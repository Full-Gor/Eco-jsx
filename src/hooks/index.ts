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
