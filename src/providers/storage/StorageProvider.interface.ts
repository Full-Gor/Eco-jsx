/**
 * Storage Provider Interface
 * Defines the contract for all storage providers
 */

import { ApiResponse, Callback, Unsubscribe } from '../../types/common';
import { BaseProvider } from '../types';

/** File metadata */
export interface FileMetadata {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  metadata?: Record<string, unknown>;
}

/** Upload options */
export interface UploadOptions {
  /** File path/key */
  path?: string;

  /** Custom file name */
  fileName?: string;

  /** Content type */
  contentType?: string;

  /** File visibility */
  visibility?: 'public' | 'private';

  /** Custom metadata */
  metadata?: Record<string, string>;

  /** Overwrite if exists */
  overwrite?: boolean;

  /** Generate thumbnail (for images) */
  generateThumbnail?: boolean;
}

/** Download options */
export interface DownloadOptions {
  /** Save as filename */
  saveAs?: string;

  /** Return as blob or base64 */
  responseType?: 'blob' | 'base64' | 'arraybuffer';
}

/** Upload progress event */
export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
}

/** Upload progress callback */
export type UploadProgressCallback = Callback<UploadProgress>;

/** Upload task interface */
export interface IUploadTask {
  /** Promise that resolves when upload completes */
  promise: Promise<ApiResponse<FileMetadata>>;

  /** Pause upload */
  pause(): void;

  /** Resume upload */
  resume(): void;

  /** Cancel upload */
  cancel(): void;

  /** Subscribe to progress updates */
  onProgress(callback: UploadProgressCallback): Unsubscribe;
}

/** Storage provider interface */
export interface IStorageProvider extends BaseProvider {
  /**
   * Upload a file
   * @param file - File to upload (Blob, File, or base64 string)
   * @param options - Upload options
   * @returns Promise with file metadata
   */
  upload(
    file: Blob | File | string,
    options?: UploadOptions
  ): Promise<ApiResponse<FileMetadata>>;

  /**
   * Upload a file with progress tracking
   * @param file - File to upload
   * @param options - Upload options
   * @returns Upload task with progress events
   */
  uploadWithProgress(
    file: Blob | File | string,
    options?: UploadOptions
  ): IUploadTask;

  /**
   * Download a file
   * @param path - File path
   * @param options - Download options
   * @returns Promise with file data
   */
  download(
    path: string,
    options?: DownloadOptions
  ): Promise<ApiResponse<Blob | string>>;

  /**
   * Delete a file
   * @param path - File path
   * @returns Promise with success status
   */
  delete(path: string): Promise<ApiResponse<void>>;

  /**
   * Delete multiple files
   * @param paths - Array of file paths
   * @returns Promise with success status
   */
  deleteMany(paths: string[]): Promise<ApiResponse<void>>;

  /**
   * Get file URL
   * @param path - File path
   * @param options - URL options
   * @returns Promise with public URL
   */
  getUrl(
    path: string,
    options?: GetUrlOptions
  ): Promise<ApiResponse<string>>;

  /**
   * Get file metadata
   * @param path - File path
   * @returns Promise with file metadata
   */
  getMetadata(path: string): Promise<ApiResponse<FileMetadata>>;

  /**
   * List files in a directory
   * @param path - Directory path
   * @param options - List options
   * @returns Promise with array of file metadata
   */
  list(path: string, options?: ListOptions): Promise<ApiResponse<FileMetadata[]>>;

  /**
   * Check if file exists
   * @param path - File path
   * @returns Promise with existence status
   */
  exists(path: string): Promise<ApiResponse<boolean>>;

  /**
   * Copy a file
   * @param sourcePath - Source file path
   * @param destinationPath - Destination file path
   * @returns Promise with new file metadata
   */
  copy?(sourcePath: string, destinationPath: string): Promise<ApiResponse<FileMetadata>>;

  /**
   * Move a file
   * @param sourcePath - Source file path
   * @param destinationPath - Destination file path
   * @returns Promise with new file metadata
   */
  move?(sourcePath: string, destinationPath: string): Promise<ApiResponse<FileMetadata>>;

  /**
   * Create a signed upload URL
   * @param path - File path
   * @param options - Signed URL options
   * @returns Promise with signed URL
   */
  createSignedUploadUrl?(
    path: string,
    options?: SignedUrlOptions
  ): Promise<ApiResponse<string>>;
}

/** Get URL options */
export interface GetUrlOptions {
  /** URL expiration in seconds */
  expiresIn?: number;

  /** Force download */
  download?: boolean;

  /** Transform options (for images) */
  transform?: ImageTransformOptions;
}

/** Image transform options */
export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill';
}

/** List options */
export interface ListOptions {
  /** Maximum number of files to return */
  limit?: number;

  /** Pagination cursor */
  cursor?: string;

  /** Sort by field */
  sortBy?: 'name' | 'createdAt' | 'size';

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/** Signed URL options */
export interface SignedUrlOptions {
  /** URL expiration in seconds */
  expiresIn?: number;

  /** Maximum file size in bytes */
  maxFileSize?: number;

  /** Allowed content types */
  allowedContentTypes?: string[];
}

/** Storage provider options */
export interface StorageProviderOptions {
  /** Default bucket/container */
  defaultBucket?: string;

  /** Base path prefix */
  basePath?: string;

  /** Maximum file size */
  maxFileSize?: number;

  /** Allowed file types */
  allowedFileTypes?: string[];

  /** Auto generate unique filenames */
  autoGenerateFilename?: boolean;
}
