/**
 * Database Provider exports
 */

export type {
  IDatabaseProvider,
  IQueryBuilder,
  ITransaction,
  DatabaseChangeEvent,
  DatabaseChangeCallback,
  DatabaseProviderOptions,
} from './DatabaseProvider.interface';

export {
  createNexusServDatabaseProvider,
} from './NexusServDatabaseProvider';

export {
  createFirebaseDatabaseProvider,
} from './FirebaseDatabaseProvider';

export {
  createSupabaseDatabaseProvider,
} from './SupabaseDatabaseProvider';

export {
  createDatabaseProvider,
  type DatabaseProviderType,
  type DatabaseProviderConfig,
} from './DatabaseProviderFactory';
