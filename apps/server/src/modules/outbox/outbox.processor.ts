import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxService } from './outbox.service';
import { RabbitMQProducerService } from './rabbitmq-producer.service';

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);
  private isProcessing = false;

  constructor(
    private readonly outboxService: OutboxService,
    private readonly rabbitMQProducerService: RabbitMQProducerService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processOutboxEvents(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Pick up stale events older than 5 seconds to avoid racing with immediate event listener
      const pendingEvents = await this.outboxService.findStalePendingEvents(5000, 20);
      if (pendingEvents.length === 0) {
        return;
      }

      this.logger.log(`[Backup Worker] Processing ${pendingEvents.length} stale outbox event(s)...`);

      for (const event of pendingEvents) {
        try {
          await this.outboxService.markAsProcessing([event.id]);

          switch (event.eventType) {
            case 'ORDER_CONFIRMATION':
            case 'ORDER_CREATED': {
              // Send outboxEventId to message queue
              await this.rabbitMQProducerService.sendToQueue({
                outboxEventId: event.id,
              });

              this.logger.log(
                `[Backup Worker] Published minimal outbox message (outboxEventId: ${event.id}) to RabbitMQ`,
              );
              break;
            }

            default:
              this.logger.warn(`[Backup Worker] Unknown outbox event type: ${event.eventType}`);
          }

          await this.outboxService.markAsCompleted(event.id);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown processing error';
          this.logger.error(
            `[Backup Worker] Failed to process outbox event ${event.id}: ${errorMessage}`,
          );
          await this.outboxService.markAsFailed(event.id, errorMessage);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`[Backup Worker] Error in outbox backup loop: ${errorMessage}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
