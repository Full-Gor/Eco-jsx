/**
 * NexusServ Recommendation Provider
 * Self-hosted product recommendations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiResponse } from '../types';
import type {
  RecommendationProvider,
  RecommendationProviderConfig,
  RecommendationOptions,
} from './RecommendationProvider.interface';
import type { Product } from '../../types/product';
import type {
  RecommendationSection,
  RecommendationContext,
  TrackedEvent,
  UserBehaviorProfile,
} from '../../types/advanced';

/** Storage keys */
const RECENTLY_VIEWED_KEY = '@app/recently_viewed';
const SESSION_ID_KEY = '@app/session_id';

/** Generate session ID */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create NexusServ recommendation provider
 */
export function createNexusServRecommendationProvider(
  config: RecommendationProviderConfig
): RecommendationProvider {
  const {
    apiUrl,
    apiKey,
    cacheDuration = 300000, // 5 minutes
    debug = false,
  } = config;

  let isInitialized = false;
  let currentUserId: string | null = config.userId || null;
  let sessionId: string = config.sessionId || '';
  let recentlyViewed: string[] = [];

  // Simple in-memory cache
  const cache: Map<string, { data: unknown; timestamp: number }> = new Map();

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log('[NexusServRecommendation]', ...args);
    }
  };

  /** Get authorization headers */
  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    return headers;
  };

  /** Make API request with caching */
  const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {},
    cacheKey?: string
  ): Promise<ApiResponse<T>> => {
    // Check cache
    if (cacheKey && options.method !== 'POST') {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        log('Cache hit:', cacheKey);
        return { success: true, data: cached.data as T };
      }
    }

    try {
      const response = await fetch(`${apiUrl}/recommendations${endpoint}`, {
        ...options,
        headers: {
          ...getHeaders(),
          ...((options.headers as Record<string, string>) || {}),
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: error.message || `HTTP ${response.status}`,
          },
        };
      }

      const data = await response.json();

      // Cache successful GET responses
      if (cacheKey && options.method !== 'POST') {
        cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return { success: true, data };
    } catch (error) {
      log('API error:', error);
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: String(error) },
      };
    }
  };

  /** Track event to backend */
  const sendTrackEvent = async (event: TrackedEvent): Promise<void> => {
    try {
      await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify(event),
      });
    } catch (error) {
      log('Error tracking event:', error);
    }
  };

  /** Save recently viewed to storage */
  const saveRecentlyViewed = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        RECENTLY_VIEWED_KEY,
        JSON.stringify(recentlyViewed.slice(0, 50))
      );
    } catch (error) {
      log('Error saving recently viewed:', error);
    }
  };

  return {
    name: 'nexusserv-recommendation',
    type: 'recommendation',

    async initialize(): Promise<void> {
      if (isInitialized) return;

      log('Initializing NexusServ recommendation provider');

      // Load or create session ID
      try {
        const savedSessionId = await AsyncStorage.getItem(SESSION_ID_KEY);
        if (savedSessionId) {
          sessionId = savedSessionId;
        } else {
          sessionId = generateSessionId();
          await AsyncStorage.setItem(SESSION_ID_KEY, sessionId);
        }
        log('Session ID:', sessionId);
      } catch (error) {
        sessionId = generateSessionId();
        log('Error loading session, generated new:', sessionId);
      }

      // Load recently viewed
      try {
        const savedViewed = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
        if (savedViewed) {
          recentlyViewed = JSON.parse(savedViewed);
          log('Loaded recently viewed:', recentlyViewed.length);
        }
      } catch (error) {
        log('Error loading recently viewed:', error);
      }

      isInitialized = true;
    },

    isReady(): boolean {
      return isInitialized;
    },

    async dispose(): Promise<void> {
      cache.clear();
      isInitialized = false;
      log('Provider disposed');
    },

    setUser(userId: string | null): void {
      currentUserId = userId;
      log('User set:', userId);
    },

    setSession(newSessionId: string): void {
      sessionId = newSessionId;
      log('Session set:', sessionId);
    },

    // ============================================================================
    // Recommendations
    // ============================================================================

    async getForUser(
      userId: string,
      options?: RecommendationOptions
    ): Promise<ApiResponse<Product[]>> {
      const params = new URLSearchParams({ userId });
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.context) params.append('context', options.context);
      if (options?.excludeProducts?.length) {
        params.append('exclude', options.excludeProducts.join(','));
      }

      return apiRequest<Product[]>(
        `/for-user?${params.toString()}`,
        {},
        `for-user-${userId}-${options?.context || 'default'}`
      );
    },

    async getForProduct(
      productId: string,
      type: 'similar' | 'also_bought' | 'also_viewed',
      options?: RecommendationOptions
    ): Promise<ApiResponse<Product[]>> {
      const params = new URLSearchParams({ type });
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.excludeProducts?.length) {
        params.append('exclude', options.excludeProducts.join(','));
      }

      return apiRequest<Product[]>(
        `/products/${productId}?${params.toString()}`,
        {},
        `product-${productId}-${type}`
      );
    },

    async getSimilar(
      productId: string,
      options?: RecommendationOptions
    ): Promise<ApiResponse<Product[]>> {
      return this.getForProduct(productId, 'similar', options);
    },

    async getTrending(options?: RecommendationOptions): Promise<ApiResponse<Product[]>> {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.categories?.length) {
        params.append('categories', options.categories.join(','));
      }

      return apiRequest<Product[]>(
        `/trending?${params.toString()}`,
        {},
        `trending-${options?.categories?.join(',') || 'all'}`
      );
    },

    async getRecentlyViewed(
      userId?: string,
      options?: RecommendationOptions
    ): Promise<ApiResponse<Product[]>> {
      // Use local recently viewed for current session
      if (!userId || userId === currentUserId) {
        const limit = options?.limit || 10;
        const productIds = recentlyViewed.slice(0, limit);

        if (productIds.length === 0) {
          return { success: true, data: [] };
        }

        // Fetch product details
        return apiRequest<Product[]>(
          `/products/batch?ids=${productIds.join(',')}`,
          {},
          `recently-viewed-local`
        );
      }

      // Fetch from server for other users
      const params = new URLSearchParams({ userId });
      if (options?.limit) params.append('limit', String(options.limit));

      return apiRequest<Product[]>(
        `/recently-viewed?${params.toString()}`,
        {},
        `recently-viewed-${userId}`
      );
    },

    async getForCart(
      productIds: string[],
      options?: RecommendationOptions
    ): Promise<ApiResponse<Product[]>> {
      if (productIds.length === 0) {
        return { success: true, data: [] };
      }

      const params = new URLSearchParams({
        products: productIds.join(','),
      });
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.excludeProducts?.length) {
        params.append('exclude', options.excludeProducts.join(','));
      }

      return apiRequest<Product[]>(
        `/for-cart?${params.toString()}`,
        {},
        `for-cart-${productIds.slice(0, 3).join(',')}`
      );
    },

    async getSections(
      context: RecommendationContext,
      options?: RecommendationOptions
    ): Promise<ApiResponse<RecommendationSection[]>> {
      const params = new URLSearchParams({ context });
      if (currentUserId) params.append('userId', currentUserId);
      if (options?.limit) params.append('limit', String(options.limit));

      return apiRequest<RecommendationSection[]>(
        `/sections?${params.toString()}`,
        {},
        `sections-${context}-${currentUserId || 'anonymous'}`
      );
    },

    // ============================================================================
    // Behavior Tracking
    // ============================================================================

    async trackView(productId: string, duration?: number): Promise<void> {
      log('Track view:', productId, duration);

      // Add to recently viewed (at start)
      const index = recentlyViewed.indexOf(productId);
      if (index > -1) {
        recentlyViewed.splice(index, 1);
      }
      recentlyViewed.unshift(productId);
      recentlyViewed = recentlyViewed.slice(0, 50);
      await saveRecentlyViewed();

      // Send to backend
      await sendTrackEvent({
        type: 'view',
        userId: currentUserId || undefined,
        sessionId,
        productId,
        timestamp: new Date().toISOString(),
        metadata: duration ? { duration } : undefined,
      });
    },

    async trackAddToCart(productId: string): Promise<void> {
      log('Track add to cart:', productId);
      await sendTrackEvent({
        type: 'add_to_cart',
        userId: currentUserId || undefined,
        sessionId,
        productId,
        timestamp: new Date().toISOString(),
      });
    },

    async trackRemoveFromCart(productId: string): Promise<void> {
      log('Track remove from cart:', productId);
      await sendTrackEvent({
        type: 'remove_from_cart',
        userId: currentUserId || undefined,
        sessionId,
        productId,
        timestamp: new Date().toISOString(),
      });
    },

    async trackPurchase(productIds: string[]): Promise<void> {
      log('Track purchase:', productIds);
      await sendTrackEvent({
        type: 'purchase',
        userId: currentUserId || undefined,
        sessionId,
        productIds,
        timestamp: new Date().toISOString(),
      });
    },

    async trackWishlistAdd(productId: string): Promise<void> {
      log('Track wishlist add:', productId);
      await sendTrackEvent({
        type: 'wishlist_add',
        userId: currentUserId || undefined,
        sessionId,
        productId,
        timestamp: new Date().toISOString(),
      });
    },

    async trackWishlistRemove(productId: string): Promise<void> {
      log('Track wishlist remove:', productId);
      await sendTrackEvent({
        type: 'wishlist_remove',
        userId: currentUserId || undefined,
        sessionId,
        productId,
        timestamp: new Date().toISOString(),
      });
    },

    async trackSearch(query: string, resultCount: number): Promise<void> {
      log('Track search:', query, resultCount);
      await sendTrackEvent({
        type: 'search',
        userId: currentUserId || undefined,
        sessionId,
        searchQuery: query,
        timestamp: new Date().toISOString(),
        metadata: { resultCount },
      });
    },

    async trackCategoryView(categoryId: string): Promise<void> {
      log('Track category view:', categoryId);
      await sendTrackEvent({
        type: 'category_view',
        userId: currentUserId || undefined,
        sessionId,
        categoryId,
        timestamp: new Date().toISOString(),
      });
    },

    async trackEvent(event: Omit<TrackedEvent, 'timestamp' | 'sessionId'>): Promise<void> {
      log('Track custom event:', event.type);
      await sendTrackEvent({
        ...event,
        sessionId,
        timestamp: new Date().toISOString(),
      });
    },

    // ============================================================================
    // User Profile
    // ============================================================================

    async getUserProfile(userId: string): Promise<ApiResponse<UserBehaviorProfile>> {
      return apiRequest<UserBehaviorProfile>(`/users/${userId}/profile`);
    },

    async clearUserProfile(userId: string): Promise<ApiResponse<void>> {
      log('Clearing user profile:', userId);

      // Clear local data if current user
      if (userId === currentUserId) {
        recentlyViewed = [];
        await saveRecentlyViewed();
      }

      return apiRequest<void>(`/users/${userId}/profile`, {
        method: 'DELETE',
      });
    },
  };
}
