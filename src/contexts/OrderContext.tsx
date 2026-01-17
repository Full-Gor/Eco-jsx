/**
 * Order Context
 * Manages orders, tracking, and returns
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { getConfig } from '../config';
import { useAuth } from './AuthContext';
import { ApiResponse, Price } from '../types/common';
import {
  ExtendedOrder,
  ExtendedOrderStatus,
  ExtendedOrderSummary,
  ExtendedTrackingInfo,
  OrderFilter,
  OrderSort,
  ReturnRequest,
  ReturnStatus,
  CreateReturnData,
  OrderTimelineStep,
  ReturnTimelineStep,
} from '../types/order';

/** Helper to convert Date | string to string */
const toDateString = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined;
  if (typeof date === 'string') return date;
  return date.toISOString();
};

/** Order context value */
interface OrderContextValue {
  // Orders
  orders: ExtendedOrderSummary[];
  currentOrder: ExtendedOrder | null;
  isLoading: boolean;
  error: string | null;
  filter: OrderFilter;
  sort: OrderSort;
  hasMore: boolean;

  // Order actions
  fetchOrders: (reset?: boolean) => Promise<void>;
  fetchOrder: (orderId: string) => Promise<ExtendedOrder | null>;
  refreshOrders: () => Promise<void>;
  loadMoreOrders: () => Promise<void>;
  setFilter: (filter: OrderFilter) => void;
  setSort: (sort: OrderSort) => void;
  cancelOrder: (orderId: string, reason?: string) => Promise<boolean>;
  reorder: (orderId: string) => Promise<boolean>;

  // Tracking
  trackingInfo: ExtendedTrackingInfo | null;
  isTrackingLoading: boolean;
  fetchTracking: (trackingNumber: string, carrier?: string) => Promise<ExtendedTrackingInfo | null>;
  getOrderTimeline: (order: ExtendedOrder) => OrderTimelineStep[];

  // Returns
  currentReturn: ReturnRequest | null;
  returns: ReturnRequest[];
  isReturnLoading: boolean;
  fetchReturns: () => Promise<void>;
  fetchReturn: (returnId: string) => Promise<ReturnRequest | null>;
  createReturn: (data: CreateReturnData) => Promise<ReturnRequest | null>;
  getReturnTimeline: (returnRequest: ReturnRequest) => ReturnTimelineStep[];
}

const OrderContext = createContext<OrderContextValue | null>(null);

interface OrderProviderProps {
  children: ReactNode;
}

const PAGE_SIZE = 20;

/** Order status labels and colors */
const ORDER_STATUS_INFO: Record<ExtendedOrderStatus, { label: string; icon: string }> = {
  pending: { label: 'Pending', icon: 'time-outline' },
  confirmed: { label: 'Confirmed', icon: 'checkmark-circle-outline' },
  processing: { label: 'Processing', icon: 'construct-outline' },
  shipped: { label: 'Shipped', icon: 'airplane-outline' },
  in_transit: { label: 'In Transit', icon: 'car-outline' },
  out_for_delivery: { label: 'Out for Delivery', icon: 'bicycle-outline' },
  delivered: { label: 'Delivered', icon: 'checkmark-done-outline' },
  cancelled: { label: 'Cancelled', icon: 'close-circle-outline' },
  refunded: { label: 'Refunded', icon: 'cash-outline' },
  return_requested: { label: 'Return Requested', icon: 'return-down-back-outline' },
  return_in_progress: { label: 'Return in Progress', icon: 'swap-horizontal-outline' },
  returned: { label: 'Returned', icon: 'checkmark-circle-outline' },
};

/** Return status labels */
const RETURN_STATUS_INFO: Record<ReturnStatus, { label: string; icon: string }> = {
  pending: { label: 'Pending Review', icon: 'time-outline' },
  approved: { label: 'Approved', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rejected', icon: 'close-circle-outline' },
  shipped: { label: 'Return Shipped', icon: 'airplane-outline' },
  received: { label: 'Return Received', icon: 'archive-outline' },
  inspecting: { label: 'Inspecting', icon: 'search-outline' },
  refunded: { label: 'Refunded', icon: 'cash-outline' },
  exchanged: { label: 'Exchanged', icon: 'swap-horizontal-outline' },
};

export function OrderProvider({ children }: OrderProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const config = getConfig();

  // Orders state
  const [orders, setOrders] = useState<ExtendedOrderSummary[]>([]);
  const [currentOrder, setCurrentOrder] = useState<ExtendedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>({ status: 'all' });
  const [sort, setSort] = useState<OrderSort>('date_desc');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Tracking state
  const [trackingInfo, setTrackingInfo] = useState<ExtendedTrackingInfo | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // Returns state
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [currentReturn, setCurrentReturn] = useState<ReturnRequest | null>(null);
  const [isReturnLoading, setIsReturnLoading] = useState(false);

  const apiUrl = config.apiUrl || '';

  /** API request helper */
  const apiRequest = useCallback(
    async <T,>(
      endpoint: string,
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
      body?: unknown
    ): Promise<ApiResponse<T>> => {
      try {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return {
            success: false,
            error: {
              code: `HTTP_${response.status}`,
              message: errorData.message || `HTTP error ${response.status}`,
            },
          };
        }

        const data = await response.json();
        return { success: true, data };
      } catch (err) {
        const error = err as Error;
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: error.message || 'Network error occurred',
          },
        };
      }
    },
    [apiUrl]
  );

  /** Fetch orders */
  const fetchOrders = useCallback(
    async (reset: boolean = false) => {
      if (!isAuthenticated || !user?.id) {
        setOrders([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      const currentPage = reset ? 0 : page;

      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: PAGE_SIZE.toString(),
          sort,
        });

        if (filter.status && filter.status !== 'all') {
          params.append('status', filter.status);
        }
        if (filter.dateFrom) {
          params.append('dateFrom', filter.dateFrom);
        }
        if (filter.dateTo) {
          params.append('dateTo', filter.dateTo);
        }

        const result = await apiRequest<{ orders: ExtendedOrderSummary[]; total: number }>(
          `/orders?${params.toString()}`
        );

        if (result.success && result.data) {
          if (reset) {
            setOrders(result.data.orders);
          } else {
            setOrders((prev) => [...prev, ...result.data!.orders]);
          }
          setHasMore(result.data.orders.length === PAGE_SIZE);
          setPage(currentPage + 1);
        } else {
          setError(result.error?.message || 'Failed to fetch orders');
        }
      } catch (err) {
        setError('Failed to fetch orders');
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, user?.id, page, sort, filter, apiRequest]
  );

  /** Refresh orders */
  const refreshOrders = useCallback(async () => {
    setPage(0);
    await fetchOrders(true);
  }, [fetchOrders]);

  /** Load more orders */
  const loadMoreOrders = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchOrders(false);
  }, [hasMore, isLoading, fetchOrders]);

  /** Fetch single order */
  const fetchOrder = useCallback(
    async (orderId: string): Promise<ExtendedOrder | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiRequest<ExtendedOrder>(`/orders/${orderId}`);

        if (result.success && result.data) {
          setCurrentOrder(result.data);
          return result.data;
        } else {
          setError(result.error?.message || 'Failed to fetch order');
          return null;
        }
      } catch (err) {
        setError('Failed to fetch order');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiRequest]
  );

  /** Cancel order */
  const cancelOrder = useCallback(
    async (orderId: string, reason?: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiRequest<ExtendedOrder>(`/orders/${orderId}/cancel`, 'POST', {
          reason,
        });

        if (result.success && result.data) {
          setCurrentOrder(result.data);
          // Update in list
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId ? { ...o, status: 'cancelled' as ExtendedOrderStatus } : o
            )
          );
          return true;
        } else {
          setError(result.error?.message || 'Failed to cancel order');
          return false;
        }
      } catch (err) {
        setError('Failed to cancel order');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [apiRequest]
  );

  /** Reorder - add same items to cart */
  const reorder = useCallback(
    async (orderId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiRequest<{ success: boolean }>(`/orders/${orderId}/reorder`, 'POST');

        if (result.success) {
          return true;
        } else {
          setError(result.error?.message || 'Failed to reorder');
          return false;
        }
      } catch (err) {
        setError('Failed to reorder');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [apiRequest]
  );

  /** Fetch tracking info */
  const fetchTracking = useCallback(
    async (trackingNumber: string, carrier?: string): Promise<ExtendedTrackingInfo | null> => {
      setIsTrackingLoading(true);

      try {
        const endpoint = carrier
          ? `/tracking/${encodeURIComponent(trackingNumber)}?carrier=${encodeURIComponent(carrier)}`
          : `/tracking/${encodeURIComponent(trackingNumber)}`;

        const result = await apiRequest<ExtendedTrackingInfo>(endpoint);

        if (result.success && result.data) {
          setTrackingInfo(result.data);
          return result.data;
        }
        return null;
      } catch (err) {
        return null;
      } finally {
        setIsTrackingLoading(false);
      }
    },
    [apiRequest]
  );

  /** Get order timeline steps */
  const getOrderTimeline = useCallback((order: ExtendedOrder): OrderTimelineStep[] => {
    const statusOrder: ExtendedOrderStatus[] = [
      'confirmed',
      'processing',
      'shipped',
      'in_transit',
      'out_for_delivery',
      'delivered',
    ];

    const currentIndex = statusOrder.indexOf(order.status);

    // Handle special statuses
    if (['cancelled', 'refunded', 'return_requested', 'return_in_progress', 'returned'].includes(order.status)) {
      const steps: OrderTimelineStep[] = statusOrder
        .slice(0, Math.max(currentIndex, 2))
        .map((status, index) => ({
          id: status,
          status,
          title: ORDER_STATUS_INFO[status].label,
          icon: ORDER_STATUS_INFO[status].icon,
          isCompleted: true,
          isCurrent: false,
        }));

      // Add the special status at the end
      steps.push({
        id: order.status,
        status: order.status,
        title: ORDER_STATUS_INFO[order.status].label,
        icon: ORDER_STATUS_INFO[order.status].icon,
        timestamp: toDateString(order.cancelledAt || order.updatedAt),
        isCompleted: true,
        isCurrent: true,
      });

      return steps;
    }

    // Normal flow
    return statusOrder.map((status, index) => ({
      id: status,
      status,
      title: ORDER_STATUS_INFO[status].label,
      icon: ORDER_STATUS_INFO[status].icon,
      timestamp: index <= currentIndex ? toDateString(order.updatedAt) : undefined,
      isCompleted: index <= currentIndex,
      isCurrent: index === currentIndex,
    }));
  }, []);

  /** Fetch returns */
  const fetchReturns = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setReturns([]);
      return;
    }

    setIsReturnLoading(true);

    try {
      const result = await apiRequest<{ returns: ReturnRequest[] }>('/returns');

      if (result.success && result.data) {
        setReturns(result.data.returns);
      }
    } catch (err) {
      // Silent fail for returns
    } finally {
      setIsReturnLoading(false);
    }
  }, [isAuthenticated, user?.id, apiRequest]);

  /** Fetch single return */
  const fetchReturn = useCallback(
    async (returnId: string): Promise<ReturnRequest | null> => {
      setIsReturnLoading(true);

      try {
        const result = await apiRequest<ReturnRequest>(`/returns/${returnId}`);

        if (result.success && result.data) {
          setCurrentReturn(result.data);
          return result.data;
        }
        return null;
      } catch (err) {
        return null;
      } finally {
        setIsReturnLoading(false);
      }
    },
    [apiRequest]
  );

  /** Create return request */
  const createReturn = useCallback(
    async (data: CreateReturnData): Promise<ReturnRequest | null> => {
      setIsReturnLoading(true);
      setError(null);

      try {
        const result = await apiRequest<ReturnRequest>('/returns', 'POST', data);

        if (result.success && result.data) {
          setCurrentReturn(result.data);
          setReturns((prev) => [result.data!, ...prev]);

          // Update order status
          setOrders((prev) =>
            prev.map((o) =>
              o.id === data.orderId
                ? { ...o, status: 'return_requested' as ExtendedOrderStatus }
                : o
            )
          );

          return result.data;
        } else {
          setError(result.error?.message || 'Failed to create return');
          return null;
        }
      } catch (err) {
        setError('Failed to create return');
        return null;
      } finally {
        setIsReturnLoading(false);
      }
    },
    [apiRequest]
  );

  /** Get return timeline steps */
  const getReturnTimeline = useCallback((returnRequest: ReturnRequest): ReturnTimelineStep[] => {
    const statusOrder: ReturnStatus[] = [
      'pending',
      'approved',
      'shipped',
      'received',
      'inspecting',
      returnRequest.resolution === 'refund' ? 'refunded' : 'exchanged',
    ];

    const currentIndex = statusOrder.indexOf(returnRequest.status);

    // Handle rejected status
    if (returnRequest.status === 'rejected') {
      return [
        {
          id: 'pending',
          status: 'pending',
          title: RETURN_STATUS_INFO.pending.label,
          isCompleted: true,
          isCurrent: false,
        },
        {
          id: 'rejected',
          status: 'rejected',
          title: RETURN_STATUS_INFO.rejected.label,
          description: returnRequest.rejectionReason,
          timestamp: toDateString(returnRequest.updatedAt),
          isCompleted: true,
          isCurrent: true,
        },
      ];
    }

    return statusOrder.map((status, index) => ({
      id: status,
      status,
      title: RETURN_STATUS_INFO[status].label,
      timestamp: index <= currentIndex ? toDateString(returnRequest.updatedAt) : undefined,
      isCompleted: index <= currentIndex,
      isCurrent: index === currentIndex,
    }));
  }, []);

  // Fetch orders on mount/auth change
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchOrders(true);
    }
  }, [isAuthenticated, user?.id]);

  // Reset pagination when filter/sort changes
  useEffect(() => {
    setPage(0);
    if (isAuthenticated) {
      fetchOrders(true);
    }
  }, [filter, sort, isAuthenticated]);

  const value: OrderContextValue = {
    orders,
    currentOrder,
    isLoading,
    error,
    filter,
    sort,
    hasMore,
    fetchOrders,
    fetchOrder,
    refreshOrders,
    loadMoreOrders,
    setFilter,
    setSort,
    cancelOrder,
    reorder,
    trackingInfo,
    isTrackingLoading,
    fetchTracking,
    getOrderTimeline,
    currentReturn,
    returns,
    isReturnLoading,
    fetchReturns,
    fetchReturn,
    createReturn,
    getReturnTimeline,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

/** useOrders hook - list of orders */
export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }

  return {
    orders: context.orders,
    isLoading: context.isLoading,
    error: context.error,
    filter: context.filter,
    sort: context.sort,
    hasMore: context.hasMore,
    fetchOrders: context.fetchOrders,
    refreshOrders: context.refreshOrders,
    loadMoreOrders: context.loadMoreOrders,
    setFilter: context.setFilter,
    setSort: context.setSort,
  };
}

/** useOrder hook - single order details */
export function useOrder(orderId?: string) {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }

  useEffect(() => {
    if (orderId) {
      context.fetchOrder(orderId);
    }
  }, [orderId]);

  return {
    order: context.currentOrder,
    isLoading: context.isLoading,
    error: context.error,
    fetchOrder: context.fetchOrder,
    cancelOrder: context.cancelOrder,
    reorder: context.reorder,
    getTimeline: context.getOrderTimeline,
  };
}

/** useTracking hook - shipment tracking */
export function useTracking(trackingNumber?: string, carrier?: string) {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useTracking must be used within an OrderProvider');
  }

  useEffect(() => {
    if (trackingNumber) {
      context.fetchTracking(trackingNumber, carrier);
    }
  }, [trackingNumber, carrier]);

  return {
    tracking: context.trackingInfo,
    isLoading: context.isTrackingLoading,
    fetchTracking: context.fetchTracking,
  };
}

/** useReturn hook - returns management */
export function useReturn(returnId?: string) {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useReturn must be used within an OrderProvider');
  }

  useEffect(() => {
    if (returnId) {
      context.fetchReturn(returnId);
    }
  }, [returnId]);

  return {
    returnRequest: context.currentReturn,
    returns: context.returns,
    isLoading: context.isReturnLoading,
    fetchReturns: context.fetchReturns,
    fetchReturn: context.fetchReturn,
    createReturn: context.createReturn,
    getTimeline: context.getReturnTimeline,
  };
}

export default OrderContext;
