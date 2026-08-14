import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { RabbitMQConnectionService } from '../rabbitmq/rabbitmq-connection.service';

@Injectable()
export class RabbitMQProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQProducerService.name);
  private channel: amqp.Channel | null = null;
  private readonly queueName = 'order_confirmation_mail_queue';

  constructor(
    private readonly rabbitmqConnectionService: RabbitMQConnectionService,
  ) {}

  async onModuleInit() {
    await this.initChannel();
  }

  async onModuleDestroy() {
    await this.closeChannel();
  }

  private async initChannel(): Promise<void> {
    try {
      this.channel = await this.rabbitmqConnectionService.createChannel();
      await this.channel.assertQueue(this.queueName, {
        durable: true,
      });
      this.logger.log(
        `RabbitMQ producer initialized channel for queue "${this.queueName}"`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to initialize RabbitMQ producer channel: ${errorMessage}`,
      );
    }
  }

  async sendToQueue(payload: Record<string, unknown>): Promise<boolean> {
    if (!this.channel) {
      this.logger.warn('RabbitMQ producer channel not established. Reconnecting...');
      await this.initChannel();
    }

    if (!this.channel) {
      throw new Error('RabbitMQ producer channel unavailable. Could not publish message.');
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

  private async closeChannel(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      this.logger.log('Closed RabbitMQ producer channel.');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error closing RabbitMQ producer channel: ${errorMessage}`);
    }
  }
}
