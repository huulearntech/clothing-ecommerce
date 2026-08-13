import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQProducerService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly queueName = 'order_confirmation_mail_queue';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async connect(): Promise<void> {
    const amqpUrl = this.configService.get<string>(
      'CLOUDAMQP_URL',
      this.configService.get<string>('RABBITMQ_URL', 'amqp://localhost'),
    );

    try {
      this.connection = await amqp.connect(amqpUrl);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queueName, {
        durable: true,
      });
      this.logger.log(
        `Successfully connected to RabbitMQ (CloudAMQP) and asserted queue "${this.queueName}"`,
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to connect to RabbitMQ broker: ${errorMessage}`,
      );
    }
  }

  async sendToQueue(payload: Record<string, unknown>): Promise<boolean> {
    if (!this.channel) {
      this.logger.warn('RabbitMQ channel not established. Reconnecting...');
      await this.connect();
    }

    if (!this.channel) {
      throw new Error('RabbitMQ channel unavailable. Could not publish message.');
    }

    const messageBuffer = Buffer.from(JSON.stringify(payload));
    const published = this.channel.sendToQueue(this.queueName, messageBuffer, {
      persistent: true,
    });

    if (published) {
      this.logger.log(
        `Published message to RabbitMQ queue "${this.queueName}": ${JSON.stringify(payload)}`,
      );
    } else {
      this.logger.warn(`Buffer full, could not publish message to "${this.queueName}"`);
    }

    return published;
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
      this.logger.log('Closed RabbitMQ connection.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error closing RabbitMQ connection: ${errorMessage}`);
    }
  }
}
