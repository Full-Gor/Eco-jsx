/**
 * NexusServ Commission Provider
 * Self-hosted commission and payout management
 */

import type { ApiResponse, PaginatedResponse, Pagination } from '../types';
import type {
  CommissionProvider,
  CommissionProviderConfig,
  CommissionInput,
  RequestPayoutInput,
} from './CommissionProvider.interface';
import type {
  CommissionBreakdown,
  SellerBalance,
  Transaction,
  TransactionFilters,
  PayoutRequest,
  PayoutFilters,
  Seller,
  SubOrder,
} from '../../types/marketplace';
import type { Order } from '../../types/order';

/** NexusServ commission provider configuration */
export interface NexusServCommissionConfig extends CommissionProviderConfig {
  /** API URL */
  apiUrl: string;
  /** Default commission rate (percentage) */
  defaultCommissionRate: number;
  /** Minimum payout amount */
  minPayoutAmount: number;
  /** Payout fee percentage */
  payoutFeePercentage?: number;
  /** Fixed payout fee */
  payoutFeeFixed?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Create NexusServ commission provider
 */
export function createNexusServCommissionProvider(
  config: NexusServCommissionConfig
): CommissionProvider {
  const {
    apiUrl,
    defaultCommissionRate,
    minPayoutAmount,
    payoutFeePercentage = 0,
    payoutFeeFixed = 0,
    debug = false,
  } = config;

  let isInitialized = false;
  let authToken: string | null = null;

  const log = (...args: unknown[]) => {
    if (debug) console.log('[NexusServCommission]', ...args);
  };

  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

  const apiRequest = async <T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers: {
          ...getHeaders(),
          ...options?.headers,
        },
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
      log('API error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: String(error),
        },
      };
    }
  };

  const buildQueryString = (params: Record<string, unknown>): string => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  };

  // Helper to calculate commission based on seller's rate
  const calculateCommissionRate = (seller: Seller, categoryId?: string): number => {
    const { commission } = seller;

    // Check for category override
    if (categoryId && commission.categoryOverrides?.[categoryId] !== undefined) {
      return commission.categoryOverrides[categoryId];
    }

    // Calculate based on type
    switch (commission.type) {
      case 'percentage':
        return commission.value;

      case 'tiered':
        if (commission.tiers && commission.tiers.length > 0) {
          const sellerSales = seller.salesCount || 0;
          const applicableTier = commission.tiers
            .filter((tier) => sellerSales >= tier.minSales)
            .sort((a, b) => b.minSales - a.minSales)[0];
          return applicableTier?.rate || commission.value;
        }
        return commission.value;

      case 'fixed':
        // Fixed amount per order, convert to effective percentage
        return commission.value;

      default:
        return defaultCommissionRate;
    }
  };

  return {
    name: 'nexusserv-commission',
    type: 'commission',

    async initialize(): Promise<void> {
      if (isInitialized) return;
      log('Initializing NexusServ commission provider');
      isInitialized = true;
    },

    isReady(): boolean {
      return isInitialized;
    },

    async dispose(): Promise<void> {
      isInitialized = false;
      authToken = null;
    },

    // Commission calculation (local)
    calculateCommission(input: CommissionInput, seller: Seller): CommissionBreakdown {
      const { orderTotal, itemsTotal, shippingTotal, categoryId } = input;

      let commissionRate = calculateCommissionRate(seller, categoryId);
      let commissionAmount: number;

      if (seller.commission.type === 'fixed') {
        // Fixed commission per order
        commissionAmount = seller.commission.value;
        commissionRate = (commissionAmount / orderTotal) * 100;
      } else {
        // Percentage commission
        commissionAmount = (itemsTotal * commissionRate) / 100;
      }

      const sellerAmount = orderTotal - commissionAmount;
      const platformAmount = commissionAmount;

      const breakdown: CommissionBreakdown = {
        orderTotal,
        itemsTotal,
        shippingTotal,
        commissionRate,
        commissionAmount: Math.round(commissionAmount * 100) / 100,
        sellerAmount: Math.round(sellerAmount * 100) / 100,
        platformAmount: Math.round(platformAmount * 100) / 100,
        fees: [],
        currency: 'USD',
      };

      log('Calculated commission:', breakdown);
      return breakdown;
    },

    async calculateOrderCommissions(
      order: Order,
      subOrders: SubOrder[]
    ): Promise<ApiResponse<CommissionBreakdown[]>> {
      log('Calculating commissions for order:', order.id);
      return apiRequest<CommissionBreakdown[]>(
        `/commissions/calculate/${order.id}`,
        {
          method: 'POST',
          body: JSON.stringify({ subOrders }),
        }
      );
    },

    // Balance
    async getSellerBalance(sellerId: string): Promise<ApiResponse<SellerBalance>> {
      log('Getting balance for seller:', sellerId);
      return apiRequest<SellerBalance>(`/sellers/${sellerId}/balance`);
    },

    async refreshBalance(sellerId: string): Promise<ApiResponse<SellerBalance>> {
      log('Refreshing balance for seller:', sellerId);
      return apiRequest<SellerBalance>(`/sellers/${sellerId}/balance/refresh`, {
        method: 'POST',
      });
    },

    // Transactions
    async getTransactions(
      sellerId: string,
      filters?: TransactionFilters,
      pagination?: Pagination
    ): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
      const query = buildQueryString({
        ...filters,
        page: pagination?.page,
        limit: pagination?.limit,
      });
      log('Getting transactions for seller:', sellerId);
      return apiRequest<PaginatedResponse<Transaction>>(
        `/sellers/${sellerId}/transactions${query}`
      );
    },

    async getTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
      log('Getting transaction:', transactionId);
      return apiRequest<Transaction>(`/transactions/${transactionId}`);
    },

    async getTransactionsByOrder(orderId: string): Promise<ApiResponse<Transaction[]>> {
      log('Getting transactions for order:', orderId);
      return apiRequest<Transaction[]>(`/orders/${orderId}/transactions`);
    },

    // Payouts
    async requestPayout(
      sellerId: string,
      input: RequestPayoutInput
    ): Promise<ApiResponse<PayoutRequest>> {
      log('Requesting payout for seller:', sellerId, 'amount:', input.amount);

      if (input.amount < minPayoutAmount) {
        return {
          success: false,
          error: {
            code: 'MIN_PAYOUT_NOT_MET',
            message: `Minimum payout amount is ${minPayoutAmount}`,
          },
        };
      }

      // Calculate fee
      const fee = (input.amount * payoutFeePercentage) / 100 + payoutFeeFixed;

      return apiRequest<PayoutRequest>(`/sellers/${sellerId}/payouts`, {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          fee,
          netAmount: input.amount - fee,
        }),
      });
    },

    async cancelPayoutRequest(payoutId: string): Promise<ApiResponse<void>> {
      log('Cancelling payout request:', payoutId);
      return apiRequest<void>(`/payouts/${payoutId}/cancel`, {
        method: 'POST',
      });
    },

    async getPayoutRequests(
      sellerId: string,
      filters?: PayoutFilters,
      pagination?: Pagination
    ): Promise<ApiResponse<PaginatedResponse<PayoutRequest>>> {
      const query = buildQueryString({
        ...filters,
        page: pagination?.page,
        limit: pagination?.limit,
      });
      log('Getting payout requests for seller:', sellerId);
      return apiRequest<PaginatedResponse<PayoutRequest>>(
        `/sellers/${sellerId}/payouts${query}`
      );
    },

    async getPayoutRequest(payoutId: string): Promise<ApiResponse<PayoutRequest>> {
      log('Getting payout request:', payoutId);
      return apiRequest<PayoutRequest>(`/payouts/${payoutId}`);
    },

    // Reports
    async getEarningsSummary(
      sellerId: string,
      period: 'day' | 'week' | 'month' | 'year'
    ): Promise<ApiResponse<{
      totalEarnings: number;
      totalCommissions: number;
      totalPayouts: number;
      pendingBalance: number;
      availableBalance: number;
      transactionCount: number;
    }>> {
      log('Getting earnings summary for seller:', sellerId, 'period:', period);
      return apiRequest(`/sellers/${sellerId}/earnings?period=${period}`);
    },

    async getCommissionReport(
      sellerId: string,
      startDate: string,
      endDate: string
    ): Promise<ApiResponse<{
      totalOrders: number;
      totalSales: number;
      totalCommissions: number;
      averageCommissionRate: number;
      breakdown: Array<{
        date: string;
        orders: number;
        sales: number;
        commissions: number;
      }>;
    }>> {
      log('Getting commission report for seller:', sellerId);
      return apiRequest(
        `/sellers/${sellerId}/reports/commissions?startDate=${startDate}&endDate=${endDate}`
      );
    },
  };
}
