import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(
    @Query('userId') userId?: string,
    @Query('sessionToken') sessionToken?: string,
  ) {
    return this.cartService.getOrCreateCart(userId, sessionToken);
  }

  @Post('items')
  addItem(@Body() dto: AddToCartDto) {
    return this.cartService.addItem(dto);
  }

  @Patch('items/:id')
  updateItemQuantity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(id, dto);
  }

  @Delete('items/:id')
  removeItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.cartService.removeItem(id);
  }

  @Post('items/remove-batch')
  @HttpCode(HttpStatus.OK)
  removeItems(@Body() body: { itemIds: string[] }) {
    return this.cartService.removeItems(body.itemIds);
  }
}
