/**
 * Supabase Database Provider
 * Database operations using Supabase PostgreSQL
 *
 * Note: Requires @supabase/supabase-js package:
 * npm install @supabase/supabase-js
 */

import * as SecureStore from 'expo-secure-store';
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

/** Supabase configuration */
interface SupabaseDatabaseConfig {
  url: string;
  anonKey: string;
}

/** Supabase query builder filter */
interface SupabaseFilter {
  column: string;
  operator: string;
  value: unknown;
}

/** Create Supabase Database Provider */
export function createSupabaseDatabaseProvider(
  config: SupabaseDatabaseConfig,
  options: DatabaseProviderOptions = {}
): IDatabaseProvider {
  const { url, anonKey } = config;
  const { enableRealtime = true, enableLogging = false } = options;

  let supabaseClient: unknown = null;
  let ready = false;
  const subscriptionChannels: Map<string, unknown> = new Map();

  /** Log if enabled */
  const log = (...args: unknown[]) => {
    if (enableLogging) {
      console.log('[SupabaseDB]', ...args);
    }
  };

  /** Custom storage adapter for Supabase */
  const createStorageAdapter = () => ({
    getItem: async (key: string): Promise<string | null> => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error('Failed to save to storage:', error);
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error('Failed to remove from storage:', error);
      }
    },
  });

  /** Initialize Supabase client */
  const initializeSupabase = async () => {
    if (supabaseClient) return supabaseClient;

    try {
      const { createClient } = await import('@supabase/supabase-js');

      supabaseClient = createClient(url, anonKey, {
        auth: {
          storage: createStorageAdapter(),
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
        realtime: enableRealtime ? {
          params: {
            eventsPerSecond: 10,
          },
        } : undefined,
      });

      return supabaseClient;
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      throw new Error('Supabase SDK not installed. Run: npm install @supabase/supabase-js');
    }
  };

  /** Map operator to Supabase PostgREST operator */
  const mapOperator = (op: string): string => {
    const operators: Record<string, string> = {
      '=': 'eq',
      '==': 'eq',
      '!=': 'neq',
      '<>': 'neq',
      '<': 'lt',
      '<=': 'lte',
      '>': 'gt',
      '>=': 'gte',
      like: 'like',
      ilike: 'ilike',
      in: 'in',
      is: 'is',
      contains: 'contains',
      containedBy: 'containedBy',
      overlaps: 'overlaps',
    };
    return operators[op] || 'eq';
  };

  /** Apply filters to Supabase query */
  const applyFilters = (query: unknown, filters: SupabaseFilter[]): unknown => {
    let result = query as {
      eq: (col: string, val: unknown) => unknown;
      neq: (col: string, val: unknown) => unknown;
      lt: (col: string, val: unknown) => unknown;
      lte: (col: string, val: unknown) => unknown;
      gt: (col: string, val: unknown) => unknown;
      gte: (col: string, val: unknown) => unknown;
      like: (col: string, val: unknown) => unknown;
      ilike: (col: string, val: unknown) => unknown;
      in: (col: string, val: unknown) => unknown;
      is: (col: string, val: unknown) => unknown;
      contains: (col: string, val: unknown) => unknown;
      containedBy: (col: string, val: unknown) => unknown;
      overlaps: (col: string, val: unknown) => unknown;
    };

    filters.forEach((filter) => {
      const op = mapOperator(filter.operator);
      if (typeof result[op as keyof typeof result] === 'function') {
        result = (result[op as keyof typeof result] as (col: string, val: unknown) => unknown)(
          filter.column,
          filter.value
        ) as typeof result;
      }
    });

    return result;
  };

  /** Create query builder */
  const createQueryBuilder = <T>(tableName: string): IQueryBuilder<T> => {
    const filters: SupabaseFilter[] = [];
    let orderByField: string | undefined;
    let orderDirection: 'asc' | 'desc' = 'asc';
    let limitCount: number | undefined;
    let offsetCount: number | undefined;
    let selectedFields: string = '*';

    const builder: IQueryBuilder<T> = {
      where(field: string, operator: string, value: unknown) {
        filters.push({ column: field, operator, value });
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
        selectedFields = fields.join(',');
        return builder;
      },

      async get(): Promise<ApiResponse<T[]>> {
        try {
          const client = await initializeSupabase() as {
            from: (table: string) => {
              select: (columns: string) => unknown;
            };
          };

          let query = client.from(tableName).select(selectedFields) as unknown;

          // Apply filters
          query = applyFilters(query, filters);

          // Apply ordering
          if (orderByField) {
            query = (query as { order: (col: string, opts: { ascending: boolean }) => unknown })
              .order(orderByField, { ascending: orderDirection === 'asc' });
          }

          // Apply pagination
          if (limitCount !== undefined && offsetCount !== undefined) {
            query = (query as { range: (from: number, to: number) => unknown })
              .range(offsetCount, offsetCount + limitCount - 1);
          } else if (limitCount !== undefined) {
            query = (query as { limit: (count: number) => unknown }).limit(limitCount);
          }

          const { data, error } = await (query as Promise<{ data: T[] | null; error: { message: string } | null }>);

          if (error) {
            return {
              success: false,
              error: { code: 'QUERY_ERROR', message: error.message },
            };
          }

          return { success: true, data: data || [] };
        } catch (error) {
          const err = error as Error;
          return {
            success: false,
            error: { code: 'QUERY_ERROR', message: err.message },
          };
        }
      },

      async first(): Promise<ApiResponse<T | null>> {
        try {
          const client = await initializeSupabase() as {
            from: (table: string) => {
              select: (columns: string) => {
                single: () => unknown;
              };
            };
          };

          let query = client.from(tableName).select(selectedFields) as unknown;

          // Apply filters
          query = applyFilters(query, filters);

          // Get single result
          query = (query as { limit: (n: number) => { single: () => unknown } }).limit(1).single();

          const { data, error } = await (query as Promise<{ data: T | null; error: { message: string } | null }>);

          if (error && error.message !== 'JSON object requested, multiple (or no) rows returned') {
            return {
              success: false,
              error: { code: 'QUERY_ERROR', message: error.message },
            };
          }

          return { success: true, data };
        } catch (error) {
          const err = error as Error;
          return {
            success: false,
            error: { code: 'QUERY_ERROR', message: err.message },
          };
        }
      },

      async count(): Promise<ApiResponse<number>> {
        try {
          const client = await initializeSupabase() as {
            from: (table: string) => {
              select: (columns: string, opts: { count: string; head: boolean }) => unknown;
            };
          };

          let query = client.from(tableName).select('*', { count: 'exact', head: true }) as unknown;

          // Apply filters
          query = applyFilters(query, filters);

          const { count, error } = await (query as Promise<{ count: number | null; error: { message: string } | null }>);

          if (error) {
            return {
              success: false,
              error: { code: 'COUNT_ERROR', message: error.message },
            };
          }

          return { success: true, data: count || 0 };
        } catch (error) {
          const err = error as Error;
          return {
            success: false,
            error: { code: 'COUNT_ERROR', message: err.message },
          };
        }
      },
    };

    return builder;
  };

  const provider: IDatabaseProvider = {
    name: 'supabase',
    type: 'database',

    async initialize(): Promise<void> {
      log('Initializing Supabase Database Provider');
      await initializeSupabase();
      ready = true;
    },

    isReady(): boolean {
      return ready;
    },

    async dispose(): Promise<void> {
      // Unsubscribe from all channels
      for (const [, channel] of subscriptionChannels) {
        try {
          const client = await initializeSupabase() as {
            removeChannel: (channel: unknown) => void;
          };
          client.removeChannel(channel);
        } catch {
          // Ignore errors during disposal
        }
      }
      subscriptionChannels.clear();
      supabaseClient = null;
      ready = false;
    },

    async query<T>(tableName: string, options?: QueryOptions): Promise<ApiResponse<T[]>> {
      try {
        const builder = createQueryBuilder<T>(tableName);

        if (options?.orderBy) {
          builder.orderBy(options.orderBy, options.orderDirection);
        }
        if (options?.limit) {
          builder.limit(options.limit);
        }
        if (options?.offset) {
          builder.offset(options.offset);
        }

        return builder.get();
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'QUERY_ERROR', message: err.message },
        };
      }
    },

    async getById<T>(tableName: string, id: string): Promise<ApiResponse<T | null>> {
      try {
        const client = await initializeSupabase() as {
          from: (table: string) => {
            select: (columns: string) => {
              eq: (col: string, val: string) => {
                single: () => Promise<{ data: T | null; error: { message: string } | null }>;
              };
            };
          };
        };

        const { data, error } = await client
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.message.includes('no rows returned')) {
            return { success: true, data: null };
          }
          return {
            success: false,
            error: { code: 'GET_ERROR', message: error.message },
          };
        }

        return { success: true, data };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'GET_ERROR', message: err.message },
        };
      }
    },

    async insert<T>(tableName: string, data: Partial<T>): Promise<ApiResponse<T>> {
      try {
        const client = await initializeSupabase() as {
          from: (table: string) => {
            insert: (data: unknown) => {
              select: () => {
                single: () => Promise<{ data: T | null; error: { message: string } | null }>;
              };
            };
          };
        };

        const { data: insertedData, error } = await client
          .from(tableName)
          .insert(data)
          .select()
          .single();

        if (error) {
          return {
            success: false,
            error: { code: 'INSERT_ERROR', message: error.message },
          };
        }

        return { success: true, data: insertedData as T };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'INSERT_ERROR', message: err.message },
        };
      }
    },

    async insertMany<T>(tableName: string, data: Partial<T>[]): Promise<ApiResponse<T[]>> {
      try {
        const client = await initializeSupabase() as {
          from: (table: string) => {
            insert: (data: unknown[]) => {
              select: () => Promise<{ data: T[] | null; error: { message: string } | null }>;
            };
          };
        };

        const { data: insertedData, error } = await client
          .from(tableName)
          .insert(data)
          .select();

        if (error) {
          return {
            success: false,
            error: { code: 'INSERT_MANY_ERROR', message: error.message },
          };
        }

        return { success: true, data: insertedData || [] };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'INSERT_MANY_ERROR', message: err.message },
        };
      }
    },

    async update<T>(tableName: string, id: string, data: Partial<T>): Promise<ApiResponse<T>> {
      try {
        const client = await initializeSupabase() as {
          from: (table: string) => {
            update: (data: unknown) => {
              eq: (col: string, val: string) => {
                select: () => {
                  single: () => Promise<{ data: T | null; error: { message: string } | null }>;
                };
              };
            };
          };
        };

        const updateData = {
          ...data,
          updated_at: new Date().toISOString(),
        };

        const { data: updatedData, error } = await client
          .from(tableName)
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return {
            success: false,
            error: { code: 'UPDATE_ERROR', message: error.message },
          };
        }

        return { success: true, data: updatedData as T };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'UPDATE_ERROR', message: err.message },
        };
      }
    },

    async updateMany<T>(
      tableName: string,
      filter: FilterCondition[],
      data: Partial<T>
    ): Promise<ApiResponse<number>> {
      try {
        const client = await initializeSupabase() as {
          from: (table: string) => {
            update: (data: unknown) => unknown;
          };
        };

        const updateData = {
          ...data,
          updated_at: new Date().toISOString(),
        };

        let query = client.from(tableName).update(updateData) as unknown;

        // Apply filters
        const supabaseFilters = filter.map((f) => ({
          column: f.field,
          operator: f.operator,
          value: f.value,
        }));
        query = applyFilters(query, supabaseFilters);

        const { data: result, error } = await (query as Promise<{ data: unknown[] | null; error: { message: string } | null }>);

        if (error) {
          return {
            success: false,
            error: { code: 'UPDATE_MANY_ERROR', message: error.message },
          };
        }

        return { success: true, data: Array.isArray(result) ? result.length : 0 };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'UPDATE_MANY_ERROR', message: err.message },
        };
      }
    },

    async delete(tableName: string, id: string): Promise<ApiResponse<void>> {
      try {
        const client = await initializeSupabase() as {
          from: (table: string) => {
            delete: () => {
              eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
            };
          };
        };

        const { error } = await client
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) {
          return {
            success: false,
            error: { code: 'DELETE_ERROR', message: error.message },
          };
        }

        return { success: true };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'DELETE_ERROR', message: err.message },
        };
      }
    },

    async deleteMany(tableName: string, filter: FilterCondition[]): Promise<ApiResponse<number>> {
      try {
        const client = await initializeSupabase() as {
          from: (table: string) => {
            delete: () => unknown;
          };
        };

        let query = client.from(tableName).delete() as unknown;

        // Apply filters
        const supabaseFilters = filter.map((f) => ({
          column: f.field,
          operator: f.operator,
          value: f.value,
        }));
        query = applyFilters(query, supabaseFilters);

        const { data, error } = await (query as Promise<{ data: unknown[] | null; error: { message: string } | null }>);

        if (error) {
          return {
            success: false,
            error: { code: 'DELETE_MANY_ERROR', message: error.message },
          };
        }

        return { success: true, data: Array.isArray(data) ? data.length : 0 };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'DELETE_MANY_ERROR', message: err.message },
        };
      }
    },

    subscribe<T>(
      tableName: string,
      callback: DatabaseChangeCallback<T>,
      options?: SubscriptionOptions
    ): Unsubscribe {
      const channelKey = `${tableName}:${JSON.stringify(options?.filter || {})}`;

      (async () => {
        try {
          const client = await initializeSupabase() as {
            channel: (name: string) => {
              on: (
                event: string,
                opts: { event: string; schema: string; table: string; filter?: string },
                handler: (payload: {
                  eventType: string;
                  new: unknown;
                  old: unknown;
                }) => void
              ) => {
                subscribe: () => Promise<void>;
              };
            };
          };

          let filter: string | undefined;
          if (options?.filter) {
            filter = Object.entries(options.filter)
              .map(([key, value]) => `${key}=eq.${value}`)
              .join(',');
          }

          const channel = client
            .channel(channelKey)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: tableName,
                ...(filter ? { filter } : {}),
              },
              (payload) => {
                const eventType: 'insert' | 'update' | 'delete' =
                  payload.eventType === 'INSERT' ? 'insert' :
                  payload.eventType === 'UPDATE' ? 'update' :
                  'delete';

                const event: DatabaseChangeEvent<T> = {
                  type: eventType,
                  collection: tableName,
                  documentId: (payload.new as { id?: string })?.id || (payload.old as { id?: string })?.id || '',
                  oldData: payload.old as T | undefined,
                  newData: payload.new as T | undefined,
                  timestamp: new Date(),
                };

                callback(event);
              }
            );

          await channel.subscribe();
          subscriptionChannels.set(channelKey, channel);
          log(`Subscribed to table: ${tableName}`);
        } catch (error) {
          console.error('Subscription error:', error);
        }
      })();

      return () => {
        const channel = subscriptionChannels.get(channelKey);
        if (channel) {
          (async () => {
            try {
              const client = await initializeSupabase() as {
                removeChannel: (channel: unknown) => void;
              };
              client.removeChannel(channel);
              subscriptionChannels.delete(channelKey);
              log(`Unsubscribed from table: ${tableName}`);
            } catch {
              // Ignore errors during unsubscribe
            }
          })();
        }
      };
    },

    subscribeToDocument<T>(
      tableName: string,
      id: string,
      callback: DatabaseChangeCallback<T>
    ): Unsubscribe {
      return provider.subscribe(tableName, callback, {
        filter: { id },
      });
    },

    createQuery<T>(tableName: string): IQueryBuilder<T> {
      return createQueryBuilder<T>(tableName);
    },
  };

  return provider;
}

export default createSupabaseDatabaseProvider;
