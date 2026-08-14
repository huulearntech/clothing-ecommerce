import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQConnectionService } from './rabbitmq-connection.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RabbitMQConnectionService],
  exports: [RabbitMQConnectionService],
})
export class RabbitMQModule {}
