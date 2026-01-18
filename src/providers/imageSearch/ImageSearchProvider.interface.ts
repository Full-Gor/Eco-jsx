/**
 * ImageSearch Provider Interface
 * Visual product search using image recognition
 */

import type { BaseProvider, ApiResponse } from '../types';
import type {
  ImageSearchResult,
  ImageSearchOptions,
  IndexedImage,
} from '../../types/advanced';

/** ImageSearch provider configuration */
export interface ImageSearchProviderConfig {
  apiUrl?: string;
  apiKey?: string;
  modelPath?: string;
  debug?: boolean;
}

/** ImageSearch provider interface */
export interface ImageSearchProvider extends BaseProvider {
  type: 'imageSearch';

  /**
   * Search for products by image
   * @param image - Base64 image string or Blob
   * @param options - Search options
   */
  searchByImage(
    image: string | Blob,
    options?: ImageSearchOptions
  ): Promise<ApiResponse<ImageSearchResult[]>>;

  /**
   * Index a product image for search
   * @param productId - Product ID
   * @param imageUrl - Image URL to index
   */
  indexProductImage(
    productId: string,
    imageUrl: string
  ): Promise<ApiResponse<IndexedImage>>;

  /**
   * Remove product from image index
   * @param productId - Product ID to remove
   */
  removeFromIndex(productId: string): Promise<ApiResponse<void>>;

  /**
   * Check if model/service is ready
   */
  isModelReady(): boolean;

  /**
   * Preload model (for TensorFlow.js)
   */
  preloadModel?(): Promise<void>;
}

export type { ImageSearchProviderConfig as ImageSearchConfig };
