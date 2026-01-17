/**
 * Supabase Auth Provider
 * Authentication using Supabase Auth SDK
 *
 * Note: Requires @supabase/supabase-js package to be installed:
 * npm install @supabase/supabase-js
 */

import * as SecureStore from 'expo-secure-store';
import {
  IAuthProvider,
  AuthProviderOptions,
  AuthStateChangeCallback,
} from './AuthProvider.interface';
import {
  User,
  AuthSession,
  LoginCredentials,
  RegisterData,
  PasswordResetRequest,
  PasswordResetConfirm,
  SocialAuthData,
  AuthStatus,
} from '../../types/user';
import { ApiResponse, Unsubscribe } from '../../types/common';

/** Storage keys */
const STORAGE_KEYS = {
  SESSION: 'supabase_session',
};

/** Supabase configuration */
interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/** Supabase user type */
interface SupabaseUser {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  user_metadata?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
}

/** Supabase session type */
interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: SupabaseUser;
}

/** Map Supabase user to app user */
const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
  const metadata = supabaseUser.user_metadata || {};

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    firstName: metadata.first_name || undefined,
    lastName: metadata.last_name || undefined,
    displayName: metadata.full_name || undefined,
    avatar: metadata.avatar_url || undefined,
    phone: supabaseUser.phone || undefined,
    role: 'customer',
    isEmailVerified: !!supabaseUser.email_confirmed_at,
    isPhoneVerified: !!supabaseUser.phone_confirmed_at,
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
  };
};

/** Create Supabase Auth Provider */
export function createSupabaseAuthProvider(
  config: SupabaseConfig,
  options: AuthProviderOptions = {}
): IAuthProvider {
  const { persistSession = true } = options;
  const { url, anonKey } = config;

  let supabaseClient: unknown = null;
  let currentUser: User | null = null;
  let authStatus: AuthStatus = 'loading';
  let supabaseUnsubscribe: (() => void) | null = null;
  let ready = false;
  const listeners: Set<AuthStateChangeCallback> = new Set();

  /** Notify all listeners of auth state change */
  const notifyListeners = () => {
    listeners.forEach((callback) => callback(currentUser));
  };

  /** Set auth status */
  const setAuthStatus = (status: AuthStatus) => {
    authStatus = status;
  };

  /** Custom storage adapter for Supabase */
  const createStorageAdapter = () => ({
    getItem: async (key: string): Promise<string | null> => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error('Failed to save to storage:', error);
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error('Failed to remove from storage:', error);
      }
    },
  });

  /** Initialize Supabase client */
  const initializeSupabase = async () => {
    if (supabaseClient) return supabaseClient;

    try {
      const { createClient } = await import('@supabase/supabase-js');

      supabaseClient = createClient(url, anonKey, {
        auth: {
          storage: persistSession ? createStorageAdapter() : undefined,
          autoRefreshToken: true,
          persistSession,
          detectSessionInUrl: false,
        },
      });

      return supabaseClient;
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      throw new Error('Supabase SDK not installed. Run: npm install @supabase/supabase-js');
    }
  };

  /** Get Supabase auth client */
  const getAuth = async () => {
    const client = await initializeSupabase();
    return (client as { auth: unknown }).auth;
  };

  const provider: IAuthProvider = {
    name: 'supabase',
    type: 'auth',

    async initialize(): Promise<void> {
      setAuthStatus('loading');

      try {
        const auth = await getAuth() as {
          getSession: () => Promise<{ data: { session: SupabaseSession | null } }>;
          onAuthStateChange: (callback: (event: string, session: SupabaseSession | null) => void) => { data: { subscription: { unsubscribe: () => void } } };
        };

        // Get current session
        const { data: { session } } = await auth.getSession();

        if (session) {
          currentUser = mapSupabaseUser(session.user);
          setAuthStatus('authenticated');
        } else {
          setAuthStatus('unauthenticated');
        }

        // Set up auth state listener
        const { data: { subscription } } = auth.onAuthStateChange(
          (_event: string, session: SupabaseSession | null) => {
            if (session) {
              currentUser = mapSupabaseUser(session.user);
              setAuthStatus('authenticated');
            } else {
              currentUser = null;
              setAuthStatus('unauthenticated');
            }
            notifyListeners();
          }
        );

        supabaseUnsubscribe = () => subscription.unsubscribe();
        ready = true;
        notifyListeners();
      } catch (error) {
        setAuthStatus('unauthenticated');
        ready = true;
        notifyListeners();
      }
    },

    isReady(): boolean {
      return ready;
    },

    async dispose(): Promise<void> {
      if (supabaseUnsubscribe) {
        supabaseUnsubscribe();
        supabaseUnsubscribe = null;
      }
      listeners.clear();
      currentUser = null;
      supabaseClient = null;
      ready = false;
    },

    async login(credentials: LoginCredentials): Promise<ApiResponse<AuthSession>> {
      try {
        const auth = await getAuth() as {
          signInWithPassword: (opts: { email: string; password: string }) => Promise<{ data: { session: SupabaseSession | null; user: SupabaseUser | null }; error: { message: string; code?: string } | null }>;
        };

        const { data, error } = await auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) {
          return {
            success: false,
            error: {
              code: error.code || 'AUTH_ERROR',
              message: getSupabaseErrorMessage(error.message),
            },
          };
        }

        if (!data.session || !data.user) {
          return {
            success: false,
            error: {
              code: 'NO_SESSION',
              message: 'Connexion échouée',
            },
          };
        }

        const user = mapSupabaseUser(data.user);
        currentUser = user;
        setAuthStatus('authenticated');
        notifyListeners();

        return {
          success: true,
          data: {
            user,
            tokens: {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresIn: data.session.expires_in,
              tokenType: data.session.token_type,
            },
          },
        };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: err.message,
          },
        };
      }
    },

    async register(data: RegisterData): Promise<ApiResponse<AuthSession>> {
      try {
        const auth = await getAuth() as {
          signUp: (opts: {
            email: string;
            password: string;
            options?: { data?: Record<string, unknown> };
          }) => Promise<{ data: { session: SupabaseSession | null; user: SupabaseUser | null }; error: { message: string; code?: string } | null }>;
        };

        const { data: authData, error } = await auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
              full_name: [data.firstName, data.lastName].filter(Boolean).join(' '),
            },
          },
        });

        if (error) {
          return {
            success: false,
            error: {
              code: error.code || 'REGISTER_ERROR',
              message: getSupabaseErrorMessage(error.message),
            },
          };
        }

        if (!authData.user) {
          return {
            success: false,
            error: {
              code: 'NO_USER',
              message: 'Inscription échouée',
            },
          };
        }

        const user = mapSupabaseUser(authData.user);
        currentUser = user;

        // Supabase may not return a session if email confirmation is required
        if (authData.session) {
          setAuthStatus('authenticated');
          notifyListeners();

          return {
            success: true,
            data: {
              user,
              tokens: {
                accessToken: authData.session.access_token,
                refreshToken: authData.session.refresh_token,
                expiresIn: authData.session.expires_in,
                tokenType: authData.session.token_type,
              },
            },
          };
        }

        // Email confirmation required
        return {
          success: true,
          data: {
            user,
            tokens: {
              accessToken: '',
            },
          },
        };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'REGISTER_ERROR',
            message: err.message,
          },
        };
      }
    },

    async logout(): Promise<ApiResponse<void>> {
      try {
        const auth = await getAuth() as {
          signOut: () => Promise<{ error: { message: string } | null }>;
        };

        const { error } = await auth.signOut();

        if (error) {
          console.error('Logout error:', error);
        }

        currentUser = null;
        setAuthStatus('unauthenticated');
        notifyListeners();

        return { success: true };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'LOGOUT_ERROR',
            message: err.message,
          },
        };
      }
    },

    async getCurrentUser(): Promise<ApiResponse<User | null>> {
      try {
        const auth = await getAuth() as {
          getUser: () => Promise<{ data: { user: SupabaseUser | null }; error: { message: string } | null }>;
        };

        const { data: { user }, error } = await auth.getUser();

        if (error || !user) {
          return { success: true, data: null };
        }

        const mappedUser = mapSupabaseUser(user);
        currentUser = mappedUser;
        return { success: true, data: mappedUser };
      } catch (error) {
        return { success: true, data: currentUser };
      }
    },

    async resetPassword(request: PasswordResetRequest): Promise<ApiResponse<void>> {
      try {
        const auth = await getAuth() as {
          resetPasswordForEmail: (email: string) => Promise<{ error: { message: string } | null }>;
        };

        const { error } = await auth.resetPasswordForEmail(request.email);

        if (error) {
          return {
            success: false,
            error: {
              code: 'RESET_ERROR',
              message: getSupabaseErrorMessage(error.message),
            },
          };
        }

        return { success: true };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'RESET_ERROR',
            message: err.message,
          },
        };
      }
    },

    async confirmResetPassword(confirm: PasswordResetConfirm): Promise<ApiResponse<void>> {
      try {
        const auth = await getAuth() as {
          updateUser: (opts: { password: string }) => Promise<{ error: { message: string } | null }>;
        };

        // In Supabase, the reset token is exchanged via URL redirect
        // This method is called after the user clicks the reset link
        const { error } = await auth.updateUser({ password: confirm.newPassword });

        if (error) {
          return {
            success: false,
            error: {
              code: 'RESET_ERROR',
              message: getSupabaseErrorMessage(error.message),
            },
          };
        }

        return { success: true };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'RESET_ERROR',
            message: err.message,
          },
        };
      }
    },

    async refreshToken(): Promise<ApiResponse<AuthSession>> {
      try {
        const auth = await getAuth() as {
          refreshSession: () => Promise<{ data: { session: SupabaseSession | null; user: SupabaseUser | null }; error: { message: string } | null }>;
        };

        const { data, error } = await auth.refreshSession();

        if (error || !data.session || !data.user) {
          return {
            success: false,
            error: {
              code: 'REFRESH_ERROR',
              message: error?.message || 'Impossible de rafraîchir la session',
            },
          };
        }

        const user = mapSupabaseUser(data.user);
        currentUser = user;
        notifyListeners();

        return {
          success: true,
          data: {
            user,
            tokens: {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresIn: data.session.expires_in,
              tokenType: data.session.token_type,
            },
          },
        };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'REFRESH_ERROR',
            message: err.message,
          },
        };
      }
    },

    async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
      try {
        const auth = await getAuth() as {
          updateUser: (opts: { email?: string; data?: Record<string, unknown> }) => Promise<{ data: { user: SupabaseUser | null }; error: { message: string } | null }>;
        };

        const updateData: Record<string, unknown> = {};

        if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
        if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
        if (updates.displayName !== undefined) updateData.full_name = updates.displayName;
        if (updates.avatar !== undefined) updateData.avatar_url = updates.avatar;

        const updateOptions: { email?: string; data?: Record<string, unknown> } = {};
        if (updates.email) updateOptions.email = updates.email;
        if (Object.keys(updateData).length > 0) updateOptions.data = updateData;

        const { data, error } = await auth.updateUser(updateOptions);

        if (error || !data.user) {
          return {
            success: false,
            error: {
              code: 'UPDATE_ERROR',
              message: error?.message || 'Mise à jour échouée',
            },
          };
        }

        const user = mapSupabaseUser(data.user);
        currentUser = user;
        notifyListeners();

        return { success: true, data: user };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: err.message,
          },
        };
      }
    },

    async changePassword(
      _currentPassword: string,
      newPassword: string
    ): Promise<ApiResponse<void>> {
      try {
        const auth = await getAuth() as {
          updateUser: (opts: { password: string }) => Promise<{ error: { message: string } | null }>;
        };

        // Note: Supabase doesn't require current password verification
        // for password change when user is already authenticated
        const { error } = await auth.updateUser({ password: newPassword });

        if (error) {
          return {
            success: false,
            error: {
              code: 'PASSWORD_ERROR',
              message: getSupabaseErrorMessage(error.message),
            },
          };
        }

        return { success: true };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'PASSWORD_ERROR',
            message: err.message,
          },
        };
      }
    },

    async deleteAccount(): Promise<ApiResponse<void>> {
      // Note: Supabase doesn't have a built-in method for users to delete their own accounts
      // This needs to be implemented via a serverless function or backend API
      return {
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'La suppression de compte nécessite une action administrative',
        },
      };
    },

    async socialLogin(data: SocialAuthData): Promise<ApiResponse<AuthSession>> {
      try {
        const auth = await getAuth() as {
          signInWithIdToken: (opts: {
            provider: string;
            token: string;
          }) => Promise<{ data: { session: SupabaseSession | null; user: SupabaseUser | null }; error: { message: string } | null }>;
        };

        const providerMap: Record<string, string> = {
          google: 'google',
          apple: 'apple',
          facebook: 'facebook',
        };

        const supabaseProvider = providerMap[data.provider];
        if (!supabaseProvider) {
          return {
            success: false,
            error: {
              code: 'UNSUPPORTED_PROVIDER',
              message: `Le provider ${data.provider} n'est pas supporté`,
            },
          };
        }

        const { data: authData, error } = await auth.signInWithIdToken({
          provider: supabaseProvider,
          token: data.token,
        });

        if (error || !authData.session || !authData.user) {
          return {
            success: false,
            error: {
              code: 'SOCIAL_LOGIN_ERROR',
              message: error?.message || 'Connexion sociale échouée',
            },
          };
        }

        const user = mapSupabaseUser(authData.user);
        currentUser = user;
        setAuthStatus('authenticated');
        notifyListeners();

        return {
          success: true,
          data: {
            user,
            tokens: {
              accessToken: authData.session.access_token,
              refreshToken: authData.session.refresh_token,
              expiresIn: authData.session.expires_in,
              tokenType: authData.session.token_type,
            },
          },
        };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'SOCIAL_LOGIN_ERROR',
            message: err.message,
          },
        };
      }
    },

    async verifyEmail(): Promise<ApiResponse<void>> {
      // Email verification in Supabase is handled automatically via email links
      return { success: true };
    },

    async sendEmailVerification(): Promise<ApiResponse<void>> {
      try {
        const auth = await getAuth() as {
          resend: (opts: { type: string; email: string }) => Promise<{ error: { message: string } | null }>;
        };

        if (!currentUser?.email) {
          return {
            success: false,
            error: {
              code: 'NO_EMAIL',
              message: 'Aucune adresse email associée au compte',
            },
          };
        }

        const { error } = await auth.resend({
          type: 'signup',
          email: currentUser.email,
        });

        if (error) {
          return {
            success: false,
            error: {
              code: 'VERIFICATION_ERROR',
              message: error.message,
            },
          };
        }

        return { success: true };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'VERIFICATION_ERROR',
            message: err.message,
          },
        };
      }
    },

    getAuthStatus(): AuthStatus {
      return authStatus;
    },

    onAuthStateChange(callback: AuthStateChangeCallback): Unsubscribe {
      listeners.add(callback);
      callback(currentUser);

      return () => {
        listeners.delete(callback);
      };
    },

    isAuthenticated(): boolean {
      return authStatus === 'authenticated' && currentUser !== null;
    },
  };

  return provider;
}

/** Map Supabase error messages to user-friendly messages */
function getSupabaseErrorMessage(message: string): string {
  const messageMap: Record<string, string> = {
    'Invalid login credentials': 'Identifiants incorrects',
    'Email not confirmed': 'Veuillez confirmer votre adresse email',
    'User already registered': 'Cette adresse email est déjà utilisée',
    'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
    'Unable to validate email address: invalid format': 'Format d\'email invalide',
    'For security purposes, you can only request this once every 60 seconds': 'Veuillez patienter 60 secondes avant de réessayer',
  };

  return messageMap[message] || message;
}

export default createSupabaseAuthProvider;
