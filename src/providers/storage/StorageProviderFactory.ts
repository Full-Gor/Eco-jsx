/**
 * Storage Provider Factory
 * Creates the appropriate storage provider based on configuration
 */

import { IStorageProvider, StorageProviderOptions } from './StorageProvider.interface';
import { createNexusServStorageProvider } from './NexusServStorageProvider';
import { createFirebaseStorageProvider } from './FirebaseStorageProvider';
import { createSupabaseStorageProvider } from './SupabaseStorageProvider';

/** Storage provider type */
export type StorageProviderType = 'selfhosted' | 'firebase' | 'supabase';

/** Storage provider configuration */
export interface StorageProviderConfig {
  type: StorageProviderType;
  // NexusServ (self-hosted)
  apiUrl?: string;
  cdnUrl?: string;
  // Firebase
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  // Supabase
  url?: string;
  anonKey?: string;
}

/**
 * Create a storage provider based on configuration
 * @param config - Provider configuration
 * @param options - Provider options
 * @returns Storage provider instance
 */
export function createStorageProvider(
  config: StorageProviderConfig,
  options: StorageProviderOptions = {}
): IStorageProvider {
  switch (config.type) {
    case 'selfhosted':
      if (!config.apiUrl) {
        throw new Error('NexusServ storage provider requires apiUrl');
      }
      return createNexusServStorageProvider(
        {
          apiUrl: config.apiUrl,
          cdnUrl: config.cdnUrl,
        },
        options
      );

    case 'firebase':
      if (!config.apiKey || !config.authDomain || !config.projectId || !config.storageBucket) {
        throw new Error('Firebase storage provider requires apiKey, authDomain, projectId, and storageBucket');
      }
      return createFirebaseStorageProvider(
        {
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId,
        },
        options
      );

    case 'supabase':
      if (!config.url || !config.anonKey) {
        throw new Error('Supabase storage provider requires url and anonKey');
      }
      return createSupabaseStorageProvider(
        {
          url: config.url,
          anonKey: config.anonKey,
        },
        options
      );

    default:
      throw new Error(`Unknown storage provider type: ${config.type}`);
  }
}

export default createStorageProvider;
