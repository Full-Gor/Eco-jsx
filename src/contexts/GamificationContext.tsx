/**
 * Gamification Context
 * Loyalty points, missions, wheel, and referrals
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { GamificationProvider, RedemptionResult } from '../providers/gamification';
import type {
  LoyaltyStatus,
  PointsTransaction,
  Mission,
  WheelStatus,
  WheelSpinResult,
  ReferralInfo,
  ReferredUser,
  UserLevel,
} from '../types/advanced';

/** Gamification state */
interface GamificationState {
  isLoading: boolean;
  loyaltyStatus: LoyaltyStatus | null;
  missions: Mission[];
  wheelStatus: WheelStatus | null;
  referralInfo: ReferralInfo | null;
  pointsHistory: PointsTransaction[];
  levels: UserLevel[];
  error: string | null;
}

/** Gamification context value */
interface GamificationContextValue extends GamificationState {
  /** Refresh loyalty status */
  refreshStatus: () => Promise<void>;
  /** Perform daily check-in */
  dailyCheckin: () => Promise<PointsTransaction | null>;
  /** Check if can check in */
  canCheckin: () => Promise<boolean>;
  /** Redeem points for discount */
  redeemPoints: (amount: number) => Promise<RedemptionResult | null>;
  /** Get points history */
  fetchPointsHistory: (page?: number) => Promise<void>;
  /** Refresh missions */
  refreshMissions: () => Promise<void>;
  /** Claim mission reward */
  claimMissionReward: (missionId: string) => Promise<RedemptionResult | null>;
  /** Refresh wheel status */
  refreshWheelStatus: () => Promise<void>;
  /** Spin the wheel */
  spinWheel: () => Promise<WheelSpinResult | null>;
  /** Refresh referral info */
  refreshReferralInfo: () => Promise<void>;
  /** Get referred users */
  fetchReferredUsers: (page?: number) => Promise<ReferredUser[]>;
  /** Apply referral code */
  applyReferralCode: (code: string) => Promise<{ success: boolean; reward?: string }>;
  /** Get conversion rate */
  conversionRate: number;
}

const GamificationContext = createContext<GamificationContextValue | null>(null);

/** Gamification provider props */
interface GamificationProviderProps {
  children: React.ReactNode;
  provider: GamificationProvider;
  userId: string | null;
  enabled?: boolean;
}

/**
 * Gamification Provider Component
 */
export function GamificationProviderComponent({
  children,
  provider,
  userId,
  enabled = true,
}: GamificationProviderProps) {
  const [state, setState] = useState<GamificationState>({
    isLoading: false,
    loyaltyStatus: null,
    missions: [],
    wheelStatus: null,
    referralInfo: null,
    pointsHistory: [],
    levels: [],
    error: null,
  });

  const initRef = useRef(false);

  // Initialize provider and load initial data
  useEffect(() => {
    if (!enabled || !userId) return;
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        await provider.initialize();

        // Load levels
        const levelsResult = await provider.getLevels();
        if (levelsResult.success && levelsResult.data) {
          setState((prev) => ({ ...prev, levels: levelsResult.data || [] }));
        }

        // Load initial status
        const statusResult = await provider.getLoyaltyStatus(userId);
        if (statusResult.success && statusResult.data) {
          setState((prev) => ({ ...prev, loyaltyStatus: statusResult.data || null }));
        }
      } catch (error) {
        console.error('Failed to initialize gamification:', error);
      }
    };

    init();

    return () => {
      provider.dispose();
    };
  }, [provider, userId, enabled]);

  // Refresh when user changes
  useEffect(() => {
    if (!userId || !enabled) {
      setState((prev) => ({
        ...prev,
        loyaltyStatus: null,
        missions: [],
        wheelStatus: null,
        referralInfo: null,
        pointsHistory: [],
      }));
    }
  }, [userId, enabled]);

  const refreshStatus = useCallback(async () => {
    if (!userId) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await provider.getLoyaltyStatus(userId);
      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          loyaltyStatus: result.data || null,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message || 'Failed to refresh status',
          isLoading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: String(error),
        isLoading: false,
      }));
    }
  }, [provider, userId]);

  const dailyCheckin = useCallback(async (): Promise<PointsTransaction | null> => {
    if (!userId) return null;

    try {
      const result = await provider.dailyCheckin(userId);
      if (result.success && result.data) {
        // Refresh status after check-in
        await refreshStatus();
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Check-in failed:', error);
      return null;
    }
  }, [provider, userId, refreshStatus]);

  const canCheckin = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      const result = await provider.canCheckin(userId);
      return result.success && result.data === true;
    } catch {
      return false;
    }
  }, [provider, userId]);

  const redeemPoints = useCallback(
    async (amount: number): Promise<RedemptionResult | null> => {
      if (!userId) return null;

      try {
        const result = await provider.redeemPoints({
          userId,
          amount,
          type: 'discount',
        });
        if (result.success && result.data) {
          await refreshStatus();
          return result.data;
        }
        return null;
      } catch (error) {
        console.error('Redemption failed:', error);
        return null;
      }
    },
    [provider, userId, refreshStatus]
  );

  const fetchPointsHistory = useCallback(
    async (page = 1) => {
      if (!userId) return;

      try {
        const result = await provider.getPointsHistory(userId, { page, limit: 20 });
        if (result.success && result.data) {
          setState((prev) => ({
            ...prev,
            pointsHistory:
              page === 1
                ? result.data?.items || []
                : [...prev.pointsHistory, ...(result.data?.items || [])],
          }));
        }
      } catch (error) {
        console.error('Failed to fetch points history:', error);
      }
    },
    [provider, userId]
  );

  const refreshMissions = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await provider.getMissions(userId);
      if (result.success && result.data) {
        setState((prev) => ({ ...prev, missions: result.data || [] }));
      }
    } catch (error) {
      console.error('Failed to refresh missions:', error);
    }
  }, [provider, userId]);

  const claimMissionReward = useCallback(
    async (missionId: string): Promise<RedemptionResult | null> => {
      if (!userId) return null;

      try {
        const result = await provider.claimMissionReward(userId, missionId);
        if (result.success && result.data) {
          await refreshMissions();
          await refreshStatus();
          return result.data;
        }
        return null;
      } catch (error) {
        console.error('Failed to claim mission reward:', error);
        return null;
      }
    },
    [provider, userId, refreshMissions, refreshStatus]
  );

  const refreshWheelStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await provider.getWheelStatus(userId);
      if (result.success && result.data) {
        setState((prev) => ({ ...prev, wheelStatus: result.data || null }));
      }
    } catch (error) {
      console.error('Failed to refresh wheel status:', error);
    }
  }, [provider, userId]);

  const spinWheel = useCallback(async (): Promise<WheelSpinResult | null> => {
    if (!userId) return null;

    try {
      const result = await provider.spinWheel(userId);
      if (result.success && result.data) {
        await refreshWheelStatus();
        await refreshStatus();
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to spin wheel:', error);
      return null;
    }
  }, [provider, userId, refreshWheelStatus, refreshStatus]);

  const refreshReferralInfo = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await provider.getReferralInfo(userId);
      if (result.success && result.data) {
        setState((prev) => ({ ...prev, referralInfo: result.data || null }));
      }
    } catch (error) {
      console.error('Failed to refresh referral info:', error);
    }
  }, [provider, userId]);

  const fetchReferredUsers = useCallback(
    async (page = 1): Promise<ReferredUser[]> => {
      if (!userId) return [];

      try {
        const result = await provider.getReferredUsers(userId, { page, limit: 20 });
        if (result.success && result.data) {
          return result.data.items;
        }
        return [];
      } catch (error) {
        console.error('Failed to fetch referred users:', error);
        return [];
      }
    },
    [provider, userId]
  );

  const applyReferralCode = useCallback(
    async (code: string): Promise<{ success: boolean; reward?: string }> => {
      if (!userId) return { success: false };

      try {
        const result = await provider.applyReferralCode(userId, code);
        if (result.success && result.data) {
          await refreshStatus();
          return result.data;
        }
        return { success: false };
      } catch (error) {
        console.error('Failed to apply referral code:', error);
        return { success: false };
      }
    },
    [provider, userId, refreshStatus]
  );

  const value: GamificationContextValue = {
    ...state,
    refreshStatus,
    dailyCheckin,
    canCheckin,
    redeemPoints,
    fetchPointsHistory,
    refreshMissions,
    claimMissionReward,
    refreshWheelStatus,
    spinWheel,
    refreshReferralInfo,
    fetchReferredUsers,
    applyReferralCode,
    conversionRate: provider.getConversionRate(),
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

/**
 * Hook to use gamification (loyalty)
 */
export function useLoyalty(): GamificationContextValue {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useLoyalty must be used within GamificationProvider');
  }
  return context;
}

// Alias for useLoyalty
export const useGamification = useLoyalty;

export { GamificationProviderComponent as GamificationProvider };
