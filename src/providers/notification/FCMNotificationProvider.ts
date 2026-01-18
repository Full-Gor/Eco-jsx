/**
 * Firebase Cloud Messaging (FCM) Notification Provider
 * Uses expo-notifications for cross-platform support
 */

import { ApiResponse, Unsubscribe } from '../../types/common';
import { BaseProvider } from '../types';
import {
  INotificationProvider,
  Notification,
  NotificationPermissionStatus,
  NotificationReceivedCallback,
  NotificationInteractionCallback,
  PushTokenCallback,
  SendToUserOptions,
  SendToTopicOptions,
  SendToTokenOptions,
} from './NotificationProvider.interface';

// Dynamic imports for expo-notifications
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

/** FCM configuration */
export interface FCMConfig {
  /** Firebase project ID */
  projectId?: string;
  /** Server key for sending (optional, typically server-side) */
  serverKey?: string;
  /** API URL for backend notification service */
  apiUrl?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Android channel configuration */
  androidChannel?: {
    id: string;
    name: string;
    importance?: number;
    vibrationPattern?: number[];
    lightColor?: string;
  };
}

/** Create FCM notification provider */
export async function createFCMNotificationProvider(
  config: FCMConfig
): Promise<INotificationProvider> {
  // Dynamically import expo-notifications
  try {
    Notifications = await import('expo-notifications');
    Device = await import('expo-device');
  } catch (err) {
    console.warn('expo-notifications not available:', err);
  }

  const receivedCallbacks: Set<NotificationReceivedCallback> = new Set();
  const interactionCallbacks: Set<NotificationInteractionCallback> = new Set();
  const tokenCallbacks: Set<PushTokenCallback> = new Set();

  let isInitialized = false;
  let expoPushToken: string | null = null;
  let currentUserId: string | null = null;
  const notificationHistory: Notification[] = [];
  const maxHistorySize = 100;
  const subscriptions: Array<{ remove: () => void }> = [];

  const log = (...args: unknown[]) => {
    if (config.debug) {
      console.log('[FCMProvider]', ...args);
    }
  };

  /** Convert expo notification to our Notification type */
  const toNotification = (
    notification: import('expo-notifications').Notification
  ): Notification => ({
    id: notification.request.identifier,
    title: notification.request.content.title || '',
    body: notification.request.content.body || '',
    data: notification.request.content.data as Record<string, unknown>,
    imageUrl: notification.request.content.data?.imageUrl as string | undefined,
    sentAt: new Date(notification.date).toISOString(),
    isRead: false,
  });

  /** Register for push notifications */
  const registerForPushNotifications = async (): Promise<string | null> => {
    if (!Notifications || !Device) {
      log('Notifications module not available');
      return null;
    }

    if (!Device.isDevice) {
      log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      log('Permission not granted');
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: config.projectId,
      });
      return tokenData.data;
    } catch (err) {
      log('Error getting push token:', err);
      return null;
    }
  };

  /** Setup notification channel (Android) */
  const setupNotificationChannel = async () => {
    if (!Notifications) return;

    const channelConfig = config.androidChannel || {
      id: 'default',
      name: 'Default notifications',
      importance: Notifications.AndroidImportance?.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    };

    await Notifications.setNotificationChannelAsync(channelConfig.id, {
      name: channelConfig.name,
      importance: channelConfig.importance || Notifications.AndroidImportance?.MAX,
      vibrationPattern: channelConfig.vibrationPattern,
      lightColor: channelConfig.lightColor,
    });
  };

  /** Send notification via API */
  const sendViaAPI = async (
    endpoint: string,
    payload: Record<string, unknown>
  ): Promise<void> => {
    if (!config.apiUrl) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${config.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.serverKey && { Authorization: `key=${config.serverKey}` }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  };

  const provider: INotificationProvider = {
    name: 'fcm',
    type: 'notification',

    isReady(): boolean {
      return isInitialized;
    },

    async initialize(): Promise<void> {
      log('Initializing FCM provider');

      if (!Notifications) {
        log('Notifications not available, skipping init');
        isInitialized = true;
        return;
      }

      // Setup Android channel
      await setupNotificationChannel();

      // Get push token
      expoPushToken = await registerForPushNotifications();
      if (expoPushToken) {
        log('Push token:', expoPushToken);
        tokenCallbacks.forEach((cb) => cb(expoPushToken!));
      }

      // Setup notification listeners
      const receivedSubscription = Notifications.addNotificationReceivedListener(
        (notification: import('expo-notifications').Notification) => {
          const notif = toNotification(notification);
          notificationHistory.unshift(notif);
          if (notificationHistory.length > maxHistorySize) {
            notificationHistory.pop();
          }
          receivedCallbacks.forEach((cb) => cb(notif));
        }
      );
      subscriptions.push(receivedSubscription);

      const responseSubscription = Notifications.addNotificationResponseReceivedListener(
        (response: import('expo-notifications').NotificationResponse) => {
          const notif = toNotification(response.notification);
          const actionId = response.actionIdentifier;
          interactionCallbacks.forEach((cb) => cb({ notification: notif, actionId }));
        }
      );
      subscriptions.push(responseSubscription);

      isInitialized = true;
      log('FCM provider initialized');
    },

    async dispose(): Promise<void> {
      subscriptions.forEach((sub) => sub.remove());
      subscriptions.length = 0;
      isInitialized = false;
    },

    async sendToUser(options: SendToUserOptions): Promise<ApiResponse<void>> {
      try {
        await sendViaAPI('/notifications/user', {
          userId: options.userId,
          title: options.title,
          body: options.body,
          data: options.data,
          imageUrl: options.imageUrl,
        });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'SEND_FAILED', message: String(error) },
        };
      }
    },

    async sendToTopic(options: SendToTopicOptions): Promise<ApiResponse<void>> {
      try {
        await sendViaAPI('/notifications/topic', {
          topic: options.topic,
          title: options.title,
          body: options.body,
          data: options.data,
          imageUrl: options.imageUrl,
        });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'SEND_FAILED', message: String(error) },
        };
      }
    },

    async sendToToken(options: SendToTokenOptions): Promise<ApiResponse<void>> {
      try {
        await sendViaAPI('/notifications/token', {
          token: options.token,
          title: options.title,
          body: options.body,
          data: options.data,
          imageUrl: options.imageUrl,
        });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'SEND_FAILED', message: String(error) },
        };
      }
    },

    async subscribe(topic: string): Promise<ApiResponse<void>> {
      try {
        if (config.apiUrl) {
          await sendViaAPI('/notifications/subscribe', {
            topic,
            token: expoPushToken,
          });
        }
        log('Subscribed to topic:', topic);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'SUBSCRIBE_FAILED', message: String(error) },
        };
      }
    },

    async unsubscribe(topic: string): Promise<ApiResponse<void>> {
      try {
        if (config.apiUrl) {
          await sendViaAPI('/notifications/unsubscribe', {
            topic,
            token: expoPushToken,
          });
        }
        log('Unsubscribed from topic:', topic);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'UNSUBSCRIBE_FAILED', message: String(error) },
        };
      }
    },

    async getToken(): Promise<ApiResponse<string>> {
      if (expoPushToken) {
        return { success: true, data: expoPushToken };
      }

      // Try to get token again
      expoPushToken = await registerForPushNotifications();
      if (expoPushToken) {
        return { success: true, data: expoPushToken };
      }

      return {
        success: false,
        error: { code: 'NO_TOKEN', message: 'Push token not available' },
      };
    },

    async registerDevice(userId: string): Promise<ApiResponse<void>> {
      currentUserId = userId;
      try {
        if (config.apiUrl && expoPushToken) {
          await sendViaAPI('/notifications/register', {
            userId,
            token: expoPushToken,
            platform: Device?.osName || 'unknown',
          });
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'REGISTER_FAILED', message: String(error) },
        };
      }
    },

    async unregisterDevice(): Promise<ApiResponse<void>> {
      try {
        if (config.apiUrl && expoPushToken) {
          await sendViaAPI('/notifications/unregister', {
            token: expoPushToken,
          });
        }
        currentUserId = null;
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'UNREGISTER_FAILED', message: String(error) },
        };
      }
    },

    async requestPermissions(): Promise<ApiResponse<NotificationPermissionStatus>> {
      if (!Notifications) {
        return { success: true, data: 'undetermined' };
      }

      const { status } = await Notifications.requestPermissionsAsync();
      const permStatus: NotificationPermissionStatus =
        status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
      return { success: true, data: permStatus };
    },

    async checkPermissions(): Promise<ApiResponse<NotificationPermissionStatus>> {
      if (!Notifications) {
        return { success: true, data: 'undetermined' };
      }

      const { status } = await Notifications.getPermissionsAsync();
      const permStatus: NotificationPermissionStatus =
        status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
      return { success: true, data: permStatus };
    },

    async getHistory(limit?: number): Promise<ApiResponse<Notification[]>> {
      const history = limit
        ? notificationHistory.slice(0, limit)
        : notificationHistory;
      return { success: true, data: history };
    },

    async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
      const notification = notificationHistory.find((n) => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
      }
      return { success: true };
    },

    async markAllAsRead(): Promise<ApiResponse<void>> {
      const now = new Date().toISOString();
      notificationHistory.forEach((n) => {
        n.isRead = true;
        n.readAt = now;
      });
      return { success: true };
    },

    async getUnreadCount(): Promise<ApiResponse<number>> {
      const count = notificationHistory.filter((n) => !n.isRead).length;
      return { success: true, data: count };
    },

    onNotificationReceived(callback: NotificationReceivedCallback): Unsubscribe {
      receivedCallbacks.add(callback);
      return () => receivedCallbacks.delete(callback);
    },

    onNotificationInteraction(callback: NotificationInteractionCallback): Unsubscribe {
      interactionCallbacks.add(callback);
      return () => interactionCallbacks.delete(callback);
    },

    onTokenRefresh(callback: PushTokenCallback): Unsubscribe {
      tokenCallbacks.add(callback);
      // Immediately call with current token if available
      if (expoPushToken) {
        callback(expoPushToken);
      }
      return () => tokenCallbacks.delete(callback);
    },

    async setBadgeCount(count: number): Promise<ApiResponse<void>> {
      if (Notifications) {
        await Notifications.setBadgeCountAsync(count);
      }
      return { success: true };
    },

    async clearAll(): Promise<ApiResponse<void>> {
      if (Notifications) {
        await Notifications.dismissAllNotificationsAsync();
      }
      notificationHistory.length = 0;
      return { success: true };
    },
  };

  return provider;
}
