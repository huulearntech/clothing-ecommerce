import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { MailgunService } from './provider/mailgun.service';
import { MAIL_PROVIDER } from './mail.interfaces';
import { Order } from '../orders/entities/order.entity';
import { OutboxModule } from '../outbox/outbox.module';
import { RabbitMQConsumerService } from './rabbitmq-consumer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), OutboxModule],
  providers: [
    MailService,
    RabbitMQConsumerService,
    {
      provide: MAIL_PROVIDER,
      useClass: MailgunService,
    },
  ],
  exports: [MailService],
})
export class MailModule {}
