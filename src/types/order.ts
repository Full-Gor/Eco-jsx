/**
 * Order-related types
 */

import { Address, Price, Timestamps } from './common';
import { Product, ProductVariant } from './product';

/** Cart item */
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: Price;
  totalPrice: Price;
  metadata?: Record<string, unknown>;
}

/** Shopping cart */
export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  subtotal: Price;
  discount?: CartDiscount;
  shipping?: ShippingOption;
  tax?: Price;
  total: Price;
  couponCode?: string;
  itemCount: number;
  updatedAt: Date | string;
}

/** Cart discount */
export interface CartDiscount {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  amount: Price;
  description?: string;
}

/** Shipping option */
export interface ShippingOption {
  id: string;
  name: string;
  carrier: string;
  description?: string;
  price: Price;
  estimatedDays?: number;
  estimatedDelivery?: string;
  trackingSupported?: boolean;
}

/** Order status */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'failed';

/** Payment status */
export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'partially_refunded'
  | 'refunded'
  | 'failed'
  | 'cancelled';

/** Order */
export interface Order extends Timestamps {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: Price;
  discount?: CartDiscount;
  shippingCost: Price;
  tax: Price;
  total: Price;
  paymentMethod?: PaymentMethodInfo;
  shippingMethod?: ShippingOption;
  tracking?: TrackingInfo;
  notes?: string;
  metadata?: Record<string, unknown>;
}

/** Order item */
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unitPrice: Price;
  totalPrice: Price;
}

/** Payment method info */
export interface PaymentMethodInfo {
  type: string;
  provider: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

/** Tracking info */
export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  status?: TrackingStatus;
  events?: TrackingEvent[];
  estimatedDelivery?: string;
}

/** Tracking status */
export type TrackingStatus =
  | 'pending'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception'
  | 'returned';

/** Tracking event */
export interface TrackingEvent {
  date: Date | string;
  status: string;
  location?: string;
  description: string;
}

/** Checkout data */
export interface CheckoutData {
  cartId: string;
  shippingAddress: Address;
  billingAddress?: Address;
  sameAsShipping?: boolean;
  shippingMethodId: string;
  paymentMethodId?: string;
  couponCode?: string;
  notes?: string;
}

/** Coupon */
export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  validFrom?: Date | string;
  validUntil?: Date | string;
  isActive: boolean;
}
