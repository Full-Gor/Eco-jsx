/**
 * Configuration hooks
 */

import { useMemo } from 'react';
import {
  getConfig,
  isFeatureEnabled,
  getEnabledAuthProviders,
  getEnabledPaymentProviders,
  getEnabledNotificationProviders,
  getEnabledTrackingProviders,
} from '../config';
import { AppConfig } from '../types/config';

/** Hook to access app configuration */
export function useConfig(): AppConfig {
  return useMemo(() => getConfig(), []);
}

/** Hook to check if a feature is enabled */
export function useFeature(feature: keyof AppConfig['features']): boolean {
  const config = useConfig();
  return config.features[feature] ?? false;
}

/** Hook to get enabled auth providers */
export function useAuthProviders() {
  return useMemo(() => getEnabledAuthProviders(), []);
}

/** Hook to get enabled payment providers */
export function usePaymentProviders() {
  return useMemo(() => getEnabledPaymentProviders(), []);
}

/** Hook to get enabled notification providers */
export function useNotificationProviders() {
  return useMemo(() => getEnabledNotificationProviders(), []);
}

/** Hook to get enabled tracking providers */
export function useTrackingProviders() {
  return useMemo(() => getEnabledTrackingProviders(), []);
}

/** Hook to check app mode */
export function useAppMode() {
  const config = useConfig();
  return {
    mode: config.mode,
    isSelfHosted: config.mode === 'selfhosted',
    isFree: config.mode === 'free',
    isPro: config.mode === 'pro',
  };
}

export default {
  useConfig,
  useFeature,
  useAuthProviders,
  usePaymentProviders,
  useNotificationProviders,
  useTrackingProviders,
  useAppMode,
};
