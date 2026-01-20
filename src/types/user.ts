/**
 * User-related types
 */

import { Address, Timestamps } from './common';

/** User role in the system */
export type UserRole = 'customer' | 'admin' | 'vendor' | 'vendeur' | 'client' | 'moderator';

/** User authentication status */
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

/** User profile */
export interface User extends Timestamps {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified?: boolean;
  addresses?: Address[];
  preferences?: UserPreferences;
  metadata?: Record<string, unknown>;
}

/** User preferences */
export interface UserPreferences {
  language?: string;
  currency?: string;
  theme?: 'light' | 'dark' | 'system';
  notifications?: NotificationPreferences;
  newsletter?: boolean;
}

/** Notification preferences */
export interface NotificationPreferences {
  push?: boolean;
  email?: boolean;
  sms?: boolean;
  orderUpdates?: boolean;
  promotions?: boolean;
  newProducts?: boolean;
}

/** Login credentials */
export interface LoginCredentials {
  email?: string;
  userId?: string;
  password: string;
  rememberMe?: boolean;
}

/** Registration data */
export interface RegisterData {
  email: string;
  userId?: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptTerms?: boolean;
  newsletter?: boolean;
}

/** Password reset request */
export interface PasswordResetRequest {
  email: string;
}

/** Password reset confirmation */
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

/** Auth tokens */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

/** Auth session */
export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

/** Social auth provider */
export type SocialAuthProvider = 'google' | 'apple' | 'facebook';

/** Social auth data */
export interface SocialAuthData {
  provider: SocialAuthProvider;
  token: string;
  userData?: Partial<User>;
}
