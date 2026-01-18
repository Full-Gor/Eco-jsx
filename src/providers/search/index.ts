/**
 * Search Provider exports
 */

export type {
  ISearchProvider,
  SearchResult,
  SearchHit,
  SearchFacets,
  SearchFacetValue,
  SearchOptions,
  IndexSettings,
  DocumentBatch,
  IndexStats,
  SearchProviderOptions,
} from './SearchProvider.interface';

export {
  createNexusServSearchProvider,
} from './NexusServSearchProvider';
