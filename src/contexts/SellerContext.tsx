/**
 * Seller Context
 * Manages seller data, shop pages, and seller-related operations
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { SellerProvider, SellerFilters, UpdateSellerOptions } from '../providers/seller';
import type {
  Seller,
  SellerRegistration,
  SellerApplication,
  SellerReview,
  SellerStats,
  PayoutInfo,
} from '../types/marketplace';
import type { Product } from '../types/product';

/** Seller state */
interface SellerState {
  isLoading: boolean;
  currentSeller: Seller | null;
  mySellerAccount: Seller | null;
  myApplication: SellerApplication | null;
  isSellerMode: boolean;
  error: string | null;
}

/** Seller context value */
interface SellerContextValue extends SellerState {
  // Registration
  submitApplication: (data: SellerRegistration) => Promise<SellerApplication | null>;
  getApplicationStatus: () => Promise<SellerApplication | null>;
  updateApplication: (data: Partial<SellerRegistration>) => Promise<SellerApplication | null>;

  // Seller profile (for current user as seller)
  loadMySellerAccount: () => Promise<Seller | null>;
  updateMyProfile: (data: UpdateSellerOptions) => Promise<Seller | null>;
  updatePayoutInfo: (payoutInfo: PayoutInfo) => Promise<Seller | null>;
  getMyStats: () => Promise<SellerStats | null>;

  // View seller (for buyers viewing a seller's shop)
  loadSeller: (sellerId: string) => Promise<Seller | null>;
  loadSellerBySlug: (slug: string) => Promise<Seller | null>;
  getSellerProducts: (sellerId: string, page?: number) => Promise<Product[]>;
  getSellerReviews: (sellerId: string, page?: number) => Promise<SellerReview[]>;

  // Discovery
  getTopSellers: (limit?: number) => Promise<Seller[]>;
  getNewSellers: (limit?: number) => Promise<Seller[]>;
  searchSellers: (query: string, page?: number) => Promise<Seller[]>;
  browseSellers: (filters?: SellerFilters, page?: number) => Promise<Seller[]>;

  // Following
  followSeller: (sellerId: string) => Promise<boolean>;
  unfollowSeller: (sellerId: string) => Promise<boolean>;
  isFollowing: (sellerId: string) => Promise<boolean>;
  getFollowedSellers: (page?: number) => Promise<Seller[]>;

  // Reviews
  submitReview: (sellerId: string, orderId: string, data: {
    rating: number;
    title?: string;
    comment: string;
  }) => Promise<SellerReview | null>;
  respondToReview: (reviewId: string, response: string) => Promise<SellerReview | null>;

  // Seller mode toggle
  toggleSellerMode: () => void;
  clearCurrentSeller: () => void;
}

const SellerContext = createContext<SellerContextValue | null>(null);

/** Seller provider props */
interface SellerProviderComponentProps {
  children: React.ReactNode;
  provider: SellerProvider;
  userId: string | null;
  marketplaceEnabled?: boolean;
}

/**
 * Seller Provider Component
 */
export function SellerProviderComponent({
  children,
  provider,
  userId,
  marketplaceEnabled = true,
}: SellerProviderComponentProps) {
  const [state, setState] = useState<SellerState>({
    isLoading: false,
    currentSeller: null,
    mySellerAccount: null,
    myApplication: null,
    isSellerMode: false,
    error: null,
  });

  const initRef = useRef(false);

  // Initialize provider
  useEffect(() => {
    if (initRef.current || !marketplaceEnabled) return;
    initRef.current = true;

    const init = async () => {
      await provider.initialize();
    };

    init();

    return () => {
      provider.dispose();
    };
  }, [provider, marketplaceEnabled]);

  // Load seller account when user changes
  useEffect(() => {
    if (userId && marketplaceEnabled) {
      loadMySellerAccount();
    }
  }, [userId, marketplaceEnabled]);

  // Registration
  const submitApplication = useCallback(
    async (data: SellerRegistration): Promise<SellerApplication | null> => {
      if (!userId) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await provider.submitApplication(userId, data);
        if (result.success && result.data) {
          setState((prev) => ({
            ...prev,
            myApplication: result.data!,
            isLoading: false,
          }));
          return result.data;
        }
        setState((prev) => ({
          ...prev,
          error: result.error?.message || 'Failed to submit application',
          isLoading: false,
        }));
        return null;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: String(error),
          isLoading: false,
        }));
        return null;
      }
    },
    [provider, userId]
  );

  const getApplicationStatus = useCallback(async (): Promise<SellerApplication | null> => {
    if (!userId) return null;

    try {
      const result = await provider.getApplicationStatus(userId);
      if (result.success) {
        setState((prev) => ({ ...prev, myApplication: result.data || null }));
        return result.data || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get application status:', error);
      return null;
    }
  }, [provider, userId]);

  const updateApplication = useCallback(
    async (data: Partial<SellerRegistration>): Promise<SellerApplication | null> => {
      if (!state.myApplication) return null;

      try {
        const result = await provider.updateApplication(state.myApplication.id, data);
        if (result.success && result.data) {
          setState((prev) => ({ ...prev, myApplication: result.data! }));
          return result.data;
        }
        return null;
      } catch (error) {
        console.error('Failed to update application:', error);
        return null;
      }
    },
    [provider, state.myApplication]
  );

  // My seller account
  const loadMySellerAccount = useCallback(async (): Promise<Seller | null> => {
    if (!userId) return null;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await provider.getSellerByUserId(userId);
      if (result.success) {
        setState((prev) => ({
          ...prev,
          mySellerAccount: result.data || null,
          isLoading: false,
        }));
        return result.data || null;
      }
      setState((prev) => ({ ...prev, isLoading: false }));
      return null;
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [provider, userId]);

  const updateMyProfile = useCallback(
    async (data: UpdateSellerOptions): Promise<Seller | null> => {
      if (!state.mySellerAccount) return null;

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const result = await provider.updateSeller(state.mySellerAccount.id, data);
        if (result.success && result.data) {
          setState((prev) => ({
            ...prev,
            mySellerAccount: result.data!,
            isLoading: false,
          }));
          return result.data;
        }
        setState((prev) => ({ ...prev, isLoading: false }));
        return null;
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return null;
      }
    },
    [provider, state.mySellerAccount]
  );

  const updatePayoutInfo = useCallback(
    async (payoutInfo: PayoutInfo): Promise<Seller | null> => {
      if (!state.mySellerAccount) return null;

      try {
        const result = await provider.updatePayoutInfo(state.mySellerAccount.id, payoutInfo);
        if (result.success && result.data) {
          setState((prev) => ({ ...prev, mySellerAccount: result.data! }));
          return result.data;
        }
        return null;
      } catch (error) {
        console.error('Failed to update payout info:', error);
        return null;
      }
    },
    [provider, state.mySellerAccount]
  );

  const getMyStats = useCallback(async (): Promise<SellerStats | null> => {
    if (!state.mySellerAccount) return null;

    try {
      const result = await provider.getSellerStats(state.mySellerAccount.id);
      return result.success ? result.data || null : null;
    } catch (error) {
      console.error('Failed to get seller stats:', error);
      return null;
    }
  }, [provider, state.mySellerAccount]);

  // View seller
  const loadSeller = useCallback(
    async (sellerId: string): Promise<Seller | null> => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const result = await provider.getSeller(sellerId);
        if (result.success && result.data) {
          setState((prev) => ({
            ...prev,
            currentSeller: result.data!,
            isLoading: false,
          }));
          return result.data;
        }
        setState((prev) => ({ ...prev, isLoading: false }));
        return null;
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return null;
      }
    },
    [provider]
  );

  const loadSellerBySlug = useCallback(
    async (slug: string): Promise<Seller | null> => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const result = await provider.getSellerBySlug(slug);
        if (result.success && result.data) {
          setState((prev) => ({
            ...prev,
            currentSeller: result.data!,
            isLoading: false,
          }));
          return result.data;
        }
        setState((prev) => ({ ...prev, isLoading: false }));
        return null;
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return null;
      }
    },
    [provider]
  );

  const getSellerProducts = useCallback(
    async (sellerId: string, page = 1): Promise<Product[]> => {
      try {
        const result = await provider.getSellerProducts(sellerId, { page, limit: 20 });
        return result.success && result.data ? result.data.items : [];
      } catch (error) {
        console.error('Failed to get seller products:', error);
        return [];
      }
    },
    [provider]
  );

  const getSellerReviews = useCallback(
    async (sellerId: string, page = 1): Promise<SellerReview[]> => {
      try {
        const result = await provider.getSellerReviews(sellerId, { page, limit: 20 });
        return result.success && result.data ? result.data.items : [];
      } catch (error) {
        console.error('Failed to get seller reviews:', error);
        return [];
      }
    },
    [provider]
  );

  // Discovery
  const getTopSellers = useCallback(
    async (limit = 10): Promise<Seller[]> => {
      try {
        const result = await provider.getTopSellers(limit);
        return result.success && result.data ? result.data : [];
      } catch (error) {
        console.error('Failed to get top sellers:', error);
        return [];
      }
    },
    [provider]
  );

  const getNewSellers = useCallback(
    async (limit = 10): Promise<Seller[]> => {
      try {
        const result = await provider.getNewSellers(limit);
        return result.success && result.data ? result.data : [];
      } catch (error) {
        console.error('Failed to get new sellers:', error);
        return [];
      }
    },
    [provider]
  );

  const searchSellers = useCallback(
    async (query: string, page = 1): Promise<Seller[]> => {
      try {
        const result = await provider.searchSellers(query, { page, limit: 20 });
        return result.success && result.data ? result.data.items : [];
      } catch (error) {
        console.error('Failed to search sellers:', error);
        return [];
      }
    },
    [provider]
  );

  const browseSellers = useCallback(
    async (filters?: SellerFilters, page = 1): Promise<Seller[]> => {
      try {
        const result = await provider.getSellers(filters, undefined, { page, limit: 20 });
        return result.success && result.data ? result.data.items : [];
      } catch (error) {
        console.error('Failed to browse sellers:', error);
        return [];
      }
    },
    [provider]
  );

  // Following
  const followSeller = useCallback(
    async (sellerId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const result = await provider.followSeller(sellerId, userId);
        return result.success;
      } catch (error) {
        console.error('Failed to follow seller:', error);
        return false;
      }
    },
    [provider, userId]
  );

  const unfollowSeller = useCallback(
    async (sellerId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const result = await provider.unfollowSeller(sellerId, userId);
        return result.success;
      } catch (error) {
        console.error('Failed to unfollow seller:', error);
        return false;
      }
    },
    [provider, userId]
  );

  const isFollowing = useCallback(
    async (sellerId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const result = await provider.isFollowing(sellerId, userId);
        return result.success && result.data === true;
      } catch (error) {
        return false;
      }
    },
    [provider, userId]
  );

  const getFollowedSellers = useCallback(
    async (page = 1): Promise<Seller[]> => {
      if (!userId) return [];

      try {
        const result = await provider.getFollowedSellers(userId, { page, limit: 20 });
        return result.success && result.data ? result.data.items : [];
      } catch (error) {
        console.error('Failed to get followed sellers:', error);
        return [];
      }
    },
    [provider, userId]
  );

  // Reviews
  const submitReview = useCallback(
    async (
      sellerId: string,
      orderId: string,
      data: { rating: number; title?: string; comment: string }
    ): Promise<SellerReview | null> => {
      try {
        const result = await provider.submitSellerReview(sellerId, orderId, data);
        return result.success && result.data ? result.data : null;
      } catch (error) {
        console.error('Failed to submit review:', error);
        return null;
      }
    },
    [provider]
  );

  const respondToReview = useCallback(
    async (reviewId: string, response: string): Promise<SellerReview | null> => {
      try {
        const result = await provider.respondToReview(reviewId, response);
        return result.success && result.data ? result.data : null;
      } catch (error) {
        console.error('Failed to respond to review:', error);
        return null;
      }
    },
    [provider]
  );

  // Mode toggle
  const toggleSellerMode = useCallback(() => {
    setState((prev) => ({ ...prev, isSellerMode: !prev.isSellerMode }));
  }, []);

  const clearCurrentSeller = useCallback(() => {
    setState((prev) => ({ ...prev, currentSeller: null }));
  }, []);

  const value: SellerContextValue = {
    ...state,
    submitApplication,
    getApplicationStatus,
    updateApplication,
    loadMySellerAccount,
    updateMyProfile,
    updatePayoutInfo,
    getMyStats,
    loadSeller,
    loadSellerBySlug,
    getSellerProducts,
    getSellerReviews,
    getTopSellers,
    getNewSellers,
    searchSellers,
    browseSellers,
    followSeller,
    unfollowSeller,
    isFollowing,
    getFollowedSellers,
    submitReview,
    respondToReview,
    toggleSellerMode,
    clearCurrentSeller,
  };

  return <SellerContext.Provider value={value}>{children}</SellerContext.Provider>;
}

/**
 * Hook to use seller context
 */
export function useSeller(): SellerContextValue {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error('useSeller must be used within SellerProvider');
  }
  return context;
}

export { SellerProviderComponent as SellerProvider };
