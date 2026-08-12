import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Shipment } from './entities/shipment.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { Voucher } from '../vouchers/entities/voucher.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { OrderStatus, DiscountType } from '../../common/enums';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
    private dataSource: DataSource,
    private outboxService: OutboxService,
  ) { }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'Cannot create an order with an empty cart.',
      );
    }

    // Step 1: Pre-transactional work - Fetch variants, build map, prepare order items & subtotal
    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await this.variantRepo.find({
      where: { id: In(variantIds) },
      relations: { product: true },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let subtotal = 0;
    const totalItemQuantity = dto.items.reduce((sum, i) => sum + i.quantity, 0);

    const orderItemInputs = dto.items.map((itemDto) => {
      const variant = variantMap.get(itemDto.variantId);
      if (!variant) {
        throw new NotFoundException(
          `Variant "${itemDto.variantId}" not found`,
        );
      }

      if (variant.stockQuantity < itemDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock for item "${variant.product?.name ?? variant.sku}"`,
        );
      }

      const unitPrice =
        variant.priceOverride ?? variant.product?.basePrice ?? 0;
      const totalPrice = unitPrice * itemDto.quantity;
      subtotal += totalPrice;

      return {
        variantId: variant.id,
        productNameSnapshot: variant.product?.name ?? '',
        skuSnapshot: variant.sku ?? '',
        sizeSnapshot: variant.size ?? '',
        colorSnapshot: variant.colorName ?? '',
        unitPrice,
        quantity: itemDto.quantity,
        totalPrice,
      };
    });

    // Prepare batch update SQL query parameters for atomic stock decrement at once
    const valueTuples = dto.items.map(
      (_, idx) => `($${idx * 2 + 1}::uuid, $${idx * 2 + 2}::int)`,
    );
    const updateParams: any[] = [];
    dto.items.forEach((item) => {
      updateParams.push(item.variantId, item.quantity);
    });
    const bulkUpdateStockSql = `
      UPDATE product_variants
      SET stock_quantity = product_variants.stock_quantity - v.qty
      FROM (VALUES ${valueTuples.join(', ')}) AS v(id, qty)
      WHERE product_variants.id = v.id AND product_variants.stock_quantity >= v.qty
      RETURNING product_variants.id;
    `;

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // Step 2: Bulk stock decrement & sufficiency check at once (no loops in transaction)
      const queryResult = await transactionalEntityManager.query(
        bulkUpdateStockSql,
        updateParams,
      );

      // TypeORM postgres driver returns [rows, affectedCount] for non-SELECT queries
      const rows = Array.isArray(queryResult[0])
        ? queryResult[0]
        : Array.isArray(queryResult)
        ? queryResult
        : [];
      const affectedCount =
        typeof queryResult[1] === 'number'
          ? queryResult[1]
          : rows.length;

      if (affectedCount !== dto.items.length) {
        throw new BadRequestException('Insufficient stock for one or more items');
      }

      // Step 3: Handle vouchers
      let discountAmount = 0;
      let isFreeShippingVoucher = false;
      if (dto.voucherId) {
        const voucher = await transactionalEntityManager.findOne(Voucher, {
          where: { id: dto.voucherId },
        });

        if (voucher) {
          if (voucher.discountType === DiscountType.FREE_SHIPPING) {
            isFreeShippingVoucher = true;
          }
          if (!voucher.isActive) {
            throw new BadRequestException('Voucher is inactive');
          }
          const now = new Date();
          if (voucher.startDate && voucher.startDate > now) {
            throw new BadRequestException('Voucher is not yet active');
          }
          if (voucher.endDate && voucher.endDate < now) {
            throw new BadRequestException('Voucher has expired');
          }
          if (
            voucher.usageLimit !== null &&
            voucher.usageLimit !== undefined &&
            voucher.usageCount >= voucher.usageLimit
          ) {
            throw new BadRequestException('Voucher usage limit reached');
          }
          if (subtotal < Number(voucher.minOrderAmount)) {
            throw new BadRequestException(
              `Order subtotal must be at least $${voucher.minOrderAmount} for this voucher`,
            );
          }

          if (totalItemQuantity < voucher.minItemQuantity) {
            throw new BadRequestException(
              `Order must contain at least ${voucher.minItemQuantity} items for this voucher`,
            );
          }

          const discountValue = Number(voucher.discountValue);
          if (voucher.discountType === DiscountType.PERCENTAGE) {
            discountAmount = (subtotal * discountValue) / 100;
            if (
              voucher.maxDiscountAmount &&
              discountAmount > Number(voucher.maxDiscountAmount)
            ) {
              discountAmount = Number(voucher.maxDiscountAmount);
            }
          } else if (voucher.discountType === DiscountType.FIXED_AMOUNT) {
            discountAmount = Math.min(discountValue, subtotal);
          }

          // Atomically increment voucher usage count
          const updateVoucherResult = await transactionalEntityManager
            .createQueryBuilder()
            .update(Voucher)
            .set({
              usageCount: () => 'usage_count + 1',
            })
            .where(
              'id = :id AND (usage_limit IS NULL OR usage_count < usage_limit)',
              { id: voucher.id },
            )
            .execute();

          if (updateVoucherResult.affected === 0) {
            throw new BadRequestException('Voucher usage limit reached');
          }
        }
      }

      // Step 4: Calculate totals & Save order
      const shippingFee = isFreeShippingVoucher ? 0 : 5.0;
      const taxAmount = (subtotal - discountAmount) * 0.08;
      const totalAmount = subtotal - discountAmount + shippingFee + taxAmount;

      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(
        Math.random() * 1000,
      )}`;

      const orderItems = transactionalEntityManager.create(
        OrderItem,
        orderItemInputs,
      );

      const order = transactionalEntityManager.create(Order, {
        orderNumber,
        userId: dto.userId,
        voucherId: dto.voucherId,
        status: OrderStatus.PENDING,
        subtotalAmount: subtotal,
        discountAmount,
        shippingFee,
        taxAmount,
        totalAmount,
        shippingAddressSnapshot: dto.shippingAddress,
        billingAddressSnapshot: dto.billingAddress ?? dto.shippingAddress,
        items: orderItems,
      });

      const savedOrder = await transactionalEntityManager.save(Order, order);

      // Step 5: Record outbox event within the SAME database transaction
      await this.outboxService.createOutboxEvent(transactionalEntityManager, {
        aggregateType: 'ORDER',
        aggregateId: savedOrder.id,
        eventType: 'ORDER_CONFIRMATION',
        payload: {
          orderId: savedOrder.id,
        },
      });

      return savedOrder;
    });
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: { items: true, payment: true, shipments: true, user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      relations: { items: true, payment: true, shipments: true, user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { items: true, payment: true, shipments: true, user: true },
    });
    if (!order) {
      throw new NotFoundException(`Order "${id}" not found`);
    }
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    order.status = dto.status;
    return this.orderRepo.save(order);
  }

  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    await this.findOne(dto.orderId);
    const payment = this.paymentRepo.create(dto);
    return this.paymentRepo.save(payment);
  }

  async createShipment(dto: CreateShipmentDto): Promise<Shipment> {
    await this.findOne(dto.orderId);
    const shipment = this.shipmentRepo.create(dto);
    return this.shipmentRepo.save(shipment);
  }
}
