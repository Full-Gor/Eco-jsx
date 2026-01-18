/**
 * Configuration types for multi-backend support
 */

/** Application mode */
export type AppMode = 'selfhosted' | 'free' | 'pro';

/** Provider type for each service */
export type AuthProviderType =
  | 'selfhosted'    // Custom JWT auth via NexusServ
  | 'firebase'      // Firebase Auth
  | 'supabase'      // Supabase Auth
  | 'auth0'         // Auth0
  | 'clerk';        // Clerk

export type DatabaseProviderType =
  | 'selfhosted'    // NexusServ PostgreSQL/SQLite
  | 'firebase'      // Firestore
  | 'supabase';     // Supabase PostgreSQL

export type StorageProviderType =
  | 'selfhosted'    // NexusServ file storage
  | 'firebase'      // Firebase Storage
  | 'supabase'      // Supabase Storage
  | 's3';           // AWS S3 compatible

export type PaymentProviderType =
  | 'stripe'
  | 'paypal'
  | 'mollie'
  | 'adyen';

export type NotificationProviderType =
  | 'ntfy'          // Self-hosted ntfy
  | 'fcm'           // Firebase Cloud Messaging
  | 'onesignal';    // OneSignal

export type NewsletterProviderType =
  | 'listmonk'      // Self-hosted Listmonk
  | 'brevo'         // Brevo (ex-Sendinblue)
  | 'mailchimp';    // Mailchimp

export type TrackingProviderType =
  | 'manual'        // Self-hosted manual tracking
  | 'colissimo'
  | 'chronopost'
  | 'mondialrelay'
  | 'ups'
  | 'fedex'
  | 'dhl'
  | 'shippo'        // Multi-carrier aggregator
  | 'easypost'      // Multi-carrier API
  | '17track'       // Universal tracking
  | 'native';       // Native carrier integration

export type SearchProviderType =
  | 'meilisearch'   // Self-hosted Meilisearch
  | 'algolia'       // Algolia
  | 'typesense';    // Typesense

/** Base provider configuration */
export interface BaseProviderConfig {
  enabled: boolean;
}

/** Self-hosted auth configuration */
export interface SelfHostedAuthConfig extends BaseProviderConfig {
  type: 'selfhosted';
  apiUrl: string;
  jwtSecret?: string;
}

/** Firebase auth configuration */
export interface FirebaseAuthConfig extends BaseProviderConfig {
  type: 'firebase';
  apiKey: string;
  authDomain: string;
  projectId: string;
}

/** Supabase auth configuration */
export interface SupabaseAuthConfig extends BaseProviderConfig {
  type: 'supabase';
  url: string;
  anonKey: string;
}

/** Auth0 configuration */
export interface Auth0Config extends BaseProviderConfig {
  type: 'auth0';
  domain: string;
  clientId: string;
  audience?: string;
}

/** Clerk configuration */
export interface ClerkConfig extends BaseProviderConfig {
  type: 'clerk';
  publishableKey: string;
}

/** Auth provider config union */
export type AuthProviderConfig =
  | SelfHostedAuthConfig
  | FirebaseAuthConfig
  | SupabaseAuthConfig
  | Auth0Config
  | ClerkConfig;

/** Self-hosted database configuration */
export interface SelfHostedDatabaseConfig extends BaseProviderConfig {
  type: 'selfhosted';
  apiUrl: string;
}

/** Firebase database configuration */
export interface FirebaseDatabaseConfig extends BaseProviderConfig {
  type: 'firebase';
  projectId: string;
}

/** Supabase database configuration */
export interface SupabaseDatabaseConfig extends BaseProviderConfig {
  type: 'supabase';
  url: string;
  anonKey: string;
}

/** Database provider config union */
export type DatabaseProviderConfig =
  | SelfHostedDatabaseConfig
  | FirebaseDatabaseConfig
  | SupabaseDatabaseConfig;

/** Self-hosted storage configuration */
export interface SelfHostedStorageConfig extends BaseProviderConfig {
  type: 'selfhosted';
  apiUrl: string;
  maxFileSize?: number;
}

/** Firebase storage configuration */
export interface FirebaseStorageConfig extends BaseProviderConfig {
  type: 'firebase';
  storageBucket: string;
  maxFileSize?: number;
}

/** Supabase storage configuration */
export interface SupabaseStorageConfig extends BaseProviderConfig {
  type: 'supabase';
  url: string;
  anonKey: string;
  bucket: string;
  maxFileSize?: number;
}

/** S3 storage configuration */
export interface S3StorageConfig extends BaseProviderConfig {
  type: 's3';
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  maxFileSize?: number;
}

/** Storage provider config union */
export type StorageProviderConfig =
  | SelfHostedStorageConfig
  | FirebaseStorageConfig
  | SupabaseStorageConfig
  | S3StorageConfig;

/** Stripe configuration */
export interface StripeConfig extends BaseProviderConfig {
  type: 'stripe';
  publishableKey: string;
  merchantId?: string;
}

/** PayPal configuration */
export interface PayPalConfig extends BaseProviderConfig {
  type: 'paypal';
  clientId: string;
  sandbox?: boolean;
}

/** Mollie configuration */
export interface MollieConfig extends BaseProviderConfig {
  type: 'mollie';
  profileId: string;
}

/** Adyen configuration */
export interface AdyenConfig extends BaseProviderConfig {
  type: 'adyen';
  environment: 'test' | 'live';
  clientKey: string;
  merchantAccount: string;
}

/** Payment provider config union */
export type PaymentProviderConfig =
  | StripeConfig
  | PayPalConfig
  | MollieConfig
  | AdyenConfig;

/** ntfy configuration */
export interface NtfyConfig extends BaseProviderConfig {
  type: 'ntfy';
  serverUrl: string;
  topic: string;
  authToken?: string;
}

/** FCM configuration */
export interface FCMConfig extends BaseProviderConfig {
  type: 'fcm';
  projectId: string;
  vapidKey?: string;
}

/** OneSignal configuration */
export interface OneSignalConfig extends BaseProviderConfig {
  type: 'onesignal';
  appId: string;
}

/** Notification provider config union */
export type NotificationProviderConfig =
  | NtfyConfig
  | FCMConfig
  | OneSignalConfig;

/** Listmonk configuration */
export interface ListmonkConfig extends BaseProviderConfig {
  type: 'listmonk';
  apiUrl: string;
  username: string;
  password: string;
  listId: number;
}

/** Brevo configuration */
export interface BrevoConfig extends BaseProviderConfig {
  type: 'brevo';
  apiKey: string;
  listId: number;
}

/** Mailchimp configuration */
export interface MailchimpConfig extends BaseProviderConfig {
  type: 'mailchimp';
  apiKey: string;
  dataCenter: string;
  listId: string;
}

/** Newsletter provider config union */
export type NewsletterProviderConfig =
  | ListmonkConfig
  | BrevoConfig
  | MailchimpConfig;

/** Base shipping/tracking configuration */
export interface BaseShippingConfig extends BaseProviderConfig {
  type: TrackingProviderType;
  apiKey?: string;
  apiSecret?: string;
  accountNumber?: string;
}

/** Colissimo configuration */
export interface ColissimoConfig extends BaseProviderConfig {
  type: 'colissimo';
  contractNumber: string;
  password: string;
}

/** Chronopost configuration */
export interface ChronopostConfig extends BaseProviderConfig {
  type: 'chronopost';
  accountNumber: string;
  password: string;
}

/** Mondial Relay configuration */
export interface MondialRelayConfig extends BaseProviderConfig {
  type: 'mondialrelay';
  brandId: string;
  privateKey: string;
}

/** Shippo configuration (multi-carrier) */
export interface ShippoConfig extends BaseProviderConfig {
  type: 'shippo';
  apiToken: string;
}

/** Generic carrier configuration */
export interface GenericCarrierConfig extends BaseProviderConfig {
  type: 'ups' | 'fedex' | 'dhl';
  apiKey: string;
  apiSecret: string;
  accountNumber?: string;
}

/** Tracking provider config union */
export type TrackingProviderConfig =
  | ColissimoConfig
  | ChronopostConfig
  | MondialRelayConfig
  | ShippoConfig
  | GenericCarrierConfig;

/** Meilisearch configuration */
export interface MeilisearchConfig extends BaseProviderConfig {
  type: 'meilisearch';
  host: string;
  apiKey: string;
  indexName: string;
}

/** Algolia configuration */
export interface AlgoliaConfig extends BaseProviderConfig {
  type: 'algolia';
  appId: string;
  apiKey: string;
  indexName: string;
}

/** Typesense configuration */
export interface TypesenseConfig extends BaseProviderConfig {
  type: 'typesense';
  host: string;
  port: number;
  protocol: 'http' | 'https';
  apiKey: string;
  collectionName: string;
}

/** Search provider config union */
export type SearchProviderConfig =
  | MeilisearchConfig
  | AlgoliaConfig
  | TypesenseConfig;

/** App configuration */
export interface AppConfig {
  /** Application mode */
  mode: AppMode;

  /** App info */
  app: {
    name: string;
    version: string;
    bundleId: string;
    supportEmail?: string;
    privacyPolicyUrl?: string;
    termsOfServiceUrl?: string;
  };

  /** API base URL for self-hosted mode */
  apiUrl?: string;

  /** Feature flags */
  features: {
    wishlist: boolean;
    reviews: boolean;
    comparisons: boolean;
    multiCurrency: boolean;
    multiLanguage: boolean;
    guestCheckout: boolean;
    socialLogin: boolean;
    biometricAuth: boolean;
    darkMode: boolean;
    pushNotifications: boolean;
    analytics: boolean;
  };

  /** Authentication providers (multiple allowed) */
  auth: AuthProviderConfig[];

  /** Database provider (single) */
  database: DatabaseProviderConfig;

  /** Storage provider (single) */
  storage: StorageProviderConfig;

  /** Payment providers (multiple allowed) */
  payments: PaymentProviderConfig[];

  /** Notification providers (multiple allowed) */
  notifications: NotificationProviderConfig[];

  /** Newsletter provider (single) */
  newsletter?: NewsletterProviderConfig;

  /** Tracking/shipping providers (multiple allowed) */
  tracking: TrackingProviderConfig[];

  /** Search provider (single) */
  search?: SearchProviderConfig;

  /** Default locale */
  defaultLocale: string;

  /** Supported locales */
  supportedLocales: string[];

  /** Default currency */
  defaultCurrency: string;

  /** Supported currencies */
  supportedCurrencies: string[];
}

/** Configuration validation result */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
