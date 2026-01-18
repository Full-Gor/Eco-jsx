/**
 * TensorFlow.js Image Search Provider
 * Self-hosted visual search using MobileNet or custom model
 */

import type { ApiResponse } from '../types';
import type { ImageSearchProvider, ImageSearchProviderConfig } from './ImageSearchProvider.interface';
import type {
  ImageSearchResult,
  ImageSearchOptions,
  IndexedImage,
} from '../../types/advanced';
import type { Product } from '../../types/product';

/** TensorFlow-specific configuration */
export interface TensorFlowImageSearchConfig extends ImageSearchProviderConfig {
  /** Backend API URL for search requests */
  apiUrl: string;
  /** Path to custom model (optional) */
  modelPath?: string;
  /** Feature extraction endpoint */
  extractFeaturesEndpoint?: string;
  /** Search endpoint */
  searchEndpoint?: string;
  /** Index endpoint */
  indexEndpoint?: string;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Create TensorFlow.js image search provider
 * Uses backend service with TensorFlow for feature extraction and matching
 */
export function createTensorFlowImageSearchProvider(
  config: TensorFlowImageSearchConfig
): ImageSearchProvider {
  const {
    apiUrl,
    extractFeaturesEndpoint = '/extract-features',
    searchEndpoint = '/search',
    indexEndpoint = '/index',
    debug = false,
  } = config;

  let isInitialized = false;
  let modelReady = false;

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log('[TensorFlowImageSearch]', ...args);
    }
  };

  /** Make API request */
  const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: error.message || `HTTP ${response.status}`,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      log('API error:', error);
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: String(error) },
      };
    }
  };

  /** Convert image to base64 if needed */
  const imageToBase64 = async (image: string | Blob): Promise<string> => {
    if (typeof image === 'string') {
      // Already base64 or data URL
      if (image.startsWith('data:')) {
        return image.split(',')[1] || image;
      }
      return image;
    }

    // Convert Blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(image);
    });
  };

  return {
    name: 'tensorflow-image-search',
    type: 'imageSearch',

    async initialize(): Promise<void> {
      if (isInitialized) return;

      log('Initializing TensorFlow image search provider');

      // Check if backend is available
      const healthCheck = await apiRequest<{ status: string; modelLoaded: boolean }>(
        '/health'
      );

      if (healthCheck.success && healthCheck.data) {
        modelReady = healthCheck.data.modelLoaded;
        log('Backend status:', healthCheck.data);
      }

      isInitialized = true;
    },

    isReady(): boolean {
      return isInitialized && modelReady;
    },

    isModelReady(): boolean {
      return modelReady;
    },

    async preloadModel(): Promise<void> {
      log('Requesting model preload');
      const result = await apiRequest<{ loaded: boolean }>('/preload-model', {
        method: 'POST',
      });
      if (result.success && result.data?.loaded) {
        modelReady = true;
      }
    },

    async dispose(): Promise<void> {
      isInitialized = false;
      modelReady = false;
      log('Provider disposed');
    },

    async searchByImage(
      image: string | Blob,
      options?: ImageSearchOptions
    ): Promise<ApiResponse<ImageSearchResult[]>> {
      if (!isInitialized) {
        return {
          success: false,
          error: { code: 'NOT_INITIALIZED', message: 'Provider not initialized' },
        };
      }

      try {
        log('Searching by image, options:', options);

        const base64Image = await imageToBase64(image);

        const result = await apiRequest<{
          results: Array<{
            productId: string;
            similarity: number;
            product: Product;
            matchedFeatures?: string[];
          }>;
        }>(searchEndpoint, {
          method: 'POST',
          body: JSON.stringify({
            image: base64Image,
            limit: options?.limit || 20,
            minSimilarity: options?.minSimilarity || 0.5,
            categories: options?.categories,
          }),
        });

        if (!result.success) {
          return { success: false, error: result.error };
        }

        log('Search results:', result.data?.results.length);
        return { success: true, data: result.data?.results || [] };
      } catch (error) {
        log('Search error:', error);
        return {
          success: false,
          error: { code: 'SEARCH_ERROR', message: String(error) },
        };
      }
    },

    async indexProductImage(
      productId: string,
      imageUrl: string
    ): Promise<ApiResponse<IndexedImage>> {
      if (!isInitialized) {
        return {
          success: false,
          error: { code: 'NOT_INITIALIZED', message: 'Provider not initialized' },
        };
      }

      log('Indexing product image:', productId, imageUrl);

      const result = await apiRequest<IndexedImage>(indexEndpoint, {
        method: 'POST',
        body: JSON.stringify({ productId, imageUrl }),
      });

      return result;
    },

    async removeFromIndex(productId: string): Promise<ApiResponse<void>> {
      if (!isInitialized) {
        return {
          success: false,
          error: { code: 'NOT_INITIALIZED', message: 'Provider not initialized' },
        };
      }

      log('Removing from index:', productId);

      return apiRequest<void>(`${indexEndpoint}/${productId}`, {
        method: 'DELETE',
      });
    },
  };
}

