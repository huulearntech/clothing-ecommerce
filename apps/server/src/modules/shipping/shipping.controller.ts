import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CalculateRatesDto } from './dto/calculate-rates.dto';
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('rates')
  @HttpCode(HttpStatus.OK)
  getRates(@Body() calculateRatesDto: CalculateRatesDto) {
    return this.shippingService.getRates(calculateRatesDto);
  }

  @Get('track/:trackingNumber')
  trackShipment(@Param('trackingNumber') trackingNumber: string) {
    return this.shippingService.trackShipment(trackingNumber);
  }

  @Post('zones')
  createZone(@Body() createZoneDto: CreateShippingZoneDto) {
    return this.shippingService.createZone(createZoneDto);
  }

  @Get('zones')
  getAllZones() {
    return this.shippingService.getAllZones();
  }

  @Post('methods')
  createMethod(@Body() createMethodDto: CreateShippingMethodDto) {
    return this.shippingService.createMethod(createMethodDto);
  }
}
