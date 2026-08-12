import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReturnRequest } from './entities/return-request.entity';
import { ReturnItem } from './entities/return-item.entity';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnStatusDto } from './dto/update-return-status.dto';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(ReturnRequest)
    private returnRepo: Repository<ReturnRequest>,
    @InjectRepository(ReturnItem)
    private itemRepo: Repository<ReturnItem>,
  ) {}

  async createReturnRequest(
    dto: CreateReturnRequestDto,
  ): Promise<ReturnRequest> {
    const returnItems = dto.items.map((item) =>
      this.itemRepo.create({
        orderItemId: item.orderItemId,
        reason: item.reason,
        condition: item.condition,
        exchangeVariantId: item.exchangeVariantId,
        quantity: item.quantity,
      }),
    );

    const request = this.returnRepo.create({
      orderId: dto.orderId,
      userId: dto.userId,
      items: returnItems,
    });

    return this.returnRepo.save(request);
  }

  async findAll(): Promise<ReturnRequest[]> {
    return this.returnRepo.find({
      relations: { items: true, order: true, user: true },
    });
  }

  async findOne(id: string): Promise<ReturnRequest> {
    const req = await this.returnRepo.findOne({
      where: { id },
      relations: { items: true, order: true, user: true },
    });
    if (!req) {
      throw new NotFoundException(`Return request "${id}" not found`);
    }
    return req;
  }

  async updateStatus(
    id: string,
    dto: UpdateReturnStatusDto,
  ): Promise<ReturnRequest> {
    const req = await this.findOne(id);
    req.status = dto.status;
    if (dto.refundAmount !== undefined) {
      req.refundAmount = dto.refundAmount;
    }
    return this.returnRepo.save(req);
  }
}
