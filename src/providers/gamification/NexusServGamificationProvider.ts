/**
 * NexusServ Gamification Provider
 * Self-hosted loyalty and gamification system
 */

import type { ApiResponse, Pagination, PaginatedResponse } from '../types';
import type {
  GamificationProvider,
  GamificationProviderConfig,
  AddPointsOptions,
  RedeemPointsOptions,
  RedemptionResult,
} from './GamificationProvider.interface';
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

/** NexusServ-specific configuration */
export interface NexusServGamificationConfig extends GamificationProviderConfig {
  /** API base URL */
  apiUrl: string;
  /** API key for authentication */
  apiKey?: string;
  /** Points earned per currency unit spent */
  pointsPerCurrency?: number;
  /** Points needed for 1 currency unit discount */
  conversionRate?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Create NexusServ gamification provider
 */
export function createNexusServGamificationProvider(
  config: NexusServGamificationConfig
): GamificationProvider {
  const {
    apiUrl,
    apiKey,
    pointsPerCurrency = 10,
    conversionRate = 100,
    debug = false,
  } = config;

  let isInitialized = false;
  let levels: UserLevel[] = [];

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log('[NexusServGamification]', ...args);
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

  /** Make API request */
  const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${apiUrl}/gamification${endpoint}`, {
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
      return { success: true, data };
    } catch (error) {
      log('API error:', error);
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: String(error) },
      };
    }
  };

  return {
    name: 'nexusserv-gamification',
    type: 'gamification',

    async initialize(): Promise<void> {
      if (isInitialized) return;

      log('Initializing NexusServ gamification provider');

      // Load user levels
      const levelsResult = await apiRequest<UserLevel[]>('/levels');
      if (levelsResult.success && levelsResult.data) {
        levels = levelsResult.data;
      } else {
        // Default levels
        levels = [
          {
            id: 'bronze',
            tier: 'bronze',
            name: 'Bronze',
            minPoints: 0,
            maxPoints: 999,
            benefits: ['5% bonus points on purchases'],
            badge: 'bronze-badge',
            multiplier: 1.0,
          },
          {
            id: 'silver',
            tier: 'silver',
            name: 'Silver',
            minPoints: 1000,
            maxPoints: 4999,
            benefits: ['10% bonus points', 'Free shipping over $50'],
            badge: 'silver-badge',
            multiplier: 1.1,
          },
          {
            id: 'gold',
            tier: 'gold',
            name: 'Gold',
            minPoints: 5000,
            maxPoints: 14999,
            benefits: ['15% bonus points', 'Free shipping', 'Early access to sales'],
            badge: 'gold-badge',
            multiplier: 1.15,
          },
          {
            id: 'platinum',
            tier: 'platinum',
            name: 'Platinum',
            minPoints: 15000,
            benefits: ['20% bonus points', 'Free express shipping', 'VIP support'],
            badge: 'platinum-badge',
            multiplier: 1.2,
          },
        ];
      }

      isInitialized = true;
    },

    isReady(): boolean {
      return isInitialized;
    },

    async dispose(): Promise<void> {
      isInitialized = false;
      log('Provider disposed');
    },

    getConversionRate(): number {
      return conversionRate;
    },

    // ============================================================================
    // Loyalty Points
    // ============================================================================

    async getLoyaltyStatus(userId: string): Promise<ApiResponse<LoyaltyStatus>> {
      log('Getting loyalty status for:', userId);
      return apiRequest<LoyaltyStatus>(`/users/${userId}/status`);
    },

    async getPoints(userId: string): Promise<ApiResponse<number>> {
      const result = await apiRequest<{ points: number }>(`/users/${userId}/points`);
      if (result.success && result.data) {
        return { success: true, data: result.data.points };
      }
      return { success: false, error: result.error };
    },

    async addPoints(options: AddPointsOptions): Promise<ApiResponse<PointsTransaction>> {
      log('Adding points:', options);
      return apiRequest<PointsTransaction>(`/users/${options.userId}/points`, {
        method: 'POST',
        body: JSON.stringify({
          amount: options.amount,
          type: options.type,
          description: options.description,
          referenceId: options.referenceId,
          expiresInDays: options.expiresInDays,
        }),
      });
    },

    async redeemPoints(options: RedeemPointsOptions): Promise<ApiResponse<RedemptionResult>> {
      log('Redeeming points:', options);
      return apiRequest<RedemptionResult>(`/users/${options.userId}/redeem`, {
        method: 'POST',
        body: JSON.stringify({
          amount: options.amount,
          type: options.type,
          productId: options.productId,
        }),
      });
    },

    async getPointsHistory(
      userId: string,
      pagination?: Pagination
    ): Promise<ApiResponse<PaginatedResponse<PointsTransaction>>> {
      const params = new URLSearchParams();
      if (pagination?.page) params.append('page', String(pagination.page));
      if (pagination?.limit) params.append('limit', String(pagination.limit));

      return apiRequest<PaginatedResponse<PointsTransaction>>(
        `/users/${userId}/history?${params.toString()}`
      );
    },

    async getLevels(): Promise<ApiResponse<UserLevel[]>> {
      return { success: true, data: levels };
    },

    // ============================================================================
    // Daily Check-in
    // ============================================================================

    async dailyCheckin(userId: string): Promise<ApiResponse<PointsTransaction>> {
      log('Daily check-in for:', userId);
      return apiRequest<PointsTransaction>(`/users/${userId}/checkin`, {
        method: 'POST',
      });
    },

    async canCheckin(userId: string): Promise<ApiResponse<boolean>> {
      const result = await apiRequest<{ canCheckin: boolean }>(
        `/users/${userId}/can-checkin`
      );
      if (result.success && result.data) {
        return { success: true, data: result.data.canCheckin };
      }
      return { success: false, error: result.error };
    },

    // ============================================================================
    // Missions
    // ============================================================================

    async getMissions(userId: string): Promise<ApiResponse<Mission[]>> {
      log('Getting missions for:', userId);
      return apiRequest<Mission[]>(`/users/${userId}/missions`);
    },

    async getMission(userId: string, missionId: string): Promise<ApiResponse<Mission>> {
      return apiRequest<Mission>(`/users/${userId}/missions/${missionId}`);
    },

    async updateMissionProgress(
      userId: string,
      missionId: string,
      progress: number
    ): Promise<ApiResponse<Mission>> {
      log('Updating mission progress:', missionId, progress);
      return apiRequest<Mission>(`/users/${userId}/missions/${missionId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ progress }),
      });
    },

    async claimMissionReward(
      userId: string,
      missionId: string
    ): Promise<ApiResponse<RedemptionResult>> {
      log('Claiming mission reward:', missionId);
      return apiRequest<RedemptionResult>(`/users/${userId}/missions/${missionId}/claim`, {
        method: 'POST',
      });
    },

    // ============================================================================
    // Fortune Wheel
    // ============================================================================

    async getWheelStatus(userId: string): Promise<ApiResponse<WheelStatus>> {
      log('Getting wheel status for:', userId);
      return apiRequest<WheelStatus>(`/users/${userId}/wheel`);
    },

    async spinWheel(userId: string): Promise<ApiResponse<WheelSpinResult>> {
      log('Spinning wheel for:', userId);
      return apiRequest<WheelSpinResult>(`/users/${userId}/wheel/spin`, {
        method: 'POST',
      });
    },

    // ============================================================================
    // Referrals
    // ============================================================================

    async getReferralInfo(userId: string): Promise<ApiResponse<ReferralInfo>> {
      log('Getting referral info for:', userId);
      return apiRequest<ReferralInfo>(`/users/${userId}/referral`);
    },

    async getReferredUsers(
      userId: string,
      pagination?: Pagination
    ): Promise<ApiResponse<PaginatedResponse<ReferredUser>>> {
      const params = new URLSearchParams();
      if (pagination?.page) params.append('page', String(pagination.page));
      if (pagination?.limit) params.append('limit', String(pagination.limit));

      return apiRequest<PaginatedResponse<ReferredUser>>(
        `/users/${userId}/referral/users?${params.toString()}`
      );
    },

    async applyReferralCode(
      userId: string,
      code: string
    ): Promise<ApiResponse<{ success: boolean; reward?: string }>> {
      log('Applying referral code:', code);
      return apiRequest<{ success: boolean; reward?: string }>(
        `/users/${userId}/referral/apply`,
        {
          method: 'POST',
          body: JSON.stringify({ code }),
        }
      );
    },

    async generateReferralCode(userId: string): Promise<ApiResponse<string>> {
      const result = await apiRequest<{ code: string }>(
        `/users/${userId}/referral/generate`,
        { method: 'POST' }
      );
      if (result.success && result.data) {
        return { success: true, data: result.data.code };
      }
      return { success: false, error: result.error };
    },
  };
}

