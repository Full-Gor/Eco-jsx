/**
 * Database Provider Interface
 * Defines the contract for all database providers
 */

import { ApiResponse, Callback, Unsubscribe, FilterCondition, SortParams, PaginationParams } from '../../types/common';
import { BaseProvider, QueryOptions, SubscriptionOptions } from '../types';

/** Database query builder interface */
export interface IQueryBuilder<T> {
  /** Add a where condition */
  where(field: string, operator: string, value: unknown): IQueryBuilder<T>;

  /** Order by a field */
  orderBy(field: string, direction?: 'asc' | 'desc'): IQueryBuilder<T>;

  /** Limit results */
  limit(count: number): IQueryBuilder<T>;

  /** Offset results */
  offset(count: number): IQueryBuilder<T>;

  /** Select specific fields */
  select(fields: string[]): IQueryBuilder<T>;

  /** Execute query and get results */
  get(): Promise<ApiResponse<T[]>>;

  /** Get first result */
  first(): Promise<ApiResponse<T | null>>;

  /** Count results */
  count(): Promise<ApiResponse<number>>;
}

/** Database transaction interface */
export interface ITransaction {
  /** Commit transaction */
  commit(): Promise<void>;

  /** Rollback transaction */
  rollback(): Promise<void>;
}

/** Real-time change event */
export interface DatabaseChangeEvent<T> {
  type: 'insert' | 'update' | 'delete';
  collection: string;
  documentId: string;
  oldData?: T;
  newData?: T;
  timestamp: Date;
}

/** Database change callback */
export type DatabaseChangeCallback<T> = Callback<DatabaseChangeEvent<T>>;

/** Database provider interface */
export interface IDatabaseProvider extends BaseProvider {
  /**
   * Query documents from a collection
   * @param collection - Collection name
   * @param options - Query options
   * @returns Promise with array of documents
   */
  query<T>(collection: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;

  /**
   * Get a single document by ID
   * @param collection - Collection name
   * @param id - Document ID
   * @returns Promise with document or null
   */
  getById<T>(collection: string, id: string): Promise<ApiResponse<T | null>>;

  /**
   * Insert a new document
   * @param collection - Collection name
   * @param data - Document data
   * @returns Promise with inserted document
   */
  insert<T>(collection: string, data: Partial<T>): Promise<ApiResponse<T>>;

  /**
   * Insert multiple documents
   * @param collection - Collection name
   * @param data - Array of document data
   * @returns Promise with inserted documents
   */
  insertMany<T>(collection: string, data: Partial<T>[]): Promise<ApiResponse<T[]>>;

  /**
   * Update a document by ID
   * @param collection - Collection name
   * @param id - Document ID
   * @param data - Update data
   * @returns Promise with updated document
   */
  update<T>(collection: string, id: string, data: Partial<T>): Promise<ApiResponse<T>>;

  /**
   * Update multiple documents
   * @param collection - Collection name
   * @param filter - Filter conditions
   * @param data - Update data
   * @returns Promise with count of updated documents
   */
  updateMany<T>(
    collection: string,
    filter: FilterCondition[],
    data: Partial<T>
  ): Promise<ApiResponse<number>>;

  /**
   * Delete a document by ID
   * @param collection - Collection name
   * @param id - Document ID
   * @returns Promise with success status
   */
  delete(collection: string, id: string): Promise<ApiResponse<void>>;

  /**
   * Delete multiple documents
   * @param collection - Collection name
   * @param filter - Filter conditions
   * @returns Promise with count of deleted documents
   */
  deleteMany(collection: string, filter: FilterCondition[]): Promise<ApiResponse<number>>;

  /**
   * Subscribe to real-time changes
   * @param collection - Collection name
   * @param callback - Change callback
   * @param options - Subscription options
   * @returns Unsubscribe function
   */
  subscribe<T>(
    collection: string,
    callback: DatabaseChangeCallback<T>,
    options?: SubscriptionOptions
  ): Unsubscribe;

  /**
   * Subscribe to a single document changes
   * @param collection - Collection name
   * @param id - Document ID
   * @param callback - Change callback
   * @returns Unsubscribe function
   */
  subscribeToDocument<T>(
    collection: string,
    id: string,
    callback: DatabaseChangeCallback<T>
  ): Unsubscribe;

  /**
   * Create a query builder
   * @param collection - Collection name
   * @returns Query builder instance
   */
  createQuery<T>(collection: string): IQueryBuilder<T>;

  /**
   * Begin a transaction
   * @returns Transaction instance
   */
  beginTransaction?(): Promise<ITransaction>;

  /**
   * Execute raw query (if supported)
   * @param query - Raw query string
   * @param params - Query parameters
   * @returns Promise with query results
   */
  rawQuery?<T>(query: string, params?: unknown[]): Promise<ApiResponse<T[]>>;
}

/** Database provider options */
export interface DatabaseProviderOptions {
  /** Enable real-time subscriptions */
  enableRealtime?: boolean;

  /** Connection pool size */
  poolSize?: number;

  /** Query timeout in milliseconds */
  queryTimeout?: number;

  /** Enable query logging */
  enableLogging?: boolean;
}
