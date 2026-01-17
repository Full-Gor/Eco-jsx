/**
 * Firebase Storage Provider
 * File storage operations using Firebase Storage
 *
 * Note: Requires firebase package:
 * npm install firebase
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

/** Firebase Storage configuration */
interface FirebaseStorageConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId?: string;
  appId?: string;
}

/** Create Firebase Storage Provider */
export function createFirebaseStorageProvider(
  config: FirebaseStorageConfig,
  options: StorageProviderOptions = {}
): IStorageProvider {
  const { basePath = '', autoGenerateFilename = true } = options;

  let storage: unknown = null;
  let ready = false;

  /** Initialize Firebase Storage */
  const initializeFirebaseStorage = async () => {
    if (storage) return storage;

    try {
      const firebase = await import('firebase/app');
      const firebaseStorage = await import('firebase/storage');

      const apps = firebase.getApps();
      let app;
      if (apps.length === 0) {
        app = firebase.initializeApp(config);
      } else {
        app = apps[0];
      }

      storage = firebaseStorage.getStorage(app);
      return { storage, firebaseStorage };
    } catch (error) {
      console.error('Failed to initialize Firebase Storage:', error);
      throw new Error('Firebase SDK not installed. Run: npm install firebase');
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

  /** Convert Firebase StorageReference to FileMetadata */
  const refToMetadata = async (
    ref: unknown,
    firebaseStorage: {
      getMetadata: (ref: unknown) => Promise<{
        name: string;
        fullPath: string;
        size: number;
        contentType: string;
        timeCreated: string;
        updated: string;
        customMetadata?: Record<string, string>;
      }>;
      getDownloadURL: (ref: unknown) => Promise<string>;
    }
  ): Promise<FileMetadata> => {
    const [metadata, url] = await Promise.all([
      firebaseStorage.getMetadata(ref),
      firebaseStorage.getDownloadURL(ref),
    ]);

    return {
      id: metadata.fullPath,
      name: metadata.name,
      path: metadata.fullPath,
      size: metadata.size,
      mimeType: metadata.contentType || 'application/octet-stream',
      url,
      createdAt: metadata.timeCreated,
      updatedAt: metadata.updated,
      metadata: metadata.customMetadata,
    };
  };

  const provider: IStorageProvider = {
    name: 'firebase',
    type: 'storage',

    async initialize(): Promise<void> {
      await initializeFirebaseStorage();
      ready = true;
    },

    isReady(): boolean {
      return ready;
    },

    async dispose(): Promise<void> {
      storage = null;
      ready = false;
    },

    async upload(
      file: Blob | File | string,
      uploadOptions?: UploadOptions
    ): Promise<ApiResponse<FileMetadata>> {
      try {
        const { storage: storageInstance, firebaseStorage } = await initializeFirebaseStorage() as {
          storage: unknown;
          firebaseStorage: {
            ref: (storage: unknown, path: string) => unknown;
            uploadBytes: (ref: unknown, data: Blob, metadata?: { contentType?: string; customMetadata?: Record<string, string> }) => Promise<{ ref: unknown }>;
            getDownloadURL: (ref: unknown) => Promise<string>;
            getMetadata: (ref: unknown) => Promise<{
              name: string;
              fullPath: string;
              size: number;
              contentType: string;
              timeCreated: string;
              updated: string;
              customMetadata?: Record<string, string>;
            }>;
          };
        };

        let fileData: Blob;
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
        const storageRef = firebaseStorage.ref(storageInstance, path);

        const metadata: { contentType?: string; customMetadata?: Record<string, string> } = {};
        if (uploadOptions?.contentType || getContentType(file)) {
          metadata.contentType = uploadOptions?.contentType || getContentType(file);
        }
        if (uploadOptions?.metadata) {
          metadata.customMetadata = uploadOptions.metadata;
        }

        const snapshot = await firebaseStorage.uploadBytes(storageRef, fileData, metadata);
        const fileMetadata = await refToMetadata(snapshot.ref, firebaseStorage);

        return { success: true, data: fileMetadata };
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
      let uploadTask: {
        pause: () => boolean;
        resume: () => boolean;
        cancel: () => boolean;
        on: (
          event: string,
          next: (snapshot: { bytesTransferred: number; totalBytes: number }) => void,
          error: (error: Error) => void,
          complete: () => void
        ) => void;
        snapshot: { ref: unknown };
      } | null = null;

      const promise = new Promise<ApiResponse<FileMetadata>>((resolve) => {
        (async () => {
          try {
            const { storage: storageInstance, firebaseStorage } = await initializeFirebaseStorage() as {
              storage: unknown;
              firebaseStorage: {
                ref: (storage: unknown, path: string) => unknown;
                uploadBytesResumable: (
                  ref: unknown,
                  data: Blob,
                  metadata?: { contentType?: string; customMetadata?: Record<string, string> }
                ) => {
                  pause: () => boolean;
                  resume: () => boolean;
                  cancel: () => boolean;
                  on: (
                    event: string,
                    next: (snapshot: { bytesTransferred: number; totalBytes: number }) => void,
                    error: (error: Error) => void,
                    complete: () => void
                  ) => void;
                  snapshot: { ref: unknown };
                };
                getDownloadURL: (ref: unknown) => Promise<string>;
                getMetadata: (ref: unknown) => Promise<{
                  name: string;
                  fullPath: string;
                  size: number;
                  contentType: string;
                  timeCreated: string;
                  updated: string;
                  customMetadata?: Record<string, string>;
                }>;
              };
            };

            let fileData: Blob;
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
            const storageRef = firebaseStorage.ref(storageInstance, path);

            const metadata: { contentType?: string; customMetadata?: Record<string, string> } = {};
            if (uploadOptions?.contentType || getContentType(file)) {
              metadata.contentType = uploadOptions?.contentType || getContentType(file);
            }
            if (uploadOptions?.metadata) {
              metadata.customMetadata = uploadOptions.metadata;
            }

            uploadTask = firebaseStorage.uploadBytesResumable(storageRef, fileData, metadata);

            uploadTask.on(
              'state_changed',
              (snapshot) => {
                const progress = {
                  bytesUploaded: snapshot.bytesTransferred,
                  totalBytes: snapshot.totalBytes,
                  percentage: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                };
                progressListeners.forEach((listener) => listener(progress));
              },
              (error) => {
                resolve({
                  success: false,
                  error: {
                    code: 'UPLOAD_ERROR',
                    message: error.message,
                  },
                });
              },
              async () => {
                try {
                  const fileMetadata = await refToMetadata(uploadTask!.snapshot.ref, firebaseStorage);
                  resolve({ success: true, data: fileMetadata });
                } catch (error) {
                  const err = error as Error;
                  resolve({
                    success: false,
                    error: {
                      code: 'METADATA_ERROR',
                      message: err.message,
                    },
                  });
                }
              }
            );
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
          uploadTask?.pause();
        },
        resume: () => {
          uploadTask?.resume();
        },
        cancel: () => {
          uploadTask?.cancel();
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
        const { storage: storageInstance, firebaseStorage } = await initializeFirebaseStorage() as {
          storage: unknown;
          firebaseStorage: {
            ref: (storage: unknown, path: string) => unknown;
            getDownloadURL: (ref: unknown) => Promise<string>;
          };
        };

        const fullPath = buildPath(path);
        const storageRef = firebaseStorage.ref(storageInstance, fullPath);
        const url = await firebaseStorage.getDownloadURL(storageRef);

        const response = await fetch(url);
        const blob = await response.blob();

        if (downloadOptions?.responseType === 'base64') {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({ success: true, data: reader.result as string });
            };
            reader.readAsDataURL(blob);
          });
        }

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
      try {
        const { storage: storageInstance, firebaseStorage } = await initializeFirebaseStorage() as {
          storage: unknown;
          firebaseStorage: {
            ref: (storage: unknown, path: string) => unknown;
            deleteObject: (ref: unknown) => Promise<void>;
          };
        };

        const fullPath = buildPath(path);
        const storageRef = firebaseStorage.ref(storageInstance, fullPath);
        await firebaseStorage.deleteObject(storageRef);

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
        const { storage: storageInstance, firebaseStorage } = await initializeFirebaseStorage() as {
          storage: unknown;
          firebaseStorage: {
            ref: (storage: unknown, path: string) => unknown;
            deleteObject: (ref: unknown) => Promise<void>;
          };
        };

        await Promise.all(
          paths.map((path) => {
            const fullPath = buildPath(path);
            const storageRef = firebaseStorage.ref(storageInstance, fullPath);
            return firebaseStorage.deleteObject(storageRef);
          })
        );

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

    async getUrl(path: string, _urlOptions?: GetUrlOptions): Promise<ApiResponse<string>> {
      try {
        const { storage: storageInstance, firebaseStorage } = await initializeFirebaseStorage() as {
          storage: unknown;
          firebaseStorage: {
            ref: (storage: unknown, path: string) => unknown;
            getDownloadURL: (ref: unknown) => Promise<string>;
          };
        };

        const fullPath = buildPath(path);
        const storageRef = firebaseStorage.ref(storageInstance, fullPath);
        const url = await firebaseStorage.getDownloadURL(storageRef);

        return { success: true, data: url };
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
        const { storage: storageInstance, firebaseStorage } = await initializeFirebaseStorage() as {
          storage: unknown;
          firebaseStorage: {
            ref: (storage: unknown, path: string) => unknown;
            getMetadata: (ref: unknown) => Promise<{
              name: string;
              fullPath: string;
              size: number;
              contentType: string;
              timeCreated: string;
              updated: string;
              customMetadata?: Record<string, string>;
            }>;
            getDownloadURL: (ref: unknown) => Promise<string>;
          };
        };

        const fullPath = buildPath(path);
        const storageRef = firebaseStorage.ref(storageInstance, fullPath);
        const metadata = await refToMetadata(storageRef, firebaseStorage);

        return { success: true, data: metadata };
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
        const { storage: storageInstance, firebaseStorage } = await initializeFirebaseStorage() as {
          storage: unknown;
          firebaseStorage: {
            ref: (storage: unknown, path: string) => unknown;
            list: (ref: unknown, options?: { maxResults?: number; pageToken?: string }) => Promise<{
              items: unknown[];
              nextPageToken?: string;
            }>;
            getMetadata: (ref: unknown) => Promise<{
              name: string;
              fullPath: string;
              size: number;
              contentType: string;
              timeCreated: string;
              updated: string;
              customMetadata?: Record<string, string>;
            }>;
            getDownloadURL: (ref: unknown) => Promise<string>;
          };
        };

        const fullPath = buildPath(path);
        const storageRef = firebaseStorage.ref(storageInstance, fullPath);

        const result = await firebaseStorage.list(storageRef, {
          maxResults: listOptions?.limit,
          pageToken: listOptions?.cursor,
        });

        const metadataPromises = result.items.map((item) =>
          refToMetadata(item, firebaseStorage)
        );
        const files = await Promise.all(metadataPromises);

        // Sort if requested
        if (listOptions?.sortBy) {
          files.sort((a, b) => {
            let comparison = 0;
            switch (listOptions.sortBy) {
              case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
              case 'size':
                comparison = a.size - b.size;
                break;
              case 'createdAt':
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
            }
            return listOptions.sortDirection === 'desc' ? -comparison : comparison;
          });
        }

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
      try {
        const result = await provider.getMetadata(path);
        return { success: true, data: result.success };
      } catch {
        return { success: true, data: false };
      }
    },
  };

  return provider;
}

export default createFirebaseStorageProvider;
