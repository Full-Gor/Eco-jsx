/**
 * Recommendation Provider Interface
 * Product recommendations and behavior tracking
 */

import type { BaseProvider, ApiResponse } from '../types';
import type { Product } from '../../types/product';
import type {
  RecommendationSection,
  RecommendationType,
  RecommendationContext,
  TrackedEvent,
  UserBehaviorProfile,
} from '../../types/advanced';

/** Recommendation provider configuration */
export interface RecommendationProviderConfig {
  apiUrl: string;
  apiKey?: string;
  /** User ID for personalization */
  userId?: string;
  /** Session ID for anonymous tracking */
  sessionId?: string;
  /** Cache duration in milliseconds */
  cacheDuration?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/** Recommendation options */
export interface RecommendationOptions {
  limit?: number;
  context?: RecommendationContext;
  excludeProducts?: string[];
  categories?: string[];
}

/** Recommendation provider interface */
export interface RecommendationProvider extends BaseProvider {
  type: 'recommendation';

  /**
   * Set current user for personalization
   */
  setUser(userId: string | null): void;

  /**
   * Set session ID for anonymous tracking
   */
  setSession(sessionId: string): void;

  // ============================================================================
  // Recommendations
  // ============================================================================

  /**
   * Get personalized recommendations for user
   */
  getForUser(
    userId: string,
    options?: RecommendationOptions
  ): Promise<ApiResponse<Product[]>>;

  /**
   * Get recommendations for a product (similar, also bought, etc.)
   */
  getForProduct(
    productId: string,
    type: 'similar' | 'also_bought' | 'also_viewed',
    options?: RecommendationOptions
  ): Promise<ApiResponse<Product[]>>;

  /**
   * Get similar products
   */
  getSimilar(
    productId: string,
    options?: RecommendationOptions
  ): Promise<ApiResponse<Product[]>>;

  /**
   * Get trending products
   */
  getTrending(options?: RecommendationOptions): Promise<ApiResponse<Product[]>>;

  /**
   * Get recently viewed products
   */
  getRecentlyViewed(
    userId?: string,
    options?: RecommendationOptions
  ): Promise<ApiResponse<Product[]>>;

  /**
   * Get recommendations based on cart
   */
  getForCart(
    productIds: string[],
    options?: RecommendationOptions
  ): Promise<ApiResponse<Product[]>>;

  /**
   * Get multiple recommendation sections
   */
  getSections(
    context: RecommendationContext,
    options?: RecommendationOptions
  ): Promise<ApiResponse<RecommendationSection[]>>;

  // ============================================================================
  // Behavior Tracking
  // ============================================================================

  /**
   * Track product view
   */
  trackView(productId: string, duration?: number): Promise<void>;

  /**
   * Track add to cart
   */
  trackAddToCart(productId: string): Promise<void>;

  /**
   * Track remove from cart
   */
  trackRemoveFromCart(productId: string): Promise<void>;

  /**
   * Track purchase
   */
  trackPurchase(productIds: string[]): Promise<void>;

  /**
   * Track wishlist add
   */
  trackWishlistAdd(productId: string): Promise<void>;

  /**
   * Track wishlist remove
   */
  trackWishlistRemove(productId: string): Promise<void>;

  /**
   * Track search
   */
  trackSearch(query: string, resultCount: number): Promise<void>;

  /**
   * Track category view
   */
  trackCategoryView(categoryId: string): Promise<void>;

  /**
   * Track custom event
   */
  trackEvent(event: Omit<TrackedEvent, 'timestamp' | 'sessionId'>): Promise<void>;

  // ============================================================================
  // User Profile
  // ============================================================================

  /**
   * Get user behavior profile
   */
  getUserProfile(userId: string): Promise<ApiResponse<UserBehaviorProfile>>;

  /**
   * Clear user profile data
   */
  clearUserProfile(userId: string): Promise<ApiResponse<void>>;
}

export type { RecommendationProviderConfig as RecommendationConfig };
