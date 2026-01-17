# Phase 3 - Catalogue

## Vue d'ensemble

Cette phase implémente le système de catalogue complet avec les providers de base de données, de stockage et de recherche. Elle inclut les écrans de liste de produits, de détail produit, de catégories et de recherche.

## Architecture

```
src/
├── providers/
│   ├── database/
│   │   ├── DatabaseProvider.interface.ts
│   │   ├── NexusServDatabaseProvider.ts
│   │   ├── FirebaseDatabaseProvider.ts
│   │   ├── SupabaseDatabaseProvider.ts
│   │   ├── DatabaseProviderFactory.ts
│   │   └── index.ts
│   ├── storage/
│   │   ├── StorageProvider.interface.ts
│   │   ├── NexusServStorageProvider.ts
│   │   ├── FirebaseStorageProvider.ts
│   │   ├── SupabaseStorageProvider.ts
│   │   ├── StorageProviderFactory.ts
│   │   └── index.ts
│   └── search/
│       ├── SearchProvider.interface.ts
│       ├── NexusServSearchProvider.ts
│       └── index.ts
├── contexts/
│   └── CatalogContext.tsx
├── components/
│   ├── common/
│   │   └── Skeleton.tsx
│   └── product/
│       ├── ProductCard.tsx
│       └── index.ts
├── screens/
│   ├── products/
│   │   ├── ProductListScreen.tsx
│   │   ├── ProductDetailScreen.tsx
│   │   └── index.ts
│   ├── categories/
│   │   └── CategoriesScreen.tsx
│   └── search/
│       ├── SearchScreen.tsx
│       └── index.ts
└── types/
    └── product.ts
```

## Providers de Base de Données

### Interface IDatabaseProvider

```typescript
interface IDatabaseProvider extends BaseProvider {
  // CRUD Operations
  getById<T>(collection: string, id: string): Promise<ApiResponse<T>>;
  create<T>(collection: string, data: Omit<T, 'id'>): Promise<ApiResponse<T>>;
  update<T>(collection: string, id: string, data: Partial<T>): Promise<ApiResponse<T>>;
  delete(collection: string, id: string): Promise<ApiResponse<void>>;

  // Query
  query<T>(collection: string, options?: QueryOptions): Promise<ApiResponse<T[]>>;
  createQuery<T>(collection: string): IQueryBuilder<T>;

  // Real-time
  subscribe<T>(collection: string, callback: DataChangeCallback<T>): Unsubscribe;

  // Batch
  batch(): IBatchWriter;
}
```

### 1. NexusServDatabaseProvider

Provider pour base de données auto-hébergée via REST API avec Socket.io pour le temps réel.

**Fonctionnalités :**
- REST API pour CRUD
- Socket.io pour subscriptions temps réel
- Query builder avec filtres et tri
- Batch operations
- Authentification automatique

**Configuration :**
```typescript
{
  type: 'selfhosted',
  apiUrl: 'https://api.nexusserv.com'
}
```

### 2. FirebaseDatabaseProvider

Provider utilisant Cloud Firestore avec chargement dynamique.

**Fonctionnalités :**
- Firestore queries avec indexes
- Real-time listeners
- Offline persistence
- Batch writes et transactions

**Configuration :**
```typescript
{
  type: 'firebase',
  projectId: 'my-project',
  apiKey: 'AIza...',
  authDomain: 'project.firebaseapp.com'
}
```

### 3. SupabaseDatabaseProvider

Provider utilisant Supabase PostgreSQL avec temps réel.

**Fonctionnalités :**
- SQL queries via PostgREST
- Real-time subscriptions (postgres_changes)
- Row Level Security (RLS)
- Full-text search

**Configuration :**
```typescript
{
  type: 'supabase',
  url: 'https://xxx.supabase.co',
  anonKey: 'eyJ...'
}
```

### Query Builder

```typescript
const products = await db.createQuery<Product>('products')
  .where('categoryId', '==', 'electronics')
  .where('price.amount', '>=', 100)
  .where('price.amount', '<=', 500)
  .orderBy('createdAt', 'desc')
  .limit(20)
  .offset(0)
  .get();
```

## Providers de Stockage

### Interface IStorageProvider

```typescript
interface IStorageProvider extends BaseProvider {
  upload(file: Blob | File | string, options?: UploadOptions): Promise<ApiResponse<FileMetadata>>;
  uploadWithProgress(file: Blob | File | string, options?: UploadOptions): IUploadTask;
  download(path: string): Promise<ApiResponse<Blob>>;
  getUrl(path: string, options?: UrlOptions): Promise<ApiResponse<string>>;
  delete(path: string): Promise<ApiResponse<void>>;
  list(path: string, options?: ListOptions): Promise<ApiResponse<FileMetadata[]>>;
  getMetadata(path: string): Promise<ApiResponse<FileMetadata>>;
}
```

### 1. NexusServStorageProvider

**Fonctionnalités :**
- Upload avec XMLHttpRequest pour progress
- Download via REST
- Gestion des métadonnées
- Génération d'URLs signées

### 2. FirebaseStorageProvider

**Fonctionnalités :**
- Firebase Storage SDK
- Resumable uploads
- Download URLs
- Security rules

### 3. SupabaseStorageProvider

**Fonctionnalités :**
- Supabase Storage buckets
- Image transforms (resize, crop)
- Public/private files
- Signed URLs

## Provider de Recherche

### NexusServSearchProvider (Meilisearch)

```typescript
interface ISearchProvider extends BaseProvider {
  search<T>(index: string, params: SearchParams): Promise<ApiResponse<SearchResult<T>>>;
  index<T>(index: string, documents: T[]): Promise<ApiResponse<void>>;
  delete(index: string, ids: string[]): Promise<ApiResponse<void>>;
  getSettings(index: string): Promise<ApiResponse<IndexSettings>>;
  updateSettings(index: string, settings: IndexSettings): Promise<ApiResponse<void>>;
}
```

**Fonctionnalités :**
- Recherche full-text instantanée
- Facettes et filtres
- Typo-tolerance
- Highlighting des résultats

## Context Catalogue

### CatalogContext

```typescript
interface CatalogContextValue {
  // État
  products: Product[];
  categories: Category[];
  currentProduct: Product | null;
  searchResults: Product[];
  filters: ProductFilter;
  sort: ProductSortOption;
  viewMode: 'grid' | 'list';
  loading: boolean;
  hasMore: boolean;

  // Actions produits
  fetchProducts: (reset?: boolean) => Promise<void>;
  fetchProduct: (id: string) => Promise<Product | null>;
  refreshProducts: () => Promise<void>;
  loadMoreProducts: () => Promise<void>;

  // Actions catégories
  fetchCategories: () => Promise<void>;
  fetchCategory: (id: string) => Promise<Category | null>;

  // Actions recherche
  search: (query: string) => Promise<void>;
  getSuggestions: (query: string) => Promise<string[]>;
  clearSearch: () => void;

  // Filtres et tri
  setFilters: (filters: Partial<ProductFilter>) => void;
  clearFilters: () => void;
  setSort: (sort: ProductSortOption) => void;
  setViewMode: (mode: 'grid' | 'list') => void;

  // Favoris
  addToFavorites: (productId: string) => Promise<boolean>;
  removeFromFavorites: (productId: string) => Promise<boolean>;
  isFavorite: (productId: string) => boolean;
}
```

### Hooks spécialisés

```typescript
// Liste des produits avec pagination
const { products, loading, hasMore, loadMoreProducts } = useProducts();

// Détail d'un produit
const { product, loading, fetchReviews } = useProduct(productId);

// Catégories
const { categories, fetchCategories } = useCategories();

// Recherche
const { results, suggestions, search } = useSearch();
```

## Types Produit

### Product

```typescript
interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: Price;
  compareAtPrice?: Price;
  images: ProductImage[];
  thumbnail?: ProductImage;
  categoryId: string;
  brandId?: string;
  tags?: string[];
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  rating?: ProductRating;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Category

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: ProductImage;
  parentId?: string;
  children?: Category[];
  order: number;
  productCount?: number;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
}
```

### ProductVariant

```typescript
interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  options: VariantOption[]; // ex: [{name: 'Couleur', value: 'Rouge'}]
  price: Price;
  compareAtPrice?: Price;
  stock: number;
  image?: ProductImage;
  isDefault: boolean;
}
```

## Écrans

### ProductListScreen

**Fonctionnalités :**
- Affichage grille ou liste (toggle)
- Pagination infinie (scroll)
- Pull-to-refresh
- Modal de tri (prix, popularité, nouveautés, note)
- Badge de filtres actifs
- Skeleton loading

**Navigation :**
```typescript
navigation.navigate('ProductList', {
  categoryId?: string,
  categoryName?: string,
  searchQuery?: string
});
```

### ProductDetailScreen

**Fonctionnalités :**
- Galerie d'images avec pagination
- Sélection de variantes (couleur, taille)
- Sélecteur de quantité
- Section description (expand/collapse)
- Tableau des caractéristiques
- Section avis clients
- Barre d'action fixe (Ajouter au panier, Acheter)
- Header animé au scroll
- Boutons partage et favori

### CategoriesScreen

**Fonctionnalités :**
- Arborescence de catégories
- Expand/collapse des sous-catégories
- Icônes par catégorie
- Compteur de produits
- Barre de recherche
- Navigation vers ProductList

### SearchScreen

**Fonctionnalités :**
- Input de recherche avec debounce
- Suggestions en temps réel
- Historique des recherches (AsyncStorage)
- Résultats avec ProductCard
- Tags de recherches populaires
- Clear history

## Composants

### ProductCard

Composant mémoïsé pour l'affichage des produits.

**Props :**
```typescript
interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onPress?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
}
```

**Affichage :**
- Image avec placeholder
- Badges (Promo, Nouveau, Rupture)
- Nom du produit
- Note (étoiles)
- Prix (avec barré si promo)
- Bouton favori
- Bouton ajouter au panier

### Skeleton

Composant de chargement avec animation shimmer.

```typescript
<Skeleton width={200} height={20} borderRadius={4} />
<Skeleton width="100%" height={150} borderRadius={12} />
```

## Options de tri

```typescript
type ProductSortOption =
  | 'relevance'   // Pertinence
  | 'newest'      // Nouveautés
  | 'price_asc'   // Prix croissant
  | 'price_desc'  // Prix décroissant
  | 'rating'      // Mieux notés
  | 'popularity'  // Popularité
  | 'name_asc'    // Nom A-Z
  | 'name_desc';  // Nom Z-A
```

## Filtres

```typescript
interface ProductFilter {
  categoryId?: string;
  categoryIds?: string[];
  brandId?: string;
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  tags?: string[];
  attributes?: Record<string, string[]>;
}
```

## Utilisation

### Afficher la liste des produits

```typescript
import { useProducts } from './hooks';

function ProductsPage() {
  const {
    products,
    loading,
    hasMore,
    refreshProducts,
    loadMoreProducts,
    setSort,
    setFilters
  } = useProducts();

  return (
    <FlatList
      data={products}
      renderItem={({ item }) => <ProductCard product={item} />}
      onEndReached={loadMoreProducts}
      refreshing={loading}
      onRefresh={refreshProducts}
    />
  );
}
```

### Afficher un produit

```typescript
import { useProduct } from './hooks';

function ProductPage({ productId }) {
  const { product, loading, fetchReviews } = useProduct(productId);

  if (loading) return <Skeleton />;
  if (!product) return <NotFound />;

  return <ProductDetailScreen product={product} />;
}
```

## Prochaines étapes

La Phase 4 implémentera le panier d'achat et le système de commande.
