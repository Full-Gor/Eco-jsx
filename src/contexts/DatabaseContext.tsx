/**
 * Database Context
 * Provides shared database access throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { IDatabaseProvider } from '../providers/database';
import { createDatabaseProvider, DatabaseProviderConfig } from '../providers/database/DatabaseProviderFactory';
import { getConfig } from '../config';

/** Database context value */
interface DatabaseContextValue {
  /** Database provider instance */
  database: IDatabaseProvider | null;
  /** Is database ready */
  isReady: boolean;
  /** Is database loading */
  isLoading: boolean;
  /** Error if any */
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextValue | undefined>(undefined);

/** Database provider props */
interface DatabaseProviderProps {
  children: ReactNode;
}

/**
 * Database Provider Component
 * Initializes and provides the database provider to the app
 */
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dbProvider = useRef<IDatabaseProvider | null>(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const config = getConfig();
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
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
        setIsLoading(false);
      }
    };

    initDatabase();

    return () => {
      dbProvider.current?.dispose();
    };
  }, []);

  const value: DatabaseContextValue = {
    database: dbProvider.current,
    isReady,
    isLoading,
    error,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

/**
 * Hook to use database context
 */
export function useDatabase(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

export default DatabaseContext;
