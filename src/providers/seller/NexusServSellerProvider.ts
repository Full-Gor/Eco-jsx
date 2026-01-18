/**
 * NexusServ Seller Provider
 * Self-hosted seller management implementation
 */

import type { ApiResponse, PaginatedResponse, Pagination } from '../types';
import type {
  SellerProvider,
  SellerProviderConfig,
  SellerFilters,
  SellerSortOptions,
  UpdateSellerOptions,
} from './SellerProvider.interface';
import type {
  Seller,
  SellerRegistration,
  SellerApplication,
  SellerReview,
  SellerFollower,
  SellerStats,
  PayoutInfo,
} from '../../types/marketplace';
import type { Product } from '../../types/product';

/** NexusServ seller provider configuration */
export interface NexusServSellerConfig extends SellerProviderConfig {
  /** API URL */
  apiUrl: string;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Create NexusServ seller provider
 */
export function createNexusServSellerProvider(
  config: NexusServSellerConfig
): SellerProvider {
  const { apiUrl, debug = false } = config;

  let isInitialized = false;
  let authToken: string | null = null;

  const log = (...args: unknown[]) => {
    if (debug) console.log('[NexusServSeller]', ...args);
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

  return {
    name: 'nexusserv-seller',
    type: 'seller',

    async initialize(): Promise<void> {
      if (isInitialized) return;
      log('Initializing NexusServ seller provider');
      isInitialized = true;
    },

    isReady(): boolean {
      return isInitialized;
    },

    async dispose(): Promise<void> {
      isInitialized = false;
      authToken = null;
    },

    // Registration
    async submitApplication(
      userId: string,
      data: SellerRegistration
    ): Promise<ApiResponse<SellerApplication>> {
      log('Submitting seller application for user:', userId);
      return apiRequest<SellerApplication>('/sellers/apply', {
        method: 'POST',
        body: JSON.stringify({ userId, ...data }),
      });
    },

    async getApplicationStatus(userId: string): Promise<ApiResponse<SellerApplication | null>> {
      log('Getting application status for user:', userId);
      return apiRequest<SellerApplication | null>(`/sellers/applications/user/${userId}`);
    },

    async updateApplication(
      applicationId: string,
      data: Partial<SellerRegistration>
    ): Promise<ApiResponse<SellerApplication>> {
      log('Updating application:', applicationId);
      return apiRequest<SellerApplication>(`/sellers/applications/${applicationId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    // Profile
    async getSeller(sellerId: string): Promise<ApiResponse<Seller>> {
      log('Getting seller:', sellerId);
      return apiRequest<Seller>(`/sellers/${sellerId}`);
    },

    async getSellerBySlug(slug: string): Promise<ApiResponse<Seller>> {
      log('Getting seller by slug:', slug);
      return apiRequest<Seller>(`/sellers/slug/${slug}`);
    },

    async getSellerByUserId(userId: string): Promise<ApiResponse<Seller | null>> {
      log('Getting seller by user ID:', userId);
      return apiRequest<Seller | null>(`/sellers/user/${userId}`);
    },

    async updateSeller(
      sellerId: string,
      data: UpdateSellerOptions
    ): Promise<ApiResponse<Seller>> {
      log('Updating seller:', sellerId);
      return apiRequest<Seller>(`/sellers/${sellerId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async updatePayoutInfo(
      sellerId: string,
      payoutInfo: PayoutInfo
    ): Promise<ApiResponse<Seller>> {
      log('Updating payout info for seller:', sellerId);
      return apiRequest<Seller>(`/sellers/${sellerId}/payout`, {
        method: 'PUT',
        body: JSON.stringify(payoutInfo),
      });
    },

    async getSellerStats(sellerId: string): Promise<ApiResponse<SellerStats>> {
      log('Getting stats for seller:', sellerId);
      return apiRequest<SellerStats>(`/sellers/${sellerId}/stats`);
    },

    // Listing
    async getSellers(
      filters?: SellerFilters,
      sort?: SellerSortOptions,
      pagination?: Pagination
    ): Promise<ApiResponse<PaginatedResponse<Seller>>> {
      const query = buildQueryString({
        ...filters,
        sortBy: sort?.field,
        sortDir: sort?.direction,
        page: pagination?.page,
        limit: pagination?.limit,
      });
      log('Getting sellers:', query);
      return apiRequest<PaginatedResponse<Seller>>(`/sellers${query}`);
    },

    async getTopSellers(limit = 10): Promise<ApiResponse<Seller[]>> {
      log('Getting top sellers');
      return apiRequest<Seller[]>(`/sellers/top?limit=${limit}`);
    },

    async getNewSellers(limit = 10): Promise<ApiResponse<Seller[]>> {
      log('Getting new sellers');
      return apiRequest<Seller[]>(`/sellers/new?limit=${limit}`);
    },

    async searchSellers(
      query: string,
      pagination?: Pagination
    ): Promise<ApiResponse<PaginatedResponse<Seller>>> {
      const params = buildQueryString({
        q: query,
        page: pagination?.page,
        limit: pagination?.limit,
      });
      log('Searching sellers:', query);
      return apiRequest<PaginatedResponse<Seller>>(`/sellers/search${params}`);
    },

    // Products
    async getSellerProducts(
      sellerId: string,
      pagination?: Pagination
    ): Promise<ApiResponse<PaginatedResponse<Product>>> {
      const query = buildQueryString({
        page: pagination?.page,
        limit: pagination?.limit,
      });
      log('Getting products for seller:', sellerId);
      return apiRequest<PaginatedResponse<Product>>(`/sellers/${sellerId}/products${query}`);
    },

    // Reviews
    async getSellerReviews(
      sellerId: string,
      pagination?: Pagination
    ): Promise<ApiResponse<PaginatedResponse<SellerReview>>> {
      const query = buildQueryString({
        page: pagination?.page,
        limit: pagination?.limit,
      });
      log('Getting reviews for seller:', sellerId);
      return apiRequest<PaginatedResponse<SellerReview>>(`/sellers/${sellerId}/reviews${query}`);
    },

    async submitSellerReview(
      sellerId: string,
      orderId: string,
      data: { rating: number; title?: string; comment: string }
    ): Promise<ApiResponse<SellerReview>> {
      log('Submitting review for seller:', sellerId);
      return apiRequest<SellerReview>(`/sellers/${sellerId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ orderId, ...data }),
      });
    },

    async respondToReview(
      reviewId: string,
      response: string
    ): Promise<ApiResponse<SellerReview>> {
      log('Responding to review:', reviewId);
      return apiRequest<SellerReview>(`/sellers/reviews/${reviewId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ response }),
      });
    },

    // Following
    async followSeller(sellerId: string, userId: string): Promise<ApiResponse<void>> {
      log('Following seller:', sellerId);
      return apiRequest<void>(`/sellers/${sellerId}/follow`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    },

    async unfollowSeller(sellerId: string, userId: string): Promise<ApiResponse<void>> {
      log('Unfollowing seller:', sellerId);
      return apiRequest<void>(`/sellers/${sellerId}/unfollow`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    },

    async isFollowing(sellerId: string, userId: string): Promise<ApiResponse<boolean>> {
      log('Checking if following seller:', sellerId);
      return apiRequest<boolean>(`/sellers/${sellerId}/following/${userId}`);
    },

    async getFollowers(
      sellerId: string,
      pagination?: Pagination
    ): Promise<ApiResponse<PaginatedResponse<SellerFollower>>> {
      const query = buildQueryString({
        page: pagination?.page,
        limit: pagination?.limit,
      });
      return apiRequest<PaginatedResponse<SellerFollower>>(
        `/sellers/${sellerId}/followers${query}`
      );
    },

    async getFollowedSellers(
      userId: string,
      pagination?: Pagination
    ): Promise<ApiResponse<PaginatedResponse<Seller>>> {
      const query = buildQueryString({
        page: pagination?.page,
        limit: pagination?.limit,
      });
      return apiRequest<PaginatedResponse<Seller>>(`/users/${userId}/following${query}`);
    },

    async getFollowerCount(sellerId: string): Promise<ApiResponse<number>> {
      return apiRequest<number>(`/sellers/${sellerId}/followers/count`);
    },

    // Verification
    async requestVerification(
      sellerId: string,
      documents: string[]
    ): Promise<ApiResponse<void>> {
      log('Requesting verification for seller:', sellerId);
      return apiRequest<void>(`/sellers/${sellerId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ documents }),
      });
    },
  };
}
