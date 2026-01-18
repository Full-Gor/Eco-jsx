/**
 * Seller Provider Interface
 * Manages seller registration, profiles, and operations
 */

import type { BaseProvider, ApiResponse, PaginatedResponse, Pagination } from '../types';
import type {
  Seller,
  SellerRegistration,
  SellerApplication,
  SellerReview,
  SellerFollower,
  SellerStats,
  SellerPolicies,
  PayoutInfo,
} from '../../types/marketplace';
import type { Product } from '../../types/product';

/** Seller list filters */
export interface SellerFilters {
  status?: Seller['status'];
  verified?: boolean;
  minRating?: number;
  category?: string;
  search?: string;
  badge?: string;
}

/** Seller sort options */
export interface SellerSortOptions {
  field: 'rating' | 'salesCount' | 'productCount' | 'createdAt' | 'name';
  direction: 'asc' | 'desc';
}

/** Update seller options */
export interface UpdateSellerOptions {
  shopName?: string;
  description?: string;
  shortDescription?: string;
  logo?: string;
  banner?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: Seller['socialLinks'];
  policies?: Partial<SellerPolicies>;
  featuredProducts?: string[];
}

/** Seller provider configuration */
export interface SellerProviderConfig {
  apiUrl: string;
  debug?: boolean;
}

/** Seller provider interface */
export interface SellerProvider extends BaseProvider {
  readonly type: 'seller';

  // Seller registration
  submitApplication(
    userId: string,
    data: SellerRegistration
  ): Promise<ApiResponse<SellerApplication>>;
  getApplicationStatus(userId: string): Promise<ApiResponse<SellerApplication | null>>;
  updateApplication(
    applicationId: string,
    data: Partial<SellerRegistration>
  ): Promise<ApiResponse<SellerApplication>>;

  // Seller profile
  getSeller(sellerId: string): Promise<ApiResponse<Seller>>;
  getSellerBySlug(slug: string): Promise<ApiResponse<Seller>>;
  getSellerByUserId(userId: string): Promise<ApiResponse<Seller | null>>;
  updateSeller(sellerId: string, data: UpdateSellerOptions): Promise<ApiResponse<Seller>>;
  updatePayoutInfo(sellerId: string, payoutInfo: PayoutInfo): Promise<ApiResponse<Seller>>;
  getSellerStats(sellerId: string): Promise<ApiResponse<SellerStats>>;

  // Seller listing (for buyers)
  getSellers(
    filters?: SellerFilters,
    sort?: SellerSortOptions,
    pagination?: Pagination
  ): Promise<ApiResponse<PaginatedResponse<Seller>>>;
  getTopSellers(limit?: number): Promise<ApiResponse<Seller[]>>;
  getNewSellers(limit?: number): Promise<ApiResponse<Seller[]>>;
  searchSellers(query: string, pagination?: Pagination): Promise<ApiResponse<PaginatedResponse<Seller>>>;

  // Seller products
  getSellerProducts(
    sellerId: string,
    pagination?: Pagination
  ): Promise<ApiResponse<PaginatedResponse<Product>>>;

  // Seller reviews
  getSellerReviews(
    sellerId: string,
    pagination?: Pagination
  ): Promise<ApiResponse<PaginatedResponse<SellerReview>>>;
  submitSellerReview(
    sellerId: string,
    orderId: string,
    data: {
      rating: number;
      title?: string;
      comment: string;
    }
  ): Promise<ApiResponse<SellerReview>>;
  respondToReview(
    reviewId: string,
    response: string
  ): Promise<ApiResponse<SellerReview>>;

  // Following
  followSeller(sellerId: string, userId: string): Promise<ApiResponse<void>>;
  unfollowSeller(sellerId: string, userId: string): Promise<ApiResponse<void>>;
  isFollowing(sellerId: string, userId: string): Promise<ApiResponse<boolean>>;
  getFollowers(sellerId: string, pagination?: Pagination): Promise<ApiResponse<PaginatedResponse<SellerFollower>>>;
  getFollowedSellers(userId: string, pagination?: Pagination): Promise<ApiResponse<PaginatedResponse<Seller>>>;
  getFollowerCount(sellerId: string): Promise<ApiResponse<number>>;

  // Seller verification
  requestVerification(sellerId: string, documents: string[]): Promise<ApiResponse<void>>;
}
