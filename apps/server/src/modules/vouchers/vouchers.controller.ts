import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  create(@Body() createVoucherDto: CreateVoucherDto) {
    return this.vouchersService.create(createVoucherDto);
  }

  @Get()
  findAll() {
    return this.vouchersService.findAll();
  }

  @Get('promotions')
  findActivePromotions() {
    return this.vouchersService.findActivePromotions();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateVoucherDto: UpdateVoucherDto) {
    return this.vouchersService.update(id, updateVoucherDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.vouchersService.remove(id);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateAndCalculate(@Body() applyVoucherDto: ApplyVoucherDto) {
    return this.vouchersService.validateAndCalculateDiscount(applyVoucherDto);
  }
}
