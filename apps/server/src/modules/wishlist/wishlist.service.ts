import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistItem } from './entities/wishlist-item.entity';
import { User } from '../users/entities/user.entity';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist) private wishlistRepo: Repository<Wishlist>,
    @InjectRepository(WishlistItem) private itemRepo: Repository<WishlistItem>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getOrCreateWishlist(userId: string): Promise<Wishlist> {
    let wishlist = await this.wishlistRepo.findOne({
      where: { userId },
      relations: { items: { product: true, variant: true } },
    });
    if (!wishlist) {
      let userExists = await this.userRepo.findOne({ where: { id: userId } });
      if (!userExists) {
        userExists = await this.userRepo.save(
          this.userRepo.create({
            id: userId,
            email: 'default.user@example.com',
            passwordHash: 'dummy',
            firstName: 'Default',
            lastName: 'Customer',
          }),
        );
      }
      wishlist = this.wishlistRepo.create({ userId: userExists.id, items: [] });
      wishlist = await this.wishlistRepo.save(wishlist);
    }
    return wishlist;
  }

  async addItem(dto: AddToWishlistDto): Promise<Wishlist> {
    const wishlist = await this.getOrCreateWishlist(dto.userId);
    const existing = await this.itemRepo.findOne({
      where: {
        wishlistId: wishlist.id,
        productId: dto.productId,
        variantId: dto.variantId ?? undefined,
      },
    });

    if (!existing) {
      const item = this.itemRepo.create({
        wishlistId: wishlist.id,
        productId: dto.productId,
        variantId: dto.variantId,
      });
      await this.itemRepo.save(item);
    }

    return this.getOrCreateWishlist(dto.userId);
  }

  async removeItem(itemId: string): Promise<void> {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (item) {
      await this.itemRepo.remove(item);
    }
  }
}
