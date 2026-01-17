/**
 * Supabase Storage Provider
 * File storage operations using Supabase Storage
 *
 * Note: Requires @supabase/supabase-js package:
 * npm install @supabase/supabase-js
 */

import * as SecureStore from 'expo-secure-store';
import {
  IStorageProvider,
  IUploadTask,
  FileMetadata,
  UploadOptions,
  DownloadOptions,
  GetUrlOptions,
  ListOptions,
  UploadProgressCallback,
  StorageProviderOptions,
} from './StorageProvider.interface';
import { ApiResponse, Unsubscribe } from '../../types/common';

/** Supabase Storage configuration */
interface SupabaseStorageConfig {
  url: string;
  anonKey: string;
}

/** Create Supabase Storage Provider */
export function createSupabaseStorageProvider(
  config: SupabaseStorageConfig,
  options: StorageProviderOptions = {}
): IStorageProvider {
  const { url, anonKey } = config;
  const {
    defaultBucket = 'public',
    basePath = '',
    autoGenerateFilename = true,
  } = options;

  let supabaseClient: unknown = null;
  let ready = false;

  /** Custom storage adapter for Supabase */
  const createStorageAdapter = () => ({
    getItem: async (key: string): Promise<string | null> => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error('Failed to save to storage:', error);
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error('Failed to remove from storage:', error);
      }
    },
  });

  /** Initialize Supabase client */
  const initializeSupabase = async () => {
    if (supabaseClient) return supabaseClient;

    try {
      const { createClient } = await import('@supabase/supabase-js');

      supabaseClient = createClient(url, anonKey, {
        auth: {
          storage: createStorageAdapter(),
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });

      return supabaseClient;
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      throw new Error('Supabase SDK not installed. Run: npm install @supabase/supabase-js');
    }
  };

  /** Generate unique filename */
  const generateFilename = (originalName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop() || '';
    return `${timestamp}-${random}.${extension}`;
  };

  /** Build full path */
  const buildPath = (path: string): string => {
    if (basePath) {
      return `${basePath}/${path}`.replace(/\/+/g, '/');
    }
    return path;
  };

  /** Get content type from file or data */
  const getContentType = (file: Blob | File | string): string => {
    if (file instanceof File) {
      return file.type || 'application/octet-stream';
    }
    if (file instanceof Blob) {
      return file.type || 'application/octet-stream';
    }
    // base64 string
    const mimeMatch = file.match(/data:([^;]+);/);
    return mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  };

  /** Convert base64 to Blob */
  const base64ToBlob = (base64: string): Blob => {
    const base64Data = base64.split(',')[1] || base64;
    const mimeMatch = base64.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  /** Convert Supabase file object to FileMetadata */
  const fileToMetadata = (
    file: {
      name: string;
      id: string;
      metadata: {
        size: number;
        mimetype: string;
      };
      created_at: string;
      updated_at: string;
    },
    path: string,
    publicUrl: string
  ): FileMetadata => ({
    id: file.id,
    name: file.name,
    path,
    size: file.metadata?.size || 0,
    mimeType: file.metadata?.mimetype || 'application/octet-stream',
    url: publicUrl,
    createdAt: file.created_at,
    updatedAt: file.updated_at,
  });

  const provider: IStorageProvider = {
    name: 'supabase',
    type: 'storage',

    async initialize(): Promise<void> {
      await initializeSupabase();
      ready = true;
    },

    isReady(): boolean {
      return ready;
    },

    async dispose(): Promise<void> {
      supabaseClient = null;
      ready = false;
    },

    async upload(
      file: Blob | File | string,
      uploadOptions?: UploadOptions
    ): Promise<ApiResponse<FileMetadata>> {
      try {
        const client = await initializeSupabase() as {
          storage: {
            from: (bucket: string) => {
              upload: (
                path: string,
                file: Blob | File,
                options?: { contentType?: string; upsert?: boolean }
              ) => Promise<{ data: { path: string } | null; error: { message: string } | null }>;
              getPublicUrl: (path: string) => { data: { publicUrl: string } };
            };
          };
        };

        let fileData: Blob | File;
        let fileName = uploadOptions?.fileName || 'file';

        if (file instanceof File) {
          fileData = file;
          fileName = uploadOptions?.fileName || file.name;
        } else if (file instanceof Blob) {
          fileData = file;
        } else {
          fileData = base64ToBlob(file);
        }

        if (autoGenerateFilename) {
          fileName = generateFilename(fileName);
        }

        const path = buildPath(uploadOptions?.path || fileName);
        const bucket = defaultBucket;

        const { data, error } = await client.storage
          .from(bucket)
          .upload(path, fileData, {
            contentType: uploadOptions?.contentType || getContentType(file),
            upsert: uploadOptions?.overwrite,
          });

        if (error) {
          return {
            success: false,
            error: {
              code: 'UPLOAD_ERROR',
              message: error.message,
            },
          };
        }

        const { data: urlData } = client.storage.from(bucket).getPublicUrl(path);

        const metadata: FileMetadata = {
          id: data?.path || path,
          name: fileName,
          path: data?.path || path,
          size: fileData.size,
          mimeType: getContentType(file),
          url: urlData.publicUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return { success: true, data: metadata };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: err.message,
          },
        };
      }
    },

    uploadWithProgress(
      file: Blob | File | string,
      uploadOptions?: UploadOptions
    ): IUploadTask {
      const progressListeners: Set<UploadProgressCallback> = new Set();
      let isCancelled = false;

      // Supabase doesn't support upload progress natively
      // We simulate it with a single update at completion
      const promise = new Promise<ApiResponse<FileMetadata>>((resolve) => {
        if (isCancelled) {
          resolve({
            success: false,
            error: { code: 'CANCELLED', message: 'Upload was cancelled' },
          });
          return;
        }

        provider.upload(file, uploadOptions).then((result) => {
          if (result.success) {
            const fileSize = typeof file === 'string'
              ? file.length
              : (file as { size: number }).size;

            progressListeners.forEach((listener) =>
              listener({
                bytesUploaded: fileSize,
                totalBytes: fileSize,
                percentage: 100,
              })
            );
          }
          resolve(result);
        });
      });

      return {
        promise,
        pause: () => {
          // Not supported by Supabase
        },
        resume: () => {
          // Not supported by Supabase
        },
        cancel: () => {
          isCancelled = true;
        },
        onProgress: (callback: UploadProgressCallback): Unsubscribe => {
          progressListeners.add(callback);
          return () => {
            progressListeners.delete(callback);
          };
        },
      };
    },

    async download(
      path: string,
      downloadOptions?: DownloadOptions
    ): Promise<ApiResponse<Blob | string>> {
      try {
        const client = await initializeSupabase() as {
          storage: {
            from: (bucket: string) => {
              download: (path: string) => Promise<{ data: Blob | null; error: { message: string } | null }>;
            };
          };
        };

        const fullPath = buildPath(path);
        const { data, error } = await client.storage.from(defaultBucket).download(fullPath);

        if (error || !data) {
          return {
            success: false,
            error: {
              code: 'DOWNLOAD_ERROR',
              message: error?.message || 'Download failed',
            },
          };
        }

        if (downloadOptions?.responseType === 'base64') {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({ success: true, data: reader.result as string });
            };
            reader.readAsDataURL(data);
          });
        }

        return { success: true, data };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'DOWNLOAD_ERROR',
            message: err.message,
          },
        };
      }
    },

    async delete(path: string): Promise<ApiResponse<void>> {
      try {
        const client = await initializeSupabase() as {
          storage: {
            from: (bucket: string) => {
              remove: (paths: string[]) => Promise<{ error: { message: string } | null }>;
            };
          };
        };

        const fullPath = buildPath(path);
        const { error } = await client.storage.from(defaultBucket).remove([fullPath]);

        if (error) {
          return {
            success: false,
            error: {
              code: 'DELETE_ERROR',
              message: error.message,
            },
          };
        }

        return { success: true };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'DELETE_ERROR',
            message: err.message,
          },
        };
      }
    },

    async deleteMany(paths: string[]): Promise<ApiResponse<void>> {
      try {
        const client = await initializeSupabase() as {
          storage: {
            from: (bucket: string) => {
              remove: (paths: string[]) => Promise<{ error: { message: string } | null }>;
            };
          };
        };

        const fullPaths = paths.map((p) => buildPath(p));
        const { error } = await client.storage.from(defaultBucket).remove(fullPaths);

        if (error) {
          return {
            success: false,
            error: {
              code: 'DELETE_MANY_ERROR',
              message: error.message,
            },
          };
        }

        return { success: true };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'DELETE_MANY_ERROR',
            message: err.message,
          },
        };
      }
    },

    async getUrl(path: string, urlOptions?: GetUrlOptions): Promise<ApiResponse<string>> {
      try {
        const client = await initializeSupabase() as {
          storage: {
            from: (bucket: string) => {
              getPublicUrl: (path: string, options?: { transform?: { width?: number; height?: number; quality?: number; format?: string } }) => { data: { publicUrl: string } };
              createSignedUrl: (path: string, expiresIn: number, options?: { transform?: { width?: number; height?: number } }) => Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
            };
          };
        };

        const fullPath = buildPath(path);

        // If expiration is set, use signed URL
        if (urlOptions?.expiresIn) {
          const { data, error } = await client.storage
            .from(defaultBucket)
            .createSignedUrl(fullPath, urlOptions.expiresIn, {
              transform: urlOptions.transform ? {
                width: urlOptions.transform.width,
                height: urlOptions.transform.height,
              } : undefined,
            });

          if (error || !data) {
            return {
              success: false,
              error: {
                code: 'URL_ERROR',
                message: error?.message || 'Failed to create signed URL',
              },
            };
          }

          return { success: true, data: data.signedUrl };
        }

        // Otherwise, get public URL
        const { data } = client.storage.from(defaultBucket).getPublicUrl(fullPath, {
          transform: urlOptions?.transform ? {
            width: urlOptions.transform.width,
            height: urlOptions.transform.height,
            quality: urlOptions.transform.quality,
            format: urlOptions.transform.format,
          } : undefined,
        });

        return { success: true, data: data.publicUrl };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'URL_ERROR',
            message: err.message,
          },
        };
      }
    },

    async getMetadata(path: string): Promise<ApiResponse<FileMetadata>> {
      try {
        const client = await initializeSupabase() as {
          storage: {
            from: (bucket: string) => {
              list: (
                folder: string,
                options?: { limit?: number; search?: string }
              ) => Promise<{
                data: Array<{
                  name: string;
                  id: string;
                  metadata: { size: number; mimetype: string };
                  created_at: string;
                  updated_at: string;
                }> | null;
                error: { message: string } | null;
              }>;
              getPublicUrl: (path: string) => { data: { publicUrl: string } };
            };
          };
        };

        const fullPath = buildPath(path);
        const folder = fullPath.split('/').slice(0, -1).join('/');
        const fileName = fullPath.split('/').pop() || '';

        const { data, error } = await client.storage.from(defaultBucket).list(folder, {
          limit: 1,
          search: fileName,
        });

        if (error || !data || data.length === 0) {
          return {
            success: false,
            error: {
              code: 'METADATA_ERROR',
              message: error?.message || 'File not found',
            },
          };
        }

        const file = data[0];
        const { data: urlData } = client.storage.from(defaultBucket).getPublicUrl(fullPath);

        return {
          success: true,
          data: fileToMetadata(file, fullPath, urlData.publicUrl),
        };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'METADATA_ERROR',
            message: err.message,
          },
        };
      }
    },

    async list(path: string, listOptions?: ListOptions): Promise<ApiResponse<FileMetadata[]>> {
      try {
        const client = await initializeSupabase() as {
          storage: {
            from: (bucket: string) => {
              list: (
                folder: string,
                options?: { limit?: number; offset?: number; sortBy?: { column: string; order: string } }
              ) => Promise<{
                data: Array<{
                  name: string;
                  id: string;
                  metadata: { size: number; mimetype: string };
                  created_at: string;
                  updated_at: string;
                }> | null;
                error: { message: string } | null;
              }>;
              getPublicUrl: (path: string) => { data: { publicUrl: string } };
            };
          };
        };

        const fullPath = buildPath(path);

        const { data, error } = await client.storage.from(defaultBucket).list(fullPath, {
          limit: listOptions?.limit,
          offset: listOptions?.cursor ? parseInt(listOptions.cursor, 10) : undefined,
          sortBy: listOptions?.sortBy ? {
            column: listOptions.sortBy === 'createdAt' ? 'created_at' : listOptions.sortBy,
            order: listOptions.sortDirection || 'asc',
          } : undefined,
        });

        if (error) {
          return {
            success: false,
            error: {
              code: 'LIST_ERROR',
              message: error.message,
            },
          };
        }

        const files = (data || []).map((file) => {
          const filePath = `${fullPath}/${file.name}`.replace(/\/+/g, '/');
          const { data: urlData } = client.storage.from(defaultBucket).getPublicUrl(filePath);
          return fileToMetadata(file, filePath, urlData.publicUrl);
        });

        return { success: true, data: files };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'LIST_ERROR',
            message: err.message,
          },
        };
      }
    },

    async exists(path: string): Promise<ApiResponse<boolean>> {
      const result = await provider.getMetadata(path);
      return { success: true, data: result.success };
    },

    async copy(sourcePath: string, destinationPath: string): Promise<ApiResponse<FileMetadata>> {
      try {
        const client = await initializeSupabase() as {
          storage: {
            from: (bucket: string) => {
              copy: (from: string, to: string) => Promise<{
                data: { path: string } | null;
                error: { message: string } | null;
              }>;
              getPublicUrl: (path: string) => { data: { publicUrl: string } };
            };
          };
        };

        const fullSourcePath = buildPath(sourcePath);
        const fullDestPath = buildPath(destinationPath);

        const { data, error } = await client.storage
          .from(defaultBucket)
          .copy(fullSourcePath, fullDestPath);

        if (error || !data) {
          return {
            success: false,
            error: {
              code: 'COPY_ERROR',
              message: error?.message || 'Copy failed',
            },
          };
        }

        // Get metadata of the copied file
        return provider.getMetadata(fullDestPath);
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'COPY_ERROR',
            message: err.message,
          },
        };
      }
    },

    async move(sourcePath: string, destinationPath: string): Promise<ApiResponse<FileMetadata>> {
      try {
        const client = await initializeSupabase() as {
          storage: {
            from: (bucket: string) => {
              move: (from: string, to: string) => Promise<{
                data: { path: string } | null;
                error: { message: string } | null;
              }>;
              getPublicUrl: (path: string) => { data: { publicUrl: string } };
            };
          };
        };

        const fullSourcePath = buildPath(sourcePath);
        const fullDestPath = buildPath(destinationPath);

        const { data, error } = await client.storage
          .from(defaultBucket)
          .move(fullSourcePath, fullDestPath);

        if (error || !data) {
          return {
            success: false,
            error: {
              code: 'MOVE_ERROR',
              message: error?.message || 'Move failed',
            },
          };
        }

        // Get metadata of the moved file
        return provider.getMetadata(fullDestPath);
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'MOVE_ERROR',
            message: err.message,
          },
        };
      }
    },

    async createSignedUploadUrl(
      path: string,
      signedUrlOptions?: { expiresIn?: number }
    ): Promise<ApiResponse<string>> {
      try {
        const client = await initializeSupabase() as {
          storage: {
            from: (bucket: string) => {
              createSignedUploadUrl: (path: string) => Promise<{
                data: { signedUrl: string; token: string; path: string } | null;
                error: { message: string } | null;
              }>;
            };
          };
        };

        const fullPath = buildPath(path);

        const { data, error } = await client.storage
          .from(defaultBucket)
          .createSignedUploadUrl(fullPath);

        if (error || !data) {
          return {
            success: false,
            error: {
              code: 'SIGNED_URL_ERROR',
              message: error?.message || 'Failed to create signed upload URL',
            },
          };
        }

        return { success: true, data: data.signedUrl };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'SIGNED_URL_ERROR',
            message: err.message,
          },
        };
      }
    },
  };

  return provider;
}

export default createSupabaseStorageProvider;
