/**
 * Wishlist Context
 * Manages user favorites/wishlist with offline support
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
  ExtendedWishlistItem,
  WishlistList,
  WishlistSort,
  AddToWishlistData,
} from '../types/engagement';
import { ApiResponse, Price } from '../types/common';

const WISHLIST_STORAGE_KEY = '@wishlist_items';
const WISHLIST_LISTS_STORAGE_KEY = '@wishlist_lists';

/** Wishlist context value */
interface WishlistContextValue {
  // Wishlist items
  items: ExtendedWishlistItem[];
  lists: WishlistList[];
  currentList: WishlistList | null;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;

  // Actions
  addToWishlist: (data: AddToWishlistData) => Promise<boolean>;
  removeFromWishlist: (productId: string, variantId?: string) => Promise<boolean>;
  isInWishlist: (productId: string, variantId?: string) => boolean;
  toggleWishlist: (data: AddToWishlistData) => Promise<boolean>;
  clearWishlist: (listId?: string) => Promise<void>;

  // List management
  createList: (name: string, description?: string) => Promise<WishlistList | null>;
  updateList: (listId: string, data: Partial<WishlistList>) => Promise<boolean>;
  deleteList: (listId: string) => Promise<boolean>;
  moveToList: (itemId: string, targetListId: string) => Promise<boolean>;
  setCurrentList: (listId: string | null) => void;

  // Sorting
  sortItems: (sort: WishlistSort) => ExtendedWishlistItem[];
  refreshWishlist: () => Promise<void>;

  // Notifications
  updateNotificationSettings: (
    itemId: string,
    settings: { notifyPriceDrop?: boolean; notifyBackInStock?: boolean }
  ) => Promise<boolean>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

/** Wishlist provider props */
interface WishlistProviderProps {
  children: ReactNode;
}

/** Wishlist Provider Component */
export function WishlistProvider({ children }: WishlistProviderProps) {
  const config = getConfig();
  const { isAuthenticated, user } = useAuth();

  const [items, setItems] = useState<ExtendedWishlistItem[]>([]);
  const [lists, setLists] = useState<WishlistList[]>([]);
  const [currentList, setCurrentListState] = useState<WishlistList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSync, setPendingSync] = useState<ExtendedWishlistItem[]>([]);

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

  /** Load wishlist from local storage */
  const loadFromStorage = useCallback(async () => {
    try {
      const [storedItems, storedLists] = await Promise.all([
        AsyncStorage.getItem(WISHLIST_STORAGE_KEY),
        AsyncStorage.getItem(WISHLIST_LISTS_STORAGE_KEY),
      ]);

      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }
      if (storedLists) {
        setLists(JSON.parse(storedLists));
      }
    } catch (err) {
      console.error('Failed to load wishlist from storage:', err);
    }
  }, []);

  /** Save wishlist to local storage */
  const saveToStorage = useCallback(async (newItems: ExtendedWishlistItem[], newLists: WishlistList[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(newItems)),
        AsyncStorage.setItem(WISHLIST_LISTS_STORAGE_KEY, JSON.stringify(newLists)),
      ]);
    } catch (err) {
      console.error('Failed to save wishlist to storage:', err);
    }
  }, []);

  /** Sync with server */
  const syncWithServer = useCallback(async () => {
    if (!isAuthenticated || !user?.id || isSyncing) return;

    setIsSyncing(true);

    try {
      // Fetch server data
      const result = await apiRequest<{ items: ExtendedWishlistItem[]; lists: WishlistList[] }>(
        `/api/wishlist?userId=${user.id}`
      );

      if (result.success && result.data) {
        // Merge local pending items with server data
        const serverItems = result.data.items;
        const mergedItems = [...serverItems];

        // Add any pending items that aren't on server
        for (const pending of pendingSync) {
          if (!serverItems.find((s) => s.productId === pending.productId)) {
            mergedItems.push(pending);
            // Sync to server
            await apiRequest('/api/wishlist', 'POST', pending);
          }
        }

        setItems(mergedItems);
        setLists(result.data.lists);
        setPendingSync([]);
        await saveToStorage(mergedItems, result.data.lists);
      }
    } catch (err) {
      console.error('Failed to sync wishlist:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, user?.id, isSyncing, pendingSync, apiRequest, saveToStorage]);

  /** Fetch wishlist from server */
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      await loadFromStorage();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRequest<{ items: ExtendedWishlistItem[]; lists: WishlistList[] }>(
        `/api/wishlist?userId=${user.id}`
      );

      if (result.success && result.data) {
        setItems(result.data.items);
        setLists(result.data.lists);
        await saveToStorage(result.data.items, result.data.lists);
      } else {
        // Fallback to local storage
        await loadFromStorage();
        setError(result.error?.message || 'Failed to fetch wishlist');
      }
    } catch (err) {
      await loadFromStorage();
      setError(err instanceof Error ? err.message : 'Failed to fetch wishlist');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, apiRequest, loadFromStorage, saveToStorage]);

  /** Add item to wishlist */
  const addToWishlist = useCallback(
    async (data: AddToWishlistData): Promise<boolean> => {
      const existingItem = items.find(
        (item) =>
          item.productId === data.productId &&
          item.variantId === data.variantId
      );

      if (existingItem) {
        return true; // Already in wishlist
      }

      const newItem: ExtendedWishlistItem = {
        id: `wishlist_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user?.id || 'guest',
        productId: data.productId,
        variantId: data.variantId,
        listId: data.listId,
        productName: '', // Will be populated from product data
        priceAtAdd: { amount: 0, currency: 'EUR', formatted: '' } as Price,
        inStockAtAdd: true,
        notifyPriceDrop: data.notifyPriceDrop ?? true,
        notifyBackInStock: data.notifyBackInStock ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update
      const newItems = [newItem, ...items];
      setItems(newItems);
      await saveToStorage(newItems, lists);

      // Sync with server if authenticated
      if (isAuthenticated && user?.id) {
        const result = await apiRequest<ExtendedWishlistItem>('/api/wishlist', 'POST', data);
        if (result.success && result.data) {
          // Update with server response
          const updatedItems = newItems.map((item) =>
            item.id === newItem.id ? result.data! : item
          );
          setItems(updatedItems);
          await saveToStorage(updatedItems, lists);
        } else {
          // Add to pending sync
          setPendingSync((prev) => [...prev, newItem]);
        }
      }

      return true;
    },
    [items, lists, user?.id, isAuthenticated, apiRequest, saveToStorage]
  );

  /** Remove item from wishlist */
  const removeFromWishlist = useCallback(
    async (productId: string, variantId?: string): Promise<boolean> => {
      const itemToRemove = items.find(
        (item) =>
          item.productId === productId &&
          item.variantId === variantId
      );

      if (!itemToRemove) {
        return true; // Not in wishlist
      }

      // Optimistic update
      const newItems = items.filter((item) => item.id !== itemToRemove.id);
      setItems(newItems);
      await saveToStorage(newItems, lists);

      // Sync with server if authenticated
      if (isAuthenticated && user?.id) {
        await apiRequest(`/api/wishlist/${itemToRemove.id}`, 'DELETE');
      }

      return true;
    },
    [items, lists, isAuthenticated, user?.id, apiRequest, saveToStorage]
  );

  /** Check if product is in wishlist */
  const isInWishlist = useCallback(
    (productId: string, variantId?: string): boolean => {
      return items.some(
        (item) =>
          item.productId === productId &&
          item.variantId === variantId
      );
    },
    [items]
  );

  /** Toggle wishlist status */
  const toggleWishlist = useCallback(
    async (data: AddToWishlistData): Promise<boolean> => {
      if (isInWishlist(data.productId, data.variantId)) {
        return removeFromWishlist(data.productId, data.variantId);
      }
      return addToWishlist(data);
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  );

  /** Clear wishlist */
  const clearWishlist = useCallback(
    async (listId?: string) => {
      const newItems = listId
        ? items.filter((item) => item.listId !== listId)
        : [];

      setItems(newItems);
      await saveToStorage(newItems, lists);

      if (isAuthenticated && user?.id) {
        const endpoint = listId
          ? `/api/wishlist/list/${listId}/clear`
          : '/api/wishlist/clear';
        await apiRequest(endpoint, 'DELETE');
      }
    },
    [items, lists, isAuthenticated, user?.id, apiRequest, saveToStorage]
  );

  /** Create new wishlist list */
  const createList = useCallback(
    async (name: string, description?: string): Promise<WishlistList | null> => {
      const newList: WishlistList = {
        id: `list_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user?.id || 'guest',
        name,
        description,
        isDefault: lists.length === 0,
        itemCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newLists = [...lists, newList];
      setLists(newLists);
      await saveToStorage(items, newLists);

      if (isAuthenticated && user?.id) {
        const result = await apiRequest<WishlistList>('/api/wishlist/lists', 'POST', {
          name,
          description,
        });
        if (result.success && result.data) {
          const updatedLists = newLists.map((list) =>
            list.id === newList.id ? result.data! : list
          );
          setLists(updatedLists);
          await saveToStorage(items, updatedLists);
          return result.data;
        }
      }

      return newList;
    },
    [lists, items, user?.id, isAuthenticated, apiRequest, saveToStorage]
  );

  /** Update wishlist list */
  const updateList = useCallback(
    async (listId: string, data: Partial<WishlistList>): Promise<boolean> => {
      const newLists = lists.map((list) =>
        list.id === listId
          ? { ...list, ...data, updatedAt: new Date().toISOString() }
          : list
      );
      setLists(newLists);
      await saveToStorage(items, newLists);

      if (isAuthenticated && user?.id) {
        await apiRequest(`/api/wishlist/lists/${listId}`, 'PUT', data);
      }

      return true;
    },
    [lists, items, isAuthenticated, user?.id, apiRequest, saveToStorage]
  );

  /** Delete wishlist list */
  const deleteList = useCallback(
    async (listId: string): Promise<boolean> => {
      const newLists = lists.filter((list) => list.id !== listId);
      const newItems = items.filter((item) => item.listId !== listId);

      setLists(newLists);
      setItems(newItems);
      await saveToStorage(newItems, newLists);

      if (isAuthenticated && user?.id) {
        await apiRequest(`/api/wishlist/lists/${listId}`, 'DELETE');
      }

      return true;
    },
    [lists, items, isAuthenticated, user?.id, apiRequest, saveToStorage]
  );

  /** Move item to different list */
  const moveToList = useCallback(
    async (itemId: string, targetListId: string): Promise<boolean> => {
      const newItems = items.map((item) =>
        item.id === itemId
          ? { ...item, listId: targetListId, updatedAt: new Date().toISOString() }
          : item
      );
      setItems(newItems);
      await saveToStorage(newItems, lists);

      if (isAuthenticated && user?.id) {
        await apiRequest(`/api/wishlist/${itemId}/move`, 'PUT', {
          listId: targetListId,
        });
      }

      return true;
    },
    [items, lists, isAuthenticated, user?.id, apiRequest, saveToStorage]
  );

  /** Set current list filter */
  const setCurrentList = useCallback(
    (listId: string | null) => {
      if (listId === null) {
        setCurrentListState(null);
      } else {
        const list = lists.find((l) => l.id === listId);
        setCurrentListState(list || null);
      }
    },
    [lists]
  );

  /** Sort wishlist items */
  const sortItems = useCallback(
    (sort: WishlistSort): ExtendedWishlistItem[] => {
      const filteredItems = currentList
        ? items.filter((item) => item.listId === currentList.id)
        : items;

      const sorted = [...filteredItems];

      switch (sort) {
        case 'date_added':
          sorted.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case 'price_low':
          sorted.sort((a, b) =>
            (a.currentPrice?.amount || a.priceAtAdd.amount) -
            (b.currentPrice?.amount || b.priceAtAdd.amount)
          );
          break;
        case 'price_high':
          sorted.sort((a, b) =>
            (b.currentPrice?.amount || b.priceAtAdd.amount) -
            (a.currentPrice?.amount || a.priceAtAdd.amount)
          );
          break;
        case 'name':
          sorted.sort((a, b) => a.productName.localeCompare(b.productName));
          break;
      }

      return sorted;
    },
    [items, currentList]
  );

  /** Update notification settings for item */
  const updateNotificationSettings = useCallback(
    async (
      itemId: string,
      settings: { notifyPriceDrop?: boolean; notifyBackInStock?: boolean }
    ): Promise<boolean> => {
      const newItems = items.map((item) =>
        item.id === itemId
          ? { ...item, ...settings, updatedAt: new Date().toISOString() }
          : item
      );
      setItems(newItems);
      await saveToStorage(newItems, lists);

      if (isAuthenticated && user?.id) {
        await apiRequest(`/api/wishlist/${itemId}/notifications`, 'PUT', settings);
      }

      return true;
    },
    [items, lists, isAuthenticated, user?.id, apiRequest, saveToStorage]
  );

  /** Refresh wishlist */
  const refreshWishlist = useCallback(async () => {
    await fetchWishlist();
  }, [fetchWishlist]);

  /** Load on mount */
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  /** Fetch from server when authenticated */
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchWishlist();
    }
  }, [isAuthenticated, user?.id, fetchWishlist]);

  /** Sync pending items when coming online */
  useEffect(() => {
    if (isAuthenticated && pendingSync.length > 0) {
      syncWithServer();
    }
  }, [isAuthenticated, pendingSync.length, syncWithServer]);

  const value: WishlistContextValue = {
    items,
    lists,
    currentList,
    isLoading,
    error,
    isSyncing,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    createList,
    updateList,
    deleteList,
    moveToList,
    setCurrentList,
    sortItems,
    refreshWishlist,
    updateNotificationSettings,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

/** Hook to use wishlist context */
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
