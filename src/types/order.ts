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

// ============================================
// Phase 5 - Extended Order and Tracking Types
// ============================================

/** Extended Order status with tracking and return states */
export type ExtendedOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'return_requested'
  | 'return_in_progress'
  | 'returned';

/** Extended tracking status */
export type ExtendedTrackingStatus =
  | 'unknown'
  | 'pre_transit'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'available_for_pickup'
  | 'return_to_sender'
  | 'failure'
  | 'cancelled';

/** Extended tracking event */
export interface ExtendedTrackingEvent {
  id: string;
  status: ExtendedTrackingStatus;
  description: string;
  location?: string;
  timestamp: string;
  rawStatus?: string;
}

/** Delivery proof */
export interface DeliveryProof {
  photo?: string;
  signature?: string;
  signedBy?: string;
  deliveredAt?: string;
}

/** Extended tracking info */
export interface ExtendedTrackingInfo {
  trackingNumber: string;
  carrier: string;
  carrierName: string;
  carrierType: CarrierType;
  status: ExtendedTrackingStatus;
  statusDescription: string;
  estimatedDelivery?: string;
  events: ExtendedTrackingEvent[];
  currentLocation?: string;
  deliveryProof?: DeliveryProof;
  trackingUrl?: string;
  lastUpdated: string;
}

/** Carrier type */
export type CarrierType =
  | 'manual'
  | 'colissimo'
  | 'chronopost'
  | 'mondialrelay'
  | 'ups'
  | 'fedex'
  | 'dhl'
  | 'shippo'
  | 'easypost'
  | '17track';

/** Order with extended status */
export interface ExtendedOrder extends Timestamps {
  id: string;
  orderNumber: string;
  userId: string;
  status: ExtendedOrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  subtotal: Price;
  shippingCost: Price;
  discount?: CartDiscount;
  tax?: Price;
  total: Price;
  shippingAddress: Address;
  billingAddress?: Address;
  shippingMethod?: ShippingOption;
  tracking?: ExtendedTrackingInfo;
  payment?: PaymentMethodInfo;
  promoCode?: string;
  notes?: string;
  cancelledAt?: string;
  cancelReason?: string;
  estimatedDelivery?: {
    min: string;
    max: string;
  };
}

/** Order timeline step */
export interface OrderTimelineStep {
  id: string;
  status: ExtendedOrderStatus | ExtendedTrackingStatus;
  title: string;
  description?: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
  icon?: string;
}

/** Return reason */
export type ReturnReason =
  | 'defective'
  | 'not_as_described'
  | 'wrong_size'
  | 'changed_mind'
  | 'arrived_late'
  | 'other';

/** Return status */
export type ReturnStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'shipped'
  | 'received'
  | 'inspecting'
  | 'refunded'
  | 'exchanged';

/** Return item */
export interface ReturnItem {
  id: string;
  orderItemId: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: Price;
  reason: ReturnReason;
}

/** Return request */
export interface ReturnRequest extends Timestamps {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  status: ReturnStatus;
  items: ReturnItem[];
  reason: ReturnReason;
  comment?: string;
  photos?: string[];
  resolution: 'refund' | 'exchange';
  returnLabel?: string;
  returnLabelUrl?: string;
  returnTrackingNumber?: string;
  returnAddress?: Address;
  refundAmount?: Price;
  refundMethod?: 'original' | 'store_credit';
  refundedAt?: string;
  rejectionReason?: string;
}

/** Return timeline step */
export interface ReturnTimelineStep {
  id: string;
  status: ReturnStatus;
  title: string;
  description?: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

/** Order filter */
export interface OrderFilter {
  status?: ExtendedOrderStatus | 'all' | 'active' | 'completed';
  dateFrom?: string;
  dateTo?: string;
}

/** Order sort */
export type OrderSort = 'date_desc' | 'date_asc' | 'total_desc' | 'total_asc';

/** Create return request data */
export interface CreateReturnData {
  orderId: string;
  items: Array<{
    orderItemId: string;
    quantity: number;
    reason: ReturnReason;
  }>;
  resolution: 'refund' | 'exchange';
  comment?: string;
  photos?: string[];
}

/** Webhook subscription */
export interface TrackingWebhook {
  id: string;
  trackingNumber: string;
  carrier: string;
  webhookUrl: string;
  createdAt: string;
}

/** Order summary for list view */
export interface ExtendedOrderSummary {
  id: string;
  orderNumber: string;
  status: ExtendedOrderStatus;
  total: Price;
  itemCount: number;
  firstItemImage?: string;
  firstItemName?: string;
  createdAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
}
