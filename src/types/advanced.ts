/**
 * Phase 7: Advanced Types
 * Image search, gamification, chat, i18n, and recommendations
 */

import type { Product } from './product';

// ============================================================================
// Image Search Types
// ============================================================================

/** Image search provider types */
export type ImageSearchProviderType = 'tensorflow' | 'google-vision' | 'aws-rekognition' | 'algolia';

/** Image search result */
export interface ImageSearchResult {
  productId: string;
  similarity: number;
  product: Product;
  matchedFeatures?: string[];
}

/** Image search options */
export interface ImageSearchOptions {
  limit?: number;
  minSimilarity?: number;
  categories?: string[];
}

/** Indexed product image */
export interface IndexedImage {
  productId: string;
  imageUrl: string;
  features?: number[];
  indexedAt: string;
}

// ============================================================================
// Gamification Types
// ============================================================================

/** User level tier */
export type LevelTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

/** Points transaction type */
export type PointsTransactionType =
  | 'purchase'
  | 'review'
  | 'referral'
  | 'daily_checkin'
  | 'mission'
  | 'wheel_spin'
  | 'bonus'
  | 'redemption'
  | 'expired'
  | 'adjustment';

/** Points transaction */
export interface PointsTransaction {
  id: string;
  userId: string;
  type: PointsTransactionType;
  amount: number;
  balance: number;
  description: string;
  referenceId?: string;
  createdAt: string;
  expiresAt?: string;
}

/** User level */
export interface UserLevel {
  id: string;
  tier: LevelTier;
  name: string;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
  badge: string;
  multiplier: number; // Points earning multiplier
}

/** User loyalty status */
export interface LoyaltyStatus {
  userId: string;
  points: number;
  lifetimePoints: number;
  level: UserLevel;
  nextLevel?: UserLevel;
  pointsToNextLevel: number;
  streakDays: number;
  lastCheckinAt?: string;
  referralCode: string;
  referralCount: number;
}

/** Mission type */
export type MissionType =
  | 'purchase'
  | 'review'
  | 'share'
  | 'daily_login'
  | 'referral'
  | 'browse'
  | 'wishlist'
  | 'first_purchase'
  | 'spend_amount';

/** Mission status */
export type MissionStatus = 'active' | 'completed' | 'expired' | 'claimed';

/** Reward type */
export type RewardType = 'points' | 'coupon' | 'discount' | 'free_shipping' | 'product';

/** Mission reward */
export interface MissionReward {
  type: RewardType;
  value: number;
  couponCode?: string;
  productId?: string;
}

/** Mission definition */
export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  target: number;
  progress: number;
  reward: MissionReward;
  status: MissionStatus;
  startedAt: string;
  expiresAt?: string;
  completedAt?: string;
  claimedAt?: string;
}

/** Fortune wheel prize */
export interface WheelPrize {
  id: string;
  name: string;
  type: RewardType;
  value: number;
  probability: number;
  color: string;
  icon?: string;
}

/** Wheel spin result */
export interface WheelSpinResult {
  prize: WheelPrize;
  applied: boolean;
  message: string;
  nextSpinAt?: string;
}

/** Wheel status */
export interface WheelStatus {
  canSpin: boolean;
  spinsRemaining: number;
  nextFreeSpinAt?: string;
  prizes: WheelPrize[];
}

/** Referral info */
export interface ReferralInfo {
  code: string;
  shareUrl: string;
  referrerReward: MissionReward;
  refereeReward: MissionReward;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
}

/** Referred user */
export interface ReferredUser {
  id: string;
  email: string;
  name?: string;
  status: 'pending' | 'registered' | 'first_purchase' | 'active';
  joinedAt: string;
  firstPurchaseAt?: string;
  rewardEarned?: number;
}

// ============================================================================
// Chat Types
// ============================================================================

/** Chat provider types */
export type ChatProviderType = 'socketio' | 'firebase' | 'intercom' | 'zendesk';

/** Message sender type */
export type SenderType = 'user' | 'support' | 'bot' | 'seller' | 'system';

/** Conversation type */
export type ConversationType = 'support' | 'seller' | 'order' | 'general';

/** Message status */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

/** Attachment type */
export type AttachmentType = 'image' | 'file' | 'video' | 'audio' | 'product' | 'order';

/** Chat attachment */
export interface ChatAttachment {
  id: string;
  type: AttachmentType;
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  productId?: string;
  orderId?: string;
}

/** Chat message */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: SenderType;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  attachments?: ChatAttachment[];
  status: MessageStatus;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
  isLocal?: boolean; // For offline queue
}

/** Chat participant */
export interface ChatParticipant {
  id: string;
  type: SenderType;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
}

/** Conversation */
export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  orderId?: string;
  productId?: string;
  status: 'active' | 'closed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

/** Typing indicator */
export interface TypingIndicator {
  conversationId: string;
  participantId: string;
  participantName: string;
  isTyping: boolean;
}

/** Quick reply option */
export interface QuickReply {
  id: string;
  text: string;
  action?: string;
}

/** Bot response */
export interface BotResponse {
  message: string;
  quickReplies?: QuickReply[];
  action?: {
    type: 'link' | 'product' | 'order' | 'faq';
    value: string;
  };
}

// ============================================================================
// i18n Types
// ============================================================================

/** Locale info */
export interface LocaleInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

/** Translation params */
export type TranslationParams = Record<string, string | number>;

/** Plural rules */
export interface PluralRules {
  zero?: string;
  one: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

/** Translation value */
export type TranslationValue = string | PluralRules;

/** Translation dictionary */
export interface TranslationDictionary {
  [key: string]: TranslationValue | TranslationDictionary;
}

// ============================================================================
// Currency Types
// ============================================================================

/** Currency info */
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  symbolPosition: 'before' | 'after';
}

/** Exchange rates */
export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
}

/** Price display options */
export interface PriceDisplayOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  decimals?: number;
}

// ============================================================================
// Recommendation Types
// ============================================================================

/** Recommendation provider types */
export type RecommendationProviderType = 'nexusserv' | 'algolia' | 'aws-personalize';

/** Recommendation context */
export type RecommendationContext =
  | 'home'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'search'
  | 'category'
  | 'wishlist';

/** Recommendation type */
export type RecommendationType =
  | 'for_you'
  | 'similar'
  | 'also_bought'
  | 'also_viewed'
  | 'trending'
  | 'recently_viewed'
  | 'based_on_cart'
  | 'based_on_history';

/** Recommendation section */
export interface RecommendationSection {
  type: RecommendationType;
  title: string;
  products: Product[];
  reason?: string;
}

/** Tracked event type */
export type TrackedEventType =
  | 'view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'purchase'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'search'
  | 'category_view';

/** Tracked event */
export interface TrackedEvent {
  type: TrackedEventType;
  userId?: string;
  sessionId: string;
  productId?: string;
  productIds?: string[];
  categoryId?: string;
  searchQuery?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/** User behavior profile */
export interface UserBehaviorProfile {
  userId: string;
  viewedProducts: string[];
  purchasedProducts: string[];
  viewedCategories: string[];
  searchHistory: string[];
  preferredCategories: Array<{ id: string; score: number }>;
  preferredPriceRange: { min: number; max: number };
  lastUpdated: string;
}
