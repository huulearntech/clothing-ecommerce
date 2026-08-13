import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OutboxService } from './outbox.service';
import { RabbitMQProducerService } from './rabbitmq-producer.service';

export interface OutboxCreatedEvent {
  outboxEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class OutboxEventListener {
  private readonly logger = new Logger(OutboxEventListener.name);

  constructor(
    private readonly outboxService: OutboxService,
    private readonly rabbitMQProducerService: RabbitMQProducerService,
  ) {}

  @OnEvent('outbox.event.created')
  async handleOutboxCreatedImmediate(event: OutboxCreatedEvent): Promise<void> {
    this.logger.log(
      `Received immediate in-memory outbox event (outboxEventId: ${event.outboxEventId}, eventType: ${event.eventType})`,
    );

    try {
      await this.outboxService.markAsProcessing([event.outboxEventId]);

      // Publish to RabbitMQ
      await this.rabbitMQProducerService.sendToQueue({
        outboxEventId: event.outboxEventId,
      });

      this.logger.log(
        `Immediate publish successful for outboxEventId: ${event.outboxEventId}`,
      );

      // Update Outbox status to COMPLETED
      await this.outboxService.markAsCompleted(event.outboxEventId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during immediate publish';
      this.logger.error(
        `Immediate publish failed for outbox ${event.outboxEventId}: ${errorMessage}. Backup worker will retry.`,
      );
      // Leave status as PENDING (or mark retry failure) so Backup Worker can retry later
      await this.outboxService.markAsFailed(event.outboxEventId, errorMessage);
    }
  }
}
