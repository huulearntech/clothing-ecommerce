import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IMailProvider } from './mail.interfaces';
import {
  MAIL_PROVIDER,
  SendEmailOptions,
  SendTemplateEmailOptions,
} from './mail.interfaces';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: IMailProvider,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async sendEmail(options: SendEmailOptions) {
    return this.mailProvider.sendEmail(options);
  }

  async sendTemplateEmail(options: SendTemplateEmailOptions) {
    return this.mailProvider.sendTemplateEmail(options);
  }

  async sendOrderConfirmationEmail(orderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: { items: true, user: true },
    });

    if (!order) {
      this.logger.error(
        `Cannot send order confirmation: Order ${orderId} not found`,
      );
      throw new NotFoundException(`Order "${orderId}" not found`);
    }

    const recipientEmail =
      order.user?.email ||
      order.shippingAddressSnapshot?.email ||
      order.billingAddressSnapshot?.email;

    if (!recipientEmail) {
      this.logger.error(
        `Cannot send order confirmation: No recipient email found for order ${orderId}`,
      );
      throw new Error(`No recipient email found for order ${orderId}`);
    }

    const customerName = order.user
      ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() ||
        'Valued Customer'
      : order.shippingAddressSnapshot?.fullName ||
        order.shippingAddressSnapshot?.name ||
        'Valued Customer';

    const formattedItems = (order.items || []).map((item) => ({
      name: item.productNameSnapshot || 'Product',
      sku: item.skuSnapshot,
      size: item.sizeSnapshot,
      color: item.colorSnapshot,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice).toFixed(2),
      totalPrice: Number(item.totalPrice).toFixed(2),
    }));

    await this.mailProvider.sendTemplateEmail({
      to: recipientEmail,
      subject: `Order Confirmation - #${order.orderNumber}`,
      template: 'order-confirmation',
      context: {
        customerName,
        orderNumber: order.orderNumber,
        orderDate: new Date(order.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        status: order.status,
        items: formattedItems,
        subtotalAmount: Number(order.subtotalAmount || 0).toFixed(2),
        discountAmount: Number(order.discountAmount || 0).toFixed(2),
        shippingFee: Number(order.shippingFee || 0).toFixed(2),
        taxAmount: Number(order.taxAmount || 0).toFixed(2),
        totalAmount: Number(order.totalAmount || 0).toFixed(2),
        shippingAddress: order.shippingAddressSnapshot,
      },
    });

    this.logger.log(
      `Order confirmation email sent successfully to ${recipientEmail} for order ${order.orderNumber}`,
    );
  }
}
