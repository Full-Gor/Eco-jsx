/**
 * Commission Provider Interface
 * Manages marketplace commissions, balances, transactions, and payouts
 */

import type { BaseProvider, ApiResponse, PaginatedResponse, Pagination } from '../types';
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

/** Commission calculation input */
export interface CommissionInput {
  orderTotal: number;
  itemsTotal: number;
  shippingTotal: number;
  sellerId: string;
  categoryId?: string;
}

/** Payout request input */
export interface RequestPayoutInput {
  amount: number;
  method?: string;
  notes?: string;
}

/** Commission provider configuration */
export interface CommissionProviderConfig {
  apiUrl: string;
  defaultCommissionRate: number;
  minPayoutAmount: number;
  payoutFeePercentage?: number;
  payoutFeeFixed?: number;
  debug?: boolean;
}

/** Commission provider interface */
export interface CommissionProvider extends BaseProvider {
  readonly type: 'commission';

  // Commission calculation
  calculateCommission(
    input: CommissionInput,
    seller: Seller
  ): CommissionBreakdown;
  calculateOrderCommissions(
    order: Order,
    subOrders: SubOrder[]
  ): Promise<ApiResponse<CommissionBreakdown[]>>;

  // Balance
  getSellerBalance(sellerId: string): Promise<ApiResponse<SellerBalance>>;
  refreshBalance(sellerId: string): Promise<ApiResponse<SellerBalance>>;

  // Transactions
  getTransactions(
    sellerId: string,
    filters?: TransactionFilters,
    pagination?: Pagination
  ): Promise<ApiResponse<PaginatedResponse<Transaction>>>;
  getTransaction(transactionId: string): Promise<ApiResponse<Transaction>>;
  getTransactionsByOrder(orderId: string): Promise<ApiResponse<Transaction[]>>;

  // Payouts
  requestPayout(
    sellerId: string,
    input: RequestPayoutInput
  ): Promise<ApiResponse<PayoutRequest>>;
  cancelPayoutRequest(payoutId: string): Promise<ApiResponse<void>>;
  getPayoutRequests(
    sellerId: string,
    filters?: PayoutFilters,
    pagination?: Pagination
  ): Promise<ApiResponse<PaginatedResponse<PayoutRequest>>>;
  getPayoutRequest(payoutId: string): Promise<ApiResponse<PayoutRequest>>;

  // Summary/Reports
  getEarningsSummary(
    sellerId: string,
    period: 'day' | 'week' | 'month' | 'year'
  ): Promise<ApiResponse<{
    totalEarnings: number;
    totalCommissions: number;
    totalPayouts: number;
    pendingBalance: number;
    availableBalance: number;
    transactionCount: number;
  }>>;
  getCommissionReport(
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
  }>>;
}
