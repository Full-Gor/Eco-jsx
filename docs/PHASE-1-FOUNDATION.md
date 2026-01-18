# Phase 1 - Foundation

## Vue d'ensemble

Cette phase établit les fondations de l'application e-commerce mobile multi-backend. Elle met en place l'architecture de base, le système de thème, la configuration multi-backend et les types TypeScript fondamentaux.

## Structure du projet

```
src/
├── config/           # Configuration de l'application
├── theme/            # Système de thème (couleurs, spacing, etc.)
├── types/            # Types TypeScript
├── providers/        # Interface des providers
├── components/       # Composants UI de base
│   ├── common/       # Button, Input, Card, Modal, etc.
│   └── layout/       # Header, TabBar, etc.
├── navigation/       # Configuration React Navigation
├── screens/          # Écrans de base
└── utils/            # Utilitaires
```

## Fonctionnalités implémentées

### 1. Configuration Multi-Backend

Le système supporte trois modes de déploiement :

| Mode | Description | Services |
|------|-------------|----------|
| `selfhosted` | Auto-hébergé avec NexusServ | PostgreSQL, MinIO, ntfy |
| `free` | Services gratuits | Firebase Auth/Firestore/Storage |
| `pro` | Services professionnels | Supabase Auth/DB/Storage |

**Fichier de configuration** : `src/config/app.config.ts`

```typescript
interface AppConfig {
  mode: 'selfhosted' | 'free' | 'pro';
  app: { name, version, bundleId };
  features: { wishlist, reviews, darkMode, ... };
  auth: AuthProviderConfig[];
  database: DatabaseProviderConfig;
  storage: StorageProviderConfig;
  payments: PaymentProviderConfig[];
  // ...
}
```

### 2. Système de Thème

**Support du mode sombre/clair** avec :
- Palette de couleurs complète
- Espacements standardisés
- Typographie cohérente
- Ombres et border radius
- Hook `useTheme()` pour accéder au thème

```typescript
const theme = useTheme();
// theme.colors.primary
// theme.spacing.md
// theme.shadows.lg
```

### 3. Types TypeScript

**Types de configuration** (`src/types/config.ts`) :
- `AppMode` - Mode de l'application
- `AuthProviderConfig` - Configuration auth (Firebase, Supabase, Auth0, Clerk)
- `DatabaseProviderConfig` - Configuration base de données
- `StorageProviderConfig` - Configuration stockage
- `PaymentProviderConfig` - Configuration paiements (Stripe, PayPal, Mollie)
- `NotificationProviderConfig` - Configuration notifications (ntfy, FCM, OneSignal)
- `TrackingProviderConfig` - Configuration livraison (Colissimo, Chronopost, etc.)

**Types communs** (`src/types/common.ts`) :
- `ApiResponse<T>` - Réponse API standardisée
- `Callback<T>` / `Unsubscribe` - Patterns de callback
- `ID`, `Timestamp` - Types utilitaires

### 4. Interfaces des Providers

Architecture de providers abstraits permettant l'interchangeabilité :

```typescript
interface BaseProvider {
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  isReady(): boolean;
}
```

### 5. Composants UI de Base

| Composant | Description |
|-----------|-------------|
| `Button` | Bouton avec variants (primary, secondary, outline, ghost, danger) |
| `Input` | Champ de texte avec validation |
| `Card` | Carte avec variants (elevated, outlined, filled) |
| `Modal` | Modal avec différentes tailles |
| `BottomSheet` | Sheet glissant depuis le bas |
| `Toast` | Notifications toast |
| `Header` | En-tête de navigation |

### 6. Navigation

Configuration React Navigation avec :
- Stack Navigator pour la navigation principale
- Tab Navigator pour la navigation par onglets
- Types TypeScript pour les paramètres de route

## Dépendances principales

```json
{
  "react-native": "^0.72.x",
  "@react-navigation/native": "^6.x",
  "@react-navigation/native-stack": "^6.x",
  "@react-navigation/bottom-tabs": "^6.x",
  "react-native-safe-area-context": "^4.x",
  "@expo/vector-icons": "^13.x"
}
```

## Utilisation

### Initialiser la configuration

```typescript
import { setConfig } from './config';

setConfig({
  mode: 'selfhosted',
  apiUrl: 'https://api.example.com',
  // ...
});
```

### Utiliser le thème

```typescript
import { useTheme } from './theme';

function MyComponent() {
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>Hello</Text>
    </View>
  );
}
```

### Utiliser les composants

```typescript
import { Button, Card, Input } from './components/common';

<Card variant="elevated" padding="lg">
  <Input placeholder="Email" />
  <Button variant="primary">Se connecter</Button>
</Card>
```

## Prochaines étapes

La Phase 2 implémente le système d'authentification et de gestion utilisateur.
