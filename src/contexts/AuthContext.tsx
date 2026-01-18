/**
 * Auth Context
 * Provides authentication state and methods throughout the app
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { IAuthProvider } from '../providers/auth';
import { createAuthProvider } from '../providers/auth/AuthProviderFactory';
import { getConfig, getEnabledAuthProviders } from '../config';
import {
  User,
  AuthSession,
  LoginCredentials,
  RegisterData,
  PasswordResetRequest,
  AuthStatus,
  SocialAuthData,
} from '../types/user';
import { ApiResponse, Address } from '../types/common';

/** Saved payment method */
export interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank';
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

/** Auth context value */
export interface AuthContextValue {
  /** Current user */
  user: User | null;
  /** Auth status */
  status: AuthStatus;
  /** Is user authenticated */
  isAuthenticated: boolean;
  /** Is auth loading */
  isLoading: boolean;
  /** Login with credentials */
  login: (credentials: LoginCredentials) => Promise<ApiResponse<AuthSession>>;
  /** Register new user */
  register: (data: RegisterData) => Promise<ApiResponse<AuthSession>>;
  /** Logout */
  logout: () => Promise<void>;
  /** Reset password */
  resetPassword: (request: PasswordResetRequest) => Promise<ApiResponse<void>>;
  /** Update profile */
  updateProfile: (updates: Partial<User>) => Promise<ApiResponse<User>>;
  /** Change password */
  changePassword: (currentPassword: string, newPassword: string) => Promise<ApiResponse<void>>;
  /** Delete account */
  deleteAccount: () => Promise<ApiResponse<void>>;
  /** Social login */
  socialLogin: (data: SocialAuthData) => Promise<ApiResponse<AuthSession>>;
  /** Refresh user data */
  refreshUser: () => Promise<void>;
  /** User addresses */
  addresses: Address[];
  /** Add address */
  addAddress: (address: Omit<Address, 'id'>) => Promise<ApiResponse<Address>>;
  /** Update address */
  updateAddress: (id: string, address: Partial<Address>) => Promise<ApiResponse<Address>>;
  /** Delete address */
  deleteAddress: (id: string) => Promise<ApiResponse<void>>;
  /** Set default address */
  setDefaultAddress: (id: string) => Promise<ApiResponse<void>>;
  /** Saved payment methods */
  paymentMethods: SavedPaymentMethod[];
  /** Add payment method */
  addPaymentMethod: (token: string) => Promise<ApiResponse<SavedPaymentMethod>>;
  /** Delete payment method */
  deletePaymentMethod: (id: string) => Promise<ApiResponse<void>>;
  /** Set default payment method */
  setDefaultPaymentMethod: (id: string) => Promise<ApiResponse<void>>;
}

/** Auth context */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Auth provider props */
interface AuthProviderProps {
  children: ReactNode;
}

/** Auth Provider Component */
export function AuthProvider({ children }: AuthProviderProps) {
  const [authProvider, setAuthProvider] = useState<IAuthProvider | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);

  // Initialize auth provider
  useEffect(() => {
    const initAuth = async () => {
      try {
        const config = getConfig();
        const enabledProviders = getEnabledAuthProviders();

        if (enabledProviders.length === 0) {
          console.warn('No auth providers configured');
          setStatus('unauthenticated');
          return;
        }

        // Use the first enabled auth provider
        const primaryProvider = enabledProviders[0];
        const provider = createAuthProvider(primaryProvider, {
          persistSession: true,
          autoRefresh: true,
        });

        // Initialize provider
        await provider.initialize();

        // Set up auth state listener
        provider.onAuthStateChange((currentUser) => {
          setUser(currentUser);
          setStatus(provider.getAuthStatus());

          // Load user addresses if authenticated
          if (currentUser?.addresses) {
            setAddresses(currentUser.addresses);
          }
        });

        setAuthProvider(provider);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setStatus('unauthenticated');
      }
    };

    initAuth();
  }, []);

  /** Login */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<ApiResponse<AuthSession>> => {
      if (!authProvider) {
        return {
          success: false,
          error: { code: 'NO_PROVIDER', message: 'Auth provider not initialized' },
        };
      }

      const result = await authProvider.login(credentials);
      return result;
    },
    [authProvider]
  );

  /** Register */
  const register = useCallback(
    async (data: RegisterData): Promise<ApiResponse<AuthSession>> => {
      if (!authProvider) {
        return {
          success: false,
          error: { code: 'NO_PROVIDER', message: 'Auth provider not initialized' },
        };
      }

      const result = await authProvider.register(data);
      return result;
    },
    [authProvider]
  );

  /** Logout */
  const logout = useCallback(async (): Promise<void> => {
    if (!authProvider) return;

    await authProvider.logout();
    setAddresses([]);
    setPaymentMethods([]);
  }, [authProvider]);

  /** Reset password */
  const resetPassword = useCallback(
    async (request: PasswordResetRequest): Promise<ApiResponse<void>> => {
      if (!authProvider) {
        return {
          success: false,
          error: { code: 'NO_PROVIDER', message: 'Auth provider not initialized' },
        };
      }

      return authProvider.resetPassword(request);
    },
    [authProvider]
  );

  /** Update profile */
  const updateProfile = useCallback(
    async (updates: Partial<User>): Promise<ApiResponse<User>> => {
      if (!authProvider) {
        return {
          success: false,
          error: { code: 'NO_PROVIDER', message: 'Auth provider not initialized' },
        };
      }

      return authProvider.updateProfile(updates);
    },
    [authProvider]
  );

  /** Change password */
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
      if (!authProvider) {
        return {
          success: false,
          error: { code: 'NO_PROVIDER', message: 'Auth provider not initialized' },
        };
      }

      return authProvider.changePassword(currentPassword, newPassword);
    },
    [authProvider]
  );

  /** Delete account */
  const deleteAccount = useCallback(async (): Promise<ApiResponse<void>> => {
    if (!authProvider) {
      return {
        success: false,
        error: { code: 'NO_PROVIDER', message: 'Auth provider not initialized' },
      };
    }

    return authProvider.deleteAccount();
  }, [authProvider]);

  /** Social login */
  const socialLogin = useCallback(
    async (data: SocialAuthData): Promise<ApiResponse<AuthSession>> => {
      if (!authProvider) {
        return {
          success: false,
          error: { code: 'NO_PROVIDER', message: 'Auth provider not initialized' },
        };
      }

      if (!authProvider.socialLogin) {
        return {
          success: false,
          error: { code: 'NOT_SUPPORTED', message: 'Social login not supported' },
        };
      }

      return authProvider.socialLogin(data);
    },
    [authProvider]
  );

  /** Refresh user data */
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!authProvider) return;

    await authProvider.getCurrentUser();
  }, [authProvider]);

  /** Add address */
  const addAddress = useCallback(
    async (address: Omit<Address, 'id'>): Promise<ApiResponse<Address>> => {
      // Generate temporary ID (in real app, this would come from backend)
      const newAddress: Address = {
        ...address,
        id: Date.now().toString(),
      };

      // If this is the first address or marked as default, update other addresses
      if (address.isDefault || addresses.length === 0) {
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isDefault: false })).concat({ ...newAddress, isDefault: true })
        );
      } else {
        setAddresses((prev) => [...prev, newAddress]);
      }

      // Update user profile with new addresses
      if (authProvider) {
        const updatedAddresses = addresses.concat(newAddress);
        await authProvider.updateProfile({ addresses: updatedAddresses });
      }

      return { success: true, data: newAddress };
    },
    [addresses, authProvider]
  );

  /** Update address */
  const updateAddress = useCallback(
    async (id: string, updates: Partial<Address>): Promise<ApiResponse<Address>> => {
      const addressIndex = addresses.findIndex((a) => a.id === id);
      if (addressIndex === -1) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Address not found' },
        };
      }

      const updatedAddress = { ...addresses[addressIndex], ...updates };

      setAddresses((prev) => {
        const newAddresses = [...prev];
        newAddresses[addressIndex] = updatedAddress;
        return newAddresses;
      });

      // Update user profile
      if (authProvider) {
        const updatedAddresses = [...addresses];
        updatedAddresses[addressIndex] = updatedAddress;
        await authProvider.updateProfile({ addresses: updatedAddresses });
      }

      return { success: true, data: updatedAddress };
    },
    [addresses, authProvider]
  );

  /** Delete address */
  const deleteAddress = useCallback(
    async (id: string): Promise<ApiResponse<void>> => {
      const addressIndex = addresses.findIndex((a) => a.id === id);
      if (addressIndex === -1) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Address not found' },
        };
      }

      const wasDefault = addresses[addressIndex].isDefault;

      setAddresses((prev) => {
        const newAddresses = prev.filter((a) => a.id !== id);
        // If deleted address was default, make first remaining address default
        if (wasDefault && newAddresses.length > 0) {
          newAddresses[0] = { ...newAddresses[0], isDefault: true };
        }
        return newAddresses;
      });

      // Update user profile
      if (authProvider) {
        const updatedAddresses = addresses.filter((a) => a.id !== id);
        await authProvider.updateProfile({ addresses: updatedAddresses });
      }

      return { success: true };
    },
    [addresses, authProvider]
  );

  /** Set default address */
  const setDefaultAddress = useCallback(
    async (id: string): Promise<ApiResponse<void>> => {
      const addressExists = addresses.some((a) => a.id === id);
      if (!addressExists) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Address not found' },
        };
      }

      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );

      // Update user profile
      if (authProvider) {
        const updatedAddresses = addresses.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }));
        await authProvider.updateProfile({ addresses: updatedAddresses });
      }

      return { success: true };
    },
    [addresses, authProvider]
  );

  /** Add payment method */
  const addPaymentMethod = useCallback(
    async (token: string): Promise<ApiResponse<SavedPaymentMethod>> => {
      // In a real app, this would call the payment provider API
      // For now, we'll simulate adding a card
      const newMethod: SavedPaymentMethod = {
        id: Date.now().toString(),
        type: 'card',
        brand: 'Visa',
        last4: token.slice(-4) || '4242',
        expiryMonth: 12,
        expiryYear: new Date().getFullYear() + 3,
        isDefault: paymentMethods.length === 0,
      };

      setPaymentMethods((prev) => {
        if (newMethod.isDefault) {
          return prev.map((m) => ({ ...m, isDefault: false })).concat(newMethod);
        }
        return [...prev, newMethod];
      });

      return { success: true, data: newMethod };
    },
    [paymentMethods]
  );

  /** Delete payment method */
  const deletePaymentMethod = useCallback(
    async (id: string): Promise<ApiResponse<void>> => {
      const methodIndex = paymentMethods.findIndex((m) => m.id === id);
      if (methodIndex === -1) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payment method not found' },
        };
      }

      const wasDefault = paymentMethods[methodIndex].isDefault;

      setPaymentMethods((prev) => {
        const newMethods = prev.filter((m) => m.id !== id);
        if (wasDefault && newMethods.length > 0) {
          newMethods[0] = { ...newMethods[0], isDefault: true };
        }
        return newMethods;
      });

      return { success: true };
    },
    [paymentMethods]
  );

  /** Set default payment method */
  const setDefaultPaymentMethod = useCallback(
    async (id: string): Promise<ApiResponse<void>> => {
      const methodExists = paymentMethods.some((m) => m.id === id);
      if (!methodExists) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payment method not found' },
        };
      }

      setPaymentMethods((prev) =>
        prev.map((m) => ({
          ...m,
          isDefault: m.id === id,
        }))
      );

      return { success: true };
    },
    [paymentMethods]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated' && user !== null,
      isLoading: status === 'loading',
      login,
      register,
      logout,
      resetPassword,
      updateProfile,
      changePassword,
      deleteAccount,
      socialLogin,
      refreshUser,
      addresses,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
      paymentMethods,
      addPaymentMethod,
      deletePaymentMethod,
      setDefaultPaymentMethod,
    }),
    [
      user,
      status,
      login,
      register,
      logout,
      resetPassword,
      updateProfile,
      changePassword,
      deleteAccount,
      socialLogin,
      refreshUser,
      addresses,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
      paymentMethods,
      addPaymentMethod,
      deletePaymentMethod,
      setDefaultPaymentMethod,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook to use auth context */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
