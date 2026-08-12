import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from './entities/voucher.entity';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';
import { DiscountType } from '../../common/enums/index';
import { VoucherType } from './vouchers.enum';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
  ) {}

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    const existing = await this.voucherRepository.findOne({
      where: { code: createVoucherDto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(
        `Voucher code '${createVoucherDto.code}' already exists`,
      );
    }

    const voucher = this.voucherRepository.create({
      ...createVoucherDto,
      code: createVoucherDto.code.toUpperCase(),
    });
    return this.voucherRepository.save(voucher);
  }

  async findAll(): Promise<Voucher[]> {
    return this.voucherRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findActivePromotions(): Promise<Voucher[]> {
    const now = new Date();
    const qb = this.voucherRepository
      .createQueryBuilder('v')
      .where('v.type = :type', { type: VoucherType.PROMOTION })
      .andWhere('v.isActive = true')
      .andWhere('(v.startDate IS NULL OR v.startDate <= :now)', { now })
      .andWhere('(v.endDate IS NULL OR v.endDate >= :now)', { now });

    return qb.getMany();
  }

  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({ where: { id } });
    if (!voucher) {
      throw new NotFoundException(`Voucher with ID '${id}' not found`);
    }
    return voucher;
  }

  async findByCode(code: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({
      where: { code: code.toUpperCase() },
    });
    if (!voucher) {
      throw new NotFoundException(`Voucher code '${code}' not found`);
    }
    return voucher;
  }

  async update(
    id: string,
    updateVoucherDto: UpdateVoucherDto,
  ): Promise<Voucher> {
    const voucher = await this.findOne(id);
    if (
      updateVoucherDto.code &&
      updateVoucherDto.code.toUpperCase() !== voucher.code
    ) {
      const existing = await this.voucherRepository.findOne({
        where: { code: updateVoucherDto.code.toUpperCase() },
      });
      if (existing) {
        throw new ConflictException(
          `Voucher code '${updateVoucherDto.code}' already exists`,
        );
      }
      updateVoucherDto.code = updateVoucherDto.code.toUpperCase();
    }
    Object.assign(voucher, updateVoucherDto);
    return this.voucherRepository.save(voucher);
  }

  async remove(id: string): Promise<void> {
    const voucher = await this.findOne(id);
    await this.voucherRepository.remove(voucher);
  }

  async validateAndCalculateDiscount(applyDto: ApplyVoucherDto): Promise<{
    voucher: Voucher;
    discountAmount: number;
    finalAmount: number;
  }> {
    const voucher = await this.findByCode(applyDto.code);

    if (!voucher.isActive) {
      throw new BadRequestException('This voucher is currently inactive');
    }

    const now = new Date();
    if (voucher.startDate && voucher.startDate > now) {
      throw new BadRequestException('This voucher is not yet active');
    }
    if (voucher.endDate && voucher.endDate < now) {
      throw new BadRequestException('This voucher has expired');
    }

    if (
      voucher.usageLimit !== null &&
      voucher.usageLimit !== undefined &&
      voucher.usageCount >= voucher.usageLimit
    ) {
      throw new BadRequestException(
        'This voucher usage limit has been reached',
      );
    }

    if (Number(applyDto.orderAmount) < Number(voucher.minOrderAmount)) {
      throw new BadRequestException(
        `Order amount must be at least ${voucher.minOrderAmount} to apply this voucher`,
      );
    }

    if (applyDto.itemQuantity < voucher.minItemQuantity) {
      throw new BadRequestException(
        `Order item quantity must be at least ${voucher.minItemQuantity} to apply this voucher`,
      );
    }

    let discountAmount = 0;
    const orderAmount = Number(applyDto.orderAmount);
    const discountValue = Number(voucher.discountValue);

    if (voucher.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (orderAmount * discountValue) / 100;
      if (
        voucher.maxDiscountAmount &&
        discountAmount > Number(voucher.maxDiscountAmount)
      ) {
        discountAmount = Number(voucher.maxDiscountAmount);
      }
    } else if (voucher.discountType === DiscountType.FIXED_AMOUNT) {
      discountAmount = Math.min(discountValue, orderAmount);
    } else if (voucher.discountType === DiscountType.FREE_SHIPPING) {
      discountAmount = 0; // Handled as shipping fee waiver in order service
    }

    const finalAmount = Math.max(0, orderAmount - discountAmount);

    return {
      voucher,
      discountAmount,
      finalAmount,
    };
  }
}
