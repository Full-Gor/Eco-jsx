/**
 * Payment Provider Interface
 * Defines the contract for all payment providers
 */

import { ApiResponse, Callback, Unsubscribe, Price } from '../../types/common';
import { BaseProvider } from '../types';

/** Payment status */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'requires_action'
  | 'requires_confirmation'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded';

/** Payment method type */
export type PaymentMethodType =
  | 'card'
  | 'bank_transfer'
  | 'paypal'
  | 'apple_pay'
  | 'google_pay'
  | 'klarna'
  | 'ideal'
  | 'bancontact'
  | 'sepa_debit';

/** Payment intent */
export interface PaymentIntent {
  id: string;
  status: PaymentStatus;
  amount: Price;
  currency: string;
  clientSecret?: string;
  paymentMethodId?: string;
  paymentMethod?: PaymentMethod;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

/** Payment method */
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  isDefault?: boolean;
  card?: CardDetails;
  bankAccount?: BankAccountDetails;
  billingDetails?: BillingDetails;
  createdAt: Date | string;
}

/** Card details */
export interface CardDetails {
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  fingerprint?: string;
}

/** Bank account details */
export interface BankAccountDetails {
  bankName: string;
  last4: string;
  accountHolderName?: string;
}

/** Billing details */
export interface BillingDetails {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

/** Create payment options */
export interface CreatePaymentOptions {
  amount: number;
  currency: string;
  orderId?: string;
  customerId?: string;
  paymentMethodId?: string;
  paymentMethodType?: PaymentMethodType;
  description?: string;
  metadata?: Record<string, unknown>;
  captureMethod?: 'automatic' | 'manual';
  setupFutureUsage?: 'on_session' | 'off_session';
}

/** Confirm payment options */
export interface ConfirmPaymentOptions {
  paymentMethodId?: string;
  returnUrl?: string;
  savePaymentMethod?: boolean;
}

/** Refund options */
export interface RefundOptions {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}

/** Refund result */
export interface Refund {
  id: string;
  paymentIntentId: string;
  amount: Price;
  status: 'pending' | 'succeeded' | 'failed';
  reason?: string;
  createdAt: Date | string;
}

/** Payment event types */
export type PaymentEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.cancelled'
  | 'payment.refunded'
  | 'payment.requires_action';

/** Payment event */
export interface PaymentEvent {
  type: PaymentEventType;
  paymentIntent: PaymentIntent;
  timestamp: Date;
}

/** Payment event callback */
export type PaymentEventCallback = Callback<PaymentEvent>;

/** Payment provider interface */
export interface IPaymentProvider extends BaseProvider {
  /**
   * Create a payment intent
   * @param options - Payment creation options
   * @returns Promise with payment intent
   */
  createPayment(options: CreatePaymentOptions): Promise<ApiResponse<PaymentIntent>>;

  /**
   * Confirm a payment
   * @param paymentIntentId - Payment intent ID
   * @param options - Confirmation options
   * @returns Promise with updated payment intent
   */
  confirmPayment(
    paymentIntentId: string,
    options?: ConfirmPaymentOptions
  ): Promise<ApiResponse<PaymentIntent>>;

  /**
   * Cancel a payment
   * @param paymentIntentId - Payment intent ID
   * @returns Promise with cancelled payment intent
   */
  cancelPayment(paymentIntentId: string): Promise<ApiResponse<PaymentIntent>>;

  /**
   * Get payment intent by ID
   * @param paymentIntentId - Payment intent ID
   * @returns Promise with payment intent
   */
  getPayment(paymentIntentId: string): Promise<ApiResponse<PaymentIntent>>;

  /**
   * Refund a payment
   * @param options - Refund options
   * @returns Promise with refund result
   */
  refundPayment(options: RefundOptions): Promise<ApiResponse<Refund>>;

  /**
   * Get saved payment methods for a customer
   * @param customerId - Customer ID
   * @returns Promise with array of payment methods
   */
  getPaymentMethods(customerId: string): Promise<ApiResponse<PaymentMethod[]>>;

  /**
   * Save a payment method for future use
   * @param customerId - Customer ID
   * @param paymentMethodId - Payment method ID
   * @returns Promise with saved payment method
   */
  savePaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<ApiResponse<PaymentMethod>>;

  /**
   * Delete a saved payment method
   * @param paymentMethodId - Payment method ID
   * @returns Promise with success status
   */
  deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<void>>;

  /**
   * Set default payment method
   * @param customerId - Customer ID
   * @param paymentMethodId - Payment method ID
   * @returns Promise with success status
   */
  setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<ApiResponse<void>>;

  /**
   * Subscribe to payment events
   * @param paymentIntentId - Payment intent ID
   * @param callback - Event callback
   * @returns Unsubscribe function
   */
  onPaymentEvent(
    paymentIntentId: string,
    callback: PaymentEventCallback
  ): Unsubscribe;

  /**
   * Get supported payment methods
   * @returns Array of supported payment method types
   */
  getSupportedPaymentMethods(): PaymentMethodType[];

  /**
   * Check if Apple Pay is available
   * @returns Promise with availability status
   */
  isApplePayAvailable?(): Promise<boolean>;

  /**
   * Check if Google Pay is available
   * @returns Promise with availability status
   */
  isGooglePayAvailable?(): Promise<boolean>;

  /**
   * Present payment sheet (for native payment UI)
   * @param paymentIntent - Payment intent
   * @returns Promise with payment result
   */
  presentPaymentSheet?(paymentIntent: PaymentIntent): Promise<ApiResponse<PaymentIntent>>;
}

/** Payment provider options */
export interface PaymentProviderOptions {
  /** Merchant identifier */
  merchantId?: string;

  /** Environment */
  environment?: 'test' | 'production';

  /** Enable Apple Pay */
  enableApplePay?: boolean;

  /** Enable Google Pay */
  enableGooglePay?: boolean;

  /** Default currency */
  defaultCurrency?: string;
}
