/**
 * Stripe Payment Provider
 * Implements IPaymentProvider using Stripe SDK
 */

import { ApiResponse } from '../../types/common';
import {
  IPaymentProvider,
  PaymentIntent,
  PaymentMethod,
  PaymentMethodType,
  CreatePaymentOptions,
  ConfirmPaymentOptions,
  RefundOptions,
  Refund,
  PaymentEventCallback,
  PaymentProviderOptions,
} from './PaymentProvider.interface';

/** Stripe configuration */
export interface StripeConfig {
  publishableKey: string;
  merchantId?: string;
  urlScheme?: string;
}

/** Stripe SDK types (loaded dynamically) */
type StripeModule = {
  initStripe: (params: {
    publishableKey: string;
    merchantIdentifier?: string;
    urlScheme?: string;
  }) => Promise<void>;
  createPaymentMethod: (params: {
    paymentMethodType: 'Card';
    paymentMethodData?: {
      billingDetails?: {
        email?: string;
        name?: string;
        phone?: string;
        address?: {
          city?: string;
          country?: string;
          line1?: string;
          line2?: string;
          postalCode?: string;
          state?: string;
        };
      };
    };
  }) => Promise<{ paymentMethod?: { id: string }; error?: { message: string } }>;
  confirmPayment: (
    clientSecret: string,
    params: {
      paymentMethodType: 'Card';
      paymentMethodData?: {
        billingDetails?: object;
      };
    }
  ) => Promise<{ paymentIntent?: { id: string; status: string }; error?: { message: string } }>;
  isApplePaySupported: () => Promise<boolean>;
  isGooglePaySupported: (params: { testEnv?: boolean }) => Promise<boolean>;
  initPaymentSheet: (params: {
    paymentIntentClientSecret: string;
    merchantDisplayName: string;
    customerId?: string;
    customerEphemeralKeySecret?: string;
    applePay?: { merchantCountryCode: string };
    googlePay?: { merchantCountryCode: string; testEnv?: boolean };
    defaultBillingDetails?: object;
    returnURL?: string;
  }) => Promise<{ error?: { message: string } }>;
  presentPaymentSheet: () => Promise<{
    paymentOption?: { label: string; image: string };
    error?: { message: string };
  }>;
};

let Stripe: StripeModule | null = null;

/** Load Stripe SDK dynamically */
async function loadStripe(): Promise<StripeModule> {
  if (Stripe) return Stripe;

  try {
    const module = await import('@stripe/stripe-react-native');
    Stripe = module;
    return module;
  } catch {
    throw new Error('Stripe SDK not installed. Run: npm install @stripe/stripe-react-native');
  }
}

/**
 * Create Stripe Payment Provider
 */
export function createStripePaymentProvider(
  config: StripeConfig,
  apiUrl: string,
  getAuthToken: () => Promise<string | null>,
  options: PaymentProviderOptions = {}
): IPaymentProvider {
  const { publishableKey, merchantId, urlScheme } = config;
  const { environment = 'test', defaultCurrency = 'EUR' } = options;

  let initialized = false;
  const eventListeners = new Map<string, Set<PaymentEventCallback>>();

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

  /** Convert Stripe status to our status */
  const mapStatus = (stripeStatus: string): PaymentIntent['status'] => {
    const statusMap: Record<string, PaymentIntent['status']> = {
      requires_payment_method: 'pending',
      requires_confirmation: 'requires_confirmation',
      requires_action: 'requires_action',
      processing: 'processing',
      requires_capture: 'processing',
      succeeded: 'succeeded',
      canceled: 'cancelled',
    };
    return statusMap[stripeStatus] || 'pending';
  };

  const provider: IPaymentProvider = {
    name: 'Stripe',
    type: 'stripe',

    async initialize(): Promise<void> {
      if (initialized) return;

      try {
        const stripe = await loadStripe();
        await stripe.initStripe({
          publishableKey,
          merchantIdentifier: merchantId,
          urlScheme,
        });
        initialized = true;
      } catch (error) {
        const err = error as Error;
        throw new Error(`Failed to initialize Stripe: ${err.message}`);
      }
    },

    async dispose(): Promise<void> {
      initialized = false;
      eventListeners.clear();
    },

    isReady(): boolean {
      return initialized;
    },

    async createPayment(options: CreatePaymentOptions): Promise<ApiResponse<PaymentIntent>> {
      // Create payment intent via server
      const result = await apiRequest<{
        id: string;
        client_secret: string;
        amount: number;
        currency: string;
        status: string;
      }>('/payments/create-intent', 'POST', {
        amount: options.amount,
        currency: options.currency || defaultCurrency,
        customerId: options.customerId,
        orderId: options.orderId,
        metadata: options.metadata,
        captureMethod: options.captureMethod,
        setupFutureUsage: options.setupFutureUsage,
      });

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || { code: 'PAYMENT_FAILED', message: 'Failed to process payment' },
        };
      }

      const paymentIntent: PaymentIntent = {
        id: result.data.id,
        status: mapStatus(result.data.status),
        amount: {
          amount: result.data.amount / 100,
          currency: result.data.currency.toUpperCase(),
        },
        currency: result.data.currency,
        clientSecret: result.data.client_secret,
        metadata: options.metadata,
        createdAt: new Date().toISOString(),
      };

      return { success: true, data: paymentIntent };
    },

    async confirmPayment(
      paymentIntentId: string,
      options?: ConfirmPaymentOptions
    ): Promise<ApiResponse<PaymentIntent>> {
      try {
        // Get payment intent details first
        const intentResult = await provider.getPayment(paymentIntentId);
        if (!intentResult.success || !intentResult.data?.clientSecret) {
          return {
            success: false,
            error: {
              code: 'INVALID_PAYMENT',
              message: 'Payment intent not found or missing client secret',
            },
          };
        }

        const stripe = await loadStripe();
        const { paymentIntent, error } = await stripe.confirmPayment(
          intentResult.data.clientSecret,
          {
            paymentMethodType: 'Card',
            paymentMethodData: options?.paymentMethodId
              ? undefined
              : { billingDetails: {} },
          }
        );

        if (error) {
          return {
            success: false,
            error: {
              code: 'CONFIRMATION_FAILED',
              message: error.message,
            },
          };
        }

        const updatedIntent: PaymentIntent = {
          ...intentResult.data,
          status: mapStatus(paymentIntent?.status || 'processing'),
          updatedAt: new Date().toISOString(),
        };

        // Notify listeners
        const listeners = eventListeners.get(paymentIntentId);
        if (listeners) {
          const event = {
            type: updatedIntent.status === 'succeeded'
              ? 'payment.succeeded' as const
              : 'payment.requires_action' as const,
            paymentIntent: updatedIntent,
            timestamp: new Date(),
          };
          listeners.forEach((cb) => cb(event));
        }

        return { success: true, data: updatedIntent };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'CONFIRMATION_ERROR',
            message: err.message,
          },
        };
      }
    },

    async cancelPayment(paymentIntentId: string): Promise<ApiResponse<PaymentIntent>> {
      const result = await apiRequest<{
        id: string;
        status: string;
        amount: number;
        currency: string;
      }>(`/payments/${paymentIntentId}/cancel`, 'POST');

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || { code: 'PAYMENT_FAILED', message: 'Failed to process payment' },
        };
      }

      const paymentIntent: PaymentIntent = {
        id: result.data.id,
        status: 'cancelled',
        amount: {
          amount: result.data.amount / 100,
          currency: result.data.currency.toUpperCase(),
        },
        currency: result.data.currency,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      return { success: true, data: paymentIntent };
    },

    async getPayment(paymentIntentId: string): Promise<ApiResponse<PaymentIntent>> {
      const result = await apiRequest<{
        id: string;
        client_secret: string;
        status: string;
        amount: number;
        currency: string;
        payment_method?: string;
        metadata?: Record<string, unknown>;
        created: number;
      }>(`/payments/${paymentIntentId}`);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || { code: 'PAYMENT_FAILED', message: 'Failed to process payment' },
        };
      }

      const paymentIntent: PaymentIntent = {
        id: result.data.id,
        status: mapStatus(result.data.status),
        amount: {
          amount: result.data.amount / 100,
          currency: result.data.currency.toUpperCase(),
        },
        currency: result.data.currency,
        clientSecret: result.data.client_secret,
        paymentMethodId: result.data.payment_method,
        metadata: result.data.metadata,
        createdAt: new Date(result.data.created * 1000).toISOString(),
      };

      return { success: true, data: paymentIntent };
    },

    async refundPayment(options: RefundOptions): Promise<ApiResponse<Refund>> {
      const result = await apiRequest<{
        id: string;
        payment_intent: string;
        amount: number;
        currency: string;
        status: string;
        reason?: string;
        created: number;
      }>('/payments/refund', 'POST', {
        paymentIntentId: options.paymentIntentId,
        amount: options.amount,
        reason: options.reason,
      });

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || { code: 'REFUND_FAILED', message: 'Failed to process refund' },
        };
      }

      const refund: Refund = {
        id: result.data.id,
        paymentIntentId: result.data.payment_intent,
        amount: {
          amount: result.data.amount / 100,
          currency: result.data.currency.toUpperCase(),
        },
        status: result.data.status === 'succeeded' ? 'succeeded' : 'pending',
        reason: result.data.reason,
        createdAt: new Date(result.data.created * 1000).toISOString(),
      };

      return { success: true, data: refund };
    },

    async getPaymentMethods(customerId: string): Promise<ApiResponse<PaymentMethod[]>> {
      const result = await apiRequest<{
        data: Array<{
          id: string;
          type: string;
          card?: {
            brand: string;
            last4: string;
            exp_month: number;
            exp_year: number;
            fingerprint?: string;
          };
          billing_details?: {
            name?: string;
            email?: string;
            phone?: string;
            address?: object;
          };
          created: number;
        }>;
      }>(`/payments/methods/${customerId}`);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || { code: 'FETCH_FAILED', message: 'Failed to fetch payment methods' },
        };
      }

      const methods: PaymentMethod[] = result.data.data.map((pm) => ({
        id: pm.id,
        type: pm.type as PaymentMethodType,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expiryMonth: pm.card.exp_month,
              expiryYear: pm.card.exp_year,
              fingerprint: pm.card.fingerprint,
            }
          : undefined,
        billingDetails: pm.billing_details,
        createdAt: new Date(pm.created * 1000).toISOString(),
      }));

      return { success: true, data: methods };
    },

    async savePaymentMethod(
      customerId: string,
      paymentMethodId: string
    ): Promise<ApiResponse<PaymentMethod>> {
      const result = await apiRequest<{
        id: string;
        type: string;
        card?: {
          brand: string;
          last4: string;
          exp_month: number;
          exp_year: number;
        };
        created: number;
      }>('/payments/methods/save', 'POST', {
        customerId,
        paymentMethodId,
      });

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || { code: 'SAVE_FAILED', message: 'Failed to save payment method' },
        };
      }

      const method: PaymentMethod = {
        id: result.data.id,
        type: result.data.type as PaymentMethodType,
        card: result.data.card
          ? {
              brand: result.data.card.brand,
              last4: result.data.card.last4,
              expiryMonth: result.data.card.exp_month,
              expiryYear: result.data.card.exp_year,
            }
          : undefined,
        createdAt: new Date(result.data.created * 1000).toISOString(),
      };

      return { success: true, data: method };
    },

    async deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<void>> {
      return apiRequest(`/payments/methods/${paymentMethodId}`, 'DELETE');
    },

    async setDefaultPaymentMethod(
      customerId: string,
      paymentMethodId: string
    ): Promise<ApiResponse<void>> {
      return apiRequest('/payments/methods/default', 'POST', {
        customerId,
        paymentMethodId,
      });
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
      const methods: PaymentMethodType[] = ['card'];

      if (options.enableApplePay) {
        methods.push('apple_pay');
      }
      if (options.enableGooglePay) {
        methods.push('google_pay');
      }

      return methods;
    },

    async isApplePayAvailable(): Promise<boolean> {
      try {
        const stripe = await loadStripe();
        return await stripe.isApplePaySupported();
      } catch {
        return false;
      }
    },

    async isGooglePayAvailable(): Promise<boolean> {
      try {
        const stripe = await loadStripe();
        return await stripe.isGooglePaySupported({
          testEnv: environment === 'test',
        });
      } catch {
        return false;
      }
    },

    async presentPaymentSheet(paymentIntent: PaymentIntent): Promise<ApiResponse<PaymentIntent>> {
      try {
        if (!paymentIntent.clientSecret) {
          return {
            success: false,
            error: {
              code: 'INVALID_PAYMENT',
              message: 'Missing client secret',
            },
          };
        }

        const stripe = await loadStripe();

        // Initialize payment sheet
        const { error: initError } = await stripe.initPaymentSheet({
          paymentIntentClientSecret: paymentIntent.clientSecret,
          merchantDisplayName: options.merchantId || 'Store',
          applePay: options.enableApplePay
            ? { merchantCountryCode: 'FR' }
            : undefined,
          googlePay: options.enableGooglePay
            ? { merchantCountryCode: 'FR', testEnv: environment === 'test' }
            : undefined,
        });

        if (initError) {
          return {
            success: false,
            error: {
              code: 'INIT_ERROR',
              message: initError.message,
            },
          };
        }

        // Present payment sheet
        const { error: presentError } = await stripe.presentPaymentSheet();

        if (presentError) {
          return {
            success: false,
            error: {
              code: 'PAYMENT_CANCELLED',
              message: presentError.message,
            },
          };
        }

        // Payment succeeded - get updated status
        return provider.getPayment(paymentIntent.id);
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'PAYMENT_SHEET_ERROR',
            message: err.message,
          },
        };
      }
    },
  };

  return provider;
}

export default createStripePaymentProvider;
