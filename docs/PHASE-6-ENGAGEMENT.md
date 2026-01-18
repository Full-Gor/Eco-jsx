# Phase 6: Engagement

This phase implements user engagement features including push notifications, wishlist/favorites, reviews and ratings, and newsletter subscriptions with multi-backend provider support.

## Features Overview

### 1. Push Notifications

Multi-backend notification system supporting:
- **ntfy** - Self-hosted push notification server
- **FCM** - Firebase Cloud Messaging (via expo-notifications)

#### Notification Types
- `order` - Order status updates
- `promo` - Promotional offers and discounts
- `product` - Product updates (price drops, back in stock)
- `message` - Customer support messages
- `system` - System notifications
- `review` - Review responses and mentions

#### Usage

```tsx
import { useNotifications } from '../contexts/NotificationContext';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    isLoading,
    preferences,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updatePreferences,
    requestPermission,
  } = useNotifications();

  // Mark notification as read
  const handleNotificationPress = async (notification) => {
    await markAsRead(notification.id);
  };

  // Update notification preferences
  const toggleOrderNotifications = async () => {
    await updatePreferences({ orders: !preferences.orders });
  };
}
```

### 2. Wishlist / Favorites

Full-featured wishlist system with offline support:
- Add/remove products
- Multiple wishlist lists
- Price drop alerts
- Back in stock notifications
- AsyncStorage persistence

#### Usage

```tsx
import { useWishlist } from '../contexts/WishlistContext';

function ProductCard({ product }) {
  const {
    items,
    lists,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    createList,
    moveToList,
  } = useWishlist();

  const isFavorite = isInWishlist(product.id);

  return (
    <TouchableOpacity onPress={() => toggleWishlist(product.id)}>
      <Icon name={isFavorite ? 'heart' : 'heart-outline'} />
    </TouchableOpacity>
  );
}
```

### 3. Reviews & Ratings

Comprehensive review system:
- Star ratings (1-5)
- Text reviews
- Photo/video attachments
- Criteria-based ratings
- Helpful votes
- Seller responses
- Review moderation

#### Usage

```tsx
import { useReviews } from '../contexts/ReviewContext';

function ProductReviews({ productId }) {
  const {
    reviews,
    summary,
    isLoading,
    userReview,
    fetchReviews,
    submitReview,
    updateReview,
    deleteReview,
    voteHelpful,
    reportReview,
  } = useReviews(productId);

  // Submit a new review
  const handleSubmit = async () => {
    await submitReview({
      rating: 5,
      title: 'Great product!',
      body: 'Exceeded my expectations...',
      images: ['https://...'],
    });
  };

  // Vote review as helpful
  const handleHelpful = async (reviewId) => {
    await voteHelpful(reviewId);
  };
}
```

### 4. Newsletter

Newsletter subscription with multi-backend support:
- **Listmonk** - Self-hosted mailing list manager
- **Brevo** - Cloud email marketing (ex-Sendinblue)

#### Usage

```tsx
import { useNewsletter } from '../contexts/NewsletterContext';

function NewsletterSignup() {
  const {
    isSubscribed,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    checkSubscriptionStatus,
  } = useNewsletter();

  const handleSubscribe = async () => {
    await subscribe({
      email: 'user@example.com',
      firstName: 'John',
      marketingConsent: true,
    });
  };

  return (
    <View>
      {!isSubscribed ? (
        <Button onPress={handleSubscribe} title="Subscribe" />
      ) : (
        <Text>You're subscribed!</Text>
      )}
    </View>
  );
}
```

## Providers

### Notification Providers

#### ntfy Provider (Self-hosted)

```tsx
import { createNtfyNotificationProvider } from '../providers/notification/NtfyNotificationProvider';

const provider = createNtfyNotificationProvider({
  serverUrl: 'https://ntfy.yourdomain.com',
  defaultTopic: 'myapp-notifications',
  authToken: 'your-auth-token', // Optional
  userTopicPrefix: 'user', // Creates user_<userId> topics
  debug: true,
});
```

Features:
- Server-Sent Events (SSE) for real-time notifications
- Topic-based subscriptions
- User-specific topics
- No system permissions required (web-based)

#### FCM Provider

```tsx
import { createFCMNotificationProvider } from '../providers/notification/FCMNotificationProvider';

const provider = await createFCMNotificationProvider({
  projectId: 'your-firebase-project-id',
  apiUrl: 'https://api.yourdomain.com', // Backend for sending
  debug: true,
  androidChannel: {
    id: 'orders',
    name: 'Order Notifications',
    importance: 4, // MAX
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  },
});
```

Features:
- Native push notifications via expo-notifications
- Android notification channels
- Badge count management
- Token refresh handling

### Newsletter Providers

#### Listmonk Provider (Self-hosted)

```tsx
import { createListmonkNewsletterProvider } from '../providers/newsletter/ListmonkNewsletterProvider';

const provider = createListmonkNewsletterProvider({
  serverUrl: 'https://listmonk.yourdomain.com',
  username: 'admin',
  password: 'your-password',
  defaultListId: 1,
  debug: true,
});
```

#### Brevo Provider

```tsx
import { createBrevoNewsletterProvider } from '../providers/newsletter/BrevoNewsletterProvider';

const provider = createBrevoNewsletterProvider({
  apiKey: 'your-brevo-api-key',
  defaultListId: 1,
  senderEmail: 'noreply@yourdomain.com',
  senderName: 'Your Store',
  doubleOptIn: true, // Enable double opt-in
  debug: true,
});
```

## Screens

### NotificationCenterScreen

Displays all notifications with:
- Notification type indicators (icons & colors)
- Read/unread status
- Relative timestamps
- Swipe-to-delete
- Tap to navigate to relevant content
- Mark all as read
- Clear all notifications

```tsx
import { NotificationCenterScreen } from '../screens/engagement/NotificationCenterScreen';

// In your navigator
<Stack.Screen name="Notifications" component={NotificationCenterScreen} />
```

### NotificationPreferencesScreen

Toggle notification preferences by type:
- Order updates
- Promotions & offers
- New arrivals
- Price drops
- Back in stock
- Messages

```tsx
import { NotificationPreferencesScreen } from '../screens/engagement/NotificationPreferencesScreen';

<Stack.Screen name="NotificationSettings" component={NotificationPreferencesScreen} />
```

### WishlistScreen

Grid display of favorited products with:
- Product images and details
- Price drop indicators
- Back in stock badges
- Sort options (date, price, name)
- Remove from wishlist
- Quick add to cart

```tsx
import { WishlistScreen } from '../screens/engagement/WishlistScreen';

<Stack.Screen name="Wishlist" component={WishlistScreen} />
```

## Type Definitions

### Notification Types

```typescript
interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  image?: string;
  read: boolean;
  action?: NotificationAction;
  actionId?: string;
  createdAt: Date | string;
  readAt?: Date | string;
}

interface PushNotificationPreferences {
  orders: boolean;
  promotions: boolean;
  newArrivals: boolean;
  priceDrops: boolean;
  backInStock: boolean;
  messages: boolean;
}
```

### Review Types

```typescript
interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  body: string;
  images?: string[];
  videos?: string[];
  criteriaRatings?: Record<string, number>;
  helpfulCount: number;
  reportCount: number;
  isVerifiedPurchase: boolean;
  sellerResponse?: SellerResponse;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  criteriaAverages?: Record<string, number>;
}
```

### Newsletter Types

```typescript
interface NewsletterPreferences {
  email: string;
  subscribed: boolean;
  topics: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  marketingConsent: boolean;
  consentDate?: string;
}

interface SubscriptionStatus {
  isSubscribed: boolean;
  email?: string;
  subscribedAt?: string;
  lists?: string[];
}
```

## Configuration

### App Configuration

Add engagement settings to your app config:

```typescript
const config: AppConfig = {
  // ... other config

  // Notification provider
  notificationProvider: 'ntfy', // or 'fcm'
  ntfyConfig: {
    serverUrl: 'https://ntfy.yourdomain.com',
    defaultTopic: 'myapp',
  },

  // Newsletter provider
  newsletterProvider: 'listmonk', // or 'brevo'
  listmonkConfig: {
    serverUrl: 'https://listmonk.yourdomain.com',
    username: 'admin',
    password: 'password',
  },
};
```

### Provider Setup

Wrap your app with the engagement providers:

```tsx
import { NotificationProvider } from '../contexts/NotificationContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { NewsletterProvider } from '../contexts/NewsletterContext';

function App() {
  return (
    <NotificationProvider>
      <WishlistProvider>
        <NewsletterProvider>
          <YourApp />
        </NewsletterProvider>
      </WishlistProvider>
    </NotificationProvider>
  );
}
```

## File Structure

```
src/
├── types/
│   └── engagement.ts              # Engagement type definitions
├── providers/
│   ├── notification/
│   │   ├── NotificationProvider.interface.ts
│   │   ├── NtfyNotificationProvider.ts
│   │   ├── FCMNotificationProvider.ts
│   │   └── index.ts
│   └── newsletter/
│       ├── NewsletterProvider.interface.ts
│       ├── ListmonkNewsletterProvider.ts
│       ├── BrevoNewsletterProvider.ts
│       └── index.ts
├── contexts/
│   ├── NotificationContext.tsx
│   ├── WishlistContext.tsx
│   ├── ReviewContext.tsx
│   └── NewsletterContext.tsx
└── screens/
    └── engagement/
        ├── NotificationCenterScreen.tsx
        ├── NotificationPreferencesScreen.tsx
        └── WishlistScreen.tsx
```

## Dependencies

### Required
- `react-native-gesture-handler` - For swipe actions
- `@react-native-async-storage/async-storage` - For wishlist persistence

### Optional (based on provider choice)
- `expo-notifications` - For FCM provider
- `expo-device` - For FCM device detection

## Best Practices

1. **Offline First**: Wishlist items are stored locally and synced when online
2. **Permission Handling**: Always check/request notification permissions before enabling
3. **GDPR Compliance**: Track marketing consent with timestamps for newsletter
4. **User Experience**: Show immediate feedback for wishlist actions
5. **Performance**: Use pagination for reviews and notifications lists
