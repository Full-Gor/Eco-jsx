/**
 * Seller Dashboard Context
 * Manages seller dashboard data, stats, and operations
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { CommissionProvider } from '../providers/commission';
import type {
  DashboardStats,
  DashboardPeriod,
  DashboardAlert,
  SalesDataPoint,
  TopProduct,
  SellerBalance,
  Transaction,
  TransactionFilters,
  PayoutRequest,
  PayoutFilters,
  SubOrder,
  SellerOrderView,
} from '../types/marketplace';

/** Dashboard state */
interface DashboardState {
  isLoading: boolean;
  stats: DashboardStats | null;
  balance: SellerBalance | null;
  salesChart: SalesDataPoint[];
  topProducts: TopProduct[];
  alerts: DashboardAlert[];
  recentOrders: SellerOrderView[];
  period: DashboardPeriod;
  error: string | null;
}

/** Dashboard context value */
interface SellerDashboardContextValue extends DashboardState {
  // Dashboard data
  loadDashboard: () => Promise<void>;
  refreshStats: () => Promise<DashboardStats | null>;
  changePeriod: (period: DashboardPeriod) => void;
  dismissAlert: (alertId: string) => void;

  // Balance & Finance
  getBalance: () => Promise<SellerBalance | null>;
  getTransactions: (filters?: TransactionFilters, page?: number) => Promise<Transaction[]>;
  requestPayout: (amount: number) => Promise<PayoutRequest | null>;
  getPayouts: (filters?: PayoutFilters, page?: number) => Promise<PayoutRequest[]>;

  // Orders
  getSellerOrders: (status?: string, page?: number) => Promise<SellerOrderView[]>;
  getOrderDetail: (subOrderId: string) => Promise<SellerOrderView | null>;
  markAsShipped: (subOrderId: string, trackingNumber: string, carrier: string) => Promise<boolean>;
  updateOrderStatus: (subOrderId: string, status: string, note?: string) => Promise<boolean>;

  // Charts & Reports
  getSalesChart: (period: DashboardPeriod) => Promise<SalesDataPoint[]>;
  getTopProducts: (limit?: number) => Promise<TopProduct[]>;
  getEarningsSummary: (period: 'day' | 'week' | 'month' | 'year') => Promise<{
    totalEarnings: number;
    totalCommissions: number;
    totalPayouts: number;
    pendingBalance: number;
    availableBalance: number;
    transactionCount: number;
  } | null>;
}

const SellerDashboardContext = createContext<SellerDashboardContextValue | null>(null);

/** Seller dashboard provider props */
interface SellerDashboardProviderProps {
  children: React.ReactNode;
  commissionProvider: CommissionProvider;
  sellerId: string | null;
  apiUrl: string;
}

/**
 * Seller Dashboard Provider Component
 */
export function SellerDashboardProvider({
  children,
  commissionProvider,
  sellerId,
  apiUrl,
}: SellerDashboardProviderProps) {
  const [state, setState] = useState<DashboardState>({
    isLoading: false,
    stats: null,
    balance: null,
    salesChart: [],
    topProducts: [],
    alerts: [],
    recentOrders: [],
    period: 'week',
    error: null,
  });

  const initRef = useRef(false);

  // API helper
  const apiRequest = async <T,>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T | null> => {
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Dashboard API error:', error);
      return null;
    }
  };

  // Initialize
  useEffect(() => {
    if (initRef.current || !sellerId) return;
    initRef.current = true;

    loadDashboard();
  }, [sellerId]);

  const loadDashboard = useCallback(async () => {
    if (!sellerId) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Load all dashboard data in parallel
      const [stats, balance, salesChart, topProducts, alerts, recentOrders] = await Promise.all([
        apiRequest<DashboardStats>(`/sellers/${sellerId}/dashboard/stats?period=${state.period}`),
        commissionProvider.getSellerBalance(sellerId).then((r) => r.data || null),
        apiRequest<SalesDataPoint[]>(`/sellers/${sellerId}/dashboard/sales?period=${state.period}`),
        apiRequest<TopProduct[]>(`/sellers/${sellerId}/dashboard/top-products?limit=5`),
        apiRequest<DashboardAlert[]>(`/sellers/${sellerId}/dashboard/alerts`),
        apiRequest<SellerOrderView[]>(`/sellers/${sellerId}/orders?limit=5&status=pending,processing`),
      ]);

      setState((prev) => ({
        ...prev,
        stats,
        balance,
        salesChart: salesChart || [],
        topProducts: topProducts || [],
        alerts: alerts || [],
        recentOrders: recentOrders || [],
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: String(error),
        isLoading: false,
      }));
    }
  }, [sellerId, state.period, commissionProvider, apiUrl]);

  const refreshStats = useCallback(async (): Promise<DashboardStats | null> => {
    if (!sellerId) return null;

    const stats = await apiRequest<DashboardStats>(
      `/sellers/${sellerId}/dashboard/stats?period=${state.period}`
    );
    if (stats) {
      setState((prev) => ({ ...prev, stats }));
    }
    return stats;
  }, [sellerId, state.period, apiUrl]);

  const changePeriod = useCallback((period: DashboardPeriod) => {
    setState((prev) => ({ ...prev, period }));
  }, []);

  // Reload when period changes
  useEffect(() => {
    if (sellerId && initRef.current) {
      loadDashboard();
    }
  }, [state.period]);

  const dismissAlert = useCallback(
    async (alertId: string) => {
      await apiRequest(`/sellers/${sellerId}/dashboard/alerts/${alertId}/dismiss`, {
        method: 'POST',
      });
      setState((prev) => ({
        ...prev,
        alerts: prev.alerts.filter((a) => a.id !== alertId),
      }));
    },
    [sellerId, apiUrl]
  );

  // Balance & Finance
  const getBalance = useCallback(async (): Promise<SellerBalance | null> => {
    if (!sellerId) return null;

    const result = await commissionProvider.getSellerBalance(sellerId);
    if (result.success && result.data) {
      setState((prev) => ({ ...prev, balance: result.data! }));
      return result.data;
    }
    return null;
  }, [commissionProvider, sellerId]);

  const getTransactions = useCallback(
    async (filters?: TransactionFilters, page = 1): Promise<Transaction[]> => {
      if (!sellerId) return [];

      const result = await commissionProvider.getTransactions(sellerId, filters, {
        page,
        limit: 20,
      });
      return result.success && result.data ? result.data.items : [];
    },
    [commissionProvider, sellerId]
  );

  const requestPayout = useCallback(
    async (amount: number): Promise<PayoutRequest | null> => {
      if (!sellerId) return null;

      const result = await commissionProvider.requestPayout(sellerId, { amount });
      if (result.success && result.data) {
        // Refresh balance
        getBalance();
        return result.data;
      }
      return null;
    },
    [commissionProvider, sellerId, getBalance]
  );

  const getPayouts = useCallback(
    async (filters?: PayoutFilters, page = 1): Promise<PayoutRequest[]> => {
      if (!sellerId) return [];

      const result = await commissionProvider.getPayoutRequests(sellerId, filters, {
        page,
        limit: 20,
      });
      return result.success && result.data ? result.data.items : [];
    },
    [commissionProvider, sellerId]
  );

  // Orders
  const getSellerOrders = useCallback(
    async (status?: string, page = 1): Promise<SellerOrderView[]> => {
      if (!sellerId) return [];

      const statusQuery = status ? `&status=${status}` : '';
      const orders = await apiRequest<SellerOrderView[]>(
        `/sellers/${sellerId}/orders?page=${page}&limit=20${statusQuery}`
      );
      return orders || [];
    },
    [sellerId, apiUrl]
  );

  const getOrderDetail = useCallback(
    async (subOrderId: string): Promise<SellerOrderView | null> => {
      if (!sellerId) return null;
      return apiRequest<SellerOrderView>(`/sellers/${sellerId}/orders/${subOrderId}`);
    },
    [sellerId, apiUrl]
  );

  const markAsShipped = useCallback(
    async (subOrderId: string, trackingNumber: string, carrier: string): Promise<boolean> => {
      if (!sellerId) return false;

      const result = await apiRequest<{ success: boolean }>(
        `/sellers/${sellerId}/orders/${subOrderId}/ship`,
        {
          method: 'POST',
          body: JSON.stringify({ trackingNumber, carrier }),
        }
      );
      return result?.success === true;
    },
    [sellerId, apiUrl]
  );

  const updateOrderStatus = useCallback(
    async (subOrderId: string, status: string, note?: string): Promise<boolean> => {
      if (!sellerId) return false;

      const result = await apiRequest<{ success: boolean }>(
        `/sellers/${sellerId}/orders/${subOrderId}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({ status, note }),
        }
      );
      return result?.success === true;
    },
    [sellerId, apiUrl]
  );

  // Charts & Reports
  const getSalesChart = useCallback(
    async (period: DashboardPeriod): Promise<SalesDataPoint[]> => {
      if (!sellerId) return [];

      const data = await apiRequest<SalesDataPoint[]>(
        `/sellers/${sellerId}/dashboard/sales?period=${period}`
      );
      return data || [];
    },
    [sellerId, apiUrl]
  );

  const getTopProducts = useCallback(
    async (limit = 10): Promise<TopProduct[]> => {
      if (!sellerId) return [];

      const data = await apiRequest<TopProduct[]>(
        `/sellers/${sellerId}/dashboard/top-products?limit=${limit}`
      );
      return data || [];
    },
    [sellerId, apiUrl]
  );

  const getEarningsSummary = useCallback(
    async (
      period: 'day' | 'week' | 'month' | 'year'
    ): Promise<{
      totalEarnings: number;
      totalCommissions: number;
      totalPayouts: number;
      pendingBalance: number;
      availableBalance: number;
      transactionCount: number;
    } | null> => {
      if (!sellerId) return null;

      const result = await commissionProvider.getEarningsSummary(sellerId, period);
      return result.success && result.data ? result.data : null;
    },
    [commissionProvider, sellerId]
  );

  const value: SellerDashboardContextValue = {
    ...state,
    loadDashboard,
    refreshStats,
    changePeriod,
    dismissAlert,
    getBalance,
    getTransactions,
    requestPayout,
    getPayouts,
    getSellerOrders,
    getOrderDetail,
    markAsShipped,
    updateOrderStatus,
    getSalesChart,
    getTopProducts,
    getEarningsSummary,
  };

  return (
    <SellerDashboardContext.Provider value={value}>
      {children}
    </SellerDashboardContext.Provider>
  );
}

/**
 * Hook to use seller dashboard
 */
export function useSellerDashboard(): SellerDashboardContextValue {
  const context = useContext(SellerDashboardContext);
  if (!context) {
    throw new Error('useSellerDashboard must be used within SellerDashboardProvider');
  }
  return context;
}
