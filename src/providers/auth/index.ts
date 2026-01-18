/**
 * Auth Provider exports
 */

// Interface
export type {
  IAuthProvider,
  AuthStateChangeCallback,
  AuthProviderOptions,
} from './AuthProvider.interface';

// Implementations
export { createNexusServAuthProvider } from './NexusServAuthProvider';
export { createFirebaseAuthProvider } from './FirebaseAuthProvider';
export { createSupabaseAuthProvider } from './SupabaseAuthProvider';

// Factory function to create auth provider based on config
export { createAuthProvider } from './AuthProviderFactory';
