/**
 * Database Provider Factory
 * Creates the appropriate database provider based on configuration
 */

import { IDatabaseProvider, DatabaseProviderOptions } from './DatabaseProvider.interface';
import { createNexusServDatabaseProvider } from './NexusServDatabaseProvider';
import { createFirebaseDatabaseProvider } from './FirebaseDatabaseProvider';
import { createSupabaseDatabaseProvider } from './SupabaseDatabaseProvider';

/** Database provider type */
export type DatabaseProviderType = 'selfhosted' | 'firebase' | 'supabase';

/** Database provider configuration */
export interface DatabaseProviderConfig {
  type: DatabaseProviderType;
  // NexusServ (self-hosted)
  apiUrl?: string;
  socketUrl?: string;
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
 * Create a database provider based on configuration
 * @param config - Provider configuration
 * @param options - Provider options
 * @returns Database provider instance
 */
export function createDatabaseProvider(
  config: DatabaseProviderConfig,
  options: DatabaseProviderOptions = {}
): IDatabaseProvider {
  switch (config.type) {
    case 'selfhosted':
      if (!config.apiUrl) {
        throw new Error('NexusServ database provider requires apiUrl');
      }
      return createNexusServDatabaseProvider(
        {
          apiUrl: config.apiUrl,
          socketUrl: config.socketUrl,
        },
        options
      );

    case 'firebase':
      if (!config.apiKey || !config.authDomain || !config.projectId) {
        throw new Error('Firebase database provider requires apiKey, authDomain, and projectId');
      }
      return createFirebaseDatabaseProvider(
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
        throw new Error('Supabase database provider requires url and anonKey');
      }
      return createSupabaseDatabaseProvider(
        {
          url: config.url,
          anonKey: config.anonKey,
        },
        options
      );

    default:
      throw new Error(`Unknown database provider type: ${config.type}`);
  }
}

export default createDatabaseProvider;
