/**
 * Product-related types
 */

import { ImageAsset, Price, Timestamps } from './common';

/** Product status */
export type ProductStatus = 'draft' | 'active' | 'archived' | 'out_of_stock';

/** Product */
export interface Product extends Timestamps {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: Price;
  compareAtPrice?: Price;
  costPrice?: Price;
  images: ImageAsset[];
  thumbnail?: ImageAsset;
  categoryId: string;
  categoryIds?: string[];
  brandId?: string;
  vendorId?: string;
  status: ProductStatus;
  stock: number;
  lowStockThreshold?: number;
  weight?: number;
  dimensions?: ProductDimensions;
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  rating?: ProductRating;
  metadata?: Record<string, unknown>;
}

/** Product dimensions */
export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

/** Product attribute */
export interface ProductAttribute {
  name: string;
  value: string;
  isVisible?: boolean;
  isFilterable?: boolean;
}

/** Product variant */
export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: Price;
  compareAtPrice?: Price;
  stock: number;
  image?: ImageAsset;
  options: VariantOption[];
  isDefault?: boolean;
}

/** Variant option */
export interface VariantOption {
  name: string;
  value: string;
}

/** Product rating */
export interface ProductRating {
  average: number;
  count: number;
  distribution?: Record<number, number>;
}

/** Product category */
export interface Category extends Timestamps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: ImageAsset;
  parentId?: string;
  children?: Category[];
  productCount?: number;
  order?: number;
  isActive: boolean;
}

/** Brand */
export interface Brand extends Timestamps {
  id: string;
  name: string;
  slug: string;
  logo?: ImageAsset;
  description?: string;
  website?: string;
  isActive: boolean;
}

/** Product review */
export interface ProductReview extends Timestamps {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  content: string;
  images?: ImageAsset[];
  isVerifiedPurchase: boolean;
  helpfulCount?: number;
  isApproved: boolean;
}

/** Product filter */
export interface ProductFilter {
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
  search?: string;
}

/** Product sort options */
export type ProductSortOption =
  | 'relevance'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'popularity'
  | 'name_asc'
  | 'name_desc';

/** Wishlist item */
export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: Date | string;
  variantId?: string;
}
