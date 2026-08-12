import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEntity } from './outbox.entity';
import { OutboxService } from './outbox.service';
import { OutboxProcessor } from './outbox.processor';
import { RabbitMQProducerService } from './rabbitmq-producer.service';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity])],
  providers: [OutboxService, OutboxProcessor, RabbitMQProducerService],
  exports: [OutboxService],
})
export class OutboxModule {}
