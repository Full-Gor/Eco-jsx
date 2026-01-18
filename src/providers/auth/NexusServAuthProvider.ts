/**
 * NexusServ Auth Provider
 * Self-hosted authentication using JWT tokens
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
  AuthTokens,
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
  ACCESS_TOKEN: 'nexus_access_token',
  REFRESH_TOKEN: 'nexus_refresh_token',
  USER: 'nexus_user',
};

/** NexusServ API configuration */
interface NexusServConfig {
  apiUrl: string;
  timeout?: number;
}

/** Create NexusServ Auth Provider */
export function createNexusServAuthProvider(
  config: NexusServConfig,
  options: AuthProviderOptions = {}
): IAuthProvider {
  const {
    persistSession = true,
    autoRefresh = true,
    storageKey = 'nexus_auth',
  } = options;

  const { apiUrl, timeout = 30000 } = config;

  let currentUser: User | null = null;
  let currentTokens: AuthTokens | null = null;
  let authStatus: AuthStatus = 'loading';
  let refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let ready = false;
  const listeners: Set<AuthStateChangeCallback> = new Set();

  /** Notify all listeners of auth state change */
  const notifyListeners = () => {
    listeners.forEach((callback) => callback(currentUser));
  };

  /** Set auth status and notify */
  const setAuthStatus = (status: AuthStatus) => {
    authStatus = status;
  };

  /** Make API request */
  const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const url = `${apiUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (currentTokens?.accessToken) {
      headers['Authorization'] = `Bearer ${currentTokens.accessToken}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code || 'API_ERROR',
            message: data.message || 'An error occurred',
            details: data.details,
          },
        };
      }

      // Handle different server response formats
      // Format 1: { data: { user, tokens } }
      // Format 2: { user, token } or { user, accessToken }
      // Format 3: { success, user, token }
      let responseData = data.data || data;

      // Normalize token format if needed
      if (responseData.token && !responseData.tokens) {
        responseData = {
          ...responseData,
          tokens: {
            accessToken: responseData.token || responseData.accessToken,
            refreshToken: responseData.refreshToken,
            expiresIn: responseData.expiresIn || 3600,
          },
        };
      }

      if (responseData.accessToken && !responseData.tokens) {
        responseData = {
          ...responseData,
          tokens: {
            accessToken: responseData.accessToken,
            refreshToken: responseData.refreshToken,
            expiresIn: responseData.expiresIn || 3600,
          },
        };
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: {
          code: err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
          message: err.name === 'AbortError' ? 'Request timed out' : err.message,
        },
      };
    }
  };

  /** Save session to secure storage */
  const saveSession = async (session: AuthSession) => {
    if (!persistSession) return;

    try {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.ACCESS_TOKEN,
        session.tokens.accessToken
      );
      if (session.tokens.refreshToken) {
        await SecureStore.setItemAsync(
          STORAGE_KEYS.REFRESH_TOKEN,
          session.tokens.refreshToken
        );
      }
      await SecureStore.setItemAsync(
        STORAGE_KEYS.USER,
        JSON.stringify(session.user)
      );
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  /** Clear session from secure storage */
  const clearSession = async () => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  /** Load session from secure storage */
  const loadSession = async (): Promise<AuthSession | null> => {
    if (!persistSession) return null;

    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      const userJson = await SecureStore.getItemAsync(STORAGE_KEYS.USER);

      if (!accessToken || !userJson) return null;

      const user = JSON.parse(userJson) as User;
      const tokens: AuthTokens = {
        accessToken,
        refreshToken: refreshToken || undefined,
      };

      return { user, tokens };
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  };

  /** Schedule token refresh */
  const scheduleRefresh = (expiresIn?: number) => {
    if (!autoRefresh || !expiresIn) return;

    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
    }

    // Refresh 5 minutes before expiry
    const refreshTime = Math.max((expiresIn - 300) * 1000, 60000);
    refreshTimeoutId = setTimeout(async () => {
      await provider.refreshToken();
    }, refreshTime);
  };

  const provider: IAuthProvider = {
    name: 'nexusserv',
    type: 'auth',

    async initialize(): Promise<void> {
      setAuthStatus('loading');

      const session = await loadSession();
      if (session) {
        currentUser = session.user;
        currentTokens = session.tokens;

        // Validate session with server
        const result = await this.getCurrentUser();
        if (result.success && result.data) {
          currentUser = result.data;
          setAuthStatus('authenticated');
          scheduleRefresh(session.tokens.expiresIn);
        } else {
          // Session invalid, try refresh
          const refreshResult = await this.refreshToken();
          if (!refreshResult.success) {
            await clearSession();
            currentUser = null;
            currentTokens = null;
            setAuthStatus('unauthenticated');
          }
        }
      } else {
        setAuthStatus('unauthenticated');
      }

      ready = true;
      notifyListeners();
    },

    isReady(): boolean {
      return ready;
    },

    async dispose(): Promise<void> {
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
        refreshTimeoutId = null;
      }
      listeners.clear();
      currentUser = null;
      currentTokens = null;
      ready = false;
    },

    async login(credentials: LoginCredentials): Promise<ApiResponse<AuthSession>> {
      // Transform credentials to match server format
      // Server expects: { userId, password } or { email, password }
      const serverCredentials = {
        userId: credentials.email || credentials.userId,
        email: credentials.email,
        password: credentials.password,
      };

      const result = await apiRequest<AuthSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(serverCredentials),
      });

      if (result.success && result.data) {
        currentUser = result.data.user;
        currentTokens = result.data.tokens;
        setAuthStatus('authenticated');
        await saveSession(result.data);
        scheduleRefresh(result.data.tokens.expiresIn);
        notifyListeners();
      }

      return result;
    },

    async register(data: RegisterData): Promise<ApiResponse<AuthSession>> {
      const result = await apiRequest<AuthSession>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (result.success && result.data) {
        currentUser = result.data.user;
        currentTokens = result.data.tokens;
        setAuthStatus('authenticated');
        await saveSession(result.data);
        scheduleRefresh(result.data.tokens.expiresIn);
        notifyListeners();
      }

      return result;
    },

    async logout(): Promise<ApiResponse<void>> {
      const result = await apiRequest<void>('/auth/logout', {
        method: 'POST',
      });

      // Clear local state regardless of API result
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
        refreshTimeoutId = null;
      }

      currentUser = null;
      currentTokens = null;
      setAuthStatus('unauthenticated');
      await clearSession();
      notifyListeners();

      return { success: true };
    },

    async getCurrentUser(): Promise<ApiResponse<User | null>> {
      if (!currentTokens?.accessToken) {
        return { success: true, data: null };
      }

      const result = await apiRequest<User>('/auth/me');

      if (result.success && result.data) {
        currentUser = result.data;
        notifyListeners();
      }

      return result as ApiResponse<User | null>;
    },

    async resetPassword(request: PasswordResetRequest): Promise<ApiResponse<void>> {
      return apiRequest<void>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    },

    async confirmResetPassword(confirm: PasswordResetConfirm): Promise<ApiResponse<void>> {
      return apiRequest<void>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(confirm),
      });
    },

    async refreshToken(): Promise<ApiResponse<AuthSession>> {
      if (!currentTokens?.refreshToken) {
        return {
          success: false,
          error: {
            code: 'NO_REFRESH_TOKEN',
            message: 'No refresh token available',
          },
        };
      }

      const result = await apiRequest<AuthSession>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
      });

      if (result.success && result.data) {
        currentUser = result.data.user;
        currentTokens = result.data.tokens;
        setAuthStatus('authenticated');
        await saveSession(result.data);
        scheduleRefresh(result.data.tokens.expiresIn);
        notifyListeners();
      } else {
        // Refresh failed, logout
        await this.logout();
      }

      return result;
    },

    async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
      const result = await apiRequest<User>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      if (result.success && result.data) {
        currentUser = result.data;
        if (currentTokens) {
          await saveSession({ user: result.data, tokens: currentTokens });
        }
        notifyListeners();
      }

      return result;
    },

    async changePassword(
      currentPassword: string,
      newPassword: string
    ): Promise<ApiResponse<void>> {
      return apiRequest<void>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },

    async deleteAccount(): Promise<ApiResponse<void>> {
      const result = await apiRequest<void>('/auth/account', {
        method: 'DELETE',
      });

      if (result.success) {
        await this.logout();
      }

      return result;
    },

    async socialLogin(data: SocialAuthData): Promise<ApiResponse<AuthSession>> {
      const result = await apiRequest<AuthSession>('/auth/social', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (result.success && result.data) {
        currentUser = result.data.user;
        currentTokens = result.data.tokens;
        setAuthStatus('authenticated');
        await saveSession(result.data);
        scheduleRefresh(result.data.tokens.expiresIn);
        notifyListeners();
      }

      return result;
    },

    async verifyEmail(token: string): Promise<ApiResponse<void>> {
      return apiRequest<void>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    },

    async sendEmailVerification(): Promise<ApiResponse<void>> {
      return apiRequest<void>('/auth/send-verification', {
        method: 'POST',
      });
    },

    getAuthStatus(): AuthStatus {
      return authStatus;
    },

    onAuthStateChange(callback: AuthStateChangeCallback): Unsubscribe {
      listeners.add(callback);
      // Immediately call with current state
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

export default createNexusServAuthProvider;
