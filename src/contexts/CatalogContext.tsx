/**
 * Catalog Context
 * Provides catalog data and operations throughout the app
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  Product,
  Category,
  ProductFilter,
  ProductSortOption,
  ProductReview,
} from '../types/product';
import { ApiResponse, PaginatedResponse } from '../types/common';
import { IDatabaseProvider } from '../providers/database';
import { ISearchProvider, SearchResult } from '../providers/search/SearchProvider.interface';
import { createDatabaseProvider, DatabaseProviderConfig } from '../providers/database/DatabaseProviderFactory';
import { getConfig } from '../config';

/** Catalog state */
interface CatalogState {
  products: Product[];
  categories: Category[];
  currentProduct: Product | null;
  currentCategory: Category | null;
  searchResults: Product[];
  searchQuery: string;
  searchSuggestions: string[];
  filters: ProductFilter;
  sort: ProductSortOption;
  viewMode: 'grid' | 'list';
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  totalProducts: number;
}

/** Catalog context value */
interface CatalogContextValue extends CatalogState {
  // Product operations
  fetchProducts: (reset?: boolean) => Promise<void>;
  fetchProduct: (id: string) => Promise<Product | null>;
  refreshProducts: () => Promise<void>;
  loadMoreProducts: () => Promise<void>;

  // Category operations
  fetchCategories: () => Promise<void>;
  fetchCategory: (id: string) => Promise<Category | null>;

  // Search operations
  search: (query: string) => Promise<void>;
  getSuggestions: (query: string) => Promise<string[]>;
  clearSearch: () => void;

  // Filter and sort operations
  setFilters: (filters: Partial<ProductFilter>) => void;
  clearFilters: () => void;
  setSort: (sort: ProductSortOption) => void;
  setViewMode: (mode: 'grid' | 'list') => void;

  // Reviews
  fetchReviews: (productId: string, page?: number) => Promise<PaginatedResponse<ProductReview>>;

  // Cart quick actions
  addToFavorites: (productId: string) => Promise<boolean>;
  removeFromFavorites: (productId: string) => Promise<boolean>;
  isFavorite: (productId: string) => boolean;

  // Clear current selections
  clearCurrentProduct: () => void;
  clearCurrentCategory: () => void;
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

/** Default filter state */
const defaultFilters: ProductFilter = {};

/** Page size for pagination */
const PAGE_SIZE = 20;

/** Catalog Provider Props */
interface CatalogProviderProps {
  children: React.ReactNode;
}

/** Catalog Provider */
export function CatalogProvider({ children }: CatalogProviderProps) {
  const [state, setState] = useState<CatalogState>({
    products: [],
    categories: [],
    currentProduct: null,
    currentCategory: null,
    searchResults: [],
    searchQuery: '',
    searchSuggestions: [],
    filters: defaultFilters,
    sort: 'relevance',
    viewMode: 'grid',
    loading: false,
    refreshing: false,
    error: null,
    hasMore: true,
    page: 0,
    totalProducts: 0,
  });

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const dbProvider = useRef<IDatabaseProvider | null>(null);
  const searchProvider = useRef<ISearchProvider | null>(null);

  /** Initialize providers */
  useEffect(() => {
    const initProviders = async () => {
      try {
        const config = getConfig();

        // Create database provider based on config
        const dbType = config.database.type;
        let dbConfig: DatabaseProviderConfig;

        if (dbType === 'selfhosted') {
          const selfHostedDb = config.database as { type: 'selfhosted'; apiUrl: string };
          dbConfig = {
            type: 'selfhosted',
            apiUrl: selfHostedDb.apiUrl || config.apiUrl || '',
          };
        } else if (dbType === 'firebase') {
          const firebaseDb = config.database as { type: 'firebase'; projectId: string };
          // Find Firebase auth config for additional settings
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

        // Load initial data
        await Promise.all([
          fetchCategories(),
          fetchProducts(true),
        ]);
      } catch (error) {
        console.error('Failed to initialize catalog providers:', error);
        setState(prev => ({ ...prev, error: 'Erreur de chargement du catalogue' }));
      }
    };

    initProviders();

    return () => {
      dbProvider.current?.dispose();
      searchProvider.current?.dispose();
    };
  }, []);

  /** Build query options from filters and sort */
  const buildQueryOptions = useCallback((page: number) => {
    const options: Record<string, unknown> = {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    };

    // Apply sorting
    switch (state.sort) {
      case 'price_asc':
        options.orderBy = 'price.amount';
        options.orderDirection = 'asc';
        break;
      case 'price_desc':
        options.orderBy = 'price.amount';
        options.orderDirection = 'desc';
        break;
      case 'newest':
        options.orderBy = 'createdAt';
        options.orderDirection = 'desc';
        break;
      case 'rating':
        options.orderBy = 'rating.average';
        options.orderDirection = 'desc';
        break;
      case 'popularity':
        options.orderBy = 'salesCount';
        options.orderDirection = 'desc';
        break;
      case 'name_asc':
        options.orderBy = 'name';
        options.orderDirection = 'asc';
        break;
      case 'name_desc':
        options.orderBy = 'name';
        options.orderDirection = 'desc';
        break;
    }

    return options;
  }, [state.sort]);

  /** Fetch products */
  const fetchProducts = useCallback(async (reset = false) => {
    if (!dbProvider.current) return;

    const newPage = reset ? 0 : state.page;

    setState(prev => ({
      ...prev,
      loading: reset,
      refreshing: !reset && prev.refreshing,
      error: null,
    }));

    try {
      const queryBuilder = dbProvider.current.createQuery<Product>('products');

      // Apply filters
      if (state.filters.categoryId) {
        queryBuilder.where('categoryId', '==', state.filters.categoryId);
      }
      if (state.filters.categoryIds?.length) {
        queryBuilder.where('categoryId', 'in', state.filters.categoryIds);
      }
      if (state.filters.brandId) {
        queryBuilder.where('brandId', '==', state.filters.brandId);
      }
      if (state.filters.minPrice !== undefined) {
        queryBuilder.where('price.amount', '>=', state.filters.minPrice);
      }
      if (state.filters.maxPrice !== undefined) {
        queryBuilder.where('price.amount', '<=', state.filters.maxPrice);
      }
      if (state.filters.inStock === true) {
        queryBuilder.where('stock', '>', 0);
      }
      if (state.filters.isFeatured) {
        queryBuilder.where('isFeatured', '==', true);
      }
      if (state.filters.isNew) {
        queryBuilder.where('isNew', '==', true);
      }

      // Apply sorting
      const options = buildQueryOptions(newPage);
      if (options.orderBy) {
        queryBuilder.orderBy(options.orderBy as string, options.orderDirection as 'asc' | 'desc');
      }

      // Apply pagination
      queryBuilder.limit(PAGE_SIZE).offset(newPage * PAGE_SIZE);

      const result = await queryBuilder.get();

      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          products: reset ? result.data! : [...prev.products, ...result.data!],
          hasMore: result.data!.length === PAGE_SIZE,
          page: newPage + 1,
          loading: false,
          refreshing: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: result.error?.message || 'Erreur de chargement',
          loading: false,
          refreshing: false,
        }));
      }
    } catch (error) {
      const err = error as Error;
      setState(prev => ({
        ...prev,
        error: err.message,
        loading: false,
        refreshing: false,
      }));
    }
  }, [state.page, state.filters, buildQueryOptions]);

  /** Fetch a single product */
  const fetchProduct = useCallback(async (id: string): Promise<Product | null> => {
    if (!dbProvider.current) return null;

    try {
      const result = await dbProvider.current.getById<Product>('products', id);

      if (result.success && result.data) {
        const product = result.data;
        setState(prev => ({ ...prev, currentProduct: product }));
        return product;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return null;
    }
  }, []);

  /** Refresh products */
  const refreshProducts = useCallback(async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    await fetchProducts(true);
  }, [fetchProducts]);

  /** Load more products */
  const loadMoreProducts = useCallback(async () => {
    if (state.loading || !state.hasMore) return;
    await fetchProducts(false);
  }, [state.loading, state.hasMore, fetchProducts]);

  /** Fetch categories */
  const fetchCategories = useCallback(async () => {
    if (!dbProvider.current) return;

    try {
      const result = await dbProvider.current.query<Category>('categories', {
        orderBy: 'order',
        orderDirection: 'asc',
      });

      if (result.success && result.data) {
        // Build category tree
        const categoryMap = new Map<string, Category>();
        const rootCategories: Category[] = [];

        result.data.forEach(cat => {
          categoryMap.set(cat.id, { ...cat, children: [] });
        });

        result.data.forEach(cat => {
          const category = categoryMap.get(cat.id)!;
          if (cat.parentId) {
            const parent = categoryMap.get(cat.parentId);
            if (parent) {
              parent.children = parent.children || [];
              parent.children.push(category);
            }
          } else {
            rootCategories.push(category);
          }
        });

        setState(prev => ({ ...prev, categories: rootCategories }));
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  /** Fetch a single category */
  const fetchCategory = useCallback(async (id: string): Promise<Category | null> => {
    if (!dbProvider.current) return null;

    try {
      const result = await dbProvider.current.getById<Category>('categories', id);

      if (result.success && result.data) {
        const category = result.data;
        setState(prev => ({ ...prev, currentCategory: category }));
        return category;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch category:', error);
      return null;
    }
  }, []);

  /** Search products */
  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState(prev => ({
        ...prev,
        searchQuery: '',
        searchResults: [],
      }));
      return;
    }

    setState(prev => ({ ...prev, searchQuery: query, loading: true }));

    try {
      if (searchProvider.current) {
        // Use search provider if available
        const result = await searchProvider.current.search<Product>('products', {
          query,
          hitsPerPage: PAGE_SIZE,
          filter: state.filters.categoryId ? `categoryId = "${state.filters.categoryId}"` : undefined,
        });

        if (result.success && result.data) {
          setState(prev => ({
            ...prev,
            searchResults: result.data!.hits.map(hit => hit.document),
            totalProducts: result.data!.totalHits,
            loading: false,
          }));
        }
      } else if (dbProvider.current) {
        // Fallback to database query
        const queryBuilder = dbProvider.current.createQuery<Product>('products');
        queryBuilder.where('name', 'like', `%${query}%`);
        queryBuilder.limit(PAGE_SIZE);

        const result = await queryBuilder.get();

        if (result.success && result.data) {
          setState(prev => ({
            ...prev,
            searchResults: result.data!,
            loading: false,
          }));
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.filters.categoryId]);

  /** Get search suggestions */
  const getSuggestions = useCallback(async (query: string): Promise<string[]> => {
    if (!query.trim() || query.length < 2) return [];

    try {
      if (searchProvider.current) {
        const result = await searchProvider.current.search<Product>('products', {
          query,
          hitsPerPage: 5,
          attributesToRetrieve: ['name'],
        });

        if (result.success && result.data) {
          const suggestions = result.data.hits.map(hit => hit.document.name);
          setState(prev => ({ ...prev, searchSuggestions: suggestions }));
          return suggestions;
        }
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }

    return [];
  }, []);

  /** Clear search */
  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      searchResults: [],
      searchSuggestions: [],
    }));
  }, []);

  /** Set filters */
  const setFilters = useCallback((newFilters: Partial<ProductFilter>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      page: 0,
    }));
  }, []);

  /** Clear filters */
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: defaultFilters,
      page: 0,
    }));
  }, []);

  /** Set sort */
  const setSort = useCallback((sort: ProductSortOption) => {
    setState(prev => ({
      ...prev,
      sort,
      page: 0,
    }));
  }, []);

  /** Set view mode */
  const setViewMode = useCallback((mode: 'grid' | 'list') => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  /** Fetch reviews */
  const fetchReviews = useCallback(async (
    productId: string,
    page = 0
  ): Promise<PaginatedResponse<ProductReview>> => {
    if (!dbProvider.current) {
      return { items: [], total: 0, page: 0, limit: PAGE_SIZE, hasMore: false };
    }

    try {
      const queryBuilder = dbProvider.current.createQuery<ProductReview>('reviews');
      queryBuilder.where('productId', '==', productId);
      queryBuilder.where('isApproved', '==', true);
      queryBuilder.orderBy('createdAt', 'desc');
      queryBuilder.limit(PAGE_SIZE).offset(page * PAGE_SIZE);

      const result = await queryBuilder.get();

      if (result.success && result.data) {
        return {
          items: result.data,
          total: result.data.length,
          page,
          limit: PAGE_SIZE,
          hasMore: result.data.length === PAGE_SIZE,
        };
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }

    return { items: [], total: 0, page: 0, limit: PAGE_SIZE, hasMore: false };
  }, []);

  /** Add to favorites */
  const addToFavorites = useCallback(async (productId: string): Promise<boolean> => {
    try {
      setFavorites(prev => new Set([...prev, productId]));
      // TODO: Sync with backend
      return true;
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      return false;
    }
  }, []);

  /** Remove from favorites */
  const removeFromFavorites = useCallback(async (productId: string): Promise<boolean> => {
    try {
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      // TODO: Sync with backend
      return true;
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      return false;
    }
  }, []);

  /** Check if product is favorite */
  const isFavorite = useCallback((productId: string): boolean => {
    return favorites.has(productId);
  }, [favorites]);

  /** Clear current product */
  const clearCurrentProduct = useCallback(() => {
    setState(prev => ({ ...prev, currentProduct: null }));
  }, []);

  /** Clear current category */
  const clearCurrentCategory = useCallback(() => {
    setState(prev => ({ ...prev, currentCategory: null }));
  }, []);

  // Re-fetch products when filters or sort changes
  useEffect(() => {
    if (dbProvider.current?.isReady()) {
      fetchProducts(true);
    }
  }, [state.filters, state.sort]);

  const value: CatalogContextValue = {
    ...state,
    fetchProducts,
    fetchProduct,
    refreshProducts,
    loadMoreProducts,
    fetchCategories,
    fetchCategory,
    search,
    getSuggestions,
    clearSearch,
    setFilters,
    clearFilters,
    setSort,
    setViewMode,
    fetchReviews,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearCurrentProduct,
    clearCurrentCategory,
  };

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
}

/** Use Catalog hook */
export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}

/** Use Products hook */
export function useProducts() {
  const {
    products,
    loading,
    refreshing,
    error,
    hasMore,
    filters,
    sort,
    viewMode,
    fetchProducts,
    refreshProducts,
    loadMoreProducts,
    setFilters,
    clearFilters,
    setSort,
    setViewMode,
  } = useCatalog();

  return {
    products,
    loading,
    refreshing,
    error,
    hasMore,
    filters,
    sort,
    viewMode,
    fetchProducts,
    refreshProducts,
    loadMoreProducts,
    setFilters,
    clearFilters,
    setSort,
    setViewMode,
  };
}

/** Use Product hook */
export function useProduct(productId?: string) {
  const {
    currentProduct,
    loading,
    error,
    fetchProduct,
    fetchReviews,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearCurrentProduct,
  } = useCatalog();

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    }
    return () => {
      clearCurrentProduct();
    };
  }, [productId]);

  return {
    product: currentProduct,
    loading,
    error,
    fetchProduct,
    fetchReviews,
    addToFavorites,
    removeFromFavorites,
    isFavorite: productId ? isFavorite(productId) : false,
  };
}

/** Use Categories hook */
export function useCategories() {
  const {
    categories,
    currentCategory,
    fetchCategories,
    fetchCategory,
    clearCurrentCategory,
  } = useCatalog();

  return {
    categories,
    currentCategory,
    fetchCategories,
    fetchCategory,
    clearCurrentCategory,
  };
}

/** Use Search hook */
export function useSearch() {
  const {
    searchResults,
    searchQuery,
    searchSuggestions,
    loading,
    search,
    getSuggestions,
    clearSearch,
  } = useCatalog();

  return {
    results: searchResults,
    query: searchQuery,
    suggestions: searchSuggestions,
    loading,
    search,
    getSuggestions,
    clearSearch,
  };
}

export default CatalogContext;
