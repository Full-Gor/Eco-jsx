/**
 * Hooks barrel export
 */

export {
  useConfig,
  useFeature,
  useAuthProviders,
  usePaymentProviders,
  useNotificationProviders,
  useTrackingProviders,
  useAppMode,
} from './useConfig';

// Re-export useAuth from contexts for convenience
export { useAuth } from '../contexts';

// Re-export catalog hooks from contexts for convenience
export {
  useCatalog,
  useProducts,
  useProduct,
  useCategories,
  useSearch,
} from '../contexts';

// Re-export cart and checkout hooks from contexts
export { useCart, useCheckout } from '../contexts';

// Re-export order hooks from contexts
export { useOrders, useOrder, useTracking, useReturn } from '../contexts';

// Re-export engagement hooks from contexts
export {
  useNotifications,
  useWishlist,
  useReviews,
  useProductReviews,
  useNewsletter,
} from '../contexts';

// Re-export advanced hooks from contexts (Phase 7)
export {
  useImageSearch,
  useLoyalty,
  useGamification,
  useChat,
  useI18n,
  useTranslation,
  useCurrency,
  usePrice,
  useRecommendations,
} from '../contexts';

// Re-export marketplace hooks from contexts (Phase 8)
export { useSeller, useSellerDashboard } from '../contexts';

// Re-export vendor hooks from contexts
export {
  useVendor,
  useShop,
  useVendorProducts,
  useVendorOrders,
  useVendorCategories,
  useVendorDashboard,
  useImageUpload,
} from '../contexts';
