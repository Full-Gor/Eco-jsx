/**
 * Auth Provider Factory
 * Creates the appropriate auth provider based on configuration
 */

import { AuthProviderConfig } from '../../types/config';
import { IAuthProvider, AuthProviderOptions } from './AuthProvider.interface';
import { createNexusServAuthProvider } from './NexusServAuthProvider';
import { createFirebaseAuthProvider } from './FirebaseAuthProvider';
import { createSupabaseAuthProvider } from './SupabaseAuthProvider';

/**
 * Create an auth provider based on configuration
 * @param config - Auth provider configuration
 * @param options - Provider options
 * @returns Auth provider instance
 */
export function createAuthProvider(
  config: AuthProviderConfig,
  options: AuthProviderOptions = {}
): IAuthProvider {
  switch (config.type) {
    case 'selfhosted':
      return createNexusServAuthProvider(
        { apiUrl: config.apiUrl },
        options
      );

    case 'firebase':
      return createFirebaseAuthProvider(
        {
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
        },
        options
      );

    case 'supabase':
      return createSupabaseAuthProvider(
        {
          url: config.url,
          anonKey: config.anonKey,
        },
        options
      );

    case 'auth0':
      // Auth0 provider not yet implemented
      throw new Error('Auth0 provider not yet implemented');

    case 'clerk':
      // Clerk provider not yet implemented
      throw new Error('Clerk provider not yet implemented');

    default:
      throw new Error(`Unknown auth provider type: ${(config as { type: string }).type}`);
  }
}

export default createAuthProvider;
