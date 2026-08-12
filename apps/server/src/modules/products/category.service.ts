import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = dto.slug || this.slugify(dto.name);
    const existing = await this.categoryRepository.findOne({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(`Category with slug "${slug}" already exists`);
    }

    const category = this.categoryRepository.create({
      ...dto,
      slug,
    });

    if (dto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent category with ID ${dto.parentId} not found`);
      }
      category.parent = parent;
    }

    return await this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.find({
      relations: { parent: true, children: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { parent: true, children: true, products: true },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
      relations: { parent: true, children: true, products: true },
    });
    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
      }
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        category.parent = null;
        category.parentId = null;
      } else {
        const parent = await this.categoryRepository.findOne({
          where: { id: dto.parentId },
        });
        if (!parent) {
          throw new NotFoundException(`Parent category with ID ${dto.parentId} not found`);
        }
        category.parent = parent;
      }
    }

    Object.assign(category, dto);
    return await this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
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
