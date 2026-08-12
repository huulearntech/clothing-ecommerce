export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
}

export enum AddressType {
  SHIPPING = 'SHIPPING',
  BILLING = 'BILLING',
}

export enum GenderPreference {
  MEN = 'MEN',
  WOMEN = 'WOMEN',
  UNISEX = 'UNISEX',
}

export enum GenderCategory {
  MEN = 'MEN',
  WOMEN = 'WOMEN',
  UNISEX = 'UNISEX',
  KIDS = 'KIDS',
}

export enum Season {
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  FALL = 'FALL',
  WINTER = 'WINTER',
  ALL_SEASON = 'ALL_SEASON',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum PaymentGateway {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  APPLE_PAY = 'APPLE_PAY',
  COD = 'COD',
}

export enum PaymentStatus {
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum ShipmentStatus {
  LABEL_CREATED = 'LABEL_CREATED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  EXCEPTION = 'EXCEPTION',
}

export enum FitFeedback {
  RUNS_SMALL = 'RUNS_SMALL',
  TRUE_TO_SIZE = 'TRUE_TO_SIZE',
  RUNS_LARGE = 'RUNS_LARGE',
}

export enum ReturnStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  RECEIVED = 'RECEIVED',
  REFUNDED = 'REFUNDED',
}
