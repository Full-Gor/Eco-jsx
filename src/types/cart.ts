/**
 * Cart and Order types
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
  price: Price;
  totalPrice: Price;
  addedAt: string;
  /** Is the item still available */
  isAvailable: boolean;
  /** Current stock for this item */
  availableStock: number;
}

/** Cart summary */
export interface CartSummary {
  subtotal: Price;
  shipping: Price | null;
  discount: Price | null;
  tax: Price | null;
  total: Price;
  itemCount: number;
  totalQuantity: number;
}

/** Applied promo code */
export interface AppliedPromoCode {
  code: string;
  type: PromoCodeType;
  value: number;
  discount: Price;
  description?: string;
}

/** Promo code type */
export type PromoCodeType = 'percentage' | 'fixed_amount' | 'free_shipping';

/** Promo code validation result */
export interface PromoCodeValidation {
  isValid: boolean;
  code?: string;
  type?: PromoCodeType;
  value?: number;
  description?: string;
  minOrderAmount?: number;
  error?: string;
}

/** Cart state */
export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  summary: CartSummary;
  promoCode?: AppliedPromoCode;
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingOptionId?: string;
  updatedAt: string;
}

/** Order status */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

/** Payment status */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'cancelled';

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

/** Shipping info */
export interface ShippingInfo {
  carrier: string;
  method: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

/** Payment info */
export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  lastFourDigits?: string;
  brand?: string;
  paidAt?: string;
}

/** Payment method */
export type PaymentMethod =
  | 'card'
  | 'paypal'
  | 'apple_pay'
  | 'google_pay'
  | 'klarna'
  | 'bank_transfer';

/** Order */
export interface Order extends Timestamps {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: Price;
  shippingCost: Price;
  discount?: Price;
  tax?: Price;
  total: Price;
  shippingAddress: Address;
  billingAddress?: Address;
  shipping?: ShippingInfo;
  payment: PaymentInfo;
  promoCode?: string;
  notes?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

/** Order summary (for list view) */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: Price;
  itemCount: number;
  firstItemImage?: string;
  createdAt: string;
}

/** Shipping option */
export interface ShippingOption {
  id: string;
  carrier: string;
  carrierId: string;
  name: string;
  description?: string;
  price: Price;
  estimatedDays: {
    min: number;
    max: number;
  };
  pickupPoints?: PickupPoint[];
  isPickupPoint: boolean;
}

/** Pickup point */
export interface PickupPoint {
  id: string;
  name: string;
  address: Address;
  distance?: number;
  openingHours?: string;
  latitude?: number;
  longitude?: number;
}

/** Saved payment method */
export interface SavedPaymentMethod {
  id: string;
  type: PaymentMethod;
  brand?: string;
  lastFourDigits?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  billingAddress?: Address;
}

/** Checkout step */
export type CheckoutStep = 'address' | 'shipping' | 'payment' | 'confirmation';

/** Checkout state */
export interface CheckoutState {
  step: CheckoutStep;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  useSameAddress: boolean;
  shippingOption: ShippingOption | null;
  selectedPickupPoint: PickupPoint | null;
  paymentMethod: SavedPaymentMethod | null;
  useNewCard: boolean;
  saveCard: boolean;
  promoCode: AppliedPromoCode | null;
  acceptedTerms: boolean;
}
