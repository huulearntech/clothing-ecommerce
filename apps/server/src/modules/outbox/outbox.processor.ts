import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { RabbitMQProducerService } from './rabbitmq-producer.service';

@Injectable()
export class OutboxProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxProcessor.name);
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private readonly outboxService: OutboxService,
    private readonly rabbitMQProducerService: RabbitMQProducerService,
  ) {}

  onModuleInit() {
    // Poll for outbox events every 3 seconds
    this.timer = setInterval(() => this.processOutboxEvents(), 3000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async processOutboxEvents(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingEvents = await this.outboxService.findPendingEvents(20);
      if (pendingEvents.length === 0) {
        return;
      }

      this.logger.log(`Processing ${pendingEvents.length} outbox event(s)...`);

      for (const event of pendingEvents) {
        try {
          await this.outboxService.markAsProcessing([event.id]);

          switch (event.eventType) {
            case 'ORDER_CONFIRMATION':
            case 'ORDER_CREATED': {
              // Send only outboxEventId as the minimal unique identifier to reduce message load
              await this.rabbitMQProducerService.sendToQueue({
                outboxEventId: event.id,
              });

              this.logger.log(
                `Published minimal outbox message (outboxEventId: ${event.id}) to RabbitMQ`,
              );
              break;
            }

            default:
              this.logger.warn(`Unknown outbox event type: ${event.eventType}`);
          }

          await this.outboxService.markAsCompleted(event.id);
        } catch (error: any) {
          const errorMessage = error?.message || 'Unknown processing error';
          this.logger.error(
            `Failed to process outbox event ${event.id}: ${errorMessage}`,
          );
          await this.outboxService.markAsFailed(event.id, errorMessage);
        }
      }
    } catch (err: any) {
      this.logger.error(`Error in outbox polling loop: ${err?.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
