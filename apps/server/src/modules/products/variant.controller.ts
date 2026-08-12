import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { VariantService } from './variant.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

@Controller('variants')
export class VariantController {
  constructor(private readonly variantService: VariantService) {}

  @Post()
  create(@Body() createVariantDto: CreateVariantDto) {
    return this.variantService.create(createVariantDto);
  }

  @Get('product/:productId')
  findByProductId(@Param('productId') productId: string) {
    return this.variantService.findByProductId(productId);
  }

  @Get('sku/:sku')
  findBySku(@Param('sku') sku: string) {
    return this.variantService.findBySku(sku);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.variantService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVariantDto: UpdateVariantDto) {
    return this.variantService.update(id, updateVariantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.variantService.remove(id);
  }
}
