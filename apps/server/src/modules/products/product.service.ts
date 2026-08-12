import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const slug = dto.slug || this.slugify(dto.name);
    if (slug) {
      const existing = await this.productRepository.findOne({
        where: { slug },
      });
      if (existing) {
        throw new ConflictException(`Product with slug "${slug}" already exists`);
      }
    }

    const product = this.productRepository.create({
      ...dto,
      slug,
    });

    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
      }
      product.category = category;
    }

    return await this.productRepository.save(product);
  }

  async findAll(query: QueryProductDto) {
    const { search, categoryId, minPrice, maxPrice, page = 1, limit = 10 } = query;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants');

    if (search) {
      qb.andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('product.createdAt', 'DESC');

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true, variants: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: { category: true, variants: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.productRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException(`Product with slug "${dto.slug}" already exists`);
      }
    }

    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        product.category = null;
        product.categoryId = null;
      } else {
        const category = await this.categoryRepository.findOne({
          where: { id: dto.categoryId },
        });
        if (!category) {
          throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
        }
        product.category = category;
      }
    }

    Object.assign(product, dto);
    return await this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
