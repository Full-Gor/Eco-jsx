/**
 * Common types used across the application
 */

/** Generic API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

/** API error structure */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Response metadata for pagination */
export interface ResponseMeta {
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
}

/** Generic pagination params */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/** Sort direction */
export type SortDirection = 'asc' | 'desc';

/** Generic sort params */
export interface SortParams {
  field: string;
  direction: SortDirection;
}

/** Generic filter operator */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'like'
  | 'ilike';

/** Generic filter condition */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

/** Address structure */
export interface Address {
  id?: string;
  label?: string;
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

/** Price with currency */
export interface Price {
  amount: number;
  currency: string;
  formatted?: string;
}

/** Image structure */
export interface ImageAsset {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  width?: number;
  height?: number;
}

/** Timestamp fields */
export interface Timestamps {
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** Subscription callback unsubscribe function */
export type Unsubscribe = () => void;

/** Generic callback type */
export type Callback<T> = (data: T) => void;

/** Async operation status */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/** Generic async state */
export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: ApiError | null;
}
