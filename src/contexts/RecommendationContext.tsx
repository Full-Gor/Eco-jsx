/**
 * Recommendation Context
 * Product recommendations and behavior tracking
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { RecommendationProvider, RecommendationOptions } from '../providers/recommendation';
import type { Product } from '../types/product';
import type {
  RecommendationSection,
  RecommendationContext as RecommendationContextType,
} from '../types/advanced';

/** Recommendation state */
interface RecommendationState {
  isLoading: boolean;
  forYou: Product[];
  trending: Product[];
  recentlyViewed: Product[];
  sections: RecommendationSection[];
  error: string | null;
}

/** Recommendation context value */
interface RecommendationContextValue extends RecommendationState {
  /** Get personalized recommendations */
  getForUser: (options?: RecommendationOptions) => Promise<Product[]>;
  /** Get similar products */
  getSimilar: (productId: string, options?: RecommendationOptions) => Promise<Product[]>;
  /** Get also bought products */
  getAlsoBought: (productId: string, options?: RecommendationOptions) => Promise<Product[]>;
  /** Get trending products */
  getTrending: (options?: RecommendationOptions) => Promise<Product[]>;
  /** Get recently viewed */
  getRecentlyViewed: (options?: RecommendationOptions) => Promise<Product[]>;
  /** Get recommendations for cart */
  getForCart: (productIds: string[], options?: RecommendationOptions) => Promise<Product[]>;
  /** Get multiple recommendation sections */
  getSections: (context: RecommendationContextType, options?: RecommendationOptions) => Promise<RecommendationSection[]>;
  /** Track product view */
  trackView: (productId: string, duration?: number) => void;
  /** Track add to cart */
  trackAddToCart: (productId: string) => void;
  /** Track remove from cart */
  trackRemoveFromCart: (productId: string) => void;
  /** Track purchase */
  trackPurchase: (productIds: string[]) => void;
  /** Track wishlist add */
  trackWishlistAdd: (productId: string) => void;
  /** Track search */
  trackSearch: (query: string, resultCount: number) => void;
  /** Track category view */
  trackCategoryView: (categoryId: string) => void;
  /** Refresh home recommendations */
  refreshHome: () => Promise<void>;
}

const RecommendationContext = createContext<RecommendationContextValue | null>(null);

/** Recommendation provider props */
interface RecommendationProviderComponentProps {
  children: React.ReactNode;
  provider: RecommendationProvider;
  userId: string | null;
}

/**
 * Recommendation Provider Component
 */
export function RecommendationProviderComponent({
  children,
  provider,
  userId,
}: RecommendationProviderComponentProps) {
  const [state, setState] = useState<RecommendationState>({
    isLoading: false,
    forYou: [],
    trending: [],
    recentlyViewed: [],
    sections: [],
    error: null,
  });

  const initRef = useRef(false);

  // Initialize provider
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      await provider.initialize();
    };

    init();

    return () => {
      provider.dispose();
    };
  }, [provider]);

  // Update user when changed
  useEffect(() => {
    provider.setUser(userId);
  }, [provider, userId]);

  const getForUser = useCallback(
    async (options?: RecommendationOptions): Promise<Product[]> => {
      if (!userId) return [];

      try {
        const result = await provider.getForUser(userId, options);
        if (result.success && result.data) {
          setState((prev) => ({ ...prev, forYou: result.data || [] }));
          return result.data;
        }
        return [];
      } catch (error) {
        console.error('Failed to get recommendations:', error);
        return [];
      }
    },
    [provider, userId]
  );

  const getSimilar = useCallback(
    async (productId: string, options?: RecommendationOptions): Promise<Product[]> => {
      try {
        const result = await provider.getSimilar(productId, options);
        return result.success && result.data ? result.data : [];
      } catch (error) {
        console.error('Failed to get similar products:', error);
        return [];
      }
    },
    [provider]
  );

  const getAlsoBought = useCallback(
    async (productId: string, options?: RecommendationOptions): Promise<Product[]> => {
      try {
        const result = await provider.getForProduct(productId, 'also_bought', options);
        return result.success && result.data ? result.data : [];
      } catch (error) {
        console.error('Failed to get also bought products:', error);
        return [];
      }
    },
    [provider]
  );

  const getTrending = useCallback(
    async (options?: RecommendationOptions): Promise<Product[]> => {
      try {
        const result = await provider.getTrending(options);
        if (result.success && result.data) {
          setState((prev) => ({ ...prev, trending: result.data || [] }));
          return result.data;
        }
        return [];
      } catch (error) {
        console.error('Failed to get trending products:', error);
        return [];
      }
    },
    [provider]
  );

  const getRecentlyViewed = useCallback(
    async (options?: RecommendationOptions): Promise<Product[]> => {
      try {
        const result = await provider.getRecentlyViewed(userId || undefined, options);
        if (result.success && result.data) {
          setState((prev) => ({ ...prev, recentlyViewed: result.data || [] }));
          return result.data;
        }
        return [];
      } catch (error) {
        console.error('Failed to get recently viewed:', error);
        return [];
      }
    },
    [provider, userId]
  );

  const getForCart = useCallback(
    async (productIds: string[], options?: RecommendationOptions): Promise<Product[]> => {
      try {
        const result = await provider.getForCart(productIds, options);
        return result.success && result.data ? result.data : [];
      } catch (error) {
        console.error('Failed to get cart recommendations:', error);
        return [];
      }
    },
    [provider]
  );

  const getSections = useCallback(
    async (
      context: RecommendationContextType,
      options?: RecommendationOptions
    ): Promise<RecommendationSection[]> => {
      try {
        const result = await provider.getSections(context, options);
        if (result.success && result.data) {
          setState((prev) => ({ ...prev, sections: result.data || [] }));
          return result.data;
        }
        return [];
      } catch (error) {
        console.error('Failed to get recommendation sections:', error);
        return [];
      }
    },
    [provider]
  );

  // Tracking methods (fire and forget)
  const trackView = useCallback(
    (productId: string, duration?: number) => {
      provider.trackView(productId, duration);
    },
    [provider]
  );

  const trackAddToCart = useCallback(
    (productId: string) => {
      provider.trackAddToCart(productId);
    },
    [provider]
  );

  const trackRemoveFromCart = useCallback(
    (productId: string) => {
      provider.trackRemoveFromCart(productId);
    },
    [provider]
  );

  const trackPurchase = useCallback(
    (productIds: string[]) => {
      provider.trackPurchase(productIds);
    },
    [provider]
  );

  const trackWishlistAdd = useCallback(
    (productId: string) => {
      provider.trackWishlistAdd(productId);
    },
    [provider]
  );

  const trackSearch = useCallback(
    (query: string, resultCount: number) => {
      provider.trackSearch(query, resultCount);
    },
    [provider]
  );

  const trackCategoryView = useCallback(
    (categoryId: string) => {
      provider.trackCategoryView(categoryId);
    },
    [provider]
  );

  const refreshHome = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await Promise.all([
        getForUser({ limit: 10 }),
        getTrending({ limit: 10 }),
        getRecentlyViewed({ limit: 10 }),
      ]);
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [getForUser, getTrending, getRecentlyViewed]);

  const value: RecommendationContextValue = {
    ...state,
    getForUser,
    getSimilar,
    getAlsoBought,
    getTrending,
    getRecentlyViewed,
    getForCart,
    getSections,
    trackView,
    trackAddToCart,
    trackRemoveFromCart,
    trackPurchase,
    trackWishlistAdd,
    trackSearch,
    trackCategoryView,
    refreshHome,
  };

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
}

/**
 * Hook to use recommendations
 */
export function useRecommendations(): RecommendationContextValue {
  const context = useContext(RecommendationContext);
  if (!context) {
    throw new Error('useRecommendations must be used within RecommendationProvider');
  }
  return context;
}

export { RecommendationProviderComponent as RecommendationProvider };
