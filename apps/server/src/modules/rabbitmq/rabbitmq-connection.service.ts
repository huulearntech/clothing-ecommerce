import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQConnectionService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RabbitMQConnectionService.name);
  private connection: amqp.ChannelModel | null = null;
  private readonly activeChannels = new Set<amqp.Channel>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.closeAll();
  }

  private async connectWithRetry(
    maxRetries = 5,
    delayMs = 3000,
  ): Promise<void> {
    const amqpUrl = this.configService.get<string>(
      'CLOUDAMQP_URL',
      this.configService.get<string>('RABBITMQ_URL', 'amqp://localhost'),
    );

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(
          `Connecting to RabbitMQ broker (Attempt ${attempt}/${maxRetries})...`,
        );
        this.connection = await amqp.connect(amqpUrl);

        this.connection.on('error', (err: unknown) => {
          const errorMessage =
            err instanceof Error ? err.message : String(err);
          this.logger.error(`RabbitMQ connection error: ${errorMessage}`);
        });

        this.connection.on('close', () => {
          this.logger.warn('RabbitMQ connection closed.');
          this.connection = null;
        });

        this.logger.log('Successfully established single RabbitMQ connection.');
        return;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to connect to RabbitMQ broker (Attempt ${attempt}/${maxRetries}): ${errorMessage}`,
        );

        if (attempt < maxRetries) {
          this.logger.log(`Waiting ${delayMs}ms before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    this.logger.error(
      'Could not establish RabbitMQ connection after maximum retries.',
    );
  }

  public async createChannel(): Promise<amqp.Channel> {
    if (!this.connection) {
      this.logger.warn(
        'RabbitMQ connection unavailable. Attempting to reconnect...',
      );
      await this.connectWithRetry(3, 2000);
    }

    if (!this.connection) {
      throw new Error(
        'Unable to create RabbitMQ channel: No active connection.',
      );
    }

    const channel = await this.connection.createChannel();
    this.activeChannels.add(channel);

    channel.on('close', () => {
      this.activeChannels.delete(channel);
    });

    channel.on('error', (err: unknown) => {
      const errorMessage =
        err instanceof Error ? err.message : String(err);
      this.logger.error(`RabbitMQ channel error: ${errorMessage}`);
      this.activeChannels.delete(channel);
    });

    return channel;
  }

  private async closeAll(): Promise<void> {
    for (const channel of this.activeChannels) {
      try {
        await channel.close();
      } catch {
        // Ignore channel closing errors during teardown
      }
    }
    this.activeChannels.clear();

    if (this.connection) {
      try {
        await this.connection.close();
        this.logger.log('Closed central RabbitMQ connection.');
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(`Error closing RabbitMQ connection: ${errorMessage}`);
      }
      this.connection = null;
    }
  }
}
