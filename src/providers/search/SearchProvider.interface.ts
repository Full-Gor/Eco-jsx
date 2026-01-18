/**
 * Search Provider Interface
 * Defines the contract for all search providers
 */

import { ApiResponse, PaginationParams, SortParams } from '../../types/common';
import { BaseProvider } from '../types';

/** Search result */
export interface SearchResult<T> {
  hits: SearchHit<T>[];
  query: string;
  totalHits: number;
  processingTimeMs: number;
  page: number;
  hitsPerPage: number;
  totalPages: number;
  facets?: SearchFacets;
}

/** Search hit */
export interface SearchHit<T> {
  id: string;
  document: T;
  score?: number;
  highlights?: Record<string, string[]>;
}

/** Search facets */
export interface SearchFacets {
  [key: string]: SearchFacetValue[];
}

/** Facet value */
export interface SearchFacetValue {
  value: string;
  count: number;
}

/** Search options */
export interface SearchOptions {
  /** Search query */
  query: string;

  /** Page number (0-indexed) */
  page?: number;

  /** Hits per page */
  hitsPerPage?: number;

  /** Fields to search in */
  searchableAttributes?: string[];

  /** Attributes to retrieve */
  attributesToRetrieve?: string[];

  /** Attributes to highlight */
  attributesToHighlight?: string[];

  /** Filter expression */
  filter?: string | string[];

  /** Facets to return */
  facets?: string[];

  /** Sort by */
  sort?: string[];

  /** Match strategy */
  matchingStrategy?: 'all' | 'last';
}

/** Index settings */
export interface IndexSettings {
  /** Searchable attributes in order of importance */
  searchableAttributes?: string[];

  /** Filterable attributes */
  filterableAttributes?: string[];

  /** Sortable attributes */
  sortableAttributes?: string[];

  /** Displayed attributes */
  displayedAttributes?: string[];

  /** Stop words */
  stopWords?: string[];

  /** Synonyms */
  synonyms?: Record<string, string[]>;

  /** Ranking rules */
  rankingRules?: string[];

  /** Distinct attribute */
  distinctAttribute?: string;
}

/** Document batch */
export interface DocumentBatch {
  documents: Record<string, unknown>[];
  primaryKey?: string;
}

/** Index stats */
export interface IndexStats {
  numberOfDocuments: number;
  isIndexing: boolean;
  lastUpdate?: Date | string;
  fieldDistribution?: Record<string, number>;
}

/** Search provider interface */
export interface ISearchProvider extends BaseProvider {
  /**
   * Search for documents
   * @param indexName - Index to search in
   * @param options - Search options
   * @returns Promise with search results
   */
  search<T>(
    indexName: string,
    options: SearchOptions
  ): Promise<ApiResponse<SearchResult<T>>>;

  /**
   * Multi-index search
   * @param queries - Array of search queries with index names
   * @returns Promise with array of search results
   */
  multiSearch?<T>(
    queries: Array<{ indexName: string; options: SearchOptions }>
  ): Promise<ApiResponse<SearchResult<T>[]>>;

  /**
   * Index a single document
   * @param indexName - Index name
   * @param document - Document to index
   * @param primaryKey - Primary key field
   * @returns Promise with success status
   */
  index(
    indexName: string,
    document: Record<string, unknown>,
    primaryKey?: string
  ): Promise<ApiResponse<void>>;

  /**
   * Index multiple documents
   * @param indexName - Index name
   * @param batch - Document batch
   * @returns Promise with success status
   */
  indexBatch(
    indexName: string,
    batch: DocumentBatch
  ): Promise<ApiResponse<void>>;

  /**
   * Update a document
   * @param indexName - Index name
   * @param id - Document ID
   * @param document - Partial document update
   * @returns Promise with success status
   */
  update(
    indexName: string,
    id: string,
    document: Partial<Record<string, unknown>>
  ): Promise<ApiResponse<void>>;

  /**
   * Delete a document by ID
   * @param indexName - Index name
   * @param id - Document ID
   * @returns Promise with success status
   */
  delete(indexName: string, id: string): Promise<ApiResponse<void>>;

  /**
   * Delete multiple documents
   * @param indexName - Index name
   * @param ids - Document IDs
   * @returns Promise with success status
   */
  deleteBatch(indexName: string, ids: string[]): Promise<ApiResponse<void>>;

  /**
   * Delete all documents in an index
   * @param indexName - Index name
   * @returns Promise with success status
   */
  deleteAll(indexName: string): Promise<ApiResponse<void>>;

  /**
   * Get a document by ID
   * @param indexName - Index name
   * @param id - Document ID
   * @returns Promise with document
   */
  getDocument<T>(
    indexName: string,
    id: string
  ): Promise<ApiResponse<T | null>>;

  /**
   * Get all documents (paginated)
   * @param indexName - Index name
   * @param options - Pagination options
   * @returns Promise with documents
   */
  getDocuments<T>(
    indexName: string,
    options?: PaginationParams
  ): Promise<ApiResponse<T[]>>;

  /**
   * Create an index
   * @param indexName - Index name
   * @param primaryKey - Primary key field
   * @returns Promise with success status
   */
  createIndex(
    indexName: string,
    primaryKey?: string
  ): Promise<ApiResponse<void>>;

  /**
   * Delete an index
   * @param indexName - Index name
   * @returns Promise with success status
   */
  deleteIndex(indexName: string): Promise<ApiResponse<void>>;

  /**
   * Get index settings
   * @param indexName - Index name
   * @returns Promise with index settings
   */
  getSettings(indexName: string): Promise<ApiResponse<IndexSettings>>;

  /**
   * Update index settings
   * @param indexName - Index name
   * @param settings - New settings
   * @returns Promise with success status
   */
  updateSettings(
    indexName: string,
    settings: Partial<IndexSettings>
  ): Promise<ApiResponse<void>>;

  /**
   * Get index stats
   * @param indexName - Index name
   * @returns Promise with index stats
   */
  getStats(indexName: string): Promise<ApiResponse<IndexStats>>;

  /**
   * Wait for pending tasks to complete
   * @param indexName - Index name
   * @param timeout - Timeout in ms
   * @returns Promise that resolves when ready
   */
  waitForPendingTasks?(
    indexName: string,
    timeout?: number
  ): Promise<ApiResponse<void>>;
}

/** Search provider options */
export interface SearchProviderOptions {
  /** Default index name */
  defaultIndex?: string;

  /** Default hits per page */
  defaultHitsPerPage?: number;

  /** Request timeout in ms */
  timeout?: number;

  /** Enable search analytics */
  enableAnalytics?: boolean;
}
