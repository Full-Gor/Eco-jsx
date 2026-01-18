/**
 * NexusServ Search Provider
 * Search operations using NexusServ API (with Meilisearch backend)
 */

import {
  ISearchProvider,
  SearchResult,
  SearchOptions,
  IndexSettings,
  IndexStats,
  DocumentBatch,
  SearchProviderOptions,
} from './SearchProvider.interface';
import { ApiResponse, PaginationParams } from '../../types/common';

/** NexusServ Search configuration */
interface NexusServSearchConfig {
  apiUrl: string;
  searchApiKey?: string;
}

/** Create NexusServ Search Provider */
export function createNexusServSearchProvider(
  config: NexusServSearchConfig,
  options: SearchProviderOptions = {}
): ISearchProvider {
  const { apiUrl, searchApiKey } = config;
  const { defaultHitsPerPage = 20, timeout = 30000 } = options;

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

  /** Make API request */
  const apiRequest = async <T>(
    endpoint: string,
    requestOptions: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const token = searchApiKey || await getAuthToken();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        ...requestOptions,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...requestOptions.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);
      const err = error as Error;
      return {
        success: false,
        error: {
          code: err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
          message: err.message,
        },
      };
    }
  };

  const provider: ISearchProvider = {
    name: 'nexusserv',
    type: 'search',

    async initialize(): Promise<void> {
      ready = true;
    },

    isReady(): boolean {
      return ready;
    },

    async dispose(): Promise<void> {
      ready = false;
    },

    async search<T>(
      indexName: string,
      searchOptions: SearchOptions
    ): Promise<ApiResponse<SearchResult<T>>> {
      const {
        query,
        page = 0,
        hitsPerPage = defaultHitsPerPage,
        searchableAttributes,
        attributesToRetrieve,
        attributesToHighlight,
        filter,
        facets,
        sort,
        matchingStrategy,
      } = searchOptions;

      const body: Record<string, unknown> = {
        q: query,
        offset: page * hitsPerPage,
        limit: hitsPerPage,
      };

      if (searchableAttributes?.length) {
        body.attributesToSearchOn = searchableAttributes;
      }
      if (attributesToRetrieve?.length) {
        body.attributesToRetrieve = attributesToRetrieve;
      }
      if (attributesToHighlight?.length) {
        body.attributesToHighlight = attributesToHighlight;
      }
      if (filter) {
        body.filter = Array.isArray(filter) ? filter : [filter];
      }
      if (facets?.length) {
        body.facets = facets;
      }
      if (sort?.length) {
        body.sort = sort;
      }
      if (matchingStrategy) {
        body.matchingStrategy = matchingStrategy;
      }

      const result = await apiRequest<{
        hits: Array<T & { _id: string; _score?: number; _formatted?: Record<string, string[]> }>;
        query: string;
        estimatedTotalHits: number;
        processingTimeMs: number;
        offset: number;
        limit: number;
        facetDistribution?: Record<string, Record<string, number>>;
      }>(`/search/${indexName}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || { code: 'SEARCH_ERROR', message: 'Search failed' },
        };
      }

      const { hits, estimatedTotalHits, processingTimeMs, facetDistribution } = result.data;

      const searchResult: SearchResult<T> = {
        hits: hits.map((hit) => ({
          id: hit._id || (hit as unknown as { id: string }).id,
          document: hit,
          score: hit._score,
          highlights: hit._formatted,
        })),
        query,
        totalHits: estimatedTotalHits,
        processingTimeMs,
        page,
        hitsPerPage,
        totalPages: Math.ceil(estimatedTotalHits / hitsPerPage),
        facets: facetDistribution
          ? Object.fromEntries(
              Object.entries(facetDistribution).map(([key, values]) => [
                key,
                Object.entries(values).map(([value, count]) => ({ value, count })),
              ])
            )
          : undefined,
      };

      return { success: true, data: searchResult };
    },

    async multiSearch<T>(
      queries: Array<{ indexName: string; options: SearchOptions }>
    ): Promise<ApiResponse<SearchResult<T>[]>> {
      const results = await Promise.all(
        queries.map(({ indexName, options }) => this.search<T>(indexName, options))
      );

      const allSuccessful = results.every((r) => r.success);
      if (!allSuccessful) {
        const firstError = results.find((r) => !r.success);
        return {
          success: false,
          error: firstError?.error || { code: 'MULTI_SEARCH_ERROR', message: 'Multi-search failed' },
        };
      }

      return {
        success: true,
        data: results.map((r) => r.data!),
      };
    },

    async index(
      indexName: string,
      document: Record<string, unknown>,
      primaryKey?: string
    ): Promise<ApiResponse<void>> {
      const endpoint = primaryKey
        ? `/search/${indexName}/documents?primaryKey=${primaryKey}`
        : `/search/${indexName}/documents`;

      return apiRequest<void>(endpoint, {
        method: 'POST',
        body: JSON.stringify([document]),
      });
    },

    async indexBatch(indexName: string, batch: DocumentBatch): Promise<ApiResponse<void>> {
      const endpoint = batch.primaryKey
        ? `/search/${indexName}/documents?primaryKey=${batch.primaryKey}`
        : `/search/${indexName}/documents`;

      return apiRequest<void>(endpoint, {
        method: 'POST',
        body: JSON.stringify(batch.documents),
      });
    },

    async update(
      indexName: string,
      id: string,
      document: Partial<Record<string, unknown>>
    ): Promise<ApiResponse<void>> {
      return apiRequest<void>(`/search/${indexName}/documents`, {
        method: 'PUT',
        body: JSON.stringify([{ id, ...document }]),
      });
    },

    async delete(indexName: string, id: string): Promise<ApiResponse<void>> {
      return apiRequest<void>(`/search/${indexName}/documents/${id}`, {
        method: 'DELETE',
      });
    },

    async deleteBatch(indexName: string, ids: string[]): Promise<ApiResponse<void>> {
      return apiRequest<void>(`/search/${indexName}/documents/delete-batch`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
    },

    async deleteAll(indexName: string): Promise<ApiResponse<void>> {
      return apiRequest<void>(`/search/${indexName}/documents`, {
        method: 'DELETE',
      });
    },

    async getDocument<T>(indexName: string, id: string): Promise<ApiResponse<T | null>> {
      return apiRequest<T | null>(`/search/${indexName}/documents/${id}`);
    },

    async getDocuments<T>(
      indexName: string,
      paginationOptions?: PaginationParams
    ): Promise<ApiResponse<T[]>> {
      const params = new URLSearchParams();
      if (paginationOptions?.offset) params.append('offset', paginationOptions.offset.toString());
      if (paginationOptions?.limit) params.append('limit', paginationOptions.limit.toString());

      const queryString = params.toString();
      return apiRequest<T[]>(
        `/search/${indexName}/documents${queryString ? `?${queryString}` : ''}`
      );
    },

    async createIndex(indexName: string, primaryKey?: string): Promise<ApiResponse<void>> {
      return apiRequest<void>('/search/indexes', {
        method: 'POST',
        body: JSON.stringify({ uid: indexName, primaryKey }),
      });
    },

    async deleteIndex(indexName: string): Promise<ApiResponse<void>> {
      return apiRequest<void>(`/search/indexes/${indexName}`, {
        method: 'DELETE',
      });
    },

    async getSettings(indexName: string): Promise<ApiResponse<IndexSettings>> {
      return apiRequest<IndexSettings>(`/search/${indexName}/settings`);
    },

    async updateSettings(
      indexName: string,
      settings: Partial<IndexSettings>
    ): Promise<ApiResponse<void>> {
      return apiRequest<void>(`/search/${indexName}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
    },

    async getStats(indexName: string): Promise<ApiResponse<IndexStats>> {
      return apiRequest<IndexStats>(`/search/${indexName}/stats`);
    },

    async waitForPendingTasks(
      indexName: string,
      taskTimeout?: number
    ): Promise<ApiResponse<void>> {
      const maxWait = taskTimeout || 30000;
      const startTime = Date.now();

      while (Date.now() - startTime < maxWait) {
        const stats = await this.getStats(indexName);
        if (stats.success && stats.data && !stats.data.isIndexing) {
          return { success: true };
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Timed out waiting for pending tasks',
        },
      };
    },
  };

  return provider;
}

export default createNexusServSearchProvider;
