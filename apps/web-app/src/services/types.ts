// TODO: Should infer these type from server DTO's
// Domain Enums / Constants
export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  SUPPORT: 'SUPPORT',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AddressType = {
  SHIPPING: 'SHIPPING',
  BILLING: 'BILLING',
} as const;
export type AddressType = (typeof AddressType)[keyof typeof AddressType];

export const GenderPreference = {
  MEN: 'MEN',
  WOMEN: 'WOMEN',
  UNISEX: 'UNISEX',
} as const;
export type GenderPreference = (typeof GenderPreference)[keyof typeof GenderPreference];

export const GenderCategory = {
  MEN: 'MEN',
  WOMEN: 'WOMEN',
  UNISEX: 'UNISEX',
  KIDS: 'KIDS',
} as const;
export type GenderCategory = (typeof GenderCategory)[keyof typeof GenderCategory];

export const Season = {
  SPRING: 'SPRING',
  SUMMER: 'SUMMER',
  FALL: 'FALL',
  WINTER: 'WINTER',
  ALL_SEASON: 'ALL_SEASON',
} as const;
export type Season = (typeof Season)[keyof typeof Season];

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  FREE_SHIPPING: 'FREE_SHIPPING',
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const VoucherType = {
  PROMOTION: 'PROMOTION',
  COUPON: 'COUPON',
} as const;
export type VoucherType = (typeof VoucherType)[keyof typeof VoucherType];

export const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentGateway = {
  STRIPE: 'STRIPE',
  PAYPAL: 'PAYPAL',
  APPLE_PAY: 'APPLE_PAY',
  COD: 'COD',
} as const;
export type PaymentGateway = (typeof PaymentGateway)[keyof typeof PaymentGateway];

export const PaymentStatus = {
  AUTHORIZED: 'AUTHORIZED',
  CAPTURED: 'CAPTURED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ShipmentStatus = {
  LABEL_CREATED: 'LABEL_CREATED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  EXCEPTION: 'EXCEPTION',
} as const;
export type ShipmentStatus = (typeof ShipmentStatus)[keyof typeof ShipmentStatus];

export const FitFeedback = {
  RUNS_SMALL: 'RUNS_SMALL',
  TRUE_TO_SIZE: 'TRUE_TO_SIZE',
  RUNS_LARGE: 'RUNS_LARGE',
} as const;
export type FitFeedback = (typeof FitFeedback)[keyof typeof FitFeedback];

export const ReturnStatus = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  RECEIVED: 'RECEIVED',
  REFUNDED: 'REFUNDED',
} as const;
export type ReturnStatus = (typeof ReturnStatus)[keyof typeof ReturnStatus];

// User Interfaces
export interface Address {
  id: string;
  userId: string;
  addressType: AddressType;
  recipientName: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  genderPreference?: GenderPreference;
  preferredTopSize?: string;
  preferredBottomSize?: string;
  preferredShoeSize?: string;
  newsletterSubscribed: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  addresses?: Address[];
  profile?: CustomerProfile;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}


export interface CreateAddressPayload {
  addressType: AddressType;
  recipientName: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface UpsertProfilePayload {
  genderPreference?: GenderPreference;
  preferredTopSize?: string;
  preferredBottomSize?: string;
  preferredShoeSize?: string;
  newsletterSubscribed?: boolean;
}

// Catalog Interfaces
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
}

export interface Category {
  id: string;
  parentId?: string;
  name: string;
  slug: string;
  children?: Category[];
}

export interface Collection {
  id: string;
  name: string;
  season: Season;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex?: string;
  priceOverride?: number;
  stockQuantity: number;
  weightGrams?: number;
  product?: Product;
}

export interface ProductImage {
  id: string;
  productId: string;
  variantId?: string;
  imageUrl: string;
  altText?: string;
  displayOrder: number;
  isThumbnail: boolean;
}

export interface Product {
  id: string;
  brandId?: string;
  brand?: Brand;
  name: string;
  slug: string;
  basePrice: number;
  description?: string;
  materialComposition?: string;
  careInstructions?: string;
  gender: GenderCategory;
  isPublished: boolean;
  categories?: Category[];
  collections?: Collection[];
  variants?: ProductVariant[];
  images?: ProductImage[];
}

export interface GetProductsFilterParams {
  search?: string;
  gender?: string;
  categorySlug?: string;
  size?: string;
  colorName?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export interface CreateBrandPayload {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  parentId?: string;
}

export interface CreateCollectionPayload {
  name: string;
  season?: Season;
  isActive?: boolean;
}

export interface CreateProductPayload {
  name: string;
  slug: string;
  basePrice: number;
  description?: string;
  materialComposition?: string;
  careInstructions?: string;
  gender?: GenderCategory;
  brandId?: string;
  categoryIds?: string[];
}

export interface CreateVariantPayload {
  productId: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex?: string;
  priceOverride?: number;
  stockQuantity?: number;
  weightGrams?: number;
}

// Cart & Wishlist Interfaces
export interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  variant: ProductVariant;
  quantity: number;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionToken?: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

export interface AddToCartPayload {
  userId?: string;
  sessionToken?: string;
  variantId: string;
  quantity: number;
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
}

export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  items: WishlistItem[];
}

export interface AddToWishlistPayload {
  userId: string;
  productId: string;
  variantId?: string;
}

// Order & Fulfillment Interfaces
export interface Voucher {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: VoucherType;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  minItemQuantity: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateVoucherPayload {
  code: string;
  name: string;
  description?: string;
  type: VoucherType;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  minItemQuantity?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface ApplyVoucherPayload {
  code: string;
  orderAmount: number;
  itemQuantity: number;
}

export interface ApplyVoucherResult {
  voucher: Voucher;
  discountAmount: number;
  finalAmount: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId?: string;
  variant?: ProductVariant;
  productNameSnapshot: string;
  skuSnapshot: string;
  sizeSnapshot: string;
  colorSnapshot: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  orderId: string;
  paymentGateway: PaymentGateway;
  transactionId?: string;
  status: PaymentStatus;
  amount: number;
  paidAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: ShipmentStatus;
  estimatedDeliveryDate: string | null;
  shippedAt: string;
  deliveredAt: string | null;
}

export interface AddressSnapshot {
  recipientName?: string;
  fullName?: string;
  name?: string;
  email?: string;
  streetAddress?: string;
  streetLine1?: string;
  streetLine2?: string;
  city?: string;
  state?: string;
  stateProvince?: string;
  zipCode?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  voucherId?: string;
  status: OrderStatus;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  shippingAddressSnapshot?: AddressSnapshot;
  billingAddressSnapshot?: AddressSnapshot;
  createdAt: string;
  items: OrderItem[];
  payment?: Payment;
  shipments?: Shipment[];
  user?: User;
}

export interface CreateOrderItemPayload {
  variantId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  userId?: string;
  voucherId?: string;
  shippingAddress: AddressSnapshot | Record<string, unknown>;
  billingAddress?: AddressSnapshot | Record<string, unknown>;
  items: CreateOrderItemPayload[];
}

export interface CreatePaymentPayload {
  orderId: string;
  paymentGateway: PaymentGateway;
  transactionId?: string;
  status?: PaymentStatus;
  amount: number;
}

export interface CreateShipmentPayload {
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status?: ShipmentStatus;
}

// Review & Return Interfaces
export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  fitFeedback: FitFeedback;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user?: User;
}

export interface CreateReviewPayload {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  fitFeedback?: FitFeedback;
  isVerifiedPurchase?: boolean;
}

export interface ReturnItem {
  id: string;
  returnRequestId: string;
  orderItemId: string;
  exchangeVariantId?: string;
  reason: string;
  condition?: string;
  quantity: number;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  status: ReturnStatus;
  refundAmount: number;
  createdAt: string;
  items: ReturnItem[];
  order?: Order;
  user?: User;
}

export interface CreateReturnItemPayload {
  orderItemId: string;
  reason: string;
  condition?: string;
  exchangeVariantId?: string;
  quantity: number;
}

export interface CreateReturnRequestPayload {
  orderId: string;
  userId: string;
  items: CreateReturnItemPayload[];
}

export interface OverviewStatsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockAlerts: number;
  avgOrderValue: number;
  revenueChange?: number | null;
  ordersChange?: number | null;
  aovChange?: number | null;
  customersChange?: number | null;
  revenueTrend: Array<{ label: string; revenue: number; orders: number }>;
  categorySales: Array<{ name: string; sales: number; percentage: number; color: string }>;
  topSellingItems: Array<{ name: string; unitsSold: number; revenue: number }>;
  departmentReturnRates: Array<{ category: string; orders: number; returnRate: string }>;
}

export interface ShippingAddressInput {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface ShippingRateRequest {
  destinationAddress: ShippingAddressInput;
  originAddress?: ShippingAddressInput;
  weightInKg: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  itemCount?: number;
}

export interface ShippingRateResponse {
  carrierName: string;
  serviceName: string;
  serviceCode: string;
  cost: number;
  estimatedDays: number;
}

export interface TrackingInfo {
  carrierName: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
  events: Array<{
    timestamp: string;
    location: string;
    description: string;
  }>;
}

export interface GenerateSkuItem {
  colorName?: string;
  size?: string;
}

export interface GenerateBatchSkusPayload {
  productName?: string;
  items: GenerateSkuItem[];
}

export interface CalculateOrderSummaryItemPayload {
  variantId: string;
  quantity: number;
}

export interface CalculateOrderSummaryPayload {
  items: CalculateOrderSummaryItemPayload[];
  voucherId?: string;
  voucherCode?: string;
  shippingCost?: number;
}

export interface OrderSummaryItemBreakdown {
  variantId: string;
  productName: string;
  size: string;
  colorName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderSummaryResponse {
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  totalItemQuantity: number;
  items: OrderSummaryItemBreakdown[];
  appliedVoucher?: {
    id: string;
    code: string;
    name: string;
    discountType: DiscountType;
    discountValue: number;
  } | null;
  voucherError?: string | null;
}


