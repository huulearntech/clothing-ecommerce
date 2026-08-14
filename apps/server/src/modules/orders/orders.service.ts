import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Shipment } from './entities/shipment.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { Voucher } from '../vouchers/entities/voucher.entity';
import { OutboxService } from '../outbox/outbox.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import {
  CalculateOrderSummaryDto,
  OrderSummaryResponse,
  OrderSummaryItemBreakdown,
} from './dto/calculate-order-summary.dto';
import { DiscountType, OrderStatus, ShipmentStatus } from '../../common/enums';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
    @InjectRepository(Voucher) private voucherRepo: Repository<Voucher>,
    private dataSource: DataSource,
    private outboxService: OutboxService,
    private eventEmitter: EventEmitter2,
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
    const updateParams: (string | number)[] = [];
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

    const result = await this.dataSource.transaction(
      async (transactionalEntityManager) => {
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
        const outboxEvent = await this.outboxService.createOutboxEvent(
          transactionalEntityManager,
          {
            aggregateType: 'ORDER',
            aggregateId: savedOrder.id,
            eventType: 'ORDER_CONFIRMATION',
            payload: {
              orderId: savedOrder.id,
            },
          },
        );

        return { savedOrder, outboxEvent };
      });

    // Step 6: Emit immediate in-memory event AFTER transaction has committed successfully
    this.eventEmitter.emit('outbox.event.created', {
      outboxEventId: result.outboxEvent.id,
      eventType: result.outboxEvent.eventType,
      payload: result.outboxEvent.payload,
    });

    return result.savedOrder;
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: {
        items: { variant: { product: { images: true } } },
        payment: true,
        shipments: true,
        user: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      relations: {
        items: { variant: { product: { images: true } } },
        payment: true,
        shipments: true,
        user: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: {
        items: { variant: { product: { images: true } } },
        payment: true,
        shipments: true,
        user: true,
      },
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

  async confirmDelivery(orderId: string, userId: string): Promise<Order> {
    const order = await this.findOne(orderId);

    if (order.userId !== userId) {
      throw new BadRequestException('You are not authorized to confirm this order');
    }

    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException(
        `Order must be in SHIPPED status to confirm delivery. Current status: ${order.status}`,
      );
    }

    order.status = OrderStatus.DELIVERED;
    const savedOrder = await this.orderRepo.save(order);

    // Mark all shipments as delivered
    if (order.shipments && order.shipments.length > 0) {
      const now = new Date();
      for (const shipment of order.shipments) {
        shipment.status = ShipmentStatus.DELIVERED;
        shipment.deliveredAt = now;
      }
      await this.shipmentRepo.save(order.shipments);
    }

    return savedOrder;
  }

  async calculateOrderSummary(
    dto: CalculateOrderSummaryDto,
  ): Promise<OrderSummaryResponse> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Items list cannot be empty');
    }

    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await this.variantRepo.find({
      where: { id: In(variantIds) },
      relations: { product: { images: true } },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let subtotalAmount = 0;
    let totalItemQuantity = 0;

    const itemSummaries: OrderSummaryItemBreakdown[] = dto.items.map(
      (itemDto) => {
        const variant = variantMap.get(itemDto.variantId);
        if (!variant) {
          throw new NotFoundException(`Variant "${itemDto.variantId}" not found`);
        }

        if (variant.stockQuantity < itemDto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${variant.product?.name ?? variant.sku}" (${variant.colorName || "Standard"}/${variant.size || "M"}). Only ${variant.stockQuantity} remaining.`,
          );
        }

        const unitPrice = Number(
          variant.priceOverride ?? variant.product?.basePrice ?? 0,
        );
        const totalPrice = Number((unitPrice * itemDto.quantity).toFixed(2));
        subtotalAmount += totalPrice;
        totalItemQuantity += itemDto.quantity;

        const primaryImage =
          variant.product?.images?.find((img) => img.isThumbnail)?.imageUrl ??
          variant.product?.images?.[0]?.imageUrl ??
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=300&q=80';

        return {
          variantId: variant.id,
          productName: variant.product?.name ?? 'Apparel Item',
          size: variant.size ?? 'Default',
          colorName: variant.colorName ?? 'Default',
          imageUrl: primaryImage,
          unitPrice: Number(unitPrice.toFixed(2)),
          quantity: itemDto.quantity,
          totalPrice,
        };
      },
    );

    subtotalAmount = Number(subtotalAmount.toFixed(2));

    let discountAmount = 0;
    let isFreeShippingVoucher = false;
    let appliedVoucherInfo: OrderSummaryResponse['appliedVoucher'] = null;
    let voucherError: string | null = null;

    let voucher: Voucher | null = null;
    if (dto.voucherId) {
      voucher = await this.voucherRepo.findOne({ where: { id: dto.voucherId } });
      if (!voucher) {
        voucherError = 'Voucher not found';
      }
    } else if (dto.voucherCode) {
      voucher = await this.voucherRepo.findOne({
        where: { code: dto.voucherCode.trim().toUpperCase() },
      });
      if (!voucher) {
        voucherError = 'Invalid or expired voucher code';
      }
    }

    if (voucher) {
      const now = new Date();
      if (!voucher.isActive) {
        voucherError = 'Voucher is inactive';
      } else if (voucher.startDate && voucher.startDate > now) {
        voucherError = 'Voucher is not yet active';
      } else if (voucher.endDate && voucher.endDate < now) {
        voucherError = 'Voucher has expired';
      } else if (
        voucher.usageLimit !== null &&
        voucher.usageLimit !== undefined &&
        voucher.usageCount >= voucher.usageLimit
      ) {
        voucherError = 'Voucher usage limit reached';
      } else if (subtotalAmount < Number(voucher.minOrderAmount)) {
        voucherError = `Order subtotal must be at least $${voucher.minOrderAmount} for this voucher`;
      } else if (totalItemQuantity < voucher.minItemQuantity) {
        voucherError = `Order must contain at least ${voucher.minItemQuantity} items for this voucher`;
      } else {
        if (voucher.discountType === DiscountType.FREE_SHIPPING) {
          isFreeShippingVoucher = true;
        } else if (voucher.discountType === DiscountType.PERCENTAGE) {
          discountAmount = (subtotalAmount * Number(voucher.discountValue)) / 100;
          if (
            voucher.maxDiscountAmount &&
            discountAmount > Number(voucher.maxDiscountAmount)
          ) {
            discountAmount = Number(voucher.maxDiscountAmount);
          }
        } else if (voucher.discountType === DiscountType.FIXED_AMOUNT) {
          discountAmount = Math.min(Number(voucher.discountValue), subtotalAmount);
        }

        discountAmount = Number(discountAmount.toFixed(2));
        appliedVoucherInfo = {
          id: voucher.id,
          code: voucher.code,
          name: voucher.name,
          discountType: voucher.discountType,
          discountValue: Number(voucher.discountValue),
        };
      }
    }

    const baseShipping = dto.shippingCost ?? 5.0;
    const shippingFee = isFreeShippingVoucher ? 0 : Number(baseShipping.toFixed(2));

    const taxableAmount = Math.max(0, subtotalAmount - discountAmount);
    const taxAmount = Number((taxableAmount * 0.08).toFixed(2));
    const totalAmount = Number(
      (subtotalAmount - discountAmount + shippingFee + taxAmount).toFixed(2),
    );

    return {
      subtotalAmount,
      discountAmount,
      shippingFee,
      taxAmount,
      totalAmount,
      totalItemQuantity,
      items: itemSummaries,
      appliedVoucher: appliedVoucherInfo,
      voucherError,
    };
  }
}
