/**
 * Vendor Context
 * Manages vendor-specific data: shop, products, orders, and categories
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { IDatabaseProvider } from '../providers/database';
import { createDatabaseProvider, DatabaseProviderConfig } from '../providers/database/DatabaseProviderFactory';
import { getConfig } from '../config';
import { useAuth } from './AuthContext';
import { ApiResponse } from '../types/common';
import {
  Shop,
  ShopCreateData,
  ShopUpdateData,
  VendorProduct,
  ProductCreateData,
  ProductUpdateData,
  VendorOrder,
  VendorOrderStatus,
  VendorCategory,
  VendorDashboardStats,
  UploadResponse,
} from '../types/vendor';

/** Vendor state */
interface VendorState {
  isLoading: boolean;
  error: string | null;
  shop: Shop | null;
  products: VendorProduct[];
  orders: VendorOrder[];
  categories: VendorCategory[];
  stats: VendorDashboardStats | null;
}

/** Vendor context value */
interface VendorContextValue extends VendorState {
  // Database access
  database: IDatabaseProvider | null;
  isReady: boolean;

  // Shop operations
  getMyShop: () => Promise<Shop | null>;
  createShop: (data: ShopCreateData) => Promise<Shop | null>;
  updateShop: (id: string, data: ShopUpdateData) => Promise<Shop | null>;

  // Product operations
  getMyProducts: () => Promise<VendorProduct[]>;
  getProduct: (id: string) => Promise<VendorProduct | null>;
  addProduct: (data: ProductCreateData) => Promise<VendorProduct | null>;
  updateProduct: (id: string, data: ProductUpdateData) => Promise<VendorProduct | null>;
  deleteProduct: (id: string) => Promise<boolean>;

  // Order operations
  getMyOrders: (status?: VendorOrderStatus) => Promise<VendorOrder[]>;
  getOrder: (id: string) => Promise<VendorOrder | null>;
  updateOrderStatus: (id: string, status: VendorOrderStatus, trackingNumber?: string, carrier?: string) => Promise<boolean>;

  // Category operations
  getCategories: () => Promise<VendorCategory[]>;

  // Stats
  getDashboardStats: () => Promise<VendorDashboardStats | null>;

  // Image upload
  uploadImage: (uri: string) => Promise<string | null>;

  // Refresh
  refresh: () => Promise<void>;
}

const VendorContext = createContext<VendorContextValue | undefined>(undefined);

/** Vendor provider props */
interface VendorProviderProps {
  children: ReactNode;
}

/** API URL for uploads */
const API_URL = 'https://nexuserv.duckdns.org/api';

/**
 * Vendor Provider Component
 */
export function VendorProvider({ children }: VendorProviderProps) {
  const { user, isAuthenticated } = useAuth();

  const [state, setState] = useState<VendorState>({
    isLoading: false,
    error: null,
    shop: null,
    products: [],
    orders: [],
    categories: [],
    stats: null,
  });

  const [isReady, setIsReady] = useState(false);
  const dbProvider = useRef<IDatabaseProvider | null>(null);
  const initRef = useRef(false);

  // Get user ID based on role
  const getUserId = useCallback(() => {
    if (!user) return null;
    // Handle both 'id' and 'userId' fields
    return user.id || (user as unknown as { userId?: string }).userId || null;
  }, [user]);

  // Check if user is a vendor
  const isVendor = useCallback(() => {
    if (!user) return false;
    const role = user.role;
    return role === 'vendor' || role === 'vendeur';
  }, [user]);

  // Initialize database provider
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initDatabase = async () => {
      try {
        const config = getConfig();
        const dbType = config.database.type;
        let dbConfig: DatabaseProviderConfig;

        if (dbType === 'selfhosted') {
          const selfHostedDb = config.database as { type: 'selfhosted'; apiUrl: string };
          dbConfig = {
            type: 'selfhosted',
            apiUrl: selfHostedDb.apiUrl || config.apiUrl || API_URL,
          };
        } else if (dbType === 'firebase') {
          const firebaseDb = config.database as { type: 'firebase'; projectId: string };
          const firebaseAuth = config.auth.find(a => a.type === 'firebase') as { apiKey?: string; authDomain?: string } | undefined;
          dbConfig = {
            type: 'firebase',
            projectId: firebaseDb.projectId,
            apiKey: firebaseAuth?.apiKey,
            authDomain: firebaseAuth?.authDomain,
          };
        } else {
          const supabaseDb = config.database as { type: 'supabase'; url: string; anonKey: string };
          dbConfig = {
            type: 'supabase',
            url: supabaseDb.url,
            anonKey: supabaseDb.anonKey,
          };
        }

        dbProvider.current = createDatabaseProvider(dbConfig);
        await dbProvider.current.initialize();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize vendor database:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to initialize database',
        }));
      }
    };

    initDatabase();

    return () => {
      dbProvider.current?.dispose();
    };
  }, []);

  // Load vendor data when user changes
  useEffect(() => {
    if (isReady && isAuthenticated && isVendor()) {
      loadVendorData();
    }
  }, [isReady, isAuthenticated, user]);

  /** Load all vendor data */
  const loadVendorData = async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await Promise.all([
        getMyShop(),
        getMyProducts(),
        getMyOrders(),
        getCategories(),
        getDashboardStats(),
      ]);
    } catch (error) {
      console.error('Failed to load vendor data:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // ==================== SHOP OPERATIONS ====================

  /** Get vendor's shop */
  const getMyShop = useCallback(async (): Promise<Shop | null> => {
    if (!dbProvider.current || !isReady) return null;

    const userId = getUserId();
    if (!userId) return null;

    try {
      const result = await dbProvider.current.createQuery<Shop>('shops')
        .where('vendeurId', '==', userId)
        .first();

      if (result.success && result.data) {
        setState(prev => ({ ...prev, shop: result.data! }));
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to get shop:', error);
      return null;
    }
  }, [isReady, getUserId]);

  /** Create a new shop */
  const createShop = useCallback(async (data: ShopCreateData): Promise<Shop | null> => {
    if (!dbProvider.current || !isReady) return null;

    const userId = getUserId();
    if (!userId) return null;

    try {
      const shopData: Partial<Shop> = {
        ...data,
        vendeurId: userId,
        status: 'active',
      };

      const result = await dbProvider.current.insert<Shop>('shops', shopData);

      if (result.success && result.data) {
        setState(prev => ({ ...prev, shop: result.data! }));
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to create shop:', error);
      return null;
    }
  }, [isReady, getUserId]);

  /** Update shop */
  const updateShop = useCallback(async (id: string, data: ShopUpdateData): Promise<Shop | null> => {
    if (!dbProvider.current || !isReady) return null;

    try {
      const result = await dbProvider.current.update<Shop>('shops', id, data);

      if (result.success && result.data) {
        setState(prev => ({ ...prev, shop: result.data! }));
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to update shop:', error);
      return null;
    }
  }, [isReady]);

  // ==================== PRODUCT OPERATIONS ====================

  /** Get vendor's products */
  const getMyProducts = useCallback(async (): Promise<VendorProduct[]> => {
    if (!dbProvider.current || !isReady) return [];

    const userId = getUserId();
    if (!userId) return [];

    try {
      const result = await dbProvider.current.createQuery<VendorProduct>('products')
        .where('vendeurId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      if (result.success && result.data) {
        setState(prev => ({ ...prev, products: result.data! }));
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }, [isReady, getUserId]);

  /** Get single product */
  const getProduct = useCallback(async (id: string): Promise<VendorProduct | null> => {
    if (!dbProvider.current || !isReady) return null;

    try {
      const result = await dbProvider.current.getById<VendorProduct>('products', id);

      if (result.success && result.data) {
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to get product:', error);
      return null;
    }
  }, [isReady]);

  /** Add a new product */
  const addProduct = useCallback(async (data: ProductCreateData): Promise<VendorProduct | null> => {
    if (!dbProvider.current || !isReady) return null;

    const userId = getUserId();
    const { shop } = state;
    if (!userId) return null;

    try {
      const productData: Partial<VendorProduct> = {
        ...data,
        vendeurId: userId,
        shopId: shop?.id || '',
        images: data.images || [],
        status: data.status || 'active',
      };

      const result = await dbProvider.current.insert<VendorProduct>('products', productData);

      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          products: [result.data!, ...prev.products],
        }));
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to add product:', error);
      return null;
    }
  }, [isReady, getUserId, state.shop]);

  /** Update product */
  const updateProduct = useCallback(async (id: string, data: ProductUpdateData): Promise<VendorProduct | null> => {
    if (!dbProvider.current || !isReady) return null;

    try {
      const result = await dbProvider.current.update<VendorProduct>('products', id, data);

      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          products: prev.products.map(p => p.id === id ? result.data! : p),
        }));
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to update product:', error);
      return null;
    }
  }, [isReady]);

  /** Delete product */
  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    if (!dbProvider.current || !isReady) return false;

    try {
      const result = await dbProvider.current.delete('products', id);

      if (result.success) {
        setState(prev => ({
          ...prev,
          products: prev.products.filter(p => p.id !== id),
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to delete product:', error);
      return false;
    }
  }, [isReady]);

  // ==================== ORDER OPERATIONS ====================

  /** Get vendor's orders */
  const getMyOrders = useCallback(async (status?: VendorOrderStatus): Promise<VendorOrder[]> => {
    if (!dbProvider.current || !isReady) return [];

    const userId = getUserId();
    if (!userId) return [];

    try {
      const query = dbProvider.current.createQuery<VendorOrder>('orders')
        .where('vendeurId', '==', userId)
        .orderBy('createdAt', 'desc');

      if (status) {
        query.where('status', '==', status);
      }

      const result = await query.get();

      if (result.success && result.data) {
        setState(prev => ({ ...prev, orders: result.data! }));
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to get orders:', error);
      return [];
    }
  }, [isReady, getUserId]);

  /** Get single order */
  const getOrder = useCallback(async (id: string): Promise<VendorOrder | null> => {
    if (!dbProvider.current || !isReady) return null;

    try {
      const result = await dbProvider.current.getById<VendorOrder>('orders', id);

      if (result.success && result.data) {
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to get order:', error);
      return null;
    }
  }, [isReady]);

  /** Update order status */
  const updateOrderStatus = useCallback(async (
    id: string,
    status: VendorOrderStatus,
    trackingNumber?: string,
    carrier?: string
  ): Promise<boolean> => {
    if (!dbProvider.current || !isReady) return false;

    try {
      const updateData: Partial<VendorOrder> = { status };

      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
      }

      if (carrier) {
        updateData.carrier = carrier;
      }

      const result = await dbProvider.current.update<VendorOrder>('orders', id, updateData);

      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          orders: prev.orders.map(o => o.id === id ? result.data! : o),
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to update order status:', error);
      return false;
    }
  }, [isReady]);

  // ==================== CATEGORY OPERATIONS ====================

  /** Get categories */
  const getCategories = useCallback(async (): Promise<VendorCategory[]> => {
    if (!dbProvider.current || !isReady) return [];

    try {
      const result = await dbProvider.current.query<VendorCategory>('categories', {
        orderBy: 'order',
        orderDirection: 'asc',
      });

      if (result.success && result.data) {
        setState(prev => ({ ...prev, categories: result.data! }));
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }, [isReady]);

  // ==================== STATS ====================

  /** Get dashboard stats */
  const getDashboardStats = useCallback(async (): Promise<VendorDashboardStats | null> => {
    if (!dbProvider.current || !isReady) return null;

    const userId = getUserId();
    if (!userId) return null;

    try {
      // Get products count
      const productsResult = await dbProvider.current.createQuery<VendorProduct>('products')
        .where('vendeurId', '==', userId)
        .get();

      const products = productsResult.success && productsResult.data ? productsResult.data : [];

      // Get orders
      const ordersResult = await dbProvider.current.createQuery<VendorOrder>('orders')
        .where('vendeurId', '==', userId)
        .get();

      const orders = ordersResult.success && ordersResult.data ? ordersResult.data : [];

      // Calculate stats
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.status === 'active').length;
      const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5).length;

      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const totalSales = orders
        .filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
        .reduce((sum, o) => sum + o.total, 0);

      // Month sales (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthSales = orders
        .filter(o => {
          const orderDate = new Date(o.createdAt || 0);
          return orderDate >= thirtyDaysAgo &&
            o.status !== 'cancelled' &&
            o.status !== 'refunded';
        })
        .reduce((sum, o) => sum + o.total, 0);

      const stats: VendorDashboardStats = {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        totalSales,
        monthSales,
        lowStockProducts,
      };

      setState(prev => ({ ...prev, stats }));
      return stats;
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return null;
    }
  }, [isReady, getUserId]);

  // ==================== IMAGE UPLOAD ====================

  /** Upload an image */
  const uploadImage = useCallback(async (uri: string): Promise<string | null> => {
    try {
      // Get auth token from secure store
      let token: string | null = null;
      try {
        const SecureStore = await import('expo-secure-store');
        token = await SecureStore.getItemAsync('nexus_access_token');
      } catch (e) {
        console.warn('Could not get auth token:', e);
      }

      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: `product_${Date.now()}.jpg`,
      } as unknown as Blob);

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (data.success && data.data) {
        return data.data.url;
      }

      console.error('Upload failed:', data.error);
      return null;
    } catch (error) {
      console.error('Failed to upload image:', error);
      return null;
    }
  }, []);

  // ==================== REFRESH ====================

  /** Refresh all vendor data */
  const refresh = useCallback(async () => {
    await loadVendorData();
  }, []);

  const value: VendorContextValue = {
    ...state,
    database: dbProvider.current,
    isReady,
    getMyShop,
    createShop,
    updateShop,
    getMyProducts,
    getProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    getMyOrders,
    getOrder,
    updateOrderStatus,
    getCategories,
    getDashboardStats,
    uploadImage,
    refresh,
  };

  return (
    <VendorContext.Provider value={value}>
      {children}
    </VendorContext.Provider>
  );
}

// ==================== HOOKS ====================

/**
 * Hook to use vendor context
 */
export function useVendor(): VendorContextValue {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
}

/**
 * Hook for shop management
 */
export function useShop() {
  const { shop, isLoading, getMyShop, createShop, updateShop } = useVendor();

  return {
    shop,
    isLoading,
    getMyShop,
    createShop,
    updateShop,
  };
}

/**
 * Hook for vendor products
 */
export function useVendorProducts() {
  const {
    products,
    isLoading,
    getMyProducts,
    getProduct,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useVendor();

  return {
    products,
    isLoading,
    getMyProducts,
    getProduct,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}

/**
 * Hook for vendor orders
 */
export function useVendorOrders() {
  const { orders, isLoading, getMyOrders, getOrder, updateOrderStatus } = useVendor();

  return {
    orders,
    isLoading,
    getMyOrders,
    getOrder,
    updateOrderStatus,
  };
}

/**
 * Hook for categories
 */
export function useVendorCategories() {
  const { categories, getCategories } = useVendor();

  return {
    categories,
    getCategories,
  };
}

/**
 * Hook for dashboard stats
 */
export function useVendorDashboard() {
  const { stats, isLoading, getDashboardStats, refresh } = useVendor();

  return {
    stats,
    isLoading,
    getDashboardStats,
    refresh,
  };
}

/**
 * Hook for image upload
 */
export function useImageUpload() {
  const { uploadImage } = useVendor();

  return {
    uploadImage,
  };
}

export default VendorContext;
