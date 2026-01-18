/**
 * Engagement Types
 * Phase 6: Notifications, Wishlist, Reviews, Newsletter
 */

import { Timestamps, Price } from './common';

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/** Notification action types */
export type NotificationAction =
  | 'open_order'
  | 'open_product'
  | 'open_promo'
  | 'open_chat'
  | 'open_review'
  | 'open_wishlist'
  | 'open_url';

/** Notification type categories */
export type NotificationType =
  | 'order'        // Order status updates
  | 'promo'        // Promotions and offers
  | 'product'      // Product updates (back in stock, price drop)
  | 'message'      // Support/chat messages
  | 'system'       // System notifications
  | 'review';      // Review-related

/** Notification payload */
export interface NotificationPayload {
  id?: string;
  title: string;
  body: string;
  type?: NotificationType;
  data?: Record<string, unknown>;
  image?: string;
  action?: NotificationAction;
  actionId?: string;
  actionUrl?: string;
}

/** In-app notification item */
export interface NotificationItem extends Timestamps {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  image?: string;
  action?: NotificationAction;
  actionId?: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
}

/** Push notification preferences by type */
export interface PushNotificationPreferences {
  enabled: boolean;
  orders: boolean;           // Order status, delivery updates
  promotions: boolean;       // Promotions and offers
  newArrivals: boolean;      // New products
  priceDrops: boolean;       // Price drops on wishlist items
  backInStock: boolean;      // Back in stock for wishlist items
  messages: boolean;         // Support messages
  quietHoursEnabled: boolean;
  quietHoursStart?: string;  // "22:00"
  quietHoursEnd?: string;    // "08:00"
}

/** Default push notification preferences */
export const DEFAULT_PUSH_NOTIFICATION_PREFERENCES: PushNotificationPreferences = {
  enabled: true,
  orders: true,
  promotions: true,
  newArrivals: false,
  priceDrops: true,
  backInStock: true,
  messages: true,
  quietHoursEnabled: false,
};

// ============================================================================
// WISHLIST / FAVORITES
// ============================================================================

/** Extended wishlist item with engagement features */
export interface ExtendedWishlistItem extends Timestamps {
  id: string;
  userId: string;
  productId: string;
  variantId?: string;
  listId?: string;
  productName: string;
  productImage?: string;
  priceAtAdd: Price;
  currentPrice?: Price;
  inStockAtAdd: boolean;
  currentlyInStock?: boolean;
  notifyPriceDrop: boolean;
  notifyBackInStock: boolean;
}

/** Wishlist list (for multiple lists support) */
export interface WishlistList extends Timestamps {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  itemCount: number;
  coverImage?: string;
}

/** Wishlist sort options */
export type WishlistSort = 'date_added' | 'price_low' | 'price_high' | 'name';

/** Add to wishlist data */
export interface AddToWishlistData {
  productId: string;
  variantId?: string;
  listId?: string;
  notifyPriceDrop?: boolean;
  notifyBackInStock?: boolean;
}

// ============================================================================
// REVIEWS
// ============================================================================

/** Review status */
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

/** Review criteria ratings */
export interface ReviewCriteria {
  quality?: number;        // 1-5
  value?: number;          // 1-5 (rapport qualité/prix)
  delivery?: number;       // 1-5
  packaging?: number;      // 1-5
  accuracy?: number;       // 1-5 (conforme à la description)
}

/** Seller response to review */
export interface SellerResponse {
  text: string;
  respondedAt: string;
  sellerName?: string;
}

/** Review */
export interface Review extends Timestamps {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  productId: string;
  orderId: string;
  orderItemId?: string;
  rating: number;          // 1-5
  title?: string;
  comment: string;
  photos?: string[];
  videos?: string[];
  criteriaRatings?: ReviewCriteria;
  helpfulCount: number;
  notHelpfulCount?: number;
  verified: boolean;       // Achat vérifié
  status: ReviewStatus;
  sellerResponse?: SellerResponse;
  reportedCount?: number;
  userHasVoted?: 'helpful' | 'not_helpful';
}

/** Review summary for a product */
export interface ReviewSummary {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  criteriaAverages?: ReviewCriteria;
  verifiedPurchaseCount: number;
  withPhotosCount: number;
}

/** Review filter options */
export interface ReviewFilter {
  rating?: number;          // Filter by specific rating
  minRating?: number;       // Minimum rating
  withPhotos?: boolean;     // Only reviews with photos
  verified?: boolean;       // Only verified purchases
}

/** Review sort options */
export type ReviewSort = 'recent' | 'helpful' | 'rating_high' | 'rating_low';

/** Create review data */
export interface CreateReviewData {
  productId: string;
  orderId: string;
  orderItemId?: string;
  rating: number;
  title?: string;
  comment: string;
  photos?: string[];
  videos?: string[];
  criteriaRatings?: ReviewCriteria;
}

/** Report review data */
export interface ReportReviewData {
  reviewId: string;
  reason: 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'other';
  comment?: string;
}

// ============================================================================
// NEWSLETTER
// ============================================================================

/** Newsletter frequency */
export type NewsletterFrequency = 'daily' | 'weekly' | 'monthly';

/** Newsletter preferences */
export interface NewsletterPreferences {
  frequency: NewsletterFrequency;
  categories: string[];
  promotions: boolean;
  newArrivals: boolean;
  personalizedRecommendations: boolean;
}

/** Newsletter subscription status */
export interface SubscriptionStatus {
  subscribed: boolean;
  email?: string;
  lists: string[];
  preferences?: NewsletterPreferences;
  subscribedAt?: string;
}

/** Newsletter list */
export interface NewsletterList {
  id: string;
  name: string;
  description?: string;
}

/** Default newsletter preferences */
export const DEFAULT_NEWSLETTER_PREFERENCES: NewsletterPreferences = {
  frequency: 'weekly',
  categories: [],
  promotions: true,
  newArrivals: true,
  personalizedRecommendations: true,
};

// Provider types are defined in config.ts
