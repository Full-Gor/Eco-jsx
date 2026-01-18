# Phase 8: Marketplace

This phase transforms the application into a multi-vendor marketplace with seller management, commission system, seller dashboard, and multi-vendor order handling.

## Features Overview

### 1. Seller Management

Complete seller lifecycle management from registration to verification.

#### Seller Registration Flow

1. User submits seller application
2. Admin reviews application
3. Application approved/rejected
4. Seller account created
5. Seller completes profile setup
6. Payout information configured

#### Usage

```tsx
import { useSeller } from '../contexts/SellerContext';

function BecomeSeller() {
  const {
    mySellerAccount,
    myApplication,
    submitApplication,
    getApplicationStatus,
  } = useSeller();

  const handleSubmit = async (data: SellerRegistration) => {
    const application = await submitApplication({
      shopName: 'My Shop',
      description: 'Quality products...',
      contactEmail: 'shop@example.com',
      address: { ... },
      businessType: 'individual',
      payoutMethod: 'bank_transfer',
      payoutDetails: { ... },
      acceptTerms: true,
    });
  };
}
```

### 2. Seller Dashboard

Comprehensive dashboard for sellers to manage their business.

#### Features

- Sales overview (today/week/month/year)
- Order management
- Balance and earnings
- Product management
- Message center
- Analytics and reports

#### Usage

```tsx
import { useSellerDashboard } from '../contexts/SellerDashboardContext';

function DashboardScreen() {
  const {
    stats,
    balance,
    alerts,
    recentOrders,
    period,
    loadDashboard,
    changePeriod,
    getSellerOrders,
    markAsShipped,
    requestPayout,
  } = useSellerDashboard();

  // Mark order as shipped
  const handleShip = async (subOrderId: string) => {
    await markAsShipped(subOrderId, 'TRACK123', 'FedEx');
  };

  // Request payout
  const handlePayout = async () => {
    const payout = await requestPayout(100);
  };
}
```

### 3. Commission System

Flexible commission management with multiple rate types.

#### Commission Types

- **Percentage**: Fixed percentage of sale
- **Fixed**: Fixed amount per order
- **Tiered**: Rate based on seller's sales volume

#### Usage

```tsx
import { CommissionProvider } from '../providers/commission';

// Calculate commission
const breakdown = commissionProvider.calculateCommission(
  {
    orderTotal: 100,
    itemsTotal: 90,
    shippingTotal: 10,
    sellerId: 'seller123',
  },
  seller
);

// Result:
// {
//   orderTotal: 100,
//   itemsTotal: 90,
//   shippingTotal: 10,
//   commissionRate: 15,
//   commissionAmount: 13.50,
//   sellerAmount: 86.50,
//   platformAmount: 13.50,
//   currency: 'USD'
// }
```

### 4. Multi-Vendor Orders

Orders automatically split by seller with independent fulfillment.

#### Order Structure

```
MarketplaceOrder
├── id: 'order123'
├── subOrders:
│   ├── SubOrder (Seller A)
│   │   ├── items: [...]
│   │   ├── status: 'shipped'
│   │   └── trackingNumber: 'TRACK1'
│   └── SubOrder (Seller B)
│       ├── items: [...]
│       ├── status: 'processing'
│       └── trackingNumber: null
└── sellerCount: 2
```

#### Seller Order View

```tsx
interface SellerOrderView {
  subOrder: SubOrder;
  buyer: {
    id: string;
    name: string;
    email: string;
  };
  shippingAddress: Address;
  parentOrderNumber: string;
}
```

### 5. Shop Pages

Public-facing seller shop pages for buyers.

#### Features

- Shop header with logo, banner, stats
- Seller badges (Top Seller, Fast Shipper, etc.)
- Product listing with filters
- Seller reviews
- Follow/unfollow functionality
- Contact seller

#### Usage

```tsx
import { useSeller } from '../contexts/SellerContext';

function ShopPage({ sellerId }) {
  const {
    currentSeller,
    loadSeller,
    getSellerProducts,
    getSellerReviews,
    followSeller,
    isFollowing,
  } = useSeller();

  // Load seller's products
  const products = await getSellerProducts(sellerId);

  // Follow seller
  await followSeller(sellerId);
}
```

## Providers

### Seller Provider

```tsx
import { createNexusServSellerProvider } from '../providers/seller';

const sellerProvider = createNexusServSellerProvider({
  apiUrl: 'https://api.yourdomain.com',
  debug: true,
});
```

#### Methods

| Method | Description |
|--------|-------------|
| `submitApplication()` | Submit seller application |
| `getSeller()` | Get seller by ID |
| `getSellerBySlug()` | Get seller by URL slug |
| `updateSeller()` | Update seller profile |
| `getSellerProducts()` | Get seller's products |
| `getSellerReviews()` | Get seller reviews |
| `followSeller()` | Follow a seller |
| `unfollowSeller()` | Unfollow a seller |
| `getTopSellers()` | Get top-rated sellers |

### Commission Provider

```tsx
import { createNexusServCommissionProvider } from '../providers/commission';

const commissionProvider = createNexusServCommissionProvider({
  apiUrl: 'https://api.yourdomain.com',
  defaultCommissionRate: 15, // 15%
  minPayoutAmount: 50, // $50 minimum
  payoutFeePercentage: 2, // 2% fee
  debug: true,
});
```

#### Methods

| Method | Description |
|--------|-------------|
| `calculateCommission()` | Calculate commission for order |
| `getSellerBalance()` | Get seller's balance |
| `getTransactions()` | Get transaction history |
| `requestPayout()` | Request a payout |
| `getPayoutRequests()` | Get payout history |
| `getEarningsSummary()` | Get earnings summary |

## Type Definitions

### Seller Types

```typescript
interface Seller {
  id: string;
  userId: string;
  shopName: string;
  slug: string;
  logo?: string;
  banner?: string;
  description?: string;
  status: SellerStatus;
  rating: number;
  reviewCount: number;
  productCount: number;
  salesCount: number;
  verified: boolean;
  badges: SellerBadge[];
  commission: CommissionRate;
  payoutInfo?: PayoutInfo;
  policies: SellerPolicies;
}

type SellerStatus = 'pending' | 'active' | 'suspended' | 'banned';

interface SellerBadge {
  type: 'top_seller' | 'fast_shipper' | 'verified' | 'new' | 'premium';
  earnedAt: string;
}
```

### Commission Types

```typescript
interface CommissionRate {
  type: 'percentage' | 'fixed' | 'tiered';
  value: number;
  tiers?: CommissionTier[];
  categoryOverrides?: Record<string, number>;
}

interface CommissionBreakdown {
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

interface SellerBalance {
  available: number;
  pending: number;
  reserved: number;
  totalEarned: number;
  totalPaid: number;
  nextPayout?: {
    date: string;
    estimatedAmount: number;
  };
}
```

### Order Types

```typescript
interface SubOrder {
  id: string;
  parentOrderId: string;
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  status: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  subtotal: number;
  shippingCost: number;
  commission: CommissionBreakdown;
  sellerAmount: number;
}

interface MarketplaceOrder extends Order {
  isMultiVendor: boolean;
  subOrders: SubOrder[];
  sellerCount: number;
}
```

## Screens

### Seller Screens

- `SellerDashboardScreen` - Main seller dashboard
- `SellerOrdersScreen` - Order management
- `SellerFinanceScreen` - Balance and payouts
- `SellerRegistrationScreen` - Become a seller

### Marketplace Screens

- `ShopScreen` - Seller's shop page
- `SellerListScreen` - Browse sellers

## File Structure

```
src/
├── types/
│   └── marketplace.ts           # Marketplace types
├── providers/
│   ├── seller/
│   │   ├── SellerProvider.interface.ts
│   │   ├── NexusServSellerProvider.ts
│   │   └── index.ts
│   └── commission/
│       ├── CommissionProvider.interface.ts
│       ├── NexusServCommissionProvider.ts
│       └── index.ts
├── contexts/
│   ├── SellerContext.tsx
│   └── SellerDashboardContext.tsx
└── screens/
    ├── seller/
    │   ├── SellerDashboardScreen.tsx
    │   ├── SellerOrdersScreen.tsx
    │   ├── SellerFinanceScreen.tsx
    │   └── index.ts
    └── marketplace/
        ├── ShopScreen.tsx
        ├── SellerListScreen.tsx
        └── index.ts
```

## Configuration

### Enable Marketplace Mode

```typescript
const appConfig = {
  // ... other config
  marketplace: {
    enabled: true,
    commission: {
      defaultRate: 15,
      type: 'percentage',
    },
    payout: {
      minAmount: 50,
      schedule: 'weekly',
      methods: ['bank_transfer', 'paypal', 'stripe_connect'],
    },
    seller: {
      requireApproval: true,
      requireVerification: true,
      allowMultipleShops: false,
    },
  },
};
```

### App Setup

```tsx
import { SellerProvider, SellerDashboardProvider } from './contexts';

function App() {
  const isMarketplaceEnabled = config.marketplace?.enabled;
  const sellerId = currentUser?.sellerId;

  return (
    <SellerProvider
      provider={sellerProvider}
      userId={currentUser?.id}
      marketplaceEnabled={isMarketplaceEnabled}
    >
      {sellerId && (
        <SellerDashboardProvider
          commissionProvider={commissionProvider}
          sellerId={sellerId}
          apiUrl={config.apiUrl}
        >
          <YourApp />
        </SellerDashboardProvider>
      )}
    </SellerProvider>
  );
}
```

## Hooks Summary

| Hook | Description |
|------|-------------|
| `useSeller()` | Seller profile, shop management, following |
| `useSellerDashboard()` | Dashboard stats, orders, balance, payouts |

## Best Practices

1. **Mode Toggle**: Marketplace can be disabled to run as single-vendor store
2. **Commission Flexibility**: Support multiple commission structures
3. **Order Splitting**: Automatically split orders by seller
4. **Independent Fulfillment**: Each seller manages their own shipping
5. **Balance Security**: Separate pending and available balances
6. **Payout Controls**: Minimum amounts and scheduled payouts
7. **Seller Verification**: Optional verification for trust badges
