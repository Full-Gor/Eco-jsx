/**
 * PayPal Payment Provider
 * Implements IPaymentProvider using PayPal SDK
 */

import { ApiResponse } from '../../types/common';
import {
  IPaymentProvider,
  PaymentIntent,
  PaymentMethod,
  PaymentMethodType,
  PaymentStatus,
  CreatePaymentOptions,
  ConfirmPaymentOptions,
  RefundOptions,
  Refund,
  PaymentEventCallback,
  PaymentProviderOptions,
} from './PaymentProvider.interface';

/** PayPal configuration */
export interface PayPalConfig {
  clientId: string;
  returnUrl?: string;
  sandbox?: boolean;
}

/** PayPal order response */
interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{ rel: string; href: string }>;
}

/**
 * Create PayPal Payment Provider
 */
export function createPayPalPaymentProvider(
  config: PayPalConfig,
  apiUrl: string,
  getAuthToken: () => Promise<string | null>,
  options: PaymentProviderOptions = {}
): IPaymentProvider {
  const { clientId, returnUrl, sandbox = true } = config;
  const { defaultCurrency = 'EUR' } = options;

  let initialized = false;
  const eventListeners = new Map<string, Set<PaymentEventCallback>>();

  // Store for PayPal orders
  const paypalOrders = new Map<string, { orderId: string; approvalUrl: string }>();

  /** Make authenticated API request */
  const apiRequest = async <T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: object
  ): Promise<ApiResponse<T>> => {
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code || 'API_ERROR',
            message: data.message || 'Request failed',
          },
        };
      }

      return { success: true, data };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err.message,
        },
      };
    }
  };

  /** Map PayPal status to our status */
  const mapStatus = (paypalStatus: string): PaymentStatus => {
    const statusMap: Record<string, PaymentStatus> = {
      CREATED: 'pending',
      SAVED: 'pending',
      APPROVED: 'requires_confirmation',
      VOIDED: 'cancelled',
      COMPLETED: 'succeeded',
      PAYER_ACTION_REQUIRED: 'requires_action',
    };
    return statusMap[paypalStatus] || 'pending';
  };

  const provider: IPaymentProvider = {
    name: 'PayPal',
    type: 'paypal',

    async initialize(): Promise<void> {
      if (initialized) return;

      // PayPal doesn't require client-side initialization
      // Just verify the clientId is set
      if (!clientId) {
        throw new Error('PayPal clientId is required');
      }

      initialized = true;
    },

    async dispose(): Promise<void> {
      initialized = false;
      eventListeners.clear();
      paypalOrders.clear();
    },

    isReady(): boolean {
      return initialized;
    },

    async createPayment(options: CreatePaymentOptions): Promise<ApiResponse<PaymentIntent>> {
      // Create PayPal order via server
      const result = await apiRequest<PayPalOrderResponse>('/payments/paypal/create-order', 'POST', {
        amount: options.amount / 100, // Convert from cents
        currency: options.currency || defaultCurrency,
        orderId: options.orderId,
        description: options.description,
        returnUrl: returnUrl || 'myapp://paypal-return',
        cancelUrl: returnUrl ? `${returnUrl}?cancelled=true` : 'myapp://paypal-cancel',
      });

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || { code: 'PAYMENT_FAILED', message: 'Failed to create PayPal order' },
        };
      }

      const approvalLink = result.data.links.find((l) => l.rel === 'approve');

      // Store PayPal order info
      paypalOrders.set(result.data.id, {
        orderId: result.data.id,
        approvalUrl: approvalLink?.href || '',
      });

      const paymentIntent: PaymentIntent = {
        id: result.data.id,
        status: mapStatus(result.data.status),
        amount: {
          amount: options.amount / 100,
          currency: (options.currency || defaultCurrency).toUpperCase(),
        },
        currency: options.currency || defaultCurrency,
        clientSecret: approvalLink?.href, // Use approval URL as "client secret"
        metadata: {
          paypalOrderId: result.data.id,
          approvalUrl: approvalLink?.href || '',
          ...options.metadata,
        },
        createdAt: new Date().toISOString(),
      };

      return { success: true, data: paymentIntent };
    },

    async confirmPayment(
      paymentIntentId: string,
      _options?: ConfirmPaymentOptions
    ): Promise<ApiResponse<PaymentIntent>> {
      // Capture PayPal order after user approval
      const result = await apiRequest<{
        id: string;
        status: string;
        purchase_units: Array<{
          payments: {
            captures: Array<{
              id: string;
              amount: { value: string; currency_code: string };
            }>;
          };
        }>;
      }>(`/payments/paypal/capture-order/${paymentIntentId}`, 'POST');

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || { code: 'CAPTURE_FAILED', message: 'Failed to capture PayPal order' },
        };
      }

      const capture = result.data.purchase_units[0]?.payments?.captures[0];
      const amount = capture ? parseFloat(capture.amount.value) : 0;
      const currency = capture?.amount.currency_code || defaultCurrency;

      const paymentIntent: PaymentIntent = {
        id: result.data.id,
        status: mapStatus(result.data.status),
        amount: {
          amount,
          currency: currency.toUpperCase(),
        },
        currency,
        paymentMethodId: capture?.id,
        metadata: {
          paypalOrderId: result.data.id,
          captureId: capture?.id,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Notify listeners
      const listeners = eventListeners.get(paymentIntentId);
      if (listeners) {
        const event = {
          type: paymentIntent.status === 'succeeded'
            ? 'payment.succeeded' as const
            : 'payment.failed' as const,
          paymentIntent,
          timestamp: new Date(),
        };
        listeners.forEach((cb) => cb(event));
      }

      // Clean up stored order
      paypalOrders.delete(paymentIntentId);

      return { success: true, data: paymentIntent };
    },

    async cancelPayment(paymentIntentId: string): Promise<ApiResponse<PaymentIntent>> {
      // PayPal orders can be voided
      const result = await apiRequest<{ id: string; status: string }>(
        `/payments/paypal/void-order/${paymentIntentId}`,
        'POST'
      );

      if (!result.success) {
        return result as ApiResponse<PaymentIntent>;
      }

      const paymentIntent: PaymentIntent = {
        id: paymentIntentId,
        status: 'cancelled',
        amount: { amount: 0, currency: defaultCurrency },
        currency: defaultCurrency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      paypalOrders.delete(paymentIntentId);

      return { success: true, data: paymentIntent };
    },

    async getPayment(paymentIntentId: string): Promise<ApiResponse<PaymentIntent>> {
      const result = await apiRequest<{
        id: string;
        status: string;
        purchase_units: Array<{
          amount: { value: string; currency_code: string };
        }>;
        create_time: string;
        update_time?: string;
      }>(`/payments/paypal/orders/${paymentIntentId}`);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || { code: 'FETCH_FAILED', message: 'Failed to fetch PayPal order' },
        };
      }

      const purchaseUnit = result.data.purchase_units[0];
      const amount = purchaseUnit ? parseFloat(purchaseUnit.amount.value) : 0;
      const currency = purchaseUnit?.amount.currency_code || defaultCurrency;

      // Get stored approval URL if available
      const stored = paypalOrders.get(paymentIntentId);

      const paymentIntent: PaymentIntent = {
        id: result.data.id,
        status: mapStatus(result.data.status),
        amount: {
          amount,
          currency: currency.toUpperCase(),
        },
        currency,
        clientSecret: stored?.approvalUrl,
        metadata: {
          paypalOrderId: result.data.id,
        },
        createdAt: result.data.create_time,
        updatedAt: result.data.update_time,
      };

      return { success: true, data: paymentIntent };
    },

    async refundPayment(options: RefundOptions): Promise<ApiResponse<Refund>> {
      const result = await apiRequest<{
        id: string;
        status: string;
        amount: { value: string; currency_code: string };
        create_time: string;
      }>('/payments/paypal/refund', 'POST', {
        captureId: options.paymentIntentId, // For PayPal, we need the capture ID
        amount: options.amount ? options.amount / 100 : undefined,
        reason: options.reason,
      });

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || { code: 'REFUND_FAILED', message: 'Failed to process PayPal refund' },
        };
      }

      const refund: Refund = {
        id: result.data.id,
        paymentIntentId: options.paymentIntentId,
        amount: {
          amount: parseFloat(result.data.amount.value),
          currency: result.data.amount.currency_code.toUpperCase(),
        },
        status: result.data.status === 'COMPLETED' ? 'succeeded' : 'pending',
        reason: options.reason,
        createdAt: result.data.create_time,
      };

      return { success: true, data: refund };
    },

    async getPaymentMethods(_customerId: string): Promise<ApiResponse<PaymentMethod[]>> {
      // PayPal doesn't store payment methods the same way as cards
      // Users authenticate with PayPal each time
      return { success: true, data: [] };
    },

    async savePaymentMethod(
      _customerId: string,
      _paymentMethodId: string
    ): Promise<ApiResponse<PaymentMethod>> {
      // Not supported for PayPal
      return {
        success: false,
        error: {
          code: 'NOT_SUPPORTED',
          message: 'PayPal does not support saving payment methods',
        },
      };
    },

    async deletePaymentMethod(_paymentMethodId: string): Promise<ApiResponse<void>> {
      // Not supported for PayPal
      return {
        success: false,
        error: {
          code: 'NOT_SUPPORTED',
          message: 'PayPal does not support deleting payment methods',
        },
      };
    },

    async setDefaultPaymentMethod(
      _customerId: string,
      _paymentMethodId: string
    ): Promise<ApiResponse<void>> {
      // Not supported for PayPal
      return {
        success: false,
        error: {
          code: 'NOT_SUPPORTED',
          message: 'PayPal does not support default payment methods',
        },
      };
    },

    onPaymentEvent(paymentIntentId: string, callback: PaymentEventCallback) {
      if (!eventListeners.has(paymentIntentId)) {
        eventListeners.set(paymentIntentId, new Set());
      }
      eventListeners.get(paymentIntentId)!.add(callback);

      return () => {
        eventListeners.get(paymentIntentId)?.delete(callback);
      };
    },

    getSupportedPaymentMethods(): PaymentMethodType[] {
      return ['paypal'];
    },
  };

  return provider;
}

export default createPayPalPaymentProvider;
