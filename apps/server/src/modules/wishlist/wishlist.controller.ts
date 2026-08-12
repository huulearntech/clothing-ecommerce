import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get('user/:userId')
  getWishlist(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.wishlistService.getOrCreateWishlist(userId);
  }

  @Post('items')
  addItem(@Body() dto: AddToWishlistDto) {
    return this.wishlistService.addItem(dto);
  }

  @Delete('items/:id')
  removeItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.wishlistService.removeItem(id);
  }
}
