import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { ReturnRequest } from './entities/return-request.entity';
import { ReturnItem } from './entities/return-item.entity';
import { ReviewsService } from './reviews.service';
import { ReturnsService } from './returns.service';
import { ReviewsController } from './reviews.controller';
import { ReturnsController } from './returns.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ReturnRequest, ReturnItem])],
  controllers: [ReviewsController, ReturnsController],
  providers: [ReviewsService, ReturnsService],
  exports: [ReviewsService, ReturnsService],
})
export class ReviewsReturnsModule {}
