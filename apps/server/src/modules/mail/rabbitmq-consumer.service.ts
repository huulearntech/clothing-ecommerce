import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { OutboxService } from '../outbox/outbox.service';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumerService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly queueName = 'order_confirmation_mail_queue';

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly outboxService: OutboxService,
  ) {}

  async onModuleInit() {
    await this.startConsumer();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async startConsumer(): Promise<void> {
    const amqpUrl = this.configService.get<string>(
      'CLOUDAMQP_URL',
      this.configService.get<string>('RABBITMQ_URL', 'amqp://localhost'),
    );

    // Configurable prefetch limit to avoid consumer out-of-memory (default to 10)
    const prefetchLimit = this.configService.get<number>(
      'RABBITMQ_PREFETCH_LIMIT',
      10,
    );

    try {
      this.connection = await amqp.connect(amqpUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue(this.queueName, {
        durable: true,
      });

      // Set prefetch count to limit concurrent message processing and prevent OOM
      await this.channel.prefetch(prefetchLimit);
      this.logger.log(
        `RabbitMQ consumer initialized for queue "${this.queueName}" with prefetch limit = ${prefetchLimit}`,
      );

      await this.channel.consume(
        this.queueName,
        async (msg) => {
          if (!msg) return;

          try {
            const contentString = msg.content.toString();
            const payload = JSON.parse(contentString);
            const { outboxEventId } = payload;

            if (!outboxEventId) {
              this.logger.warn(
                `Received RabbitMQ message without outboxEventId: ${contentString}`,
              );
              this.channel?.ack(msg);
              return;
            }

            this.logger.log(
              `Consuming RabbitMQ message for outboxEventId: ${outboxEventId}`,
            );

            // Fetch event details using outboxEventId
            const outboxEvent =
              await this.outboxService.findEventById(outboxEventId);

            if (!outboxEvent) {
              this.logger.error(
                `Outbox event with id "${outboxEventId}" not found in database`,
              );
              this.channel?.ack(msg);
              return;
            }

            const orderId = outboxEvent.payload?.orderId;

            if (typeof orderId === 'string') {
              await this.mailService.sendOrderConfirmationEmail(orderId);
              this.logger.log(
                `Successfully processed email for order ${orderId} via outboxEventId ${outboxEventId}`,
              );
            } else {
              this.logger.warn(
                `No orderId found in outbox event ${outboxEventId} payload`,
              );
            }

            // Acknowledge message only upon successful execution
            this.channel?.ack(msg);
          } catch (error: any) {
            this.logger.error(
              `Error consuming message from RabbitMQ queue: ${error?.message || error}`,
            );
            // Requeue or nack based on strategy (nack with requeue=false to avoid infinite loop)
            this.channel?.nack(msg, false, false);
          }
        },
        { noAck: false },
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to start RabbitMQ consumer: ${error?.message || error}`,
      );
    }
  }

  private async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.logger.log('Closed RabbitMQ consumer connection.');
    } catch (error: any) {
      this.logger.error(
        `Error closing RabbitMQ consumer connection: ${error?.message}`,
      );
    }
  }
}
