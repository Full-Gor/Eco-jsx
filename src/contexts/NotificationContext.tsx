/**
 * Notification Context
 * Manages notifications, permissions, and preferences
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { getConfig } from '../config';
import { useAuth } from './AuthContext';
import {
  NotificationItem,
  NotificationType,
  PushNotificationPreferences,
  DEFAULT_PUSH_NOTIFICATION_PREFERENCES,
} from '../types/engagement';
import { ApiResponse } from '../types/common';
import {
  INotificationProvider,
  Notification,
  NotificationPermissionStatus,
} from '../providers/notification';

/** Notification context value */
interface NotificationContextValue {
  // Notifications
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Permissions
  permissionStatus: NotificationPermissionStatus;
  hasPermission: boolean;

  // Preferences
  preferences: PushNotificationPreferences;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;

  // Permission actions
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<void>;

  // Preference actions
  updatePreferences: (prefs: Partial<PushNotificationPreferences>) => Promise<void>;
  toggleNotificationType: (type: keyof PushNotificationPreferences, enabled: boolean) => Promise<void>;

  // Provider registration
  registerForPushNotifications: () => Promise<string | null>;
  subscribeToTopic: (topic: string) => Promise<void>;
  unsubscribeFromTopic: (topic: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/** Notification provider props */
interface NotificationProviderProps {
  children: ReactNode;
  notificationProvider?: INotificationProvider;
}

/** Notification Provider Component */
export function NotificationProvider({
  children,
  notificationProvider,
}: NotificationProviderProps) {
  const config = getConfig();
  const { isAuthenticated, user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('undetermined');
  const [preferences, setPreferences] = useState<PushNotificationPreferences>(DEFAULT_PUSH_NOTIFICATION_PREFERENCES);
  const [isInitialized, setIsInitialized] = useState(false);

  const apiUrl = config.apiUrl || '';

  /** API request helper */
  const apiRequest = useCallback(
    async <T,>(
      endpoint: string,
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
      body?: unknown
    ): Promise<ApiResponse<T>> => {
      try {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return {
            success: false,
            error: {
              code: `HTTP_${response.status}`,
              message: errorData.message || `HTTP error ${response.status}`,
            },
          };
        }

        const data = await response.json();
        return { success: true, data };
      } catch (err) {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: err instanceof Error ? err.message : 'Network error',
          },
        };
      }
    },
    [apiUrl]
  );

  /** Initialize notification provider */
  useEffect(() => {
    const initProvider = async () => {
      if (!notificationProvider || isInitialized) return;

      try {
        await notificationProvider.initialize();
        setIsInitialized(true);

        // Check permission status
        const permResult = await notificationProvider.checkPermissions();
        if (permResult.success && permResult.data) {
          setPermissionStatus(permResult.data);
        }

        // Setup notification listeners
        const unsubReceived = notificationProvider.onNotificationReceived((notif: Notification) => {
          const item = convertToNotificationItem(notif);
          setNotifications((prev) => [item, ...prev]);
          setUnreadCount((prev) => prev + 1);
        });

        return () => {
          unsubReceived();
        };
      } catch (err) {
        console.error('Failed to initialize notification provider:', err);
      }
    };

    initProvider();
  }, [notificationProvider, isInitialized]);

  /** Register device when user logs in */
  useEffect(() => {
    if (isAuthenticated && user?.id && notificationProvider && isInitialized) {
      notificationProvider.registerDevice(user.id);
    }
  }, [isAuthenticated, user?.id, notificationProvider, isInitialized]);

  /** Convert provider notification to NotificationItem */
  /** Helper to convert date to string */
  const toDateString = (date: Date | string | undefined): string | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return date;
    return date.toISOString();
  };

  const convertToNotificationItem = (notif: Notification): NotificationItem => ({
    id: notif.id,
    userId: user?.id || '',
    type: (notif.data?.type as NotificationType) || 'system',
    title: notif.title,
    body: notif.body,
    image: notif.imageUrl,
    action: notif.data?.action as NotificationItem['action'],
    actionId: notif.data?.actionId as string,
    data: notif.data,
    read: notif.isRead || false,
    readAt: toDateString(notif.readAt),
    createdAt: toDateString(notif.sentAt) || new Date().toISOString(),
    updatedAt: toDateString(notif.sentAt) || new Date().toISOString(),
  });

  /** Fetch notifications from API */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to get from provider first
      if (notificationProvider) {
        const historyResult = await notificationProvider.getHistory(50);
        if (historyResult.success && historyResult.data) {
          const items = historyResult.data.map(convertToNotificationItem);
          setNotifications(items);
          setUnreadCount(items.filter((n) => !n.read).length);
          setIsLoading(false);
          return;
        }
      }

      // Fallback to API
      const result = await apiRequest<{ notifications: NotificationItem[]; unreadCount: number }>(
        `/api/notifications?userId=${user.id}`
      );

      if (result.success && result.data) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      } else {
        setError(result.error?.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, notificationProvider, apiRequest]);

  /** Mark notification as read */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Update in provider/API
      if (notificationProvider) {
        await notificationProvider.markAsRead(notificationId);
      } else {
        await apiRequest(`/api/notifications/${notificationId}/read`, 'PUT');
      }
    },
    [notificationProvider, apiRequest]
  );

  /** Mark all notifications as read */
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, readAt: now }))
    );
    setUnreadCount(0);

    // Update in provider/API
    if (notificationProvider) {
      await notificationProvider.markAllAsRead();
    } else {
      await apiRequest('/api/notifications/read-all', 'PUT');
    }
  }, [notificationProvider, apiRequest]);

  /** Delete notification */
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      const notification = notifications.find((n) => n.id === notificationId);

      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Delete from API
      await apiRequest(`/api/notifications/${notificationId}`, 'DELETE');
    },
    [notifications, apiRequest]
  );

  /** Clear all notifications */
  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);

    if (notificationProvider) {
      await notificationProvider.clearAll?.();
    } else {
      await apiRequest('/api/notifications', 'DELETE');
    }
  }, [notificationProvider, apiRequest]);

  /** Request notification permission */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!notificationProvider) {
      return false;
    }

    const result = await notificationProvider.requestPermissions();
    if (result.success && result.data) {
      setPermissionStatus(result.data);
      return result.data === 'granted';
    }
    return false;
  }, [notificationProvider]);

  /** Check current permission status */
  const checkPermission = useCallback(async () => {
    if (!notificationProvider) return;

    const result = await notificationProvider.checkPermissions();
    if (result.success && result.data) {
      setPermissionStatus(result.data);
    }
  }, [notificationProvider]);

  /** Update notification preferences */
  const updatePreferences = useCallback(
    async (prefs: Partial<PushNotificationPreferences>) => {
      const newPrefs = { ...preferences, ...prefs };
      setPreferences(newPrefs);

      // Save to API
      await apiRequest('/api/notifications/preferences', 'PUT', newPrefs);
    },
    [preferences, apiRequest]
  );

  /** Toggle specific notification type */
  const toggleNotificationType = useCallback(
    async (type: keyof PushNotificationPreferences, enabled: boolean) => {
      await updatePreferences({ [type]: enabled });
    },
    [updatePreferences]
  );

  /** Register for push notifications */
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    if (!notificationProvider) return null;

    const result = await notificationProvider.getToken();
    if (result.success && result.data) {
      // Register token with backend
      if (user?.id) {
        await apiRequest('/api/notifications/register', 'POST', {
          userId: user.id,
          token: result.data,
        });
      }
      return result.data;
    }
    return null;
  }, [notificationProvider, user?.id, apiRequest]);

  /** Subscribe to topic */
  const subscribeToTopic = useCallback(
    async (topic: string) => {
      if (!notificationProvider) return;
      await notificationProvider.subscribe(topic);
    },
    [notificationProvider]
  );

  /** Unsubscribe from topic */
  const unsubscribeFromTopic = useCallback(
    async (topic: string) => {
      if (!notificationProvider) return;
      await notificationProvider.unsubscribe(topic);
    },
    [notificationProvider]
  );

  /** Load preferences on mount */
  useEffect(() => {
    const loadPreferences = async () => {
      if (!isAuthenticated || !user?.id) return;

      const result = await apiRequest<PushNotificationPreferences>(
        `/api/notifications/preferences?userId=${user.id}`
      );

      if (result.success && result.data) {
        setPreferences(result.data);
      }
    };

    loadPreferences();
  }, [isAuthenticated, user?.id, apiRequest]);

  /** Fetch notifications on auth change */
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, user?.id, fetchNotifications]);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isLoading,
    error,
    permissionStatus,
    hasPermission: permissionStatus === 'granted',
    preferences,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    requestPermission,
    checkPermission,
    updatePreferences,
    toggleNotificationType,
    registerForPushNotifications,
    subscribeToTopic,
    unsubscribeFromTopic,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/** Hook to use notification context */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
