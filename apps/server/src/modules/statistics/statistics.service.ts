import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../catalog/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../catalog/entities/category.entity';
import { ReturnRequest } from '../reviews-returns/entities/return-request.entity';
import { OrderStatus, UserRole } from '../../common/enums';

export interface OverviewStatsDto {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockAlerts: number;
  avgOrderValue: number;
  revenueChange: number | null;
  ordersChange: number | null;
  aovChange: number | null;
  customersChange: number | null;
  revenueTrend: Array<{ label: string; revenue: number; orders: number }>;
  categorySales: Array<{ name: string; sales: number; percentage: number; color: string }>;
  topSellingItems: Array<{ name: string; unitsSold: number; revenue: number }>;
  departmentReturnRates: Array<{ category: string; orders: number; returnRate: string }>;
}

type TimeRange = '7d' | '30d' | 'ytd';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(ReturnRequest)
    private readonly returnRequestRepository: Repository<ReturnRequest>,
  ) {}

  async getOverviewStats(range: TimeRange = '30d'): Promise<OverviewStatsDto> {
    const now = new Date();
    const { currentStart, previousStart } = this.computeDateBoundaries(range, now);

    // Run independent queries in parallel
    const [
      currentPeriodMetrics,
      previousPeriodMetrics,
      totalCustomers,
      previousCustomers,
      lowStockAlerts,
      revenueTrend,
      categorySales,
      topSellingItems,
      departmentReturnRates,
    ] = await Promise.all([
      this.computePeriodMetrics(currentStart, now),
      this.computePeriodMetrics(previousStart, currentStart),
      this.countCustomers(),
      this.countCustomersCreatedBefore(currentStart),
      this.countLowStockProducts(),
      this.computeRevenueTrend(range, currentStart, now),
      this.computeCategorySales(currentStart, now),
      this.computeTopSellingItems(currentStart, now),
      this.computeDepartmentReturnRates(currentStart, now),
    ]);

    return {
      totalRevenue: round2(currentPeriodMetrics.revenue),
      totalOrders: currentPeriodMetrics.orderCount,
      totalCustomers,
      lowStockAlerts,
      avgOrderValue: round2(currentPeriodMetrics.aov),
      revenueChange: percentChange(previousPeriodMetrics.revenue, currentPeriodMetrics.revenue),
      ordersChange: percentChange(previousPeriodMetrics.orderCount, currentPeriodMetrics.orderCount),
      aovChange: percentChange(previousPeriodMetrics.aov, currentPeriodMetrics.aov),
      customersChange: percentChange(previousCustomers, totalCustomers),
      revenueTrend,
      categorySales,
      topSellingItems,
      departmentReturnRates,
    };
  }

  // ── Date boundary helpers ─────────────────────────────────────────

  private computeDateBoundaries(range: TimeRange, now: Date) {
    let currentStart: Date;
    let previousStart: Date;

    if (range === '7d') {
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - 7);
      previousStart = new Date(currentStart);
      previousStart.setDate(currentStart.getDate() - 7);
    } else if (range === '30d') {
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - 30);
      previousStart = new Date(currentStart);
      previousStart.setDate(currentStart.getDate() - 30);
    } else {
      // ytd: Jan 1 of current year → now; previous = same span in prior year
      currentStart = new Date(now.getFullYear(), 0, 1);
      const daysIntoYear = Math.ceil(
        (now.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - daysIntoYear);
    }

    return { currentStart, previousStart };
  }

  // ── Core period metrics ───────────────────────────────────────────

  private async computePeriodMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<{ revenue: number; orderCount: number; aov: number }> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'revenue')
      .addSelect('COUNT(order.id)', 'orderCount')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt < :endDate', { endDate })
      .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .getRawOne();

    const revenue = parseFloat(result.revenue) || 0;
    const orderCount = parseInt(result.orderCount, 10) || 0;
    const aov = orderCount > 0 ? revenue / orderCount : 0;

    return { revenue, orderCount, aov };
  }

  // ── Customer counts ───────────────────────────────────────────────

  private async countCustomers(): Promise<number> {
    return this.userRepository.count({
      where: { role: UserRole.CUSTOMER },
    });
  }

  private async countCustomersCreatedBefore(beforeDate: Date): Promise<number> {
    return this.userRepository.count({
      where: {
        role: UserRole.CUSTOMER,
        createdAt: LessThan(beforeDate),
      },
    });
  }

  // ── Low stock alerts ──────────────────────────────────────────────

  private async countLowStockProducts(): Promise<number> {
    const products = await this.productRepository.find({
      relations: { variants: true },
    });

    return products.filter((p) => {
      if (!p.variants || p.variants.length === 0) return true;
      const totalStock = p.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
      return totalStock < 15;
    }).length;
  }

  // ── Revenue trend timeline ────────────────────────────────────────

  private async computeRevenueTrend(
    range: TimeRange,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ label: string; revenue: number; orders: number }>> {
    const filteredOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt < :endDate', { endDate })
      .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .getMany();

    // Build date buckets
    const buckets = new Map<string, { revenue: number; orders: number }>();

    if (range === '7d' || range === '30d') {
      // Daily buckets
      const cursor = new Date(startDate);
      while (cursor < endDate) {
        const label = cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        buckets.set(label, { revenue: 0, orders: 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      // Monthly buckets for YTD
      const cursor = new Date(startDate);
      while (cursor < endDate) {
        const label = cursor.toLocaleDateString('en-US', { month: 'short' });
        if (!buckets.has(label)) {
          buckets.set(label, { revenue: 0, orders: 0 });
        }
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    // Distribute orders into buckets
    for (const order of filteredOrders) {
      const orderDate = new Date(order.createdAt);
      let label: string;
      if (range === '7d' || range === '30d') {
        label = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        label = orderDate.toLocaleDateString('en-US', { month: 'short' });
      }

      const bucket = buckets.get(label);
      if (bucket) {
        bucket.revenue += parseFloat(String(order.totalAmount)) || 0;
        bucket.orders += 1;
      }
    }

    return Array.from(buckets.entries()).map(([label, val]) => ({
      label,
      revenue: round2(val.revenue),
      orders: val.orders,
    }));
  }

  // ── Category sales distribution ───────────────────────────────────

  private async computeCategorySales(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ name: string; sales: number; percentage: number; color: string }>> {
    // Get order items in range with their variant → product → categories
    const orderItems = await this.orderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .leftJoinAndSelect('item.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('product.categories', 'category')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt < :endDate', { endDate })
      .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .getMany();

    const categoryMap = new Map<string, number>();

    for (const item of orderItems) {
      const itemRevenue = parseFloat(String(item.totalPrice)) || 0;
      const categories = item.variant?.product?.categories;

      if (categories && categories.length > 0) {
        // Split revenue equally across all categories of the product
        const share = itemRevenue / categories.length;
        for (const cat of categories) {
          categoryMap.set(cat.name, (categoryMap.get(cat.name) || 0) + share);
        }
      } else {
        categoryMap.set('Uncategorized', (categoryMap.get('Uncategorized') || 0) + itemRevenue);
      }
    }

    const totalSales = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
    if (totalSales === 0) return [];

    const CATEGORY_COLORS = [
      '#6366f1', '#3b82f6', '#ec4899', '#10b981', '#f59e0b',
      '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16', '#f97316',
    ];

    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, sales], idx) => ({
        name,
        sales: round2(sales),
        percentage: Math.round((sales / totalSales) * 100),
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }));
  }

  // ── Top selling items ─────────────────────────────────────────────

  private async computeTopSellingItems(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ name: string; unitsSold: number; revenue: number }>> {
    const results = await this.orderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .select('item.productNameSnapshot', 'name')
      .addSelect('SUM(item.quantity)', 'unitsSold')
      .addSelect('SUM(item.totalPrice)', 'revenue')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt < :endDate', { endDate })
      .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy('item.productNameSnapshot')
      .orderBy('"unitsSold"', 'DESC')
      .limit(5)
      .getRawMany();

    return results.map((r: { name: string; unitsSold: string; revenue: string }) => ({
      name: r.name,
      unitsSold: parseInt(r.unitsSold, 10) || 0,
      revenue: round2(parseFloat(r.revenue) || 0),
    }));
  }

  // ── Department return rates ───────────────────────────────────────

  private async computeDepartmentReturnRates(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ category: string; orders: number; returnRate: string }>> {
    // Get orders in range grouped by gender category
    const ordersByGender = await this.orderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .leftJoin('item.variant', 'variant')
      .leftJoin('variant.product', 'product')
      .select('product.gender', 'gender')
      .addSelect('COUNT(DISTINCT order.id)', 'orderCount')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt < :endDate', { endDate })
      .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy('product.gender')
      .getRawMany();

    if (ordersByGender.length === 0) return [];

    // Get return requests in same period grouped by product gender
    const returnsByGender = await this.returnRequestRepository
      .createQueryBuilder('rr')
      .innerJoin('rr.order', 'order')
      .innerJoin('rr.items', 'returnItem')
      .innerJoin('returnItem.orderItem', 'orderItem')
      .leftJoin('orderItem.variant', 'variant')
      .leftJoin('variant.product', 'product')
      .select('product.gender', 'gender')
      .addSelect('COUNT(DISTINCT rr.id)', 'returnCount')
      .where('rr.createdAt >= :startDate', { startDate })
      .andWhere('rr.createdAt < :endDate', { endDate })
      .groupBy('product.gender')
      .getRawMany();

    const returnMap = new Map<string, number>();
    for (const r of returnsByGender) {
      returnMap.set(r.gender, parseInt(r.returnCount, 10) || 0);
    }

    const GENDER_LABELS: Record<string, string> = {
      MEN: "Men's Apparel",
      WOMEN: "Women's Apparel",
      UNISEX: 'Unisex',
      KIDS: 'Kids & Youth',
    };

    return ordersByGender.map((row: { gender: string; orderCount: string }) => {
      const orders = parseInt(row.orderCount, 10) || 0;
      const returns = returnMap.get(row.gender) || 0;
      const returnRate = orders > 0 ? ((returns / orders) * 100).toFixed(1) : '0.0';

      return {
        category: GENDER_LABELS[row.gender] || row.gender || 'Unknown',
        orders,
        returnRate: `${returnRate}%`,
      };
    });
  }
}

// ── Utility functions ─────────────────────────────────────────────

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function percentChange(previous: number, current: number): number | null {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return null; // No basis for comparison
  return round2(((current - previous) / previous) * 100);
}
