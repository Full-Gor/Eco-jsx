/**
 * NexusServ Storage Provider
 * File storage operations using NexusServ API (self-hosted)
 */

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

/** NexusServ Storage configuration */
interface NexusServStorageConfig {
  apiUrl: string;
  cdnUrl?: string;
}

/** Create NexusServ Storage Provider */
export function createNexusServStorageProvider(
  config: NexusServStorageConfig,
  options: StorageProviderOptions = {}
): IStorageProvider {
  const { apiUrl, cdnUrl } = config;
  const { basePath = '', autoGenerateFilename = true } = options;

  let ready = false;
  let authToken: string | null = null;

  /** Get auth token from storage */
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const SecureStore = await import('expo-secure-store');
      return await SecureStore.getItemAsync('nexusserv_access_token');
    } catch {
      return authToken;
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

  /** Make API request */
  const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const token = await getAuthToken();

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code || 'API_ERROR',
            message: data.message || 'Request failed',
          },
        };
      }

      return { success: true, data: data.data || data };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err.message,
        },
      };
    }
  };

  const provider: IStorageProvider = {
    name: 'nexusserv',
    type: 'storage',

    async initialize(): Promise<void> {
      ready = true;
    },

    isReady(): boolean {
      return ready;
    },

    async dispose(): Promise<void> {
      ready = false;
    },

    async upload(
      file: Blob | File | string,
      uploadOptions?: UploadOptions
    ): Promise<ApiResponse<FileMetadata>> {
      try {
        const token = await getAuthToken();
        const formData = new FormData();

        let fileName = uploadOptions?.fileName || 'file';

        if (file instanceof File) {
          fileName = uploadOptions?.fileName || file.name;
          formData.append('file', file);
        } else if (file instanceof Blob) {
          formData.append('file', file, fileName);
        } else {
          // base64 string
          const base64Data = file.split(',')[1] || file;
          const mimeMatch = file.match(/data:([^;]+);/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          formData.append('file', blob, fileName);
        }

        if (autoGenerateFilename) {
          fileName = generateFilename(fileName);
        }

        const path = buildPath(uploadOptions?.path || fileName);
        formData.append('path', path);

        if (uploadOptions?.visibility) {
          formData.append('visibility', uploadOptions.visibility);
        }

        if (uploadOptions?.metadata) {
          formData.append('metadata', JSON.stringify(uploadOptions.metadata));
        }

        if (uploadOptions?.generateThumbnail) {
          formData.append('generateThumbnail', 'true');
        }

        const response = await fetch(`${apiUrl}/storage/upload`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: {
              code: data.code || 'UPLOAD_ERROR',
              message: data.message || 'Upload failed',
            },
          };
        }

        return { success: true, data: data.data || data };
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
      let isPaused = false;
      let isCancelled = false;
      let xhr: XMLHttpRequest | null = null;

      const promise = new Promise<ApiResponse<FileMetadata>>((resolve, reject) => {
        (async () => {
          try {
            const token = await getAuthToken();
            const formData = new FormData();

            let fileName = uploadOptions?.fileName || 'file';

            if (file instanceof File) {
              fileName = uploadOptions?.fileName || file.name;
              formData.append('file', file);
            } else if (file instanceof Blob) {
              formData.append('file', file, fileName);
            } else {
              // base64 string
              const base64Data = file.split(',')[1] || file;
              const mimeMatch = file.match(/data:([^;]+);/);
              const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: mimeType });
              formData.append('file', blob, fileName);
            }

            if (autoGenerateFilename) {
              fileName = generateFilename(fileName);
            }

            const path = buildPath(uploadOptions?.path || fileName);
            formData.append('path', path);

            xhr = new XMLHttpRequest();
            xhr.open('POST', `${apiUrl}/storage/upload`);

            if (token) {
              xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable && !isPaused) {
                const progress = {
                  bytesUploaded: event.loaded,
                  totalBytes: event.total,
                  percentage: Math.round((event.loaded / event.total) * 100),
                };
                progressListeners.forEach((listener) => listener(progress));
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr!.status >= 200 && xhr!.status < 300) {
                const data = JSON.parse(xhr!.responseText);
                resolve({ success: true, data: data.data || data });
              } else {
                const data = JSON.parse(xhr!.responseText);
                resolve({
                  success: false,
                  error: {
                    code: data.code || 'UPLOAD_ERROR',
                    message: data.message || 'Upload failed',
                  },
                });
              }
            });

            xhr.addEventListener('error', () => {
              resolve({
                success: false,
                error: {
                  code: 'NETWORK_ERROR',
                  message: 'Upload failed due to network error',
                },
              });
            });

            xhr.addEventListener('abort', () => {
              resolve({
                success: false,
                error: {
                  code: 'CANCELLED',
                  message: 'Upload was cancelled',
                },
              });
            });

            xhr.send(formData);
          } catch (error) {
            const err = error as Error;
            resolve({
              success: false,
              error: {
                code: 'UPLOAD_ERROR',
                message: err.message,
              },
            });
          }
        })();
      });

      return {
        promise,
        pause: () => {
          isPaused = true;
        },
        resume: () => {
          isPaused = false;
        },
        cancel: () => {
          isCancelled = true;
          if (xhr) {
            xhr.abort();
          }
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
        const token = await getAuthToken();
        const fullPath = buildPath(path);

        const response = await fetch(`${apiUrl}/storage/download/${encodeURIComponent(fullPath)}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          return {
            success: false,
            error: {
              code: 'DOWNLOAD_ERROR',
              message: 'Download failed',
            },
          };
        }

        if (downloadOptions?.responseType === 'base64') {
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({ success: true, data: reader.result as string });
            };
            reader.readAsDataURL(blob);
          });
        }

        if (downloadOptions?.responseType === 'arraybuffer') {
          const buffer = await response.arrayBuffer();
          return {
            success: true,
            data: new Blob([buffer]),
          };
        }

        const blob = await response.blob();
        return { success: true, data: blob };
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
      const fullPath = buildPath(path);
      return apiRequest<void>(`/storage/delete/${encodeURIComponent(fullPath)}`, {
        method: 'DELETE',
      });
    },

    async deleteMany(paths: string[]): Promise<ApiResponse<void>> {
      const fullPaths = paths.map((p) => buildPath(p));
      return apiRequest<void>('/storage/delete-many', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paths: fullPaths }),
      });
    },

    async getUrl(path: string, urlOptions?: GetUrlOptions): Promise<ApiResponse<string>> {
      const fullPath = buildPath(path);

      if (cdnUrl) {
        let url = `${cdnUrl}/${fullPath}`;

        if (urlOptions?.transform) {
          const params = new URLSearchParams();
          if (urlOptions.transform.width) params.append('w', urlOptions.transform.width.toString());
          if (urlOptions.transform.height) params.append('h', urlOptions.transform.height.toString());
          if (urlOptions.transform.quality) params.append('q', urlOptions.transform.quality.toString());
          if (urlOptions.transform.format) params.append('f', urlOptions.transform.format);
          if (urlOptions.transform.fit) params.append('fit', urlOptions.transform.fit);

          const queryString = params.toString();
          if (queryString) {
            url += `?${queryString}`;
          }
        }

        return { success: true, data: url };
      }

      // Get signed URL from API
      return apiRequest<string>(`/storage/url/${encodeURIComponent(fullPath)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expiresIn: urlOptions?.expiresIn,
          download: urlOptions?.download,
          transform: urlOptions?.transform,
        }),
      });
    },

    async getMetadata(path: string): Promise<ApiResponse<FileMetadata>> {
      const fullPath = buildPath(path);
      return apiRequest<FileMetadata>(`/storage/metadata/${encodeURIComponent(fullPath)}`);
    },

    async list(path: string, listOptions?: ListOptions): Promise<ApiResponse<FileMetadata[]>> {
      const fullPath = buildPath(path);
      const params = new URLSearchParams();

      if (listOptions?.limit) params.append('limit', listOptions.limit.toString());
      if (listOptions?.cursor) params.append('cursor', listOptions.cursor);
      if (listOptions?.sortBy) params.append('sortBy', listOptions.sortBy);
      if (listOptions?.sortDirection) params.append('sortDirection', listOptions.sortDirection);

      const queryString = params.toString();
      return apiRequest<FileMetadata[]>(
        `/storage/list/${encodeURIComponent(fullPath)}${queryString ? `?${queryString}` : ''}`
      );
    },

    async exists(path: string): Promise<ApiResponse<boolean>> {
      const fullPath = buildPath(path);
      return apiRequest<boolean>(`/storage/exists/${encodeURIComponent(fullPath)}`);
    },

    async copy(sourcePath: string, destinationPath: string): Promise<ApiResponse<FileMetadata>> {
      return apiRequest<FileMetadata>('/storage/copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: buildPath(sourcePath),
          destination: buildPath(destinationPath),
        }),
      });
    },

    async move(sourcePath: string, destinationPath: string): Promise<ApiResponse<FileMetadata>> {
      return apiRequest<FileMetadata>('/storage/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: buildPath(sourcePath),
          destination: buildPath(destinationPath),
        }),
      });
    },

    async createSignedUploadUrl(path: string, signedUrlOptions?: { expiresIn?: number; maxFileSize?: number; allowedContentTypes?: string[] }): Promise<ApiResponse<string>> {
      return apiRequest<string>('/storage/signed-upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: buildPath(path),
          expiresIn: signedUrlOptions?.expiresIn,
          maxFileSize: signedUrlOptions?.maxFileSize,
          allowedContentTypes: signedUrlOptions?.allowedContentTypes,
        }),
      });
    },
  };

  return provider;
}

export default createNexusServStorageProvider;
