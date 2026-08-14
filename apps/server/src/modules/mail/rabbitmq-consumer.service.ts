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
import { RabbitMQConnectionService } from '../rabbitmq/rabbitmq-connection.service';

interface OutboxPayload {
  outboxEventId?: string;
  [key: string]: unknown;
}

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumerService.name);
  private channel: amqp.Channel | null = null;
  private readonly queueName = 'order_confirmation_mail_queue';

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly outboxService: OutboxService,
    private readonly rabbitmqConnectionService: RabbitMQConnectionService,
  ) {}

  async onModuleInit() {
    await this.startConsumer();
  }

  async onModuleDestroy() {
    await this.closeChannel();
  }

  private async startConsumer(): Promise<void> {
    const rawLimit = this.configService.get<string | number>(
      'RABBITMQ_PREFETCH_LIMIT',
      10,
    );
    const parsedLimit = Number(rawLimit);
    const prefetchLimit = !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

    try {
      this.channel = await this.rabbitmqConnectionService.createChannel();

      await this.channel.assertQueue(this.queueName, {
        durable: true,
      });

      await this.channel.prefetch(prefetchLimit);
      this.logger.log(
        `RabbitMQ consumer initialized channel for queue "${this.queueName}" with prefetch limit = ${prefetchLimit}`,
      );

      await this.channel.consume(
        this.queueName,
        async (msg: amqp.ConsumeMessage | null) => {
          if (!msg) return;

          try {
            const contentString = msg.content.toString();
            const payload = JSON.parse(contentString) as OutboxPayload;
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

            this.channel?.ack(msg);
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            this.logger.error(
              `Error consuming message from RabbitMQ queue: ${errorMessage}`,
            );
            this.channel?.nack(msg, false, false);
          }
        },
        { noAck: false },
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to start RabbitMQ consumer: ${errorMessage}`,
      );
    }
  }

  private async closeChannel(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      this.logger.log('Closed RabbitMQ consumer channel.');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error closing RabbitMQ consumer channel: ${errorMessage}`,
      );
    }
  }
}
