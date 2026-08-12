import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../modules/catalog/entities/product.entity';
import { ProductVariant } from '../../modules/catalog/entities/product-variant.entity';
import { ProductImage } from '../../modules/catalog/entities/product-image.entity';
import { Category } from '../../modules/catalog/entities/category.entity';
import { Brand } from '../../modules/catalog/entities/brand.entity';
import { GenderCategory } from '../../common/enums';

@Injectable()
export class ProductSeederService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
  ) {}

  async seed() {
    console.log('🌱 Seeding Brands, Categories, and Products...');

    // 1. Seed Brands
    const brandData = [
      {
        name: 'Aura Studio',
        slug: 'aura-studio',
        description: 'Modern minimalist apparel',
      },
      {
        name: 'Urban Outfitters',
        slug: 'urban-outfitters',
        description: 'Trendy street fashion',
      },
      {
        name: 'Denim Co',
        slug: 'denim-co',
        description: 'Premium indigo jeans and workwear',
      },
    ];

    const brands: Record<string, Brand> = {};
    for (const bData of brandData) {
      let brand = await this.brandRepository.findOne({
        where: { slug: bData.slug },
      });
      if (!brand) {
        brand = await this.brandRepository.save(
          this.brandRepository.create(bData),
        );
        console.log(`  ✅ Brand seeded: ${brand.name}`);
      }
      brands[bData.slug] = brand;
    }

    // 2. Seed Categories
    const categoryData = [
      { name: 'Top-Half', slug: 'top-half' },
      { name: 'Bottom-Half', slug: 'bottom-half' },
      { name: 'Accessories', slug: 'accessories' },
      { name: 'Shirt', slug: 'shirt', parentSlug: 'top-half' },
      { name: 'T-Shirt', slug: 't-shirt', parentSlug: 'top-half' },
      { name: 'Polo Shirt', slug: 'polo-shirt', parentSlug: 'top-half' },
      { name: 'Jeans', slug: 'jeans', parentSlug: 'bottom-half' },
      { name: 'Khakis', slug: 'khakis', parentSlug: 'bottom-half' },
      { name: 'Shorts', slug: 'shorts', parentSlug: 'bottom-half' },
      { name: 'Belt', slug: 'belt', parentSlug: 'accessories' },
      { name: 'Hat', slug: 'hat', parentSlug: 'accessories' },
    ];

    const categories: Record<string, Category> = {};
    for (const cData of categoryData) {
      let cat = await this.categoryRepository.findOne({
        where: { slug: cData.slug },
      });
      if (!cat) {
        let parent: Category | undefined = undefined;
        if (cData.parentSlug && categories[cData.parentSlug]) {
          parent = categories[cData.parentSlug];
        }
        cat = await this.categoryRepository.save(
          this.categoryRepository.create({
            name: cData.name,
            slug: cData.slug,
            parentId: parent?.id,
          }),
        );
        console.log(`  ✅ Category seeded: ${cat.name}`);
      }
      categories[cData.slug] = cat;
    }

    // 3. Seed Products with Variants & Images
    const productsData = [
      {
        name: 'Classic Oxford Button-Down Shirt',
        slug: 'classic-oxford-button-down-shirt',
        basePrice: 49.99,
        description:
          'Crafted from 100% breathable Oxford cotton, this classic button-down shirt delivers timeless versatility whether tucked into chinos or worn casually over a white t-shirt.',
        materialComposition: '100% Organic Oxford Cotton',
        careInstructions: 'Machine wash cold, tumble dry low',
        gender: GenderCategory.MEN,
        brandSlug: 'aura-studio',
        categorySlugs: ['top-half', 'shirt'],
        variants: [
          {
            sku: 'OXF-WHT-S',
            size: 'S',
            colorName: 'White',
            colorHex: '#FFFFFF',
            stockQuantity: 20,
          },
          {
            sku: 'OXF-WHT-M',
            size: 'M',
            colorName: 'White',
            colorHex: '#FFFFFF',
            stockQuantity: 25,
          },
          {
            sku: 'OXF-WHT-L',
            size: 'L',
            colorName: 'White',
            colorHex: '#FFFFFF',
            stockQuantity: 15,
          },
          {
            sku: 'OXF-BLU-M',
            size: 'M',
            colorName: 'Sky Blue',
            colorHex: '#87CEEB',
            stockQuantity: 18,
          },
          {
            sku: 'OXF-BLU-L',
            size: 'L',
            colorName: 'Sky Blue',
            colorHex: '#87CEEB',
            stockQuantity: 12,
          },
        ],
        images: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
            altText: 'Classic Oxford Button-Down Shirt Front View',
            displayOrder: 1,
            isThumbnail: true,
          },
          {
            imageUrl:
              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
            altText: 'Classic Oxford Button-Down Shirt Fabric Close-up',
            displayOrder: 2,
            isThumbnail: false,
          },
        ],
      },
      {
        name: 'Slim Fit Stretch Denim Jeans',
        slug: 'slim-fit-stretch-denim-jeans',
        basePrice: 59.99,
        description:
          'Premium indigo stretch denim designed for maximum movement and comfort throughout the day with classic 5-pocket styling.',
        materialComposition: '98% Cotton, 2% Elastane',
        careInstructions: 'Machine wash cold inside out',
        gender: GenderCategory.MEN,
        brandSlug: 'denim-co',
        categorySlugs: ['bottom-half', 'jeans'],
        variants: [
          {
            sku: 'JNS-NVY-30',
            size: '30',
            colorName: 'Navy Blue',
            colorHex: '#000080',
            stockQuantity: 15,
          },
          {
            sku: 'JNS-NVY-32',
            size: '32',
            colorName: 'Navy Blue',
            colorHex: '#000080',
            stockQuantity: 22,
          },
          {
            sku: 'JNS-NVY-34',
            size: '34',
            colorName: 'Navy Blue',
            colorHex: '#000080',
            stockQuantity: 10,
          },
          {
            sku: 'JNS-DRK-32',
            size: '32',
            colorName: 'Dark Wash',
            colorHex: '#1B263B',
            stockQuantity: 14,
          },
        ],
        images: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
            altText: 'Slim Fit Stretch Denim Jeans Front View',
            displayOrder: 1,
            isThumbnail: true,
          },
        ],
      },
      {
        name: 'Premium Cotton Piqué Polo Shirt',
        slug: 'premium-cotton-pique-polo-shirt',
        basePrice: 39.99,
        description:
          'Lightweight piqué knit polo shirt with ribbed collar and double-button placket for sharp casual styling.',
        materialComposition: '100% Cotton Piqué',
        careInstructions: 'Machine wash cold',
        gender: GenderCategory.MEN,
        brandSlug: 'urban-outfitters',
        categorySlugs: ['top-half', 'polo-shirt'],
        variants: [
          {
            sku: 'POL-NVY-M',
            size: 'M',
            colorName: 'Navy',
            colorHex: '#000080',
            stockQuantity: 18,
          },
          {
            sku: 'POL-NVY-L',
            size: 'L',
            colorName: 'Navy',
            colorHex: '#000080',
            stockQuantity: 20,
          },
          {
            sku: 'POL-BLK-L',
            size: 'L',
            colorName: 'Black',
            colorHex: '#000000',
            stockQuantity: 15,
          },
          {
            sku: 'POL-BRG-XL',
            size: 'XL',
            colorName: 'Burgundy',
            colorHex: '#800020',
            stockQuantity: 8,
          },
        ],
        images: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80',
            altText: 'Premium Cotton Piqué Polo Shirt',
            displayOrder: 1,
            isThumbnail: true,
          },
        ],
      },
      {
        name: 'Tailored Chino Khaki Trousers',
        slug: 'tailored-chino-khaki-trousers',
        basePrice: 54.5,
        description:
          'Smooth cotton twill chinos tailored for a modern slim-straight silhouette suitable for work or weekend wear.',
        materialComposition: '97% Cotton, 3% Spandex',
        careInstructions: 'Machine wash warm',
        gender: GenderCategory.MEN,
        brandSlug: 'aura-studio',
        categorySlugs: ['bottom-half', 'khakis'],
        variants: [
          {
            sku: 'CHN-BGE-30',
            size: '30',
            colorName: 'Beige',
            colorHex: '#F5F5DC',
            stockQuantity: 12,
          },
          {
            sku: 'CHN-BGE-32',
            size: '32',
            colorName: 'Beige',
            colorHex: '#F5F5DC',
            stockQuantity: 16,
          },
          {
            sku: 'CHN-OLV-32',
            size: '32',
            colorName: 'Olive',
            colorHex: '#808000',
            stockQuantity: 14,
          },
          {
            sku: 'CHN-OLV-34',
            size: '34',
            colorName: 'Olive',
            colorHex: '#808000',
            stockQuantity: 9,
          },
        ],
        images: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
            altText: 'Tailored Chino Khaki Trousers',
            displayOrder: 1,
            isThumbnail: true,
          },
        ],
      },
      {
        name: 'Essential Heavyweight Crewneck T-Shirt',
        slug: 'essential-heavyweight-crewneck-t-shirt',
        basePrice: 24.99,
        description:
          'Ultra-soft heavyweight jersey tee with reinforced crew neckline and durable double-stitched hems.',
        materialComposition: '100% Combed Cotton',
        careInstructions: 'Machine wash cold',
        gender: GenderCategory.UNISEX,
        brandSlug: 'urban-outfitters',
        categorySlugs: ['top-half', 't-shirt'],
        variants: [
          {
            sku: 'TEE-BLK-S',
            size: 'S',
            colorName: 'Black',
            colorHex: '#000000',
            stockQuantity: 30,
          },
          {
            sku: 'TEE-BLK-M',
            size: 'M',
            colorName: 'Black',
            colorHex: '#000000',
            stockQuantity: 45,
          },
          {
            sku: 'TEE-BLK-L',
            size: 'L',
            colorName: 'Black',
            colorHex: '#000000',
            stockQuantity: 35,
          },
          {
            sku: 'TEE-WHT-M',
            size: 'M',
            colorName: 'White',
            colorHex: '#FFFFFF',
            stockQuantity: 40,
          },
          {
            sku: 'TEE-GRY-L',
            size: 'L',
            colorName: 'Heather Gray',
            colorHex: '#808080',
            stockQuantity: 25,
          },
        ],
        images: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
            altText: 'Essential Heavyweight Crewneck T-Shirt',
            displayOrder: 1,
            isThumbnail: true,
          },
        ],
      },
      {
        name: 'Relaxed Fit Linen Blend Shorts',
        slug: 'relaxed-fit-linen-blend-shorts',
        basePrice: 34.99,
        description:
          'Breathable linen-cotton blend shorts featuring an elasticated drawstring waistband for summer comfort.',
        materialComposition: '55% Linen, 45% Cotton',
        careInstructions: 'Machine wash cold gentle',
        gender: GenderCategory.MEN,
        brandSlug: 'aura-studio',
        categorySlugs: ['bottom-half', 'shorts'],
        variants: [
          {
            sku: 'SRT-KHK-S',
            size: 'S',
            colorName: 'Khaki',
            colorHex: '#C3B091',
            stockQuantity: 10,
          },
          {
            sku: 'SRT-KHK-M',
            size: 'M',
            colorName: 'Khaki',
            colorHex: '#C3B091',
            stockQuantity: 18,
          },
          {
            sku: 'SRT-KHK-L',
            size: 'L',
            colorName: 'Khaki',
            colorHex: '#C3B091',
            stockQuantity: 15,
          },
          {
            sku: 'SRT-NVY-M',
            size: 'M',
            colorName: 'Navy',
            colorHex: '#000080',
            stockQuantity: 12,
          },
        ],
        images: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80',
            altText: 'Relaxed Fit Linen Blend Shorts',
            displayOrder: 1,
            isThumbnail: true,
          },
        ],
      },
      {
        name: 'Full-Grain Italian Leather Belt',
        slug: 'full-grain-italian-leather-belt',
        basePrice: 29.99,
        description:
          'Handcrafted full-grain Italian leather belt finished with a brushed antique silver buckle.',
        materialComposition: '100% Genuine Leather',
        careInstructions: 'Wipe clean with soft damp cloth',
        gender: GenderCategory.UNISEX,
        brandSlug: 'aura-studio',
        categorySlugs: ['accessories', 'belt'],
        variants: [
          {
            sku: 'BLT-BRN-OS',
            size: 'ONE_SIZE',
            colorName: 'Brown',
            colorHex: '#964B00',
            stockQuantity: 25,
          },
          {
            sku: 'BLT-BLK-OS',
            size: 'ONE_SIZE',
            colorName: 'Black',
            colorHex: '#000000',
            stockQuantity: 20,
          },
        ],
        images: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80',
            altText: 'Full-Grain Italian Leather Belt',
            displayOrder: 1,
            isThumbnail: true,
          },
        ],
      },
      {
        name: 'Classic Cotton Baseball Cap',
        slug: 'classic-cotton-baseball-cap',
        basePrice: 19.99,
        description:
          'Unstructured 6-panel cotton twill cap with adjustable brass buckle strap at the back.',
        materialComposition: '100% Cotton Twill',
        careInstructions: 'Hand wash cold',
        gender: GenderCategory.UNISEX,
        brandSlug: 'urban-outfitters',
        categorySlugs: ['accessories', 'hat'],
        variants: [
          {
            sku: 'CAP-BLK-OS',
            size: 'ONE_SIZE',
            colorName: 'Black',
            colorHex: '#000000',
            stockQuantity: 30,
          },
          {
            sku: 'CAP-NVY-OS',
            size: 'ONE_SIZE',
            colorName: 'Navy',
            colorHex: '#000080',
            stockQuantity: 25,
          },
          {
            sku: 'CAP-BGE-OS',
            size: 'ONE_SIZE',
            colorName: 'Beige',
            colorHex: '#F5F5DC',
            stockQuantity: 15,
          },
        ],
        images: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
            altText: 'Classic Cotton Baseball Cap',
            displayOrder: 1,
            isThumbnail: true,
          },
        ],
      },
    ];

    for (const pData of productsData) {
      let product = await this.productRepository.findOne({
        where: { slug: pData.slug },
        relations: { variants: true, images: true },
      });

      if (!product) {
        const brand = brands[pData.brandSlug];
        const prodCategories = pData.categorySlugs
          .map((s) => categories[s])
          .filter(Boolean);

        const newProduct = this.productRepository.create({
          name: pData.name,
          slug: pData.slug,
          basePrice: pData.basePrice,
          description: pData.description,
          materialComposition: pData.materialComposition,
          careInstructions: pData.careInstructions,
          gender: pData.gender,
          brand: brand,
          brandId: brand?.id,
          categories: prodCategories,
          isPublished: true,
        });

        product = await this.productRepository.save(newProduct);
        console.log(`  ✅ Product seeded: ${product.name}`);

        // Seed Variants
        for (const vData of pData.variants) {
          const variant = this.variantRepository.create({
            productId: product.id,
            sku: vData.sku,
            size: vData.size,
            colorName: vData.colorName,
            colorHex: vData.colorHex,
            stockQuantity: vData.stockQuantity,
          });
          await this.variantRepository.save(variant);
        }

        // Seed Images
        for (const imgData of pData.images) {
          const img = this.imageRepository.create({
            productId: product.id,
            imageUrl: imgData.imageUrl,
            altText: imgData.altText,
            displayOrder: imgData.displayOrder,
            isThumbnail: imgData.isThumbnail,
          });
          await this.imageRepository.save(img);
        }
      } else {
        console.log(
          `  ℹ️ Product already exists: ${product.name}. Skipping...`,
        );
      }
    }
  }
}
