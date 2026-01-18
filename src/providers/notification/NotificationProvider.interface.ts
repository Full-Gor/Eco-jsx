/**
 * Notification Provider Interface
 * Defines the contract for all notification providers
 */

import { ApiResponse, Callback, Unsubscribe } from '../../types/common';
import { BaseProvider } from '../types';

/** Notification priority */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/** Notification */
export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  priority?: NotificationPriority;
  topic?: string;
  sentAt?: Date | string;
  readAt?: Date | string;
  isRead?: boolean;
}

/** Send notification options */
export interface SendNotificationOptions {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  priority?: NotificationPriority;
  sound?: string;
  badge?: number;
  channelId?: string;
  collapseKey?: string;
  ttl?: number;
}

/** Send to user options */
export interface SendToUserOptions extends SendNotificationOptions {
  userId: string;
}

/** Send to topic options */
export interface SendToTopicOptions extends SendNotificationOptions {
  topic: string;
}

/** Send to token options */
export interface SendToTokenOptions extends SendNotificationOptions {
  token: string;
}

/** Notification received callback */
export type NotificationReceivedCallback = Callback<Notification>;

/** Notification interaction callback */
export type NotificationInteractionCallback = Callback<{
  notification: Notification;
  actionId?: string;
}>;

/** Push token callback */
export type PushTokenCallback = Callback<string>;

/** Notification permission status */
export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined';

/** Notification provider interface */
export interface INotificationProvider extends BaseProvider {
  /**
   * Send notification to a specific user
   * @param options - Send options with userId
   * @returns Promise with notification result
   */
  sendToUser(options: SendToUserOptions): Promise<ApiResponse<void>>;

  /**
   * Send notification to a topic
   * @param options - Send options with topic
   * @returns Promise with notification result
   */
  sendToTopic(options: SendToTopicOptions): Promise<ApiResponse<void>>;

  /**
   * Send notification to a device token
   * @param options - Send options with token
   * @returns Promise with notification result
   */
  sendToToken(options: SendToTokenOptions): Promise<ApiResponse<void>>;

  /**
   * Subscribe to a topic
   * @param topic - Topic name
   * @returns Promise with success status
   */
  subscribe(topic: string): Promise<ApiResponse<void>>;

  /**
   * Unsubscribe from a topic
   * @param topic - Topic name
   * @returns Promise with success status
   */
  unsubscribe(topic: string): Promise<ApiResponse<void>>;

  /**
   * Get push token
   * @returns Promise with push token
   */
  getToken(): Promise<ApiResponse<string>>;

  /**
   * Register device for push notifications
   * @param userId - User ID to associate with device
   * @returns Promise with success status
   */
  registerDevice(userId: string): Promise<ApiResponse<void>>;

  /**
   * Unregister device from push notifications
   * @returns Promise with success status
   */
  unregisterDevice(): Promise<ApiResponse<void>>;

  /**
   * Request notification permissions
   * @returns Promise with permission status
   */
  requestPermissions(): Promise<ApiResponse<NotificationPermissionStatus>>;

  /**
   * Check notification permissions
   * @returns Promise with current permission status
   */
  checkPermissions(): Promise<ApiResponse<NotificationPermissionStatus>>;

  /**
   * Get notification history
   * @param limit - Maximum number of notifications
   * @returns Promise with array of notifications
   */
  getHistory(limit?: number): Promise<ApiResponse<Notification[]>>;

  /**
   * Mark notification as read
   * @param notificationId - Notification ID
   * @returns Promise with success status
   */
  markAsRead(notificationId: string): Promise<ApiResponse<void>>;

  /**
   * Mark all notifications as read
   * @returns Promise with success status
   */
  markAllAsRead(): Promise<ApiResponse<void>>;

  /**
   * Get unread notification count
   * @returns Promise with count
   */
  getUnreadCount(): Promise<ApiResponse<number>>;

  /**
   * Listen for incoming notifications
   * @param callback - Notification received callback
   * @returns Unsubscribe function
   */
  onNotificationReceived(callback: NotificationReceivedCallback): Unsubscribe;

  /**
   * Listen for notification interactions
   * @param callback - Interaction callback
   * @returns Unsubscribe function
   */
  onNotificationInteraction(callback: NotificationInteractionCallback): Unsubscribe;

  /**
   * Listen for push token changes
   * @param callback - Token callback
   * @returns Unsubscribe function
   */
  onTokenRefresh(callback: PushTokenCallback): Unsubscribe;

  /**
   * Set badge count (iOS)
   * @param count - Badge count
   * @returns Promise with success status
   */
  setBadgeCount?(count: number): Promise<ApiResponse<void>>;

  /**
   * Clear all notifications
   * @returns Promise with success status
   */
  clearAll?(): Promise<ApiResponse<void>>;
}

/** Notification provider options */
export interface NotificationProviderOptions {
  /** Request permissions on init */
  requestPermissionsOnInit?: boolean;

  /** Default channel ID (Android) */
  defaultChannelId?: string;

  /** Default sound */
  defaultSound?: string;

  /** Foreground presentation options (iOS) */
  foregroundPresentationOptions?: {
    alert?: boolean;
    badge?: boolean;
    sound?: boolean;
  };
}
