# Phase 7: Advanced Features

This phase implements advanced e-commerce features including visual search, gamification, real-time chat support, internationalization, and product recommendations.

## Features Overview

### 1. Image Search

Visual product search using camera or gallery images.

#### Usage

```tsx
import { useImageSearch } from '../contexts/ImageSearchContext';

function SearchScreen() {
  const {
    isSearching,
    results,
    error,
    searchByImage,
    clearResults,
    isReady,
  } = useImageSearch();

  const handleSearch = async (imageBase64: string) => {
    const results = await searchByImage(imageBase64, {
      limit: 20,
      minSimilarity: 0.5,
    });
  };
}
```

#### Providers

- **TensorFlow.js** (self-hosted) - Uses backend service with TensorFlow for feature extraction

### 2. Gamification

Complete loyalty and engagement system.

#### Features

- **Loyalty Points**: Earn points on purchases, reviews, referrals
- **User Levels**: Bronze, Silver, Gold, Platinum tiers with benefits
- **Daily Check-in**: Streak bonuses for consecutive logins
- **Fortune Wheel**: Spin to win prizes with animated wheel
- **Missions/Challenges**: Complete tasks for rewards
- **Referral Program**: Invite friends for mutual rewards

#### Usage

```tsx
import { useLoyalty } from '../contexts/GamificationContext';

function LoyaltyScreen() {
  const {
    loyaltyStatus,
    missions,
    wheelStatus,
    referralInfo,
    dailyCheckin,
    spinWheel,
    claimMissionReward,
    conversionRate,
  } = useLoyalty();

  // Check-in
  const handleCheckin = async () => {
    const result = await dailyCheckin();
    if (result) {
      alert(`Earned ${result.amount} points!`);
    }
  };

  // Spin wheel
  const handleSpin = async () => {
    const result = await spinWheel();
    if (result) {
      alert(`Won: ${result.prize.name}`);
    }
  };
}
```

#### Points Earning Sources

| Action | Points |
|--------|--------|
| Purchase | 10 pts per $1 |
| Product Review | 50 pts |
| Daily Check-in | 10-50 pts |
| Referral | 500 pts |
| Mission Complete | Varies |

### 3. Chat Support

Real-time customer support chat with Socket.IO.

#### Features

- Real-time messaging
- Typing indicators
- File attachments
- Conversation history
- Offline message queue
- Connection status

#### Usage

```tsx
import { useChat } from '../contexts/ChatContext';

function ChatScreen() {
  const {
    isConnected,
    conversations,
    currentConversation,
    messages,
    typingUsers,
    sendMessage,
    markAsRead,
    sendTyping,
    startSupportChat,
  } = useChat();

  // Start support chat
  const handleStartChat = async () => {
    const conversation = await startSupportChat('I need help with my order');
    // Navigate to chat screen
  };

  // Send message
  const handleSend = async (text: string) => {
    await sendMessage(text);
  };
}
```

### 4. Internationalization (i18n)

Multi-language and multi-currency support.

#### Languages

- English (en)
- French (fr)

#### Currencies

- EUR, USD, GBP, CAD, CHF, JPY

#### Usage

```tsx
import { useI18n, useCurrency } from '../contexts';

function ProductCard({ product }) {
  const { t, locale, formatDate } = useI18n();
  const { format, currency, convert } = useCurrency();

  return (
    <View>
      <Text>{product.name}</Text>
      <Text>{format(product.price.amount)}</Text>
      <Text>{t('product.addToCart')}</Text>
    </View>
  );
}
```

#### Translation Keys Structure

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error"
  },
  "product": {
    "addToCart": "Add to Cart",
    "buyNow": "Buy Now"
  }
}
```

### 5. Recommendations

AI-powered product recommendations.

#### Types

- **For You**: Personalized based on behavior
- **Similar Products**: Based on current product
- **Also Bought**: Customers who bought this also bought
- **Trending**: Popular products
- **Recently Viewed**: User's browsing history
- **Based on Cart**: Recommendations based on cart contents

#### Usage

```tsx
import { useRecommendations } from '../contexts/RecommendationContext';

function HomeScreen() {
  const {
    forYou,
    trending,
    recentlyViewed,
    getSimilar,
    getAlsoBought,
    trackView,
    trackAddToCart,
    refreshHome,
  } = useRecommendations();

  // Track product view
  useEffect(() => {
    trackView(productId);
  }, [productId]);

  // Get similar products
  const loadSimilar = async (productId: string) => {
    const products = await getSimilar(productId, { limit: 10 });
  };
}
```

#### Behavior Tracking

The system automatically tracks:
- Product views (with duration)
- Add to cart events
- Purchases
- Wishlist additions
- Search queries
- Category browsing

## Providers

### Image Search Provider

```tsx
import { createTensorFlowImageSearchProvider } from '../providers/imageSearch';

const provider = createTensorFlowImageSearchProvider({
  apiUrl: 'https://api.yourdomain.com/image-search',
  debug: true,
});
```

### Gamification Provider

```tsx
import { createNexusServGamificationProvider } from '../providers/gamification';

const provider = createNexusServGamificationProvider({
  apiUrl: 'https://api.yourdomain.com',
  pointsPerCurrency: 10,
  conversionRate: 100, // 100 points = $1
  debug: true,
});
```

### Chat Provider

```tsx
import { createSocketIOChatProvider } from '../providers/chat';

const provider = createSocketIOChatProvider({
  apiUrl: 'https://api.yourdomain.com',
  wsUrl: 'wss://api.yourdomain.com/chat',
  reconnection: {
    enabled: true,
    attempts: 5,
    delay: 1000,
  },
  debug: true,
});
```

### i18n Provider

```tsx
import { createReactI18nProvider } from '../providers/i18n';
import { supportedLocales, translations } from '../locales';

const provider = createReactI18nProvider({
  defaultLocale: 'en',
  fallbackLocale: 'en',
  supportedLocales,
  translations,
  debug: true,
});
```

### Currency Provider

```tsx
import { createExchangeRateCurrencyProvider } from '../providers/currency';

const provider = createExchangeRateCurrencyProvider({
  defaultCurrency: 'USD',
  supportedCurrencies: [...],
  exchangeRateApiUrl: 'https://api.exchangerate.host/latest',
  cacheDuration: 3600000, // 1 hour
  debug: true,
});
```

### Recommendation Provider

```tsx
import { createNexusServRecommendationProvider } from '../providers/recommendation';

const provider = createNexusServRecommendationProvider({
  apiUrl: 'https://api.yourdomain.com',
  cacheDuration: 300000, // 5 minutes
  debug: true,
});
```

## Screens

### Image Search Screen

`ImageSearchScreen` - Camera/gallery image selection with visual search results

### Gamification Screens

- `GamificationDashboardScreen` - Points, level, missions overview
- `FortuneWheelScreen` - Animated spin-to-win wheel

### Chat Screens

- `ChatListScreen` - Conversation list with unread badges
- `ChatScreen` - Real-time chat interface

### Settings

- `LanguageSettingsScreen` - Language and currency selection

## Type Definitions

### Image Search Types

```typescript
interface ImageSearchResult {
  productId: string;
  similarity: number;
  product: Product;
  matchedFeatures?: string[];
}
```

### Gamification Types

```typescript
interface LoyaltyStatus {
  userId: string;
  points: number;
  lifetimePoints: number;
  level: UserLevel;
  nextLevel?: UserLevel;
  pointsToNextLevel: number;
  streakDays: number;
  referralCode: string;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  target: number;
  progress: number;
  reward: MissionReward;
  status: MissionStatus;
}

interface WheelPrize {
  id: string;
  name: string;
  type: RewardType;
  value: number;
  probability: number;
  color: string;
}
```

### Chat Types

```typescript
interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'support' | 'bot' | 'seller';
  content: string;
  attachments?: ChatAttachment[];
  status: MessageStatus;
  createdAt: string;
}

interface Conversation {
  id: string;
  type: 'support' | 'seller' | 'order';
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}
```

### i18n Types

```typescript
interface LocaleInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  symbolPosition: 'before' | 'after';
}
```

## File Structure

```
src/
├── types/
│   └── advanced.ts                # Advanced feature types
├── providers/
│   ├── imageSearch/
│   │   ├── ImageSearchProvider.interface.ts
│   │   ├── TensorFlowImageSearchProvider.ts
│   │   └── index.ts
│   ├── gamification/
│   │   ├── GamificationProvider.interface.ts
│   │   ├── NexusServGamificationProvider.ts
│   │   └── index.ts
│   ├── chat/
│   │   ├── ChatProvider.interface.ts
│   │   ├── SocketIOChatProvider.ts
│   │   └── index.ts
│   ├── i18n/
│   │   ├── I18nProvider.interface.ts
│   │   ├── ReactI18nProvider.ts
│   │   └── index.ts
│   ├── currency/
│   │   ├── CurrencyProvider.interface.ts
│   │   ├── ExchangeRateCurrencyProvider.ts
│   │   └── index.ts
│   └── recommendation/
│       ├── RecommendationProvider.interface.ts
│       ├── NexusServRecommendationProvider.ts
│       └── index.ts
├── contexts/
│   ├── ImageSearchContext.tsx
│   ├── GamificationContext.tsx
│   ├── ChatContext.tsx
│   ├── I18nContext.tsx
│   ├── CurrencyContext.tsx
│   └── RecommendationContext.tsx
├── screens/
│   └── advanced/
│       ├── ImageSearchScreen.tsx
│       ├── GamificationDashboardScreen.tsx
│       ├── FortuneWheelScreen.tsx
│       ├── ChatListScreen.tsx
│       ├── ChatScreen.tsx
│       ├── LanguageSettingsScreen.tsx
│       └── index.ts
└── locales/
    ├── en.json
    ├── fr.json
    └── index.ts
```

## App Setup

Wrap your app with all the advanced providers:

```tsx
import {
  ImageSearchProvider,
  GamificationProvider,
  ChatProvider,
  I18nProvider,
  CurrencyProvider,
  RecommendationProvider,
} from './contexts';

function App() {
  return (
    <I18nProvider provider={i18nProvider}>
      <CurrencyProvider provider={currencyProvider}>
        <GamificationProvider
          provider={gamificationProvider}
          userId={userId}
          enabled={true}
        >
          <ChatProvider
            provider={chatProvider}
            userId={userId}
            autoConnect={true}
          >
            <RecommendationProvider
              provider={recommendationProvider}
              userId={userId}
            >
              <ImageSearchProvider provider={imageSearchProvider}>
                <YourApp />
              </ImageSearchProvider>
            </RecommendationProvider>
          </ChatProvider>
        </GamificationProvider>
      </CurrencyProvider>
    </I18nProvider>
  );
}
```

## Hooks Summary

| Hook | Description |
|------|-------------|
| `useImageSearch()` | Visual search functionality |
| `useLoyalty()` / `useGamification()` | Points, missions, wheel, referrals |
| `useChat()` | Real-time chat |
| `useI18n()` | Translations and localization |
| `useTranslation()` | Shorthand for t() function |
| `useCurrency()` | Currency formatting and conversion |
| `usePrice()` | Shorthand for format() function |
| `useRecommendations()` | Product recommendations |

## Best Practices

1. **Gamification**: Enable/disable via config, don't force on users
2. **Chat**: Implement offline queue for poor connectivity
3. **i18n**: Always use fallback locale for missing translations
4. **Currency**: Cache exchange rates, refresh periodically
5. **Recommendations**: Track behavior ethically, respect privacy
6. **Image Search**: Compress images before sending to reduce bandwidth
