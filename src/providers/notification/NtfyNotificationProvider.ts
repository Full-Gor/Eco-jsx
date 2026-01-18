/**
 * ntfy Notification Provider
 * Self-hosted push notifications using ntfy.sh
 * https://ntfy.sh/
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

/** ntfy configuration */
export interface NtfyConfig {
  /** ntfy server URL (e.g., https://ntfy.sh or self-hosted) */
  serverUrl: string;
  /** Default topic for the app */
  defaultTopic: string;
  /** Authentication token (optional) */
  authToken?: string;
  /** User-specific topic prefix */
  userTopicPrefix?: string;
  /** Enable debug logging */
  debug?: boolean;
}

/** ntfy message priority */
type NtfyPriority = 1 | 2 | 3 | 4 | 5;

/** ntfy message */
interface NtfyMessage {
  id: string;
  time: number;
  event: 'message' | 'open' | 'keepalive';
  topic: string;
  title?: string;
  message?: string;
  priority?: NtfyPriority;
  tags?: string[];
  click?: string;
  actions?: NtfyAction[];
  attachment?: NtfyAttachment;
}

interface NtfyAction {
  action: 'view' | 'http' | 'broadcast';
  label: string;
  url?: string;
  clear?: boolean;
}

interface NtfyAttachment {
  name?: string;
  type?: string;
  size?: number;
  expires?: number;
  url?: string;
}

/** Create ntfy notification provider */
export function createNtfyNotificationProvider(config: NtfyConfig): INotificationProvider {
  const receivedCallbacks: Set<NotificationReceivedCallback> = new Set();
  const interactionCallbacks: Set<NotificationInteractionCallback> = new Set();
  const tokenCallbacks: Set<PushTokenCallback> = new Set();

  let isInitialized = false;
  let eventSource: EventSource | null = null;
  let deviceToken: string | null = null;
  let currentUserId: string | null = null;
  const subscribedTopics: Set<string> = new Set();
  const notificationHistory: Notification[] = [];
  const maxHistorySize = 100;

  const log = (...args: unknown[]) => {
    if (config.debug) {
      console.log('[NtfyProvider]', ...args);
    }
  };

  /** Get full topic URL */
  const getTopicUrl = (topic: string): string => {
    return `${config.serverUrl}/${topic}`;
  };

  /** Convert priority to ntfy priority */
  const toNtfyPriority = (priority?: string): NtfyPriority => {
    switch (priority) {
      case 'urgent': return 5;
      case 'high': return 4;
      case 'normal': return 3;
      case 'low': return 2;
      default: return 3;
    }
  };

  /** Convert ntfy message to Notification */
  const toNotification = (msg: NtfyMessage): Notification => ({
    id: msg.id,
    title: msg.title || '',
    body: msg.message || '',
    data: {
      topic: msg.topic,
      tags: msg.tags,
      click: msg.click,
      actions: msg.actions,
    },
    sentAt: new Date(msg.time * 1000).toISOString(),
    isRead: false,
  });

  /** Get auth headers */
  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`;
    }
    return headers;
  };

  /** Subscribe to topic via SSE */
  const subscribeToTopicSSE = (topic: string) => {
    if (typeof EventSource === 'undefined') {
      log('EventSource not available, falling back to polling');
      return;
    }

    const url = `${getTopicUrl(topic)}/sse`;
    log('Subscribing to SSE:', url);

    try {
      const es = new EventSource(url);

      es.onmessage = (event) => {
        try {
          const msg: NtfyMessage = JSON.parse(event.data);
          if (msg.event === 'message') {
            const notification = toNotification(msg);
            notificationHistory.unshift(notification);
            if (notificationHistory.length > maxHistorySize) {
              notificationHistory.pop();
            }
            receivedCallbacks.forEach((cb) => cb(notification));
          }
        } catch (err) {
          log('Error parsing message:', err);
        }
      };

      es.onerror = (err) => {
        log('SSE error:', err);
      };

      eventSource = es;
    } catch (err) {
      log('Error creating EventSource:', err);
    }
  };

  /** Base notification options */
  interface BaseNotificationOptions {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    imageUrl?: string;
    priority?: string;
  }

  /** Send message to topic */
  const sendMessage = async (topic: string, options: BaseNotificationOptions): Promise<void> => {
    const payload = {
      topic,
      title: options.title,
      message: options.body,
      priority: toNtfyPriority(options.priority),
      tags: options.data?.tags as string[] | undefined,
      click: options.data?.click as string | undefined,
      attach: options.imageUrl,
    };

    const response = await fetch(config.serverUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.status}`);
    }
  };

  const provider: INotificationProvider = {
    name: 'ntfy',
    type: 'notification',

    isReady(): boolean {
      return isInitialized;
    },

    async initialize(): Promise<void> {
      log('Initializing ntfy provider');

      // Generate a unique device token
      deviceToken = `ntfy_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Subscribe to default topic
      subscribedTopics.add(config.defaultTopic);
      subscribeToTopicSSE(config.defaultTopic);

      isInitialized = true;
      log('ntfy provider initialized');
    },

    async dispose(): Promise<void> {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      subscribedTopics.clear();
      isInitialized = false;
    },

    async sendToUser(options: SendToUserOptions): Promise<ApiResponse<void>> {
      try {
        const topic = config.userTopicPrefix
          ? `${config.userTopicPrefix}_${options.userId}`
          : options.userId;
        await sendMessage(topic, options);
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
        await sendMessage(options.topic, options);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'SEND_FAILED', message: String(error) },
        };
      }
    },

    async sendToToken(options: SendToTokenOptions): Promise<ApiResponse<void>> {
      // ntfy uses topics, not tokens, so we treat token as topic
      try {
        await sendMessage(options.token, options);
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
        if (!subscribedTopics.has(topic)) {
          subscribedTopics.add(topic);
          // Note: In a real implementation, you'd manage multiple SSE connections
          log('Subscribed to topic:', topic);
        }
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
        subscribedTopics.delete(topic);
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
      if (deviceToken) {
        return { success: true, data: deviceToken };
      }
      return {
        success: false,
        error: { code: 'NO_TOKEN', message: 'Device token not available' },
      };
    },

    async registerDevice(userId: string): Promise<ApiResponse<void>> {
      currentUserId = userId;
      // Subscribe to user-specific topic
      const userTopic = config.userTopicPrefix
        ? `${config.userTopicPrefix}_${userId}`
        : `user_${userId}`;
      return this.subscribe(userTopic);
    },

    async unregisterDevice(): Promise<ApiResponse<void>> {
      if (currentUserId) {
        const userTopic = config.userTopicPrefix
          ? `${config.userTopicPrefix}_${currentUserId}`
          : `user_${currentUserId}`;
        await this.unsubscribe(userTopic);
        currentUserId = null;
      }
      return { success: true };
    },

    async requestPermissions(): Promise<ApiResponse<NotificationPermissionStatus>> {
      // ntfy via SSE doesn't require system permissions
      // but for mobile, you might want to use expo-notifications
      return { success: true, data: 'granted' };
    },

    async checkPermissions(): Promise<ApiResponse<NotificationPermissionStatus>> {
      return { success: true, data: 'granted' };
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
      return () => tokenCallbacks.delete(callback);
    },

    async setBadgeCount(_count: number): Promise<ApiResponse<void>> {
      // Badge count is typically managed by the native notification system
      return { success: true };
    },

    async clearAll(): Promise<ApiResponse<void>> {
      notificationHistory.length = 0;
      return { success: true };
    },
  };

  return provider;
}
