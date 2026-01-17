# Phase 4 - Cart & Checkout

## Vue d'ensemble

Cette phase implémente le système complet de panier et de commande. Elle inclut la gestion du panier avec persistance locale, les providers de paiement (Stripe, PayPal), les providers de livraison, le flow de checkout multi-étapes et le système de codes promo.

## Architecture

```
src/
├── types/
│   └── cart.ts                 # Types panier, commande, paiement, livraison
├── contexts/
│   ├── CartContext.tsx         # Gestion d'état du panier
│   └── CheckoutContext.tsx     # Gestion du flow checkout
├── providers/
│   ├── payment/
│   │   ├── PaymentProvider.interface.ts
│   │   ├── StripePaymentProvider.ts
│   │   ├── PayPalPaymentProvider.ts
│   │   └── index.ts
│   └── shipping/
│       ├── ShippingProvider.interface.ts
│       ├── ManualShippingProvider.ts
│       └── index.ts
├── screens/
│   ├── cart/
│   │   └── CartScreen.tsx      # Écran panier
│   └── checkout/
│       ├── CheckoutScreen.tsx  # Écran principal checkout
│       ├── OrderSuccessScreen.tsx
│       └── steps/
│           ├── AddressStep.tsx
│           ├── ShippingStep.tsx
│           ├── PaymentStep.tsx
│           └── ConfirmationStep.tsx
└── hooks/
    └── index.ts                # Export useCart, useCheckout
```

## Types Panier et Commande

### CartItem

```typescript
interface CartItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  price: Price;
  totalPrice: Price;
  addedAt: string;
  isAvailable: boolean;
  availableStock: number;
}
```

### CartSummary

```typescript
interface CartSummary {
  subtotal: Price;
  shipping: Price | null;
  discount: Price | null;
  tax: Price | null;
  total: Price;
  itemCount: number;
  totalQuantity: number;
}
```

### Order

```typescript
interface Order extends Timestamps {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: Price;
  shippingCost: Price;
  discount?: Price;
  tax?: Price;
  total: Price;
  shippingAddress: Address;
  billingAddress?: Address;
  shipping?: ShippingInfo;
  payment: PaymentInfo;
  promoCode?: string;
  notes?: string;
}

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
```

### ShippingOption

```typescript
interface ShippingOption {
  id: string;
  carrier: string;
  carrierId: string;
  name: string;
  description?: string;
  price: Price;
  estimatedDays: { min: number; max: number };
  pickupPoints?: PickupPoint[];
  isPickupPoint: boolean;
}
```

### CheckoutState

```typescript
interface CheckoutState {
  step: CheckoutStep; // 'address' | 'shipping' | 'payment' | 'confirmation'
  shippingAddress: Address | null;
  billingAddress: Address | null;
  useSameAddress: boolean;
  shippingOption: ShippingOption | null;
  selectedPickupPoint: PickupPoint | null;
  paymentMethod: SavedPaymentMethod | null;
  useNewCard: boolean;
  saveCard: boolean;
  promoCode: AppliedPromoCode | null;
  acceptedTerms: boolean;
}
```

## CartContext

### Interface CartContextValue

```typescript
interface CartContextValue {
  // État
  cart: Cart | null;
  items: CartItem[];
  summary: CartSummary;
  itemCount: number;
  isLoading: boolean;
  error: string | null;

  // Opérations sur les items
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  updateVariant: (itemId: string, variant: ProductVariant) => Promise<boolean>;
  clearCart: () => Promise<void>;

  // Déplacer vers wishlist
  moveToWishlist: (itemId: string) => Promise<boolean>;

  // Codes promo
  applyPromoCode: (code: string) => Promise<PromoCodeValidation>;
  removePromoCode: () => Promise<void>;

  // Adresses
  setShippingAddress: (address: Address) => void;
  setBillingAddress: (address: Address) => void;
  setShippingOption: (option: ShippingOption) => void;

  // Synchronisation
  syncWithServer: () => Promise<void>;
  validateStock: () => Promise<CartItem[]>;
}
```

### Fonctionnalités

- **Persistance locale** : AsyncStorage pour sauvegarder le panier
- **Synchronisation serveur** : Sync automatique avec debounce (2 secondes)
- **Fusion des paniers** : Merge local + serveur lors de la connexion
- **Validation de stock** : Vérification de disponibilité en temps réel
- **Codes promo** : Support pourcentage, montant fixe, livraison gratuite

### Utilisation

```typescript
import { useCart } from './hooks';

function ProductPage({ product }) {
  const { addItem, items, summary } = useCart();

  const handleAddToCart = async () => {
    const success = await addItem(product, 1, selectedVariant);
    if (success) {
      showToast('Produit ajouté au panier');
    }
  };

  return (
    <View>
      <Text>Total: {summary.total.formatted}</Text>
      <Button onPress={handleAddToCart}>Ajouter au panier</Button>
    </View>
  );
}
```

## CheckoutContext

### Interface CheckoutContextValue

```typescript
interface CheckoutContextValue {
  // État
  state: CheckoutState;
  isLoading: boolean;
  error: string | null;
  shippingOptions: ShippingOption[];
  paymentMethods: SavedPaymentMethod[];
  savedAddresses: Address[];

  // Navigation
  currentStep: CheckoutStep;
  canGoNext: boolean;
  canGoBack: boolean;
  goToStep: (step: CheckoutStep) => void;
  goNext: () => void;
  goBack: () => void;

  // Adresses
  setShippingAddress: (address: Address) => void;
  setBillingAddress: (address: Address | null) => void;
  setUseSameAddress: (useSame: boolean) => void;

  // Livraison
  loadShippingOptions: () => Promise<void>;
  selectShippingOption: (option: ShippingOption) => void;
  selectPickupPoint: (point: PickupPoint) => void;

  // Paiement
  loadPaymentMethods: () => Promise<void>;
  selectPaymentMethod: (method: SavedPaymentMethod | null) => void;
  setUseNewCard: (useNew: boolean) => void;
  setSaveCard: (save: boolean) => void;

  // Commande
  setAcceptedTerms: (accepted: boolean) => void;
  placeOrder: () => Promise<Order | null>;
  resetCheckout: () => void;
}
```

## Providers de Paiement

### Interface IPaymentProvider

```typescript
interface IPaymentProvider extends BaseProvider {
  createPayment(options: CreatePaymentOptions): Promise<ApiResponse<PaymentIntent>>;
  confirmPayment(paymentIntentId: string, options?: ConfirmPaymentOptions): Promise<ApiResponse<PaymentIntent>>;
  cancelPayment(paymentIntentId: string): Promise<ApiResponse<PaymentIntent>>;
  getPayment(paymentIntentId: string): Promise<ApiResponse<PaymentIntent>>;
  refundPayment(options: RefundOptions): Promise<ApiResponse<Refund>>;
  getPaymentMethods(customerId: string): Promise<ApiResponse<PaymentMethod[]>>;
  savePaymentMethod(customerId: string, paymentMethodId: string): Promise<ApiResponse<PaymentMethod>>;
  deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<void>>;
  getSupportedPaymentMethods(): PaymentMethodType[];
  isApplePayAvailable?(): Promise<boolean>;
  isGooglePayAvailable?(): Promise<boolean>;
  presentPaymentSheet?(paymentIntent: PaymentIntent): Promise<ApiResponse<PaymentIntent>>;
}
```

### 1. StripePaymentProvider

Provider utilisant le SDK Stripe React Native.

**Fonctionnalités :**
- Création de Payment Intent via API serveur
- Confirmation avec 3D Secure
- Payment Sheet natif (Apple Pay / Google Pay)
- Sauvegarde des méthodes de paiement
- Remboursements

**Configuration :**
```typescript
const stripeProvider = createStripePaymentProvider({
  publishableKey: 'pk_test_...',
  merchantId: 'merchant.com.app',
  apiUrl: 'https://api.example.com',
  urlScheme: 'myapp',
  defaultCurrency: 'EUR',
});
```

**Utilisation :**
```typescript
// Créer un paiement
const result = await stripeProvider.createPayment({
  amount: 2999, // en centimes
  currency: 'EUR',
  orderId: 'order_123',
  customerId: 'user_456',
});

// Confirmer le paiement
const confirmed = await stripeProvider.confirmPayment(result.data.id, {
  returnUrl: 'myapp://payment-complete',
});
```

### 2. PayPalPaymentProvider

Provider pour le flow de paiement PayPal.

**Fonctionnalités :**
- Création de commande PayPal via API serveur
- URL d'approbation pour redirection
- Capture de la commande après approbation
- Annulation et remboursements

**Configuration :**
```typescript
const paypalProvider = createPayPalPaymentProvider({
  clientId: 'AY...',
  apiUrl: 'https://api.example.com',
  sandbox: true,
  defaultCurrency: 'EUR',
  returnUrl: 'myapp://paypal-return',
});
```

**Utilisation :**
```typescript
// Créer une commande PayPal
const result = await paypalProvider.createPayment({
  amount: 2999,
  currency: 'EUR',
  orderId: 'order_123',
});

// L'URL d'approbation est dans metadata.approvalUrl
const approvalUrl = result.data.metadata.approvalUrl;

// Après approbation utilisateur, capturer
const captured = await paypalProvider.confirmPayment(result.data.id);
```

## Providers de Livraison

### Interface IShippingProvider

```typescript
interface IShippingProvider extends BaseProvider {
  readonly type: ShippingProviderType;
  readonly carrierName: string;

  getShippingRates(request: ShippingRateRequest): Promise<ApiResponse<ShippingOption[]>>;
  getPickupPoints?(address: Address, radius?: number): Promise<ApiResponse<PickupPoint[]>>;
  createShipment?(request: CreateShipmentRequest): Promise<ApiResponse<ShipmentLabel>>;
  trackShipment?(trackingNumber: string): Promise<ApiResponse<TrackingInfo>>;
}
```

### ManualShippingProvider

Provider avec tarifs configurables manuellement.

**Configuration :**
```typescript
const shippingProvider = createManualShippingProvider({
  options: [
    {
      id: 'standard',
      name: 'Standard',
      description: '3-5 jours ouvrés',
      price: 4.99,
      currency: 'EUR',
      estimatedDays: { min: 3, max: 5 },
      countries: ['FR', 'BE', 'CH'],
      maxWeight: 30,
      freeAbove: 50,
    },
    {
      id: 'express',
      name: 'Express',
      description: '1-2 jours ouvrés',
      price: 9.99,
      currency: 'EUR',
      estimatedDays: { min: 1, max: 2 },
      countries: ['FR'],
      maxWeight: 10,
    },
    {
      id: 'pickup',
      name: 'Point Relais',
      description: '3-4 jours ouvrés',
      price: 3.99,
      currency: 'EUR',
      estimatedDays: { min: 3, max: 4 },
      isPickupPoint: true,
      countries: ['FR'],
    },
  ],
  defaultCurrency: 'EUR',
});
```

## Écrans

### CartScreen

**Fonctionnalités :**
- Liste des articles avec image, nom, variante, prix
- Contrôles de quantité (+/-)
- Swipe pour supprimer ou déplacer vers wishlist
- Champ code promo avec validation
- Résumé de commande (sous-total, livraison, remise, total)
- Bouton "Passer commande"
- Badge "Rupture de stock" pour articles indisponibles
- Pull-to-refresh

**Actions Swipe :**
```
← Swipe gauche
  [Wishlist] [Supprimer]
```

### CheckoutScreen

Écran principal du checkout avec navigation par étapes.

**Indicateur d'étapes :**
```
[1 Adresse] ─── [2 Livraison] ─── [3 Paiement] ─── [4 Confirmation]
```

### Étape 1 - AddressStep

**Fonctionnalités :**
- Liste des adresses sauvegardées (sélection radio)
- Formulaire nouvelle adresse (prénom, nom, rue, ville, code postal, pays, téléphone)
- Checkbox "Adresse de facturation identique"
- Formulaire adresse de facturation (si différente)

### Étape 2 - ShippingStep

**Fonctionnalités :**
- Liste des options de livraison disponibles
- Prix et délais estimés
- Badge "GRATUIT" si livraison gratuite
- Sélection de point relais (si option pickup)
- Carte des points relais avec distance

### Étape 3 - PaymentStep

**Fonctionnalités :**
- Sélection du type de paiement (Carte, PayPal, Apple Pay)
- Liste des cartes sauvegardées
- Formulaire nouvelle carte (numéro, nom, expiration, CVV)
- Checkbox "Sauvegarder pour futurs achats"
- Badge sécurité SSL

### Étape 4 - ConfirmationStep

**Fonctionnalités :**
- Récapitulatif adresse de livraison (éditable)
- Récapitulatif méthode de livraison (éditable)
- Récapitulatif paiement (éditable)
- Liste des articles commandés
- Résumé des coûts
- Checkbox conditions générales
- Bouton "Confirmer et payer"

### OrderSuccessScreen

**Fonctionnalités :**
- Animation de succès (checkmark animé)
- Numéro de commande
- Informations sur l'email de confirmation
- Informations sur le suivi
- Bouton "Voir la commande"
- Bouton "Continuer mes achats"

## Codes Promo

### Types de codes

```typescript
type PromoCodeType = 'percentage' | 'fixed_amount' | 'free_shipping';

interface AppliedPromoCode {
  code: string;
  type: PromoCodeType;
  value: number;
  discount: Price;
  description?: string;
}
```

### Validation

```typescript
interface PromoCodeValidation {
  isValid: boolean;
  code?: string;
  type?: PromoCodeType;
  value?: number;
  description?: string;
  minOrderAmount?: number;
  error?: string;
}
```

### Utilisation

```typescript
const { applyPromoCode, removePromoCode, summary } = useCart();

// Appliquer un code
const result = await applyPromoCode('PROMO20');
if (result.isValid) {
  showToast(`Code appliqué : -${summary.discount?.formatted}`);
} else {
  showError(result.error);
}

// Retirer le code
await removePromoCode();
```

## Hooks

### useCart

```typescript
const {
  items,
  summary,
  itemCount,
  isLoading,
  error,
  addItem,
  removeItem,
  updateQuantity,
  applyPromoCode,
  clearCart,
} = useCart();
```

### useCheckout

```typescript
const {
  state,
  currentStep,
  canGoNext,
  goNext,
  goBack,
  setShippingAddress,
  selectShippingOption,
  selectPaymentMethod,
  placeOrder,
} = useCheckout();
```

## Flow de commande

```
1. CartScreen
   └─> Bouton "Passer commande"

2. CheckoutScreen
   ├─> AddressStep
   │   └─> Sélection/création adresse
   │   └─> Continuer vers Livraison
   │
   ├─> ShippingStep
   │   └─> Chargement options livraison
   │   └─> Sélection méthode
   │   └─> (Optionnel) Sélection point relais
   │   └─> Continuer vers Paiement
   │
   ├─> PaymentStep
   │   └─> Sélection méthode paiement
   │   └─> (Si nouvelle carte) Saisie infos
   │   └─> Continuer vers Confirmation
   │
   └─> ConfirmationStep
       └─> Vérification récapitulatif
       └─> Acceptation CGV
       └─> Bouton "Confirmer et payer"

3. Traitement
   └─> Création commande (API)
   └─> Traitement paiement (Stripe/PayPal)
   └─> Vidage panier

4. OrderSuccessScreen
   └─> Confirmation visuelle
   └─> Numéro de commande
```

## Dépendances

```json
{
  "@react-native-async-storage/async-storage": "^1.x",
  "react-native-gesture-handler": "^2.x",
  "@stripe/stripe-react-native": "^0.x" // Optionnel
}
```

## Prochaines étapes

La Phase 5 implémentera les fonctionnalités utilisateur avancées : historique des commandes, suivi de livraison, gestion du profil et wishlist.
