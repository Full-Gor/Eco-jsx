/**
 * Newsletter Context
 * Manages newsletter subscription and preferences
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConfig } from '../config';
import { useAuth } from './AuthContext';
import {
  NewsletterPreferences,
  SubscriptionStatus,
  NewsletterList,
  DEFAULT_NEWSLETTER_PREFERENCES,
} from '../types/engagement';
import { ApiResponse } from '../types/common';
import { INewsletterProvider } from '../providers/newsletter';

const NEWSLETTER_DISMISSED_KEY = '@newsletter_popup_dismissed';
const NEWSLETTER_STATUS_KEY = '@newsletter_status';

/** Newsletter context value */
interface NewsletterContextValue {
  // Subscription status
  isSubscribed: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  lists: NewsletterList[];
  isLoading: boolean;
  error: string | null;

  // Preferences
  preferences: NewsletterPreferences;

  // Popup state
  showPopup: boolean;
  dismissPopup: () => void;

  // Actions
  subscribe: (email: string, listIds?: string[]) => Promise<boolean>;
  unsubscribe: (email?: string) => Promise<boolean>;
  updatePreferences: (prefs: Partial<NewsletterPreferences>) => Promise<void>;
  checkSubscriptionStatus: (email: string) => Promise<void>;
  fetchLists: () => Promise<void>;
}

const NewsletterContext = createContext<NewsletterContextValue | undefined>(undefined);

/** Newsletter provider props */
interface NewsletterProviderComponentProps {
  children: ReactNode;
  newsletterProvider?: INewsletterProvider;
  /** Delay in ms before showing popup (default: 10000) */
  popupDelay?: number;
  /** Enable popup (default: true) */
  enablePopup?: boolean;
}

/** Newsletter Provider Component */
export function NewsletterProvider({
  children,
  newsletterProvider,
  popupDelay = 10000,
  enablePopup = true,
}: NewsletterProviderComponentProps) {
  const config = getConfig();
  const { isAuthenticated, user } = useAuth();

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [lists, setLists] = useState<NewsletterList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NewsletterPreferences>(
    DEFAULT_NEWSLETTER_PREFERENCES
  );
  const [showPopup, setShowPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);

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

  /** Load popup dismissed state */
  useEffect(() => {
    const loadDismissedState = async () => {
      try {
        const dismissed = await AsyncStorage.getItem(NEWSLETTER_DISMISSED_KEY);
        if (dismissed === 'true') {
          setPopupDismissed(true);
        }
      } catch (err) {
        console.error('Failed to load newsletter dismissed state:', err);
      }
    };

    loadDismissedState();
  }, []);

  /** Load cached subscription status */
  useEffect(() => {
    const loadCachedStatus = async () => {
      try {
        const cached = await AsyncStorage.getItem(NEWSLETTER_STATUS_KEY);
        if (cached) {
          const status = JSON.parse(cached) as SubscriptionStatus;
          setSubscriptionStatus(status);
          setIsSubscribed(status.subscribed);
          if (status.preferences) {
            setPreferences(status.preferences);
          }
        }
      } catch (err) {
        console.error('Failed to load cached newsletter status:', err);
      }
    };

    loadCachedStatus();
  }, []);

  /** Show popup after delay */
  useEffect(() => {
    if (!enablePopup || popupDismissed || isSubscribed) return;

    const timer = setTimeout(() => {
      setShowPopup(true);
    }, popupDelay);

    return () => clearTimeout(timer);
  }, [enablePopup, popupDelay, popupDismissed, isSubscribed]);

  /** Dismiss popup */
  const dismissPopup = useCallback(async () => {
    setShowPopup(false);
    setPopupDismissed(true);
    try {
      await AsyncStorage.setItem(NEWSLETTER_DISMISSED_KEY, 'true');
    } catch (err) {
      console.error('Failed to save newsletter dismissed state:', err);
    }
  }, []);

  /** Save subscription status to cache */
  const saveStatusToCache = useCallback(async (status: SubscriptionStatus) => {
    try {
      await AsyncStorage.setItem(NEWSLETTER_STATUS_KEY, JSON.stringify(status));
    } catch (err) {
      console.error('Failed to save newsletter status:', err);
    }
  }, []);

  /** Subscribe to newsletter */
  const subscribe = useCallback(
    async (email: string, listIds?: string[]): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        let success = false;

        if (newsletterProvider) {
          const result = await newsletterProvider.subscribe({
            email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            listId: listIds?.[0],
          });
          success = result.success;
        } else {
          const result = await apiRequest<{ success: boolean }>('/api/newsletter/subscribe', 'POST', {
            email,
            listIds,
            userId: user?.id,
          });
          success = result.success;
        }

        if (success) {
          const newStatus: SubscriptionStatus = {
            subscribed: true,
            email,
            lists: listIds || [],
            preferences,
            subscribedAt: new Date().toISOString(),
          };
          setSubscriptionStatus(newStatus);
          setIsSubscribed(true);
          setShowPopup(false);
          await saveStatusToCache(newStatus);
        } else {
          setError('Failed to subscribe');
        }

        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to subscribe');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [newsletterProvider, apiRequest, user, preferences, saveStatusToCache]
  );

  /** Unsubscribe from newsletter */
  const unsubscribe = useCallback(
    async (email?: string): Promise<boolean> => {
      const emailToUse = email || subscriptionStatus?.email || user?.email;
      if (!emailToUse) {
        setError('No email provided');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        let success = false;

        if (newsletterProvider) {
          const result = await newsletterProvider.unsubscribe({ email: emailToUse });
          success = result.success;
        } else {
          const result = await apiRequest<{ success: boolean }>(
            '/api/newsletter/unsubscribe',
            'POST',
            { email: emailToUse }
          );
          success = result.success;
        }

        if (success) {
          const newStatus: SubscriptionStatus = {
            subscribed: false,
            email: emailToUse,
            lists: [],
          };
          setSubscriptionStatus(newStatus);
          setIsSubscribed(false);
          await saveStatusToCache(newStatus);
        } else {
          setError('Failed to unsubscribe');
        }

        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [newsletterProvider, apiRequest, subscriptionStatus?.email, user?.email, saveStatusToCache]
  );

  /** Update newsletter preferences */
  const updatePreferences = useCallback(
    async (prefs: Partial<NewsletterPreferences>) => {
      const newPrefs = { ...preferences, ...prefs };
      setPreferences(newPrefs);

      const email = subscriptionStatus?.email || user?.email;
      if (!email || !isSubscribed) return;

      try {
        if (newsletterProvider) {
          await newsletterProvider.updateSubscriber(email, {
            metadata: { preferences: newPrefs },
          });
        } else {
          await apiRequest('/api/newsletter/preferences', 'PUT', {
            email,
            preferences: newPrefs,
          });
        }

        // Update cached status
        if (subscriptionStatus) {
          const newStatus = { ...subscriptionStatus, preferences: newPrefs };
          setSubscriptionStatus(newStatus);
          await saveStatusToCache(newStatus);
        }
      } catch (err) {
        console.error('Failed to update newsletter preferences:', err);
      }
    },
    [
      preferences,
      subscriptionStatus,
      user?.email,
      isSubscribed,
      newsletterProvider,
      apiRequest,
      saveStatusToCache,
    ]
  );

  /** Check subscription status */
  const checkSubscriptionStatus = useCallback(
    async (email: string) => {
      setIsLoading(true);

      try {
        let status: SubscriptionStatus | null = null;

        if (newsletterProvider) {
          const result = await newsletterProvider.isSubscribed(email);
          if (result.success) {
            status = {
              subscribed: result.data || false,
              email,
              lists: [],
            };
          }
        } else {
          const result = await apiRequest<SubscriptionStatus>(
            `/api/newsletter/status?email=${encodeURIComponent(email)}`
          );
          if (result.success && result.data) {
            status = result.data;
          }
        }

        if (status) {
          setSubscriptionStatus(status);
          setIsSubscribed(status.subscribed);
          if (status.preferences) {
            setPreferences(status.preferences);
          }
          await saveStatusToCache(status);
        }
      } catch (err) {
        console.error('Failed to check subscription status:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [newsletterProvider, apiRequest, saveStatusToCache]
  );

  /** Fetch available newsletter lists */
  const fetchLists = useCallback(async () => {
    try {
      let fetchedLists: NewsletterList[] = [];

      if (newsletterProvider) {
        const result = await newsletterProvider.getLists();
        if (result.success && result.data) {
          fetchedLists = result.data.map((l) => ({
            id: String(l.id),
            name: l.name,
          }));
        }
      } else {
        const result = await apiRequest<NewsletterList[]>('/api/newsletter/lists');
        if (result.success && result.data) {
          fetchedLists = result.data;
        }
      }

      setLists(fetchedLists);
    } catch (err) {
      console.error('Failed to fetch newsletter lists:', err);
    }
  }, [newsletterProvider, apiRequest]);

  /** Check subscription status when user logs in */
  useEffect(() => {
    if (isAuthenticated && user?.email && !subscriptionStatus) {
      checkSubscriptionStatus(user.email);
    }
  }, [isAuthenticated, user?.email, subscriptionStatus, checkSubscriptionStatus]);

  const value: NewsletterContextValue = {
    isSubscribed,
    subscriptionStatus,
    lists,
    isLoading,
    error,
    preferences,
    showPopup,
    dismissPopup,
    subscribe,
    unsubscribe,
    updatePreferences,
    checkSubscriptionStatus,
    fetchLists,
  };

  return (
    <NewsletterContext.Provider value={value}>
      {children}
    </NewsletterContext.Provider>
  );
}

/** Hook to use newsletter context */
export function useNewsletter() {
  const context = useContext(NewsletterContext);
  if (context === undefined) {
    throw new Error('useNewsletter must be used within a NewsletterProvider');
  }
  return context;
}
