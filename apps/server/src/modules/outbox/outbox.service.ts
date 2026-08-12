import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, In } from 'typeorm';
import { OutboxEntity, OutboxStatus } from './outbox.entity';

export interface CreateOutboxEventDto {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, any>;
}

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
  ) {}

  /**
   * Create an outbox event within a transactional entity manager to guarantee atomic persistence with business logic.
   */
  async createOutboxEvent(
    entityManager: EntityManager,
    dto: CreateOutboxEventDto,
  ): Promise<OutboxEntity> {
    const event = entityManager.create(OutboxEntity, {
      aggregateType: dto.aggregateType,
      aggregateId: dto.aggregateId,
      eventType: dto.eventType,
      payload: dto.payload,
      status: OutboxStatus.PENDING,
    });
    return entityManager.save(OutboxEntity, event);
  }

  async findEventById(id: string): Promise<OutboxEntity | null> {
    return this.outboxRepository.findOne({ where: { id } });
  }

  async findPendingEvents(limit = 10): Promise<OutboxEntity[]> {
    return this.outboxRepository.find({
      where: [
        { status: OutboxStatus.PENDING },
        { status: OutboxStatus.FAILED },
      ],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async markAsProcessing(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;
    await this.outboxRepository.update(
      { id: In(eventIds) },
      { status: OutboxStatus.PROCESSING },
    );
  }

  async markAsCompleted(eventId: string): Promise<void> {
    await this.outboxRepository.update(eventId, {
      status: OutboxStatus.COMPLETED,
      processedAt: new Date(),
      error: null,
    });
  }

  async markAsFailed(eventId: string, errorMessage: string): Promise<void> {
    const event = await this.outboxRepository.findOne({ where: { id: eventId } });
    if (!event) return;

    const retryCount = event.retryCount + 1;
    const maxRetries = 3;

    await this.outboxRepository.update(eventId, {
      retryCount,
      error: errorMessage,
      status: retryCount >= maxRetries ? OutboxStatus.FAILED : OutboxStatus.PENDING,
    });
  }
}
