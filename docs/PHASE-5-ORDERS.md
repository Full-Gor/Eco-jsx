# Phase 5: Orders, Tracking & Returns

## Overview

Phase 5 implements a complete order management system with order history, tracking, and returns functionality. It follows the multi-backend architecture, supporting both cloud providers and self-hosted solutions.

## Features

### Order Management
- Order history with filters and pagination
- Order detail view with timeline
- Order status tracking
- Cancel order functionality
- Reorder functionality

### Tracking System
- Multi-carrier tracking support
- Real-time tracking updates via Socket.io (self-hosted)
- Tracking timeline with events
- External carrier link integration
- Tracking number copy and share

### Returns & Refunds
- Return request flow
- Item selection for partial returns
- Reason selection
- Photo upload for proof
- Resolution choice (refund/exchange)
- Return tracking
- Refund status tracking

## Architecture

```
src/
├── contexts/
│   └── OrderContext.tsx          # Order state management
├── providers/
│   └── tracking/
│       ├── TrackingProvider.interface.ts
│       ├── ManualTrackingProvider.ts  # Self-hosted tracking
│       └── index.ts
├── screens/
│   └── orders/
│       ├── OrderHistoryScreen.tsx
│       ├── OrderDetailScreen.tsx
│       ├── OrderTrackingScreen.tsx
│       ├── RequestReturnScreen.tsx
│       ├── ReturnDetailScreen.tsx
│       └── index.ts
└── types/
    └── order.ts                  # Extended order types
```

## Types

### Extended Order Status
```typescript
type ExtendedOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'return_requested'
  | 'return_in_progress'
  | 'returned';
```

### Extended Tracking Status
```typescript
type ExtendedTrackingStatus =
  | 'unknown'
  | 'pre_transit'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'available_for_pickup'
  | 'return_to_sender'
  | 'failure'
  | 'cancelled';
```

### Return Status
```typescript
type ReturnStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'shipped'
  | 'received'
  | 'inspecting'
  | 'refunded'
  | 'exchanged';
```

## Hooks

### useOrders
Manages order list with filters and pagination.

```typescript
const {
  orders,           // ExtendedOrderSummary[]
  isLoading,        // boolean
  error,            // string | null
  filter,           // OrderFilter
  sort,             // OrderSort
  hasMore,          // boolean
  fetchOrders,      // (reset?: boolean) => Promise<void>
  refreshOrders,    // () => Promise<void>
  loadMoreOrders,   // () => Promise<void>
  setFilter,        // (filter: OrderFilter) => void
  setSort,          // (sort: OrderSort) => void
} = useOrders();
```

### useOrder
Manages single order details.

```typescript
const {
  order,           // ExtendedOrder | null
  isLoading,       // boolean
  error,           // string | null
  fetchOrder,      // (orderId: string) => Promise<ExtendedOrder | null>
  cancelOrder,     // (orderId: string, reason?: string) => Promise<boolean>
  reorder,         // (orderId: string) => Promise<boolean>
  getTimeline,     // (order: ExtendedOrder) => OrderTimelineStep[]
} = useOrder(orderId);
```

### useTracking
Manages tracking information for a shipment.

```typescript
const {
  tracking,        // ExtendedTrackingInfo | null
  isLoading,       // boolean
  error,           // string | null
  fetchTracking,   // (trackingNumber: string, carrier?: string) => Promise<ExtendedTrackingInfo | null>
} = useTracking(trackingNumber, carrier);
```

### useReturn
Manages return request flow.

```typescript
const {
  returns,         // ReturnRequest[]
  currentReturn,   // ReturnRequest | null
  isLoading,       // boolean
  error,           // string | null
  fetchReturns,    // () => Promise<void>
  fetchReturn,     // (returnId: string) => Promise<ReturnRequest | null>
  createReturn,    // (data: CreateReturnData) => Promise<ReturnRequest | null>
  cancelReturn,    // (returnId: string) => Promise<boolean>
  getTimeline,     // (returnRequest: ReturnRequest) => ReturnTimelineStep[]
} = useReturn();
```

## Screens

### OrderHistoryScreen
Displays order history with:
- Filter tabs (All, In Progress, Delivered, Cancelled)
- Order cards with status badges
- Pull-to-refresh
- Infinite scroll pagination
- Quick actions (Track, View Details)

### OrderDetailScreen
Shows complete order information:
- Order timeline visualization
- Order items with images
- Shipping address
- Payment summary
- Action buttons (Track, Return, Cancel, Reorder, Help)

### OrderTrackingScreen
Detailed tracking view:
- Current status with icon
- Estimated delivery date
- Tracking number (copy/share)
- Carrier information
- Events timeline
- Delivery proof (if delivered)

### RequestReturnScreen
Multi-step return request:
1. Item selection with quantity
2. Reason selection
3. Photo upload (optional)
4. Resolution choice (refund/exchange)
5. Review and submit

### ReturnDetailScreen
Return request details:
- Return status timeline
- Items being returned
- Return label download
- Refund information
- Contact support

## TrackingProvider Interface

```typescript
interface ITrackingProvider {
  // Core methods
  getTrackingInfo(trackingNumber: string, carrier?: string): Promise<TrackingInfo | null>;

  // Optional methods
  trackMultiple?(trackingNumbers: string[]): Promise<Map<string, TrackingInfo>>;
  subscribeToUpdates?(trackingNumber: string, callback: TrackingUpdateCallback): () => void;
  getShippingRates?(options: GetRatesOptions): Promise<ShippingRate[]>;
  createShipment?(options: CreateShipmentOptions): Promise<Shipment>;
  cancelShipment?(shipmentId: string): Promise<boolean>;
  getPickupPoints?(postalCode: string, carrier?: string): Promise<PickupPoint[]>;
  getSupportedCarriers?(): string[];
}
```

## Manual Tracking Provider

For self-hosted backends, the ManualTrackingProvider connects to your API:

```typescript
import { createManualTrackingProvider } from '../providers/tracking';

const trackingProvider = createManualTrackingProvider({
  apiUrl: 'https://api.yourstore.com',
  // Optional: enable real-time updates
  socketUrl: 'wss://api.yourstore.com',
  // Optional: authentication
  getAuthToken: async () => localStorage.getItem('token'),
});
```

### Real-time Updates
When `socketUrl` is configured, the provider uses Socket.io for real-time tracking updates:

```typescript
// Subscribe to updates
const unsubscribe = trackingProvider.subscribeToUpdates(
  'TRACK123',
  (info) => console.log('Update:', info)
);

// Cleanup
unsubscribe();
```

## Supported Carriers

The system supports various carriers through different providers:

| Carrier | Manual | Shippo | EasyPost | 17Track |
|---------|--------|--------|----------|---------|
| Colissimo | ✓ | ✓ | ✓ | ✓ |
| Chronopost | ✓ | ✓ | ✓ | ✓ |
| Mondial Relay | ✓ | ✓ | - | ✓ |
| UPS | ✓ | ✓ | ✓ | ✓ |
| FedEx | ✓ | ✓ | ✓ | ✓ |
| DHL | ✓ | ✓ | ✓ | ✓ |
| USPS | ✓ | ✓ | ✓ | ✓ |
| La Poste | ✓ | ✓ | ✓ | ✓ |

## Configuration

Add tracking provider to your app config:

```typescript
// config/app.config.ts
export const appConfig: AppConfig = {
  // ... other config
  tracking: {
    type: 'manual',
    config: {
      apiUrl: process.env.API_URL,
      socketUrl: process.env.SOCKET_URL,
    },
  },
};
```

## API Endpoints (Self-Hosted)

For self-hosted backends, implement these endpoints:

### Orders
```
GET    /api/orders              # List orders (with filters)
GET    /api/orders/:id          # Get order details
POST   /api/orders/:id/cancel   # Cancel order
POST   /api/orders/:id/reorder  # Create new order from existing
```

### Tracking
```
GET    /api/tracking/:number    # Get tracking info
GET    /api/tracking/multi      # Get multiple tracking info
```

### Returns
```
GET    /api/returns             # List returns
GET    /api/returns/:id         # Get return details
POST   /api/returns             # Create return request
DELETE /api/returns/:id         # Cancel return request
```

## Usage Example

```tsx
import { OrderProvider, useOrders, useOrder, useTracking } from '../contexts';

function App() {
  return (
    <OrderProvider>
      <OrderHistoryScreen />
    </OrderProvider>
  );
}

function OrderHistoryScreen() {
  const { orders, isLoading, filter, setFilter, refreshOrders } = useOrders();

  // Filter by status
  const handleFilterChange = (status: 'all' | 'active' | 'completed') => {
    setFilter({ status });
  };

  return (
    <FlatList
      data={orders}
      refreshing={isLoading}
      onRefresh={refreshOrders}
      renderItem={({ item }) => <OrderCard order={item} />}
    />
  );
}

function OrderDetailView({ orderId }: { orderId: string }) {
  const { order, getTimeline, cancelOrder } = useOrder(orderId);

  if (!order) return <Loading />;

  const timeline = getTimeline(order);

  return (
    <View>
      <OrderTimeline steps={timeline} />
      {order.status === 'pending' && (
        <Button onPress={() => cancelOrder(orderId)}>Cancel Order</Button>
      )}
    </View>
  );
}
```

## Dependencies

```json
{
  "expo-clipboard": "~7.0.0",
  "expo-image-picker": "~16.0.0"
}
```

## Next Steps

Phase 6 will add:
- Push notifications for order updates
- Order search functionality
- Order export/download
- Advanced analytics
