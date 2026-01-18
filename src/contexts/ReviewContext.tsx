/**
 * Review Context
 * Manages product reviews and ratings
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { getConfig } from '../config';
import { useAuth } from './AuthContext';
import {
  Review,
  ReviewSummary,
  ReviewFilter,
  ReviewSort,
  CreateReviewData,
  ReportReviewData,
} from '../types/engagement';
import { ApiResponse } from '../types/common';

/** Review context value */
interface ReviewContextValue {
  // Review data
  reviews: Review[];
  summary: ReviewSummary | null;
  userReview: Review | null;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  filter: ReviewFilter;
  sort: ReviewSort;

  // Actions
  fetchReviews: (productId: string, reset?: boolean) => Promise<void>;
  loadMoreReviews: () => Promise<void>;
  setFilter: (filter: ReviewFilter) => void;
  setSort: (sort: ReviewSort) => void;

  // User actions
  createReview: (data: CreateReviewData) => Promise<Review | null>;
  updateReview: (reviewId: string, data: Partial<CreateReviewData>) => Promise<boolean>;
  deleteReview: (reviewId: string) => Promise<boolean>;
  markHelpful: (reviewId: string, helpful: boolean) => Promise<void>;
  reportReview: (data: ReportReviewData) => Promise<boolean>;

  // Check eligibility
  canReviewProduct: (productId: string) => Promise<boolean>;
  getProductsToReview: () => Promise<Array<{ productId: string; orderId: string; productName: string }>>;
}

const ReviewContext = createContext<ReviewContextValue | undefined>(undefined);

/** Review provider props */
interface ReviewProviderProps {
  children: ReactNode;
}

/** Review Provider Component */
export function ReviewProvider({ children }: ReviewProviderProps) {
  const config = getConfig();
  const { isAuthenticated, user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilterState] = useState<ReviewFilter>({});
  const [sort, setSortState] = useState<ReviewSort>('recent');
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const apiUrl = config.apiUrl || '';

  /** API request helper */
  const apiRequest = useCallback(
    async <T,>(
      endpoint: string,
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
      body?: unknown
    ): Promise<ApiResponse<T>> => {
      try {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return {
            success: false,
            error: {
              code: `HTTP_${response.status}`,
              message: errorData.message || `HTTP error ${response.status}`,
            },
          };
        }

        const data = await response.json();
        return { success: true, data };
      } catch (err) {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: err instanceof Error ? err.message : 'Network error',
          },
        };
      }
    },
    [apiUrl]
  );

  /** Build query string from filter and sort */
  const buildQueryString = useCallback(
    (productId: string, pageNum: number): string => {
      const params = new URLSearchParams();
      params.set('productId', productId);
      params.set('page', String(pageNum));
      params.set('limit', String(pageSize));
      params.set('sort', sort);

      if (filter.rating) params.set('rating', String(filter.rating));
      if (filter.minRating) params.set('minRating', String(filter.minRating));
      if (filter.withPhotos) params.set('withPhotos', 'true');
      if (filter.verified) params.set('verified', 'true');

      return params.toString();
    },
    [filter, sort]
  );

  /** Fetch reviews for a product */
  const fetchReviews = useCallback(
    async (productId: string, reset = true) => {
      setIsLoading(true);
      setError(null);

      if (reset) {
        setReviews([]);
        setPage(1);
        setCurrentProductId(productId);
      }

      const currentPage = reset ? 1 : page;

      try {
        const [reviewsResult, summaryResult] = await Promise.all([
          apiRequest<{ reviews: Review[]; total: number; hasMore: boolean }>(
            `/api/reviews?${buildQueryString(productId, currentPage)}`
          ),
          reset
            ? apiRequest<ReviewSummary>(`/api/reviews/summary?productId=${productId}`)
            : Promise.resolve({ success: true, data: summary }),
        ]);

        if (reviewsResult.success && reviewsResult.data) {
          const newReviews = reset
            ? reviewsResult.data.reviews
            : [...reviews, ...reviewsResult.data.reviews];

          // Check for user's own review
          if (isAuthenticated && user?.id) {
            const ownReview = newReviews.find((r) => r.userId === user.id);
            setUserReview(ownReview || null);
          }

          // Mark user's helpful votes
          if (isAuthenticated && user?.id) {
            const votesResult = await apiRequest<{ reviewId: string; vote: 'helpful' | 'not_helpful' }[]>(
              `/api/reviews/votes?userId=${user.id}&productId=${productId}`
            );
            if (votesResult.success && votesResult.data) {
              const votesMap = new Map(votesResult.data.map((v) => [v.reviewId, v.vote]));
              newReviews.forEach((review) => {
                review.userHasVoted = votesMap.get(review.id);
              });
            }
          }

          setReviews(newReviews);
          setHasMore(reviewsResult.data.hasMore);
        } else {
          setError(reviewsResult.error?.message || 'Failed to fetch reviews');
        }

        if (summaryResult.success && summaryResult.data) {
          setSummary(summaryResult.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
      } finally {
        setIsLoading(false);
      }
    },
    [page, buildQueryString, apiRequest, reviews, summary, isAuthenticated, user?.id]
  );

  /** Load more reviews */
  const loadMoreReviews = useCallback(async () => {
    if (!hasMore || isLoading || !currentProductId) return;

    const nextPage = page + 1;
    setPage(nextPage);
    await fetchReviews(currentProductId, false);
  }, [hasMore, isLoading, currentProductId, page, fetchReviews]);

  /** Set filter */
  const setFilter = useCallback(
    (newFilter: ReviewFilter) => {
      setFilterState(newFilter);
      if (currentProductId) {
        fetchReviews(currentProductId, true);
      }
    },
    [currentProductId, fetchReviews]
  );

  /** Set sort */
  const setSort = useCallback(
    (newSort: ReviewSort) => {
      setSortState(newSort);
      if (currentProductId) {
        fetchReviews(currentProductId, true);
      }
    },
    [currentProductId, fetchReviews]
  );

  /** Create a review */
  const createReview = useCallback(
    async (data: CreateReviewData): Promise<Review | null> => {
      if (!isAuthenticated || !user?.id) {
        setError('Must be logged in to create a review');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await apiRequest<Review>('/api/reviews', 'POST', {
          ...data,
          userId: user.id,
          userName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          userAvatar: user.avatar,
        });

        if (result.success && result.data) {
          // Add to reviews list
          setReviews((prev) => [result.data!, ...prev]);
          setUserReview(result.data);

          // Update summary
          if (summary) {
            const newTotal = summary.totalReviews + 1;
            const newAvg =
              (summary.averageRating * summary.totalReviews + data.rating) / newTotal;
            setSummary({
              ...summary,
              totalReviews: newTotal,
              averageRating: Math.round(newAvg * 10) / 10,
              ratingDistribution: {
                ...summary.ratingDistribution,
                [data.rating]: summary.ratingDistribution[data.rating as 1 | 2 | 3 | 4 | 5] + 1,
              },
            });
          }

          return result.data;
        } else {
          setError(result.error?.message || 'Failed to create review');
          return null;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create review');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, user, apiRequest, summary]
  );

  /** Update a review */
  const updateReview = useCallback(
    async (reviewId: string, data: Partial<CreateReviewData>): Promise<boolean> => {
      if (!isAuthenticated || !user?.id) {
        setError('Must be logged in to update a review');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await apiRequest<Review>(`/api/reviews/${reviewId}`, 'PUT', data);

        if (result.success && result.data) {
          // Update in reviews list
          setReviews((prev) =>
            prev.map((r) => (r.id === reviewId ? result.data! : r))
          );
          if (userReview?.id === reviewId) {
            setUserReview(result.data);
          }
          return true;
        } else {
          setError(result.error?.message || 'Failed to update review');
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update review');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, user?.id, apiRequest, userReview]
  );

  /** Delete a review */
  const deleteReview = useCallback(
    async (reviewId: string): Promise<boolean> => {
      if (!isAuthenticated || !user?.id) {
        setError('Must be logged in to delete a review');
        return false;
      }

      try {
        const result = await apiRequest(`/api/reviews/${reviewId}`, 'DELETE');

        if (result.success) {
          // Remove from reviews list
          const deletedReview = reviews.find((r) => r.id === reviewId);
          setReviews((prev) => prev.filter((r) => r.id !== reviewId));

          if (userReview?.id === reviewId) {
            setUserReview(null);
          }

          // Update summary
          if (summary && deletedReview) {
            const newTotal = summary.totalReviews - 1;
            const newAvg =
              newTotal > 0
                ? (summary.averageRating * summary.totalReviews - deletedReview.rating) / newTotal
                : 0;
            setSummary({
              ...summary,
              totalReviews: newTotal,
              averageRating: Math.round(newAvg * 10) / 10,
              ratingDistribution: {
                ...summary.ratingDistribution,
                [deletedReview.rating]:
                  summary.ratingDistribution[deletedReview.rating as 1 | 2 | 3 | 4 | 5] - 1,
              },
            });
          }

          return true;
        } else {
          setError(result.error?.message || 'Failed to delete review');
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete review');
        return false;
      }
    },
    [isAuthenticated, user?.id, apiRequest, reviews, userReview, summary]
  );

  /** Mark review as helpful */
  const markHelpful = useCallback(
    async (reviewId: string, helpful: boolean) => {
      if (!isAuthenticated || !user?.id) return;

      // Optimistic update
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id !== reviewId) return r;

          const wasHelpful = r.userHasVoted === 'helpful';
          const wasNotHelpful = r.userHasVoted === 'not_helpful';

          let newHelpfulCount = r.helpfulCount;
          let newNotHelpfulCount = r.notHelpfulCount || 0;

          // Remove previous vote
          if (wasHelpful) newHelpfulCount--;
          if (wasNotHelpful) newNotHelpfulCount--;

          // Add new vote
          if (helpful) newHelpfulCount++;
          else newNotHelpfulCount++;

          return {
            ...r,
            helpfulCount: newHelpfulCount,
            notHelpfulCount: newNotHelpfulCount,
            userHasVoted: helpful ? 'helpful' : 'not_helpful',
          };
        })
      );

      // Send to server
      await apiRequest(`/api/reviews/${reviewId}/vote`, 'POST', {
        userId: user.id,
        vote: helpful ? 'helpful' : 'not_helpful',
      });
    },
    [isAuthenticated, user?.id, apiRequest]
  );

  /** Report a review */
  const reportReview = useCallback(
    async (data: ReportReviewData): Promise<boolean> => {
      if (!isAuthenticated || !user?.id) {
        setError('Must be logged in to report a review');
        return false;
      }

      try {
        const result = await apiRequest('/api/reviews/report', 'POST', {
          ...data,
          reporterId: user.id,
        });

        return result.success;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to report review');
        return false;
      }
    },
    [isAuthenticated, user?.id, apiRequest]
  );

  /** Check if user can review a product */
  const canReviewProduct = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!isAuthenticated || !user?.id) return false;

      try {
        const result = await apiRequest<{ canReview: boolean; reason?: string }>(
          `/api/reviews/can-review?userId=${user.id}&productId=${productId}`
        );

        return result.success && result.data?.canReview === true;
      } catch {
        return false;
      }
    },
    [isAuthenticated, user?.id, apiRequest]
  );

  /** Get products the user can review */
  const getProductsToReview = useCallback(async (): Promise<
    Array<{ productId: string; orderId: string; productName: string }>
  > => {
    if (!isAuthenticated || !user?.id) return [];

    try {
      const result = await apiRequest<
        Array<{ productId: string; orderId: string; productName: string }>
      >(`/api/reviews/products-to-review?userId=${user.id}`);

      return result.success && result.data ? result.data : [];
    } catch {
      return [];
    }
  }, [isAuthenticated, user?.id, apiRequest]);

  const value: ReviewContextValue = {
    reviews,
    summary,
    userReview,
    isLoading,
    error,
    hasMore,
    filter,
    sort,
    fetchReviews,
    loadMoreReviews,
    setFilter,
    setSort,
    createReview,
    updateReview,
    deleteReview,
    markHelpful,
    reportReview,
    canReviewProduct,
    getProductsToReview,
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
}

/** Hook to use review context */
export function useReviews() {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
}

/** Hook for product-specific reviews */
export function useProductReviews(productId: string) {
  const context = useReviews();

  React.useEffect(() => {
    if (productId) {
      context.fetchReviews(productId);
    }
  }, [productId]);

  return context;
}
