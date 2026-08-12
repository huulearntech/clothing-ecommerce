import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { Collection } from './entities/collection.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { GenerateBatchSkusDto } from './dto/generate-sku.dto';
import { GetProductsFilterDto, ProductSortOption } from './dto/get-products-filter.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Brand) private brandRepo: Repository<Brand>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Collection)
    private collectionRepo: Repository<Collection>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
    @InjectRepository(ProductImage) private imageRepo: Repository<ProductImage>,
  ) {}

  // Brands
  createBrand(dto: CreateBrandDto) {
    const brand = this.brandRepo.create(dto);
    return this.brandRepo.save(brand);
  }
  findAllBrands() {
    return this.brandRepo.find();
  }

  // Categories
  createCategory(dto: CreateCategoryDto) {
    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }
  findAllCategories() {
    return this.categoryRepo.find({ relations: { children: true } });
  }

  // Collections
  createCollection(dto: CreateCollectionDto) {
    const collection = this.collectionRepo.create(dto);
    return this.collectionRepo.save(collection);
  }
  findAllCollections() {
    return this.collectionRepo.find();
  }

  // Products
  async createProduct(dto: CreateProductDto) {
    const { categoryIds, variants, images, ...data } = dto;
    const slug = data.slug || this.slugify(data.name);
    const product = this.productRepo.create({ ...data, slug });

    if (categoryIds && categoryIds.length > 0) {
      product.categories = await this.categoryRepo.findBy({
        id: In(categoryIds),
      });
    }

    const savedProduct = await this.productRepo.save(product);

    // Save variants if provided
    if (variants && variants.length > 0) {
      const variantEntities = variants.map((v) =>
        this.variantRepo.create({
          ...v,
          productId: savedProduct.id,
        }),
      );
      await this.variantRepo.save(variantEntities);
    } else {
      // Default single variant if none provided
      const defaultSkus = await this.generateBatchSkus({
        productName: savedProduct.name,
        items: [{ colorName: 'Standard', size: 'M' }],
      });
      const defaultVariant = this.variantRepo.create({
        productId: savedProduct.id,
        sku: defaultSkus[0],
        size: 'M',
        colorName: 'Standard',
        stockQuantity: 20,
      });
      await this.variantRepo.save(defaultVariant);
    }

    // Save images if provided
    if (images && images.length > 0) {
      const imageEntities = images.map((img, idx) =>
        this.imageRepo.create({
          ...img,
          productId: savedProduct.id,
          displayOrder: img.displayOrder ?? idx,
          isThumbnail: img.isThumbnail ?? idx === 0,
        }),
      );
      await this.imageRepo.save(imageEntities);
    }

    return this.findOneProduct(savedProduct.id);
  }

  async findAllProducts(filterDto?: GetProductsFilterDto) {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.images', 'images');

    if (!filterDto) {
      qb.orderBy('product.name', 'ASC');
      return qb.getMany();
    }

    const { search, gender, categorySlug, size, colorName, minPrice, maxPrice, sort } = filterDto;

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search OR LOWER(categories.name) LIKE :search)',
        { search: searchTerm }
      );
    }

    if (gender) {
      qb.andWhere('product.gender = :gender', { gender });
    }

    if (categorySlug && categorySlug.trim() !== '') {
      qb.andWhere('LOWER(categories.slug) = :categorySlug OR LOWER(categories.name) = :categorySlug', {
        categorySlug: categorySlug.trim().toLowerCase(),
      });
    }

    if (size && size.trim() !== '') {
      qb.andWhere('variants.size = :size', { size: size.trim() });
    }

    if (colorName && colorName.trim() !== '') {
      qb.andWhere('LOWER(variants.colorName) = :colorName', {
        colorName: colorName.trim().toLowerCase(),
      });
    }

    if (minPrice !== undefined && !isNaN(minPrice)) {
      qb.andWhere('product.basePrice >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      qb.andWhere('product.basePrice <= :maxPrice', { maxPrice });
    }

    if (sort) {
      switch (sort) {
        case ProductSortOption.PRICE_ASC:
          qb.orderBy('product.basePrice', 'ASC');
          break;
        case ProductSortOption.PRICE_DESC:
          qb.orderBy('product.basePrice', 'DESC');
          break;
        case ProductSortOption.NAME_DESC:
          qb.orderBy('product.name', 'DESC');
          break;
        case ProductSortOption.NAME_ASC:
        default:
          qb.orderBy('product.name', 'ASC');
          break;
      }
    } else {
      qb.orderBy('product.name', 'ASC');
    }

    return qb.getMany();
  }

  async findOneProduct(id: string) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: {
        brand: true,
        categories: true,
        collections: true,
        variants: true,
        images: true,
      },
    });
    if (!product) {
      throw new NotFoundException(`Product "${id}" not found`);
    }
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.findOneProduct(id);
    const { categoryIds, variants, images, ...data } = dto;

    if (data.name && !data.slug) {
      data.slug = this.slugify(data.name);
    }

    Object.assign(product, data);

    if (categoryIds !== undefined) {
      product.categories =
        categoryIds.length > 0
          ? await this.categoryRepo.findBy({ id: In(categoryIds) })
          : [];
    }

    await this.productRepo.save(product);

    // Sync variants if provided
    if (variants !== undefined) {
      const existingVariants = await this.variantRepo.find({
        where: { productId: id },
      });
      const existingMap = new Map(existingVariants.map((v) => [v.id, v]));
      const updatedVariantIds = new Set<string>();

      const variantsToSave: ProductVariant[] = [];
      for (const v of variants) {
        if (v.id && existingMap.has(v.id)) {
          const existing = existingMap.get(v.id)!;
          Object.assign(existing, v);
          variantsToSave.push(existing);
        } else {
          const newVariant = this.variantRepo.create({
            ...v,
            productId: id,
          });
          variantsToSave.push(newVariant);
        }
      }

      const savedVariants = await this.variantRepo.save(variantsToSave);
      savedVariants.forEach((v) => updatedVariantIds.add(v.id));

      // Remove variants that were deleted from the dynamic list
      const variantsToDelete = existingVariants.filter(
        (v) => !updatedVariantIds.has(v.id),
      );
      if (variantsToDelete.length > 0) {
        await this.variantRepo.remove(variantsToDelete);
      }
    }

    // Sync images if provided
    if (images !== undefined) {
      const existingImages = await this.imageRepo.find({
        where: { productId: id },
      });
      const existingIdMap = new Map(existingImages.map((img) => [img.id, img]));
      const existingUrlMap = new Map(existingImages.map((img) => [img.imageUrl, img]));
      const updatedImageIds = new Set<string>();

      const imagesToSave: ProductImage[] = [];
      for (let idx = 0; idx < images.length; idx++) {
        const img = images[idx];
        const existing = (img.id && existingIdMap.get(img.id)) || existingUrlMap.get(img.imageUrl);

        if (existing) {
          Object.assign(existing, {
            ...img,
            displayOrder: img.displayOrder ?? idx,
            isThumbnail: img.isThumbnail ?? idx === 0,
          });
          imagesToSave.push(existing);
        } else {
          const newImg = this.imageRepo.create({
            imageUrl: img.imageUrl,
            altText: img.altText,
            productId: id,
            displayOrder: img.displayOrder ?? idx,
            isThumbnail: img.isThumbnail ?? idx === 0,
          });
          imagesToSave.push(newImg);
        }
      }

      const savedImages = await this.imageRepo.save(imagesToSave);
      savedImages.forEach((img) => updatedImageIds.add(img.id));

      const imagesToDelete = existingImages.filter(
        (img) => !updatedImageIds.has(img.id),
      );
      if (imagesToDelete.length > 0) {
        await this.imageRepo.remove(imagesToDelete);
      }
    }

    return this.findOneProduct(id);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.findOneProduct(id);
    await this.productRepo.remove(product);
  }

  // Variants
  async createVariant(dto: CreateVariantDto) {
    await this.findOneProduct(dto.productId);
    const variant = this.variantRepo.create(dto);
    return this.variantRepo.save(variant);
  }

  async generateBatchSkus(dto: GenerateBatchSkusDto): Promise<string[]> {
    const productCode = this.formatProductCode(dto.productName);
    const existingSkusSet = new Set<string>();
    const generatedSkus: string[] = [];

    const items = dto.items && dto.items.length > 0 ? dto.items : [{ colorName: 'Black', size: 'M' }];

    for (const item of items) {
      const colorCode = this.formatColorCode(item.colorName);
      const sizeCode = this.formatSizeCode(item.size);
      const baseSku = `${productCode}-${colorCode}-${sizeCode}`;

      let candidate = baseSku;
      let counter = 1;

      while (
        existingSkusSet.has(candidate) ||
        (await this.variantRepo.findOne({ where: { sku: candidate } }))
      ) {
        candidate = `${baseSku}-${String(counter).padStart(2, '0')}`;
        counter++;
      }

      existingSkusSet.add(candidate);
      generatedSkus.push(candidate);
    }

    return generatedSkus;
  }

  private formatProductCode(name?: string): string {
    if (!name || !name.trim()) return 'PRD';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 3) {
      return words
        .slice(0, 3)
        .map((w) => w.replace(/[^a-zA-Z0-9]/g, '')[0])
        .filter(Boolean)
        .join('')
        .toUpperCase() || 'PRD';
    }
    const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return clean.slice(0, 3) || 'PRD';
  }

  private formatColorCode(colorName?: string): string {
    if (!colorName || !colorName.trim()) return 'BLK';
    const name = colorName.trim().toUpperCase();
    const map: Record<string, string> = {
      BLACK: 'BLK',
      WHITE: 'WHT',
      BLUE: 'BLU',
      NAVY: 'NVY',
      RED: 'RED',
      GREEN: 'GRN',
      GREY: 'GRY',
      GRAY: 'GRY',
      PINK: 'PNK',
      BEIGE: 'BGE',
      KHAKI: 'KHK',
      BURGUNDY: 'BRG',
      YELLOW: 'YLW',
      PURPLE: 'PRP',
      ORANGE: 'ORG',
      DENIM: 'DNM',
      CHARCOAL: 'CHL',
      OLIVE: 'OLV',
    };
    if (map[name]) return map[name];
    const clean = name.replace(/[^A-Z0-9]/g, '');
    return clean.slice(0, 3) || 'BLK';
  }

  private formatSizeCode(size?: string): string {
    if (!size || !size.trim()) return 'M';
    const clean = size.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return clean || 'M';
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

