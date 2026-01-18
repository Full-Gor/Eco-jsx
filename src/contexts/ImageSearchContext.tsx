/**
 * Image Search Context
 * Visual product search functionality
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ImageSearchProvider } from '../providers/imageSearch';
import type { ImageSearchResult, ImageSearchOptions } from '../types/advanced';

/** Image search state */
interface ImageSearchState {
  isSearching: boolean;
  results: ImageSearchResult[];
  error: string | null;
  lastSearchedImage: string | null;
}

/** Image search context value */
interface ImageSearchContextValue extends ImageSearchState {
  /** Search by image (base64 or blob) */
  searchByImage: (image: string | Blob, options?: ImageSearchOptions) => Promise<ImageSearchResult[]>;
  /** Clear search results */
  clearResults: () => void;
  /** Check if provider is ready */
  isReady: boolean;
}

const ImageSearchContext = createContext<ImageSearchContextValue | null>(null);

/** Image search provider props */
interface ImageSearchProviderProps {
  children: React.ReactNode;
  provider: ImageSearchProvider;
}

/**
 * Image Search Provider Component
 */
export function ImageSearchProvider({ children, provider }: ImageSearchProviderProps) {
  const [state, setState] = useState<ImageSearchState>({
    isSearching: false,
    results: [],
    error: null,
    lastSearchedImage: null,
  });

  const [isReady, setIsReady] = useState(false);
  const initRef = useRef(false);

  // Initialize provider
  React.useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        await provider.initialize();
        if (provider.preloadModel) {
          await provider.preloadModel();
        }
        setIsReady(provider.isReady());
      } catch (error) {
        console.error('Failed to initialize image search provider:', error);
      }
    };

    init();

    return () => {
      provider.dispose();
    };
  }, [provider]);

  const searchByImage = useCallback(
    async (image: string | Blob, options?: ImageSearchOptions): Promise<ImageSearchResult[]> => {
      setState((prev) => ({
        ...prev,
        isSearching: true,
        error: null,
      }));

      try {
        const result = await provider.searchByImage(image, options);

        if (!result.success) {
          setState((prev) => ({
            ...prev,
            isSearching: false,
            error: result.error?.message || 'Search failed',
            results: [],
          }));
          return [];
        }

        const results = result.data || [];
        setState((prev) => ({
          ...prev,
          isSearching: false,
          results,
          lastSearchedImage: typeof image === 'string' ? image : URL.createObjectURL(image),
        }));

        return results;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSearching: false,
          error: String(error),
          results: [],
        }));
        return [];
      }
    },
    [provider]
  );

  const clearResults = useCallback(() => {
    setState({
      isSearching: false,
      results: [],
      error: null,
      lastSearchedImage: null,
    });
  }, []);

  const value: ImageSearchContextValue = {
    ...state,
    isReady,
    searchByImage,
    clearResults,
  };

  return (
    <ImageSearchContext.Provider value={value}>
      {children}
    </ImageSearchContext.Provider>
  );
}

/**
 * Hook to use image search
 */
export function useImageSearch(): ImageSearchContextValue {
  const context = useContext(ImageSearchContext);
  if (!context) {
    throw new Error('useImageSearch must be used within ImageSearchProvider');
  }
  return context;
}
