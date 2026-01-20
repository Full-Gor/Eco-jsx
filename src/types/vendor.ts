/**
 * Vendor-related types
 */

import { Timestamps } from './common';

/** Shop status */
export type ShopStatus = 'pending' | 'active' | 'suspended' | 'closed';

/** Shop interface */
export interface Shop extends Timestamps {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  vendeurId: string;
  status: ShopStatus;
  address?: string;
  phone?: string;
  email?: string;
  settings?: ShopSettings;
}

/** Shop settings */
export interface ShopSettings {
  acceptsReturns?: boolean;
  returnPeriod?: number;
  shipsInternational?: boolean;
  processingTime?: string;
}

/** Shop creation data */
export interface ShopCreateData {
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  address?: string;
  phone?: string;
  email?: string;
}

/** Shop update data */
export type ShopUpdateData = Partial<ShopCreateData>;

/** Vendor product status */
export type VendorProductStatus = 'draft' | 'active' | 'paused' | 'out_of_stock' | 'archived';

/** Vendor product interface */
export interface VendorProduct extends Timestamps {
  id: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  categoryId?: string;
  shopId: string;
  vendeurId: string;
  stock: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  status: VendorProductStatus;
  tags?: string[];
  variants?: ProductVariant[];
}

/** Product variant */
export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  stock: number;
  options: Record<string, string>;
}

/** Product creation data */
export interface ProductCreateData {
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images?: string[];
  categoryId?: string;
  stock: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  status?: VendorProductStatus;
  tags?: string[];
}

/** Product update data */
export type ProductUpdateData = Partial<ProductCreateData>;

/** Order status */
export type VendorOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

/** Order item */
export interface VendorOrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  total: number;
  sku?: string;
}

/** Vendor order interface */
export interface VendorOrder extends Timestamps {
  id: string;
  orderNumber?: string;
  items: VendorOrderItem[];
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  vendeurId: string;
  shopId?: string;
  total: number;
  subtotal: number;
  shippingCost?: number;
  tax?: number;
  status: VendorOrderStatus;
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
}

/** Shipping address */
export interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

/** Category interface */
export interface VendorCategory {
  id: string;
  name: string;
  icon?: string;
  order?: number;
  parentId?: string;
}

/** Dashboard stats */
export interface VendorDashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalSales: number;
  monthSales: number;
  lowStockProducts: number;
}

/** Upload response */
export interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
    filename: string;
  };
  error?: string;
}
