/**
 * Gamification Provider Interface
 * Loyalty points, missions, fortune wheel, and referrals
 */

import type { BaseProvider, ApiResponse, Pagination, PaginatedResponse } from '../types';
import type {
  LoyaltyStatus,
  PointsTransaction,
  Mission,
  WheelStatus,
  WheelSpinResult,
  ReferralInfo,
  ReferredUser,
  UserLevel,
} from '../../types/advanced';

/** Gamification provider configuration */
export interface GamificationProviderConfig {
  apiUrl: string;
  apiKey?: string;
  pointsPerCurrency?: number; // Points earned per currency unit spent
  conversionRate?: number; // Points needed per currency unit discount
  debug?: boolean;
}

/** Add points options */
export interface AddPointsOptions {
  userId: string;
  amount: number;
  type: string;
  description: string;
  referenceId?: string;
  expiresInDays?: number;
}

/** Redeem points options */
export interface RedeemPointsOptions {
  userId: string;
  amount: number;
  type: 'discount' | 'coupon' | 'product';
  productId?: string;
}

/** Redemption result */
export interface RedemptionResult {
  success: boolean;
  discount?: number;
  couponCode?: string;
  message: string;
}

/** Gamification provider interface */
export interface GamificationProvider extends BaseProvider {
  type: 'gamification';

  // ============================================================================
  // Loyalty Points
  // ============================================================================

  /**
   * Get user's current loyalty status
   */
  getLoyaltyStatus(userId: string): Promise<ApiResponse<LoyaltyStatus>>;

  /**
   * Get user's points balance
   */
  getPoints(userId: string): Promise<ApiResponse<number>>;

  /**
   * Add points to user account
   */
  addPoints(options: AddPointsOptions): Promise<ApiResponse<PointsTransaction>>;

  /**
   * Redeem points for rewards
   */
  redeemPoints(options: RedeemPointsOptions): Promise<ApiResponse<RedemptionResult>>;

  /**
   * Get points transaction history
   */
  getPointsHistory(
    userId: string,
    pagination?: Pagination
  ): Promise<ApiResponse<PaginatedResponse<PointsTransaction>>>;

  /**
   * Get points conversion rate (points per currency unit)
   */
  getConversionRate(): number;

  /**
   * Get all user levels
   */
  getLevels(): Promise<ApiResponse<UserLevel[]>>;

  // ============================================================================
  // Daily Check-in
  // ============================================================================

  /**
   * Perform daily check-in
   */
  dailyCheckin(userId: string): Promise<ApiResponse<PointsTransaction>>;

  /**
   * Check if user can check in today
   */
  canCheckin(userId: string): Promise<ApiResponse<boolean>>;

  // ============================================================================
  // Missions
  // ============================================================================

  /**
   * Get active missions for user
   */
  getMissions(userId: string): Promise<ApiResponse<Mission[]>>;

  /**
   * Get mission by ID
   */
  getMission(userId: string, missionId: string): Promise<ApiResponse<Mission>>;

  /**
   * Update mission progress
   */
  updateMissionProgress(
    userId: string,
    missionId: string,
    progress: number
  ): Promise<ApiResponse<Mission>>;

  /**
   * Claim mission reward
   */
  claimMissionReward(userId: string, missionId: string): Promise<ApiResponse<RedemptionResult>>;

  // ============================================================================
  // Fortune Wheel
  // ============================================================================

  /**
   * Get wheel status and prizes
   */
  getWheelStatus(userId: string): Promise<ApiResponse<WheelStatus>>;

  /**
   * Spin the fortune wheel
   */
  spinWheel(userId: string): Promise<ApiResponse<WheelSpinResult>>;

  // ============================================================================
  // Referrals
  // ============================================================================

  /**
   * Get referral info for user
   */
  getReferralInfo(userId: string): Promise<ApiResponse<ReferralInfo>>;

  /**
   * Get referred users list
   */
  getReferredUsers(
    userId: string,
    pagination?: Pagination
  ): Promise<ApiResponse<PaginatedResponse<ReferredUser>>>;

  /**
   * Apply referral code
   */
  applyReferralCode(
    userId: string,
    code: string
  ): Promise<ApiResponse<{ success: boolean; reward?: string }>>;

  /**
   * Generate new referral code
   */
  generateReferralCode(userId: string): Promise<ApiResponse<string>>;
}

export type { GamificationProviderConfig as GamificationConfig };
