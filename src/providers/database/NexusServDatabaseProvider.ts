/**
 * NexusServ Database Provider
 * Database operations using NexusServ API (self-hosted)
 *
 * Supports:
 * - CRUD operations via REST API
 * - Real-time updates via Socket.io
 * - Query building
 */

import { io, Socket } from 'socket.io-client';
import {
  IDatabaseProvider,
  IQueryBuilder,
  ITransaction,
  DatabaseChangeEvent,
  DatabaseChangeCallback,
  DatabaseProviderOptions,
} from './DatabaseProvider.interface';
import { ApiResponse, Unsubscribe, FilterCondition } from '../../types/common';
import { QueryOptions, SubscriptionOptions } from '../types';

/** NexusServ configuration */
interface NexusServDatabaseConfig {
  apiUrl: string;
  socketUrl?: string;
}

/** Create NexusServ Database Provider */
export function createNexusServDatabaseProvider(
  config: NexusServDatabaseConfig,
  options: DatabaseProviderOptions = {}
): IDatabaseProvider {
  const { apiUrl, socketUrl } = config;
  const {
    enableRealtime = true,
    queryTimeout = 30000,
    enableLogging = false,
  } = options;

  let socket: Socket | null = null;
  let ready = false;
  let authToken: string | null = null;
  const subscriptions: Map<string, Set<DatabaseChangeCallback<unknown>>> = new Map();

  /** Log if enabled */
  const log = (...args: unknown[]) => {
    if (enableLogging) {
      console.log('[NexusServDB]', ...args);
    }
  };

  /** Get auth token from storage */
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const SecureStore = await import('expo-secure-store');
      return await SecureStore.getItemAsync('nexusserv_access_token');
    } catch {
      return authToken;
    }
  };

  /** Set auth token */
  const setAuthToken = (token: string | null) => {
    authToken = token;
  };

  /** Make API request */
  const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const token = await getAuthToken();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), queryTimeout);

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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

      return { success: true, data: data.data || data };
    } catch (error) {
      clearTimeout(timeoutId);
      const err = error as Error;
      return {
        success: false,
        error: {
          code: err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
          message: err.message,
        },
      };
    }
  };

  /** Initialize Socket.io connection */
  const initializeSocket = () => {
    if (!enableRealtime || socket) return;

    const url = socketUrl || apiUrl.replace('/api', '');
    socket = io(url, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: async (cb: (data: { token: string | null }) => void) => {
        const token = await getAuthToken();
        cb({ token });
      },
    });

    socket.on('connect', () => {
      log('Socket connected');
    });

    socket.on('disconnect', () => {
      log('Socket disconnected');
    });

    socket.on('db:change', (event: DatabaseChangeEvent<unknown>) => {
      log('Database change event:', event);
      const collectionSubs = subscriptions.get(event.collection);
      if (collectionSubs) {
        collectionSubs.forEach((callback) => callback(event));
      }
    });
  };

  /** Build query string from options */
  const buildQueryString = (options?: QueryOptions): string => {
    if (!options) return '';

    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.orderBy) params.append('orderBy', options.orderBy);
    if (options.orderDirection) params.append('orderDirection', options.orderDirection);

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  /** Create a query builder */
  const createQueryBuilder = <T>(collection: string): IQueryBuilder<T> => {
    const conditions: { field: string; operator: string; value: unknown }[] = [];
    let orderByField: string | undefined;
    let orderDirection: 'asc' | 'desc' = 'asc';
    let limitCount: number | undefined;
    let offsetCount: number | undefined;
    let selectedFields: string[] = [];

    const builder: IQueryBuilder<T> = {
      where(field: string, operator: string, value: unknown) {
        conditions.push({ field, operator, value });
        return builder;
      },

      orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
        orderByField = field;
        orderDirection = direction;
        return builder;
      },

      limit(count: number) {
        limitCount = count;
        return builder;
      },

      offset(count: number) {
        offsetCount = count;
        return builder;
      },

      select(fields: string[]) {
        selectedFields = fields;
        return builder;
      },

      async get(): Promise<ApiResponse<T[]>> {
        const queryParams = new URLSearchParams();

        if (limitCount) queryParams.append('limit', limitCount.toString());
        if (offsetCount) queryParams.append('offset', offsetCount.toString());
        if (orderByField) queryParams.append('orderBy', orderByField);
        if (orderDirection) queryParams.append('orderDirection', orderDirection);
        if (selectedFields.length > 0) {
          queryParams.append('fields', selectedFields.join(','));
        }

        // Serialize conditions
        if (conditions.length > 0) {
          queryParams.append('filters', JSON.stringify(conditions));
        }

        const queryString = queryParams.toString();
        const endpoint = `/db/${collection}${queryString ? `?${queryString}` : ''}`;

        return apiRequest<T[]>(endpoint);
      },

      async first(): Promise<ApiResponse<T | null>> {
        const result = await builder.limit(1).get();
        if (result.success && result.data) {
          return { success: true, data: result.data[0] || null };
        }
        return { success: result.success, data: null, error: result.error };
      },

      async count(): Promise<ApiResponse<number>> {
        const queryParams = new URLSearchParams();
        if (conditions.length > 0) {
          queryParams.append('filters', JSON.stringify(conditions));
        }
        queryParams.append('count', 'true');

        const queryString = queryParams.toString();
        const endpoint = `/db/${collection}${queryString ? `?${queryString}` : ''}`;

        return apiRequest<number>(endpoint);
      },
    };

    return builder;
  };

  const provider: IDatabaseProvider = {
    name: 'nexusserv',
    type: 'database',

    async initialize(): Promise<void> {
      log('Initializing NexusServ Database Provider');
      initializeSocket();
      ready = true;
    },

    isReady(): boolean {
      return ready;
    },

    async dispose(): Promise<void> {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      subscriptions.clear();
      ready = false;
    },

    async query<T>(collection: string, options?: QueryOptions): Promise<ApiResponse<T[]>> {
      const queryString = buildQueryString(options);
      return apiRequest<T[]>(`/db/${collection}${queryString}`);
    },

    async getById<T>(collection: string, id: string): Promise<ApiResponse<T | null>> {
      return apiRequest<T | null>(`/db/${collection}/${id}`);
    },

    async insert<T>(collection: string, data: Partial<T>): Promise<ApiResponse<T>> {
      return apiRequest<T>(`/db/${collection}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async insertMany<T>(collection: string, data: Partial<T>[]): Promise<ApiResponse<T[]>> {
      return apiRequest<T[]>(`/db/${collection}/batch`, {
        method: 'POST',
        body: JSON.stringify({ documents: data }),
      });
    },

    async update<T>(collection: string, id: string, data: Partial<T>): Promise<ApiResponse<T>> {
      return apiRequest<T>(`/db/${collection}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    async updateMany<T>(
      collection: string,
      filter: FilterCondition[],
      data: Partial<T>
    ): Promise<ApiResponse<number>> {
      return apiRequest<number>(`/db/${collection}/batch`, {
        method: 'PATCH',
        body: JSON.stringify({ filters: filter, update: data }),
      });
    },

    async delete(collection: string, id: string): Promise<ApiResponse<void>> {
      return apiRequest<void>(`/db/${collection}/${id}`, {
        method: 'DELETE',
      });
    },

    async deleteMany(collection: string, filter: FilterCondition[]): Promise<ApiResponse<number>> {
      return apiRequest<number>(`/db/${collection}/batch`, {
        method: 'DELETE',
        body: JSON.stringify({ filters: filter }),
      });
    },

    subscribe<T>(
      collection: string,
      callback: DatabaseChangeCallback<T>,
      options?: SubscriptionOptions
    ): Unsubscribe {
      if (!socket) {
        initializeSocket();
      }

      // Add callback to subscriptions
      if (!subscriptions.has(collection)) {
        subscriptions.set(collection, new Set());
      }
      subscriptions.get(collection)!.add(callback as DatabaseChangeCallback<unknown>);

      // Subscribe on server
      socket?.emit('db:subscribe', {
        collection,
        filter: options?.filter,
        includeInitial: options?.includeInitial,
      });

      log(`Subscribed to collection: ${collection}`);

      return () => {
        const collectionSubs = subscriptions.get(collection);
        if (collectionSubs) {
          collectionSubs.delete(callback as DatabaseChangeCallback<unknown>);
          if (collectionSubs.size === 0) {
            subscriptions.delete(collection);
            socket?.emit('db:unsubscribe', { collection });
          }
        }
        log(`Unsubscribed from collection: ${collection}`);
      };
    },

    subscribeToDocument<T>(
      collection: string,
      id: string,
      callback: DatabaseChangeCallback<T>
    ): Unsubscribe {
      const key = `${collection}:${id}`;

      if (!socket) {
        initializeSocket();
      }

      // Create a filtered callback
      const filteredCallback: DatabaseChangeCallback<unknown> = (event) => {
        if (event.documentId === id) {
          callback(event as DatabaseChangeEvent<T>);
        }
      };

      if (!subscriptions.has(key)) {
        subscriptions.set(key, new Set());
      }
      subscriptions.get(key)!.add(filteredCallback);

      socket?.emit('db:subscribe:document', { collection, id });

      return () => {
        const docSubs = subscriptions.get(key);
        if (docSubs) {
          docSubs.delete(filteredCallback);
          if (docSubs.size === 0) {
            subscriptions.delete(key);
            socket?.emit('db:unsubscribe:document', { collection, id });
          }
        }
      };
    },

    createQuery<T>(collection: string): IQueryBuilder<T> {
      return createQueryBuilder<T>(collection);
    },

    async beginTransaction(): Promise<ITransaction> {
      const response = await apiRequest<{ transactionId: string }>('/db/transaction/begin', {
        method: 'POST',
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to begin transaction');
      }

      const transactionId = response.data.transactionId;

      return {
        async commit(): Promise<void> {
          await apiRequest(`/db/transaction/${transactionId}/commit`, {
            method: 'POST',
          });
        },
        async rollback(): Promise<void> {
          await apiRequest(`/db/transaction/${transactionId}/rollback`, {
            method: 'POST',
          });
        },
      };
    },

    async rawQuery<T>(query: string, params?: unknown[]): Promise<ApiResponse<T[]>> {
      return apiRequest<T[]>('/db/raw', {
        method: 'POST',
        body: JSON.stringify({ query, params }),
      });
    },
  };

  return provider;
}

export default createNexusServDatabaseProvider;
