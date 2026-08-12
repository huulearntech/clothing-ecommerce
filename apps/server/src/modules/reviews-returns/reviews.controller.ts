import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Get('product/:productId/rating')
  getAverageRating(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.getAverageRating(productId);
  }
}
