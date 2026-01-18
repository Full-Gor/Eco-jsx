/**
 * Firebase Database Provider
 * Database operations using Firebase Firestore
 *
 * Note: Requires firebase package:
 * npm install firebase
 */

import {
  IDatabaseProvider,
  IQueryBuilder,
  ITransaction,
  DatabaseChangeEvent,
  DatabaseChangeCallback,
  DatabaseProviderOptions,
} from './DatabaseProvider.interface';
import { ApiResponse, Unsubscribe, FilterCondition } from '../../types/common';
import { QueryOptions, SubscriptionOptions } from '../types';

/** Firebase configuration */
interface FirebaseDatabaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

/** Create Firebase Database Provider */
export function createFirebaseDatabaseProvider(
  config: FirebaseDatabaseConfig,
  options: DatabaseProviderOptions = {}
): IDatabaseProvider {
  const { enableLogging = false } = options;

  let firestore: unknown = null;
  let ready = false;

  /** Log if enabled */
  const log = (...args: unknown[]) => {
    if (enableLogging) {
      console.log('[FirebaseDB]', ...args);
    }
  };

  /** Initialize Firebase */
  const initializeFirebase = async () => {
    if (firestore) return firestore;

    try {
      const firebase = await import('firebase/app');
      const firestoreModule = await import('firebase/firestore');

      const apps = firebase.getApps();
      let app;
      if (apps.length === 0) {
        app = firebase.initializeApp(config);
      } else {
        app = apps[0];
      }

      firestore = firestoreModule.getFirestore(app);
      return { firestore, firestoreModule };
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw new Error('Firebase SDK not installed. Run: npm install firebase');
    }
  };

  /** Map Firestore operator to Firebase operator */
  const mapOperator = (op: string): string => {
    const operators: Record<string, string> = {
      '=': '==',
      '==': '==',
      '!=': '!=',
      '<': '<',
      '<=': '<=',
      '>': '>',
      '>=': '>=',
      in: 'in',
      'not-in': 'not-in',
      'array-contains': 'array-contains',
      'array-contains-any': 'array-contains-any',
    };
    return operators[op] || '==';
  };

  /** Convert Firestore document to plain object */
  const docToObject = <T>(doc: unknown): T => {
    const d = doc as {
      id: string;
      data: () => Record<string, unknown>;
      exists: () => boolean;
    };
    if (!d.exists()) return null as T;
    return { id: d.id, ...d.data() } as T;
  };

  /** Create query builder */
  const createQueryBuilder = <T>(collection: string): IQueryBuilder<T> => {
    const conditions: { field: string; operator: string; value: unknown }[] = [];
    let orderByField: string | undefined;
    let orderDirection: 'asc' | 'desc' = 'asc';
    let limitCount: number | undefined;
    let offsetCount: number | undefined;
    let selectedFields: string[] = [];

    const builder: IQueryBuilder<T> = {
      where(field: string, operator: string, value: unknown) {
        conditions.push({ field, operator: mapOperator(operator), value });
        return builder;
      },

      orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
        orderByField = field;
        orderDirection = direction;
        return builder;
      },

      limit(count: number) {
        limitCount = count;
        return builder;
      },

      offset(count: number) {
        offsetCount = count;
        return builder;
      },

      select(fields: string[]) {
        selectedFields = fields;
        return builder;
      },

      async get(): Promise<ApiResponse<T[]>> {
        try {
          const { firestore: fs, firestoreModule } = await initializeFirebase() as {
            firestore: unknown;
            firestoreModule: {
              collection: (db: unknown, path: string) => unknown;
              query: (ref: unknown, ...constraints: unknown[]) => unknown;
              where: (field: string, op: string, value: unknown) => unknown;
              orderBy: (field: string, direction: string) => unknown;
              limit: (count: number) => unknown;
              getDocs: (query: unknown) => Promise<{ docs: unknown[] }>;
            };
          };

          let q = firestoreModule.collection(fs, collection);
          const constraints: unknown[] = [];

          conditions.forEach((c) => {
            constraints.push(firestoreModule.where(c.field, c.operator, c.value));
          });

          if (orderByField) {
            constraints.push(firestoreModule.orderBy(orderByField, orderDirection));
          }

          if (limitCount) {
            constraints.push(firestoreModule.limit(limitCount));
          }

          if (constraints.length > 0) {
            q = firestoreModule.query(q, ...constraints);
          }

          const snapshot = await firestoreModule.getDocs(q);
          const results = snapshot.docs.map((doc) => docToObject<T>(doc));

          return { success: true, data: results };
        } catch (error) {
          const err = error as Error;
          return {
            success: false,
            error: { code: 'QUERY_ERROR', message: err.message },
          };
        }
      },

      async first(): Promise<ApiResponse<T | null>> {
        const result = await builder.limit(1).get();
        if (result.success && result.data) {
          return { success: true, data: result.data[0] || null };
        }
        return { success: result.success, data: null, error: result.error };
      },

      async count(): Promise<ApiResponse<number>> {
        try {
          const { firestore: fs, firestoreModule } = await initializeFirebase() as {
            firestore: unknown;
            firestoreModule: {
              collection: (db: unknown, path: string) => unknown;
              query: (ref: unknown, ...constraints: unknown[]) => unknown;
              where: (field: string, op: string, value: unknown) => unknown;
              getCountFromServer: (query: unknown) => Promise<{ data: () => { count: number } }>;
            };
          };

          let q = firestoreModule.collection(fs, collection);
          const constraints: unknown[] = [];

          conditions.forEach((c) => {
            constraints.push(firestoreModule.where(c.field, c.operator, c.value));
          });

          if (constraints.length > 0) {
            q = firestoreModule.query(q, ...constraints);
          }

          const countSnapshot = await firestoreModule.getCountFromServer(q);
          return { success: true, data: countSnapshot.data().count };
        } catch (error) {
          const err = error as Error;
          return {
            success: false,
            error: { code: 'COUNT_ERROR', message: err.message },
          };
        }
      },
    };

    return builder;
  };

  const provider: IDatabaseProvider = {
    name: 'firebase',
    type: 'database',

    async initialize(): Promise<void> {
      log('Initializing Firebase Database Provider');
      await initializeFirebase();
      ready = true;
    },

    isReady(): boolean {
      return ready;
    },

    async dispose(): Promise<void> {
      firestore = null;
      ready = false;
    },

    async query<T>(collection: string, options?: QueryOptions): Promise<ApiResponse<T[]>> {
      try {
        const builder = createQueryBuilder<T>(collection);

        if (options?.orderBy) {
          builder.orderBy(options.orderBy, options.orderDirection);
        }
        if (options?.limit) {
          builder.limit(options.limit);
        }
        if (options?.offset) {
          builder.offset(options.offset);
        }

        return builder.get();
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'QUERY_ERROR', message: err.message },
        };
      }
    },

    async getById<T>(collectionName: string, id: string): Promise<ApiResponse<T | null>> {
      try {
        const { firestore: fs, firestoreModule } = await initializeFirebase() as {
          firestore: unknown;
          firestoreModule: {
            doc: (db: unknown, path: string, id: string) => unknown;
            getDoc: (docRef: unknown) => Promise<unknown>;
          };
        };

        const docRef = firestoreModule.doc(fs, collectionName, id);
        const docSnap = await firestoreModule.getDoc(docRef);

        return { success: true, data: docToObject<T>(docSnap) };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'GET_ERROR', message: err.message },
        };
      }
    },

    async insert<T>(collectionName: string, data: Partial<T>): Promise<ApiResponse<T>> {
      try {
        const { firestore: fs, firestoreModule } = await initializeFirebase() as {
          firestore: unknown;
          firestoreModule: {
            collection: (db: unknown, path: string) => unknown;
            addDoc: (ref: unknown, data: unknown) => Promise<{ id: string }>;
            serverTimestamp: () => unknown;
          };
        };

        const collectionRef = firestoreModule.collection(fs, collectionName);
        const docData = {
          ...data,
          createdAt: firestoreModule.serverTimestamp(),
          updatedAt: firestoreModule.serverTimestamp(),
        };

        const docRef = await firestoreModule.addDoc(collectionRef, docData);

        return {
          success: true,
          data: { id: docRef.id, ...data } as T,
        };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'INSERT_ERROR', message: err.message },
        };
      }
    },

    async insertMany<T>(collectionName: string, data: Partial<T>[]): Promise<ApiResponse<T[]>> {
      try {
        const { firestore: fs, firestoreModule } = await initializeFirebase() as {
          firestore: unknown;
          firestoreModule: {
            writeBatch: (db: unknown) => {
              set: (ref: unknown, data: unknown) => void;
              commit: () => Promise<void>;
            };
            collection: (db: unknown, path: string) => unknown;
            doc: (ref: unknown) => { id: string };
            serverTimestamp: () => unknown;
          };
        };

        const batch = firestoreModule.writeBatch(fs);
        const collectionRef = firestoreModule.collection(fs, collectionName);
        const results: T[] = [];

        for (const item of data) {
          const docRef = firestoreModule.doc(collectionRef);
          const docData = {
            ...item,
            createdAt: firestoreModule.serverTimestamp(),
            updatedAt: firestoreModule.serverTimestamp(),
          };
          batch.set(docRef, docData);
          results.push({ id: docRef.id, ...item } as T);
        }

        await batch.commit();
        return { success: true, data: results };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'INSERT_MANY_ERROR', message: err.message },
        };
      }
    },

    async update<T>(collectionName: string, id: string, data: Partial<T>): Promise<ApiResponse<T>> {
      try {
        const { firestore: fs, firestoreModule } = await initializeFirebase() as {
          firestore: unknown;
          firestoreModule: {
            doc: (db: unknown, path: string, id: string) => unknown;
            updateDoc: (ref: unknown, data: unknown) => Promise<void>;
            getDoc: (ref: unknown) => Promise<unknown>;
            serverTimestamp: () => unknown;
          };
        };

        const docRef = firestoreModule.doc(fs, collectionName, id);
        const updateData = {
          ...data,
          updatedAt: firestoreModule.serverTimestamp(),
        };

        await firestoreModule.updateDoc(docRef, updateData);
        const updatedDoc = await firestoreModule.getDoc(docRef);

        return { success: true, data: docToObject<T>(updatedDoc) };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'UPDATE_ERROR', message: err.message },
        };
      }
    },

    async updateMany<T>(
      collectionName: string,
      filter: FilterCondition[],
      data: Partial<T>
    ): Promise<ApiResponse<number>> {
      try {
        const { firestore: fs, firestoreModule } = await initializeFirebase() as {
          firestore: unknown;
          firestoreModule: {
            collection: (db: unknown, path: string) => unknown;
            query: (ref: unknown, ...constraints: unknown[]) => unknown;
            where: (field: string, op: string, value: unknown) => unknown;
            getDocs: (query: unknown) => Promise<{ docs: { ref: unknown }[] }>;
            writeBatch: (db: unknown) => {
              update: (ref: unknown, data: unknown) => void;
              commit: () => Promise<void>;
            };
            serverTimestamp: () => unknown;
          };
        };

        let q = firestoreModule.collection(fs, collectionName);
        const constraints: unknown[] = [];

        filter.forEach((f) => {
          constraints.push(firestoreModule.where(f.field, mapOperator(f.operator), f.value));
        });

        if (constraints.length > 0) {
          q = firestoreModule.query(q, ...constraints);
        }

        const snapshot = await firestoreModule.getDocs(q);
        const batch = firestoreModule.writeBatch(fs);

        const updateData = {
          ...data,
          updatedAt: firestoreModule.serverTimestamp(),
        };

        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, updateData);
        });

        await batch.commit();
        return { success: true, data: snapshot.docs.length };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'UPDATE_MANY_ERROR', message: err.message },
        };
      }
    },

    async delete(collectionName: string, id: string): Promise<ApiResponse<void>> {
      try {
        const { firestore: fs, firestoreModule } = await initializeFirebase() as {
          firestore: unknown;
          firestoreModule: {
            doc: (db: unknown, path: string, id: string) => unknown;
            deleteDoc: (ref: unknown) => Promise<void>;
          };
        };

        const docRef = firestoreModule.doc(fs, collectionName, id);
        await firestoreModule.deleteDoc(docRef);

        return { success: true };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'DELETE_ERROR', message: err.message },
        };
      }
    },

    async deleteMany(collectionName: string, filter: FilterCondition[]): Promise<ApiResponse<number>> {
      try {
        const { firestore: fs, firestoreModule } = await initializeFirebase() as {
          firestore: unknown;
          firestoreModule: {
            collection: (db: unknown, path: string) => unknown;
            query: (ref: unknown, ...constraints: unknown[]) => unknown;
            where: (field: string, op: string, value: unknown) => unknown;
            getDocs: (query: unknown) => Promise<{ docs: { ref: unknown }[] }>;
            writeBatch: (db: unknown) => {
              delete: (ref: unknown) => void;
              commit: () => Promise<void>;
            };
          };
        };

        let q = firestoreModule.collection(fs, collectionName);
        const constraints: unknown[] = [];

        filter.forEach((f) => {
          constraints.push(firestoreModule.where(f.field, mapOperator(f.operator), f.value));
        });

        if (constraints.length > 0) {
          q = firestoreModule.query(q, ...constraints);
        }

        const snapshot = await firestoreModule.getDocs(q);
        const batch = firestoreModule.writeBatch(fs);

        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        return { success: true, data: snapshot.docs.length };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: { code: 'DELETE_MANY_ERROR', message: err.message },
        };
      }
    },

    subscribe<T>(
      collectionName: string,
      callback: DatabaseChangeCallback<T>,
      options?: SubscriptionOptions
    ): Unsubscribe {
      let unsubscribe: (() => void) | null = null;

      (async () => {
        try {
          const { firestore: fs, firestoreModule } = await initializeFirebase() as {
            firestore: unknown;
            firestoreModule: {
              collection: (db: unknown, path: string) => unknown;
              query: (ref: unknown, ...constraints: unknown[]) => unknown;
              where: (field: string, op: string, value: unknown) => unknown;
              onSnapshot: (
                query: unknown,
                callback: (snapshot: {
                  docChanges: () => Array<{
                    type: string;
                    doc: { id: string; data: () => unknown };
                  }>;
                }) => void
              ) => () => void;
            };
          };

          let q = firestoreModule.collection(fs, collectionName);

          if (options?.filter) {
            const constraints: unknown[] = [];
            Object.entries(options.filter).forEach(([field, value]) => {
              constraints.push(firestoreModule.where(field, '==', value));
            });
            if (constraints.length > 0) {
              q = firestoreModule.query(q, ...constraints);
            }
          }

          unsubscribe = firestoreModule.onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              const eventType =
                change.type === 'added' ? 'insert' :
                change.type === 'modified' ? 'update' :
                'delete';

              const event: DatabaseChangeEvent<T> = {
                type: eventType,
                collection: collectionName,
                documentId: change.doc.id,
                newData: change.type !== 'removed' ? (change.doc.data() as T) : undefined,
                timestamp: new Date(),
              };

              callback(event);
            });
          });
        } catch (error) {
          console.error('Subscription error:', error);
        }
      })();

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    },

    subscribeToDocument<T>(
      collectionName: string,
      id: string,
      callback: DatabaseChangeCallback<T>
    ): Unsubscribe {
      let unsubscribe: (() => void) | null = null;

      (async () => {
        try {
          const { firestore: fs, firestoreModule } = await initializeFirebase() as {
            firestore: unknown;
            firestoreModule: {
              doc: (db: unknown, path: string, id: string) => unknown;
              onSnapshot: (
                docRef: unknown,
                callback: (snapshot: { id: string; data: () => unknown; exists: () => boolean }) => void
              ) => () => void;
            };
          };

          const docRef = firestoreModule.doc(fs, collectionName, id);

          let previousData: T | undefined;

          unsubscribe = firestoreModule.onSnapshot(docRef, (snapshot) => {
            const exists = snapshot.exists();
            const data = exists ? (snapshot.data() as T) : undefined;

            let eventType: 'insert' | 'update' | 'delete';
            if (!previousData && data) {
              eventType = 'insert';
            } else if (previousData && !data) {
              eventType = 'delete';
            } else {
              eventType = 'update';
            }

            const event: DatabaseChangeEvent<T> = {
              type: eventType,
              collection: collectionName,
              documentId: id,
              oldData: previousData,
              newData: data,
              timestamp: new Date(),
            };

            previousData = data;
            callback(event);
          });
        } catch (error) {
          console.error('Document subscription error:', error);
        }
      })();

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    },

    createQuery<T>(collection: string): IQueryBuilder<T> {
      return createQueryBuilder<T>(collection);
    },
  };

  return provider;
}

export default createFirebaseDatabaseProvider;
