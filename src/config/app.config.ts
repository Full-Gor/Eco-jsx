/**
 * Application Configuration
 * Multi-backend configuration system with support for selfhosted, free, and pro modes
 */

import {
  AppConfig,
  AppMode,
  ConfigValidationResult,
} from '../types/config';

/** Self-hosted mode default configuration */
const selfHostedConfig: AppConfig = {
  mode: 'selfhosted',
  app: {
    name: 'My E-Commerce',
    version: '1.0.0',
    bundleId: 'com.myecommerce.app',
  },
  apiUrl: 'http://localhost:3000/api',
  features: {
    wishlist: true,
    reviews: true,
    comparisons: true,
    multiCurrency: false,
    multiLanguage: false,
    guestCheckout: true,
    socialLogin: false,
    biometricAuth: true,
    darkMode: true,
    pushNotifications: true,
    analytics: false,
  },
  auth: [
    {
      type: 'selfhosted',
      enabled: true,
      apiUrl: 'http://localhost:3000/api/auth',
    },
  ],
  database: {
    type: 'selfhosted',
    enabled: true,
    apiUrl: 'http://localhost:3000/api',
  },
  storage: {
    type: 'selfhosted',
    enabled: true,
    apiUrl: 'http://localhost:3000/api/storage',
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  payments: [
    {
      type: 'stripe',
      enabled: true,
      publishableKey: '',
    },
  ],
  notifications: [
    {
      type: 'ntfy',
      enabled: true,
      serverUrl: 'http://localhost:8080',
      topic: 'ecommerce-notifications',
    },
  ],
  newsletter: {
    type: 'listmonk',
    enabled: true,
    apiUrl: 'http://localhost:9000/api',
    username: '',
    password: '',
    listId: 1,
  },
  tracking: [
    {
      type: 'colissimo',
      enabled: true,
      contractNumber: '',
      password: '',
    },
  ],
  search: {
    type: 'meilisearch',
    enabled: true,
    host: 'http://localhost:7700',
    apiKey: '',
    indexName: 'products',
  },
  defaultLocale: 'fr',
  supportedLocales: ['fr', 'en'],
  defaultCurrency: 'EUR',
  supportedCurrencies: ['EUR'],
};

/** Free mode default configuration (Firebase/Supabase) */
const freeConfig: AppConfig = {
  mode: 'free',
  app: {
    name: 'My E-Commerce',
    version: '1.0.0',
    bundleId: 'com.myecommerce.app',
  },
  features: {
    wishlist: true,
    reviews: true,
    comparisons: false,
    multiCurrency: false,
    multiLanguage: false,
    guestCheckout: true,
    socialLogin: true,
    biometricAuth: true,
    darkMode: true,
    pushNotifications: true,
    analytics: true,
  },
  auth: [
    {
      type: 'firebase',
      enabled: true,
      apiKey: '',
      authDomain: '',
      projectId: '',
    },
  ],
  database: {
    type: 'firebase',
    enabled: true,
    projectId: '',
  },
  storage: {
    type: 'firebase',
    enabled: true,
    storageBucket: '',
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  payments: [
    {
      type: 'stripe',
      enabled: true,
      publishableKey: '',
    },
    {
      type: 'paypal',
      enabled: false,
      clientId: '',
      sandbox: true,
    },
  ],
  notifications: [
    {
      type: 'fcm',
      enabled: true,
      projectId: '',
    },
  ],
  newsletter: {
    type: 'brevo',
    enabled: true,
    apiKey: '',
    listId: 1,
  },
  tracking: [
    {
      type: 'colissimo',
      enabled: true,
      contractNumber: '',
      password: '',
    },
  ],
  defaultLocale: 'fr',
  supportedLocales: ['fr', 'en'],
  defaultCurrency: 'EUR',
  supportedCurrencies: ['EUR'],
};

/** Pro mode default configuration (Auth0/Clerk, Algolia, OneSignal) */
const proConfig: AppConfig = {
  mode: 'pro',
  app: {
    name: 'My E-Commerce Pro',
    version: '1.0.0',
    bundleId: 'com.myecommerce.app',
  },
  features: {
    wishlist: true,
    reviews: true,
    comparisons: true,
    multiCurrency: true,
    multiLanguage: true,
    guestCheckout: true,
    socialLogin: true,
    biometricAuth: true,
    darkMode: true,
    pushNotifications: true,
    analytics: true,
  },
  auth: [
    {
      type: 'auth0',
      enabled: true,
      domain: '',
      clientId: '',
    },
  ],
  database: {
    type: 'supabase',
    enabled: true,
    url: '',
    anonKey: '',
  },
  storage: {
    type: 'supabase',
    enabled: true,
    url: '',
    anonKey: '',
    bucket: 'uploads',
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  payments: [
    {
      type: 'stripe',
      enabled: true,
      publishableKey: '',
    },
    {
      type: 'paypal',
      enabled: true,
      clientId: '',
      sandbox: false,
    },
  ],
  notifications: [
    {
      type: 'onesignal',
      enabled: true,
      appId: '',
    },
  ],
  newsletter: {
    type: 'brevo',
    enabled: true,
    apiKey: '',
    listId: 1,
  },
  tracking: [
    {
      type: 'shippo',
      enabled: true,
      apiToken: '',
    },
  ],
  search: {
    type: 'algolia',
    enabled: true,
    appId: '',
    apiKey: '',
    indexName: 'products',
  },
  defaultLocale: 'fr',
  supportedLocales: ['fr', 'en', 'es', 'de'],
  defaultCurrency: 'EUR',
  supportedCurrencies: ['EUR', 'USD', 'GBP'],
};

/** Default configurations by mode */
const defaultConfigs: Record<AppMode, AppConfig> = {
  selfhosted: selfHostedConfig,
  free: freeConfig,
  pro: proConfig,
};

/** Current application configuration */
let currentConfig: AppConfig = { ...selfHostedConfig };

/**
 * Get default configuration for a specific mode
 */
export function getDefaultConfig(mode: AppMode): AppConfig {
  return { ...defaultConfigs[mode] };
}

/**
 * Get current application configuration
 */
export function getConfig(): AppConfig {
  return currentConfig;
}

/**
 * Set application configuration
 */
export function setConfig(config: Partial<AppConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config,
    features: {
      ...currentConfig.features,
      ...config.features,
    },
    app: {
      ...currentConfig.app,
      ...config.app,
    },
  };
}

/**
 * Load configuration for a specific mode with optional overrides
 */
export function loadConfig(mode: AppMode, overrides?: Partial<AppConfig>): AppConfig {
  const baseConfig = getDefaultConfig(mode);

  if (overrides) {
    currentConfig = {
      ...baseConfig,
      ...overrides,
      features: {
        ...baseConfig.features,
        ...overrides.features,
      },
      app: {
        ...baseConfig.app,
        ...overrides.app,
      },
      auth: overrides.auth ?? baseConfig.auth,
      payments: overrides.payments ?? baseConfig.payments,
      notifications: overrides.notifications ?? baseConfig.notifications,
      tracking: overrides.tracking ?? baseConfig.tracking,
    };
  } else {
    currentConfig = baseConfig;
  }

  return currentConfig;
}

/**
 * Validate configuration
 */
export function validateConfig(config: AppConfig): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate app info
  if (!config.app.name) {
    errors.push('App name is required');
  }
  if (!config.app.bundleId) {
    errors.push('Bundle ID is required');
  }

  // Validate auth configuration
  if (!config.auth || config.auth.length === 0) {
    errors.push('At least one auth provider is required');
  } else {
    const enabledAuth = config.auth.filter((a) => a.enabled);
    if (enabledAuth.length === 0) {
      errors.push('At least one auth provider must be enabled');
    }
  }

  // Validate database configuration
  if (!config.database || !config.database.enabled) {
    errors.push('Database provider is required and must be enabled');
  }

  // Validate storage configuration
  if (!config.storage || !config.storage.enabled) {
    warnings.push('Storage provider is not configured or disabled');
  }

  // Validate payment configuration
  if (!config.payments || config.payments.length === 0) {
    warnings.push('No payment providers configured');
  } else {
    const enabledPayments = config.payments.filter((p) => p.enabled);
    if (enabledPayments.length === 0) {
      warnings.push('No payment providers are enabled');
    }
  }

  // Validate notification configuration
  if (config.features.pushNotifications) {
    if (!config.notifications || config.notifications.length === 0) {
      warnings.push('Push notifications enabled but no providers configured');
    } else {
      const enabledNotifications = config.notifications.filter((n) => n.enabled);
      if (enabledNotifications.length === 0) {
        warnings.push('Push notifications enabled but no providers are enabled');
      }
    }
  }

  // Mode-specific validations
  if (config.mode === 'selfhosted' && !config.apiUrl) {
    errors.push('API URL is required for self-hosted mode');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
  return currentConfig.features[feature] ?? false;
}

/**
 * Get enabled auth providers
 */
export function getEnabledAuthProviders() {
  return currentConfig.auth.filter((a) => a.enabled);
}

/**
 * Get enabled payment providers
 */
export function getEnabledPaymentProviders() {
  return currentConfig.payments.filter((p) => p.enabled);
}

/**
 * Get enabled notification providers
 */
export function getEnabledNotificationProviders() {
  return currentConfig.notifications.filter((n) => n.enabled);
}

/**
 * Get enabled tracking providers
 */
export function getEnabledTrackingProviders() {
  return currentConfig.tracking.filter((t) => t.enabled);
}

export default {
  getConfig,
  setConfig,
  loadConfig,
  getDefaultConfig,
  validateConfig,
  isFeatureEnabled,
  getEnabledAuthProviders,
  getEnabledPaymentProviders,
  getEnabledNotificationProviders,
  getEnabledTrackingProviders,
};
