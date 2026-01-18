/**
 * Context exports
 */

export { AuthProvider, useAuth } from './AuthContext';
export type { AuthContextValue, SavedPaymentMethod } from './AuthContext';

export {
  CatalogProvider,
  useCatalog,
  useProducts,
  useProduct,
  useCategories,
  useSearch,
} from './CatalogContext';

export { CartProvider, useCart } from './CartContext';

export { CheckoutProvider, useCheckout } from './CheckoutContext';

export {
  OrderProvider,
  useOrders,
  useOrder,
  useTracking,
  useReturn,
} from './OrderContext';

export { NotificationProvider, useNotifications } from './NotificationContext';

export { WishlistProvider, useWishlist } from './WishlistContext';

export { ReviewProvider, useReviews, useProductReviews } from './ReviewContext';

export { NewsletterProvider, useNewsletter } from './NewsletterContext';

// Phase 7 - Advanced
export { ImageSearchProvider, useImageSearch } from './ImageSearchContext';

export {
  GamificationProvider,
  useLoyalty,
  useGamification,
} from './GamificationContext';

export { ChatProvider, useChat } from './ChatContext';

export { I18nProvider, useI18n, useTranslation } from './I18nContext';

export { CurrencyProvider, useCurrency, usePrice } from './CurrencyContext';

export { RecommendationProvider, useRecommendations } from './RecommendationContext';
