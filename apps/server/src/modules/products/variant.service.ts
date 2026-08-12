import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Variant } from './entities/variant.entity';
import { Product } from './entities/product.entity';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

@Injectable()
export class VariantService {
  constructor(
    @InjectRepository(Variant)
    private readonly variantRepository: Repository<Variant>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(dto: CreateVariantDto): Promise<Variant> {
    const existingSku = await this.variantRepository.findOne({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException(
        `Variant with SKU "${dto.sku}" already exists`,
      );
    }

    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    const variant = this.variantRepository.create({
      ...dto,
      product,
    });

    return await this.variantRepository.save(variant);
  }

  async findByProductId(productId: string): Promise<Variant[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return await this.variantRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Variant> {
    const variant = await this.variantRepository.findOne({
      where: { id },
      relations: { product: true },
    });
    if (!variant) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }
    return variant;
  }

  async findBySku(sku: string): Promise<Variant> {
    const variant = await this.variantRepository.findOne({
      where: { sku },
      relations: { product: true },
    });
    if (!variant) {
      throw new NotFoundException(`Variant with SKU "${sku}" not found`);
    }
    return variant;
  }

  async update(id: string, dto: UpdateVariantDto): Promise<Variant> {
    const variant = await this.findOne(id);

    if (dto.sku && dto.sku !== variant.sku) {
      const existing = await this.variantRepository.findOne({
        where: { sku: dto.sku },
      });
      if (existing) {
        throw new ConflictException(
          `Variant with SKU "${dto.sku}" already exists`,
        );
      }
    }

    Object.assign(variant, dto);
    return await this.variantRepository.save(variant);
  }

  async remove(id: string): Promise<void> {
    const variant = await this.findOne(id);
    await this.variantRepository.remove(variant);
  }
}
