import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CalculateOrderSummaryDto } from './dto/calculate-order-summary.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Post('calculate-summary')
  calculateSummary(@Body() dto: CalculateOrderSummaryDto) {
    return this.ordersService.calculateOrderSummary(dto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.ordersService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Post('payments')
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.ordersService.createPayment(dto);
  }

  @Post('shipments')
  createShipment(@Body() dto: CreateShipmentDto) {
    return this.ordersService.createShipment(dto);
  }

  @Post(':id/confirm-delivery')
  confirmDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.ordersService.confirmDelivery(id, userId);
  }
}
