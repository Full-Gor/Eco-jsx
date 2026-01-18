/**
 * Phase 8: Marketplace Types
 * Multi-vendor marketplace, sellers, commissions, sub-orders
 */

import type { Address } from './common';
import type { Order, OrderItem, OrderStatus } from './order';

// ============================================================================
// Seller Types
// ============================================================================

/** Seller status */
export type SellerStatus = 'pending' | 'active' | 'suspended' | 'banned';

/** Seller badge type */
export type SellerBadgeType = 'top_seller' | 'fast_shipper' | 'verified' | 'new' | 'premium';

/** Seller badge */
export interface SellerBadge {
  type: SellerBadgeType;
  name: string;
  description?: string;
  icon?: string;
  earnedAt: string;
}

/** Commission rate type */
export type CommissionRateType = 'percentage' | 'fixed' | 'tiered';

/** Commission tier */
export interface CommissionTier {
  minSales: number;
  maxSales?: number;
  rate: number;
}

/** Commission rate configuration */
export interface CommissionRate {
  type: CommissionRateType;
  value: number;
  tiers?: CommissionTier[];
  categoryOverrides?: Record<string, number>;
}

/** Payout method */
export type PayoutMethod = 'bank_transfer' | 'paypal' | 'stripe_connect';

/** Payout schedule */
export type PayoutSchedule = 'weekly' | 'biweekly' | 'monthly' | 'on_demand';

/** Payout information */
export interface PayoutInfo {
  method: PayoutMethod;
  details: Record<string, string>;
  schedule: PayoutSchedule;
  minAmount: number;
  currency: string;
  verified: boolean;
}

/** Social links */
export interface SocialLinks {
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}

/** Seller policies */
export interface SellerPolicies {
  returnPolicy: string;
  shippingPolicy: string;
  responseTime: string;
  customPolicies?: Array<{ title: string; content: string }>;
}

/** Seller statistics */
export interface SellerStats {
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  averageRating: number;
  reviewCount: number;
  productCount: number;
  activeProductCount: number;
  responseRate: number;
  averageResponseTime: number; // in minutes
  returnRate: number;
  onTimeDeliveryRate: number;
}

/** Seller */
export interface Seller {
  id: string;
  userId: string;
  shopName: string;
  slug: string;
  logo?: string;
  banner?: string;
  description?: string;
  shortDescription?: string;
  status: SellerStatus;
  rating: number;
  reviewCount: number;
  productCount: number;
  salesCount: number;
  verified: boolean;
  badges: SellerBadge[];
  commission: CommissionRate;
  payoutInfo?: PayoutInfo;
  contactEmail: string;
  contactPhone?: string;
  address: Address;
  socialLinks?: SocialLinks;
  policies: SellerPolicies;
  featuredProducts?: string[];
  categories?: string[];
  tags?: string[];
  stats?: SellerStats;
  createdAt: string;
  updatedAt: string;
}

/** Seller registration data */
export interface SellerRegistration {
  shopName: string;
  description?: string;
  logo?: string;
  contactEmail: string;
  contactPhone?: string;
  address: Address;
  businessType: 'individual' | 'company';
  businessId?: string; // SIRET, VAT, etc.
  identityDocument?: string;
  payoutMethod: PayoutMethod;
  payoutDetails: Record<string, string>;
  acceptTerms: boolean;
  policies?: Partial<SellerPolicies>;
}

/** Seller application */
export interface SellerApplication {
  id: string;
  userId: string;
  data: SellerRegistration;
  status: 'pending' | 'approved' | 'rejected' | 'more_info_needed';
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

/** Seller review (buyer reviews seller) */
export interface SellerReview {
  id: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  orderId: string;
  rating: number;
  title?: string;
  comment: string;
  sellerResponse?: {
    content: string;
    respondedAt: string;
  };
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

/** Seller follower */
export interface SellerFollower {
  sellerId: string;
  userId: string;
  followedAt: string;
  notificationsEnabled: boolean;
}

// ============================================================================
// Commission & Finance Types
// ============================================================================

/** Transaction type */
export type TransactionType = 'sale' | 'commission' | 'payout' | 'refund' | 'adjustment' | 'fee';

/** Transaction status */
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

/** Commission breakdown for an order */
export interface CommissionBreakdown {
  orderTotal: number;
  itemsTotal: number;
  shippingTotal: number;
  commissionRate: number;
  commissionAmount: number;
  sellerAmount: number;
  platformAmount: number;
  fees: Array<{ name: string; amount: number }>;
  currency: string;
}

/** Seller balance */
export interface SellerBalance {
  sellerId: string;
  available: number;
  pending: number;
  reserved: number;
  totalEarned: number;
  totalPaid: number;
  totalCommissions: number;
  totalRefunds: number;
  currency: string;
  nextPayout?: {
    date: string;
    estimatedAmount: number;
  };
  lastUpdated: string;
}

/** Transaction */
export interface Transaction {
  id: string;
  sellerId: string;
  type: TransactionType;
  status: TransactionStatus;
  orderId?: string;
  subOrderId?: string;
  amount: number;
  fee?: number;
  net: number;
  balance: number;
  currency: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  processedAt?: string;
}

/** Payout request status */
export type PayoutRequestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/** Payout request */
export interface PayoutRequest {
  id: string;
  sellerId: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  status: PayoutRequestStatus;
  method: PayoutMethod;
  destination: string; // masked account info
  reference?: string;
  failureReason?: string;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
}

/** Transaction filters */
export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  orderId?: string;
}

/** Payout filters */
export interface PayoutFilters {
  status?: PayoutRequestStatus;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// Multi-Vendor Order Types
// ============================================================================

/** Sub-order (order portion for a single seller) */
export interface SubOrder {
  id: string;
  parentOrderId: string;
  sellerId: string;
  sellerName: string;
  sellerLogo?: string;
  items: OrderItem[];
  status: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }>;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  commission: CommissionBreakdown;
  sellerAmount: number;
  shippedAt?: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Marketplace order (extends regular order) */
export interface MarketplaceOrder extends Order {
  isMultiVendor: boolean;
  subOrders: SubOrder[];
  sellerCount: number;
}

/** Seller order view (what seller sees) */
export interface SellerOrderView {
  subOrder: SubOrder;
  buyer: {
    id: string;
    name: string;
    email: string;
  };
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  parentOrderNumber: string;
  parentOrderDate: string;
}

// ============================================================================
// Seller Dashboard Types
// ============================================================================

/** Dashboard period */
export type DashboardPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

/** Dashboard stats */
export interface DashboardStats {
  period: DashboardPeriod;
  sales: {
    total: number;
    count: number;
    change: number; // percentage change from previous period
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    returned: number;
  };
  products: {
    total: number;
    active: number;
    outOfStock: number;
    lowStock: number;
  };
  messages: {
    unread: number;
    total: number;
    averageResponseTime: number;
  };
  reviews: {
    average: number;
    count: number;
    pending: number;
  };
}

/** Sales chart data point */
export interface SalesDataPoint {
  date: string;
  sales: number;
  orders: number;
}

/** Top product */
export interface TopProduct {
  productId: string;
  name: string;
  image?: string;
  sales: number;
  revenue: number;
  quantity: number;
}

/** Dashboard alert */
export interface DashboardAlert {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    route: string;
  };
  createdAt: string;
  read: boolean;
}

// ============================================================================
// Seller Product Management Types
// ============================================================================

/** Product status for seller */
export type SellerProductStatus = 'draft' | 'pending_review' | 'active' | 'rejected' | 'paused' | 'out_of_stock';

/** Seller product */
export interface SellerProduct {
  id: string;
  sellerId: string;
  status: SellerProductStatus;
  rejectionReason?: string;
  views: number;
  favorites: number;
  sales: number;
  conversionRate: number;
  lastSoldAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Product import row */
export interface ProductImportRow {
  sku: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  category?: string;
  images?: string;
  status?: string;
  errors?: string[];
}

/** Import result */
export interface ProductImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    sku?: string;
    errors: string[];
  }>;
}

// ============================================================================
// Seller Chat Types
// ============================================================================

/** Quick reply template */
export interface QuickReplyTemplate {
  id: string;
  sellerId: string;
  title: string;
  content: string;
  category?: string;
  usageCount: number;
  createdAt: string;
}

/** Seller chat stats */
export interface SellerChatStats {
  totalConversations: number;
  activeConversations: number;
  unreadMessages: number;
  averageResponseTime: number;
  responseRate: number;
  satisfactionRate?: number;
}

// ============================================================================
// Admin Marketplace Types
// ============================================================================

/** Seller moderation action */
export type ModerationAction = 'approve' | 'reject' | 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'warn';

/** Moderation log */
export interface ModerationLog {
  id: string;
  sellerId: string;
  adminId: string;
  action: ModerationAction;
  reason: string;
  previousStatus: SellerStatus;
  newStatus: SellerStatus;
  createdAt: string;
}

/** Dispute */
export interface Dispute {
  id: string;
  orderId: string;
  subOrderId?: string;
  buyerId: string;
  sellerId: string;
  type: 'refund' | 'not_received' | 'not_as_described' | 'damaged' | 'other';
  status: 'open' | 'seller_response' | 'admin_review' | 'resolved' | 'closed';
  description: string;
  evidence?: string[];
  sellerResponse?: {
    content: string;
    evidence?: string[];
    respondedAt: string;
  };
  resolution?: {
    decision: 'buyer_favor' | 'seller_favor' | 'split' | 'no_action';
    refundAmount?: number;
    notes: string;
    resolvedBy: string;
    resolvedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

/** Platform financial report */
export interface PlatformFinancialReport {
  period: {
    start: string;
    end: string;
  };
  grossSales: number;
  totalCommissions: number;
  totalPayouts: number;
  pendingPayouts: number;
  refunds: number;
  fees: number;
  netRevenue: number;
  transactionCount: number;
  activeSellerCount: number;
  newSellerCount: number;
  topSellers: Array<{
    sellerId: string;
    shopName: string;
    sales: number;
    commission: number;
  }>;
}
