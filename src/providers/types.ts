/**
 * Provider base types
 */

import { ApiResponse, Unsubscribe, Callback } from '../types/common';

/** Base provider interface */
export interface BaseProvider {
  /** Provider name */
  readonly name: string;

  /** Provider type */
  readonly type: string;

  /** Initialize the provider */
  initialize(): Promise<void>;

  /** Check if provider is ready */
  isReady(): boolean;

  /** Dispose of provider resources */
  dispose(): Promise<void>;
}

/** Provider factory function */
export type ProviderFactory<T extends BaseProvider, C = unknown> = (
  config: C
) => T;

/** Provider registry */
export interface ProviderRegistry<T extends BaseProvider> {
  /** Register a provider */
  register(name: string, provider: T): void;

  /** Get a provider by name */
  get(name: string): T | undefined;

  /** Get all registered providers */
  getAll(): T[];

  /** Check if a provider is registered */
  has(name: string): boolean;

  /** Unregister a provider */
  unregister(name: string): void;
}

/** Generic query options */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/** Real-time subscription options */
export interface SubscriptionOptions {
  /** Filter conditions */
  filter?: Record<string, unknown>;

  /** Include initial data */
  includeInitial?: boolean;
}

/** Provider event types */
export type ProviderEventType =
  | 'initialized'
  | 'error'
  | 'disposed'
  | 'connected'
  | 'disconnected';

/** Provider event */
export interface ProviderEvent {
  type: ProviderEventType;
  provider: string;
  timestamp: Date;
  data?: unknown;
  error?: Error;
}

/** Provider event listener */
export type ProviderEventListener = (event: ProviderEvent) => void;
