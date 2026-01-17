/**
 * Auth Provider Interface
 * Defines the contract for all authentication providers
 */

import { ApiResponse, Callback, Unsubscribe } from '../../types/common';
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
import { BaseProvider } from '../types';

/** Auth state change callback */
export type AuthStateChangeCallback = Callback<User | null>;

/** Auth provider interface */
export interface IAuthProvider extends BaseProvider {
  /**
   * Login with email and password
   * @param credentials - Login credentials
   * @returns Promise with auth session
   */
  login(credentials: LoginCredentials): Promise<ApiResponse<AuthSession>>;

  /**
   * Register a new user
   * @param data - Registration data
   * @returns Promise with auth session
   */
  register(data: RegisterData): Promise<ApiResponse<AuthSession>>;

  /**
   * Logout current user
   * @returns Promise with success status
   */
  logout(): Promise<ApiResponse<void>>;

  /**
   * Get current authenticated user
   * @returns Promise with current user or null
   */
  getCurrentUser(): Promise<ApiResponse<User | null>>;

  /**
   * Request password reset
   * @param request - Password reset request
   * @returns Promise with success status
   */
  resetPassword(request: PasswordResetRequest): Promise<ApiResponse<void>>;

  /**
   * Confirm password reset with token
   * @param confirm - Password reset confirmation
   * @returns Promise with success status
   */
  confirmResetPassword(confirm: PasswordResetConfirm): Promise<ApiResponse<void>>;

  /**
   * Refresh authentication token
   * @returns Promise with new auth session
   */
  refreshToken(): Promise<ApiResponse<AuthSession>>;

  /**
   * Update user profile
   * @param updates - Partial user updates
   * @returns Promise with updated user
   */
  updateProfile(updates: Partial<User>): Promise<ApiResponse<User>>;

  /**
   * Change password
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Promise with success status
   */
  changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>>;

  /**
   * Delete user account
   * @returns Promise with success status
   */
  deleteAccount(): Promise<ApiResponse<void>>;

  /**
   * Login with social provider
   * @param data - Social auth data
   * @returns Promise with auth session
   */
  socialLogin?(data: SocialAuthData): Promise<ApiResponse<AuthSession>>;

  /**
   * Verify email with token
   * @param token - Verification token
   * @returns Promise with success status
   */
  verifyEmail?(token: string): Promise<ApiResponse<void>>;

  /**
   * Send email verification
   * @returns Promise with success status
   */
  sendEmailVerification?(): Promise<ApiResponse<void>>;

  /**
   * Get current auth status
   * @returns Current auth status
   */
  getAuthStatus(): AuthStatus;

  /**
   * Subscribe to auth state changes
   * @param callback - Callback for auth state changes
   * @returns Unsubscribe function
   */
  onAuthStateChange(callback: AuthStateChangeCallback): Unsubscribe;

  /**
   * Check if user is authenticated
   * @returns True if authenticated
   */
  isAuthenticated(): boolean;
}

/** Auth provider configuration */
export interface AuthProviderOptions {
  /** Persist session to storage */
  persistSession?: boolean;

  /** Auto refresh token before expiry */
  autoRefresh?: boolean;

  /** Session storage key */
  storageKey?: string;
}
