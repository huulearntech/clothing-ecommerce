import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
  ) {}

  async create(dto: CreateReviewDto): Promise<Review> {
    const review = this.reviewRepo.create(dto);
    return this.reviewRepo.save(review);
  }

  async findByProduct(productId: string): Promise<Review[]> {
    return this.reviewRepo.find({
      where: { productId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getAverageRating(
    productId: string,
  ): Promise<{ average: number; total: number }> {
    const reviews = await this.findByProduct(productId);
    if (!reviews.length) return { average: 0, total: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: parseFloat((sum / reviews.length).toFixed(1)),
      total: reviews.length,
    };
  }
}
