import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private cartItemRepo: Repository<CartItem>,
  ) {}

  async getOrCreateCart(userId?: string, sessionToken?: string): Promise<Cart> {
    let cart: Cart | null = null;
    if (userId) {
      cart = await this.cartRepo.findOne({
        where: { userId },
        relations: { items: { variant: { product: { images: true } } } },
      });
    } else if (sessionToken) {
      cart = await this.cartRepo.findOne({
        where: { sessionToken },
        relations: { items: { variant: { product: { images: true } } } },
      });
    }

    if (!cart) {
      cart = this.cartRepo.create({ userId, sessionToken, items: [] });
      cart = await this.cartRepo.save(cart);
    }
    return cart;
  }

  async addItem(dto: AddToCartDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(dto.userId, dto.sessionToken);
    let item = await this.cartItemRepo.findOne({
      where: { cartId: cart.id, variantId: dto.variantId },
    });

    if (item) {
      item.quantity += dto.quantity;
      await this.cartItemRepo.save(item);
    } else {
      item = this.cartItemRepo.create({
        cartId: cart.id,
        variantId: dto.variantId,
        quantity: dto.quantity,
      });
      await this.cartItemRepo.save(item);
    }

    return this.getOrCreateCart(dto.userId, dto.sessionToken);
  }

  async updateItemQuantity(
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<void> {
    const item = await this.cartItemRepo.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(`Cart item "${itemId}" not found`);
    }
    if (dto.quantity <= 0) {
      await this.cartItemRepo.remove(item);
    } else {
      item.quantity = dto.quantity;
      await this.cartItemRepo.save(item);
    }
  }

  async removeItem(itemId: string): Promise<void> {
    const item = await this.cartItemRepo.findOne({ where: { id: itemId } });
    if (item) {
      await this.cartItemRepo.remove(item);
    }
  }

  async removeItems(itemIds: string[]): Promise<{ deleted: number }> {
    if (!itemIds || itemIds.length === 0) {
      return { deleted: 0 };
    }
    const result = await this.cartItemRepo.delete({ id: In(itemIds) });
    return { deleted: result.affected ?? 0 };
  }
}
