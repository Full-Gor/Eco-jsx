# Eco-jsx - Documentation

## Vue d'ensemble du projet

**Eco-jsx** est une application e-commerce mobile React Native avec support multi-backend. Elle permet de déployer une boutique en ligne complète en choisissant entre différentes solutions d'infrastructure :

- **Self-hosted (NexusServ)** : Infrastructure auto-hébergée
- **Firebase (Free tier)** : Services Google gratuits
- **Supabase (Pro)** : Alternative open-source à Firebase

## Phases de développement

| Phase | Nom | Description | Status |
|-------|-----|-------------|--------|
| 1 | [Foundation](./PHASE-1-FOUNDATION.md) | Architecture, thème, types, composants de base | ✅ Complète |
| 2 | [Auth & User](./PHASE-2-AUTH.md) | Authentification multi-provider, gestion utilisateur | ✅ Complète |
| 3 | [Catalogue](./PHASE-3-CATALOGUE.md) | Base de données, stockage, produits, recherche | ✅ Complète |
| 4 | Cart & Checkout | Panier, paiements, commandes | 🔜 À venir |
| 5 | Orders & Profile | Suivi commandes, profil utilisateur | 🔜 À venir |
| 6 | Notifications | Push notifications, emails | 🔜 À venir |

## Architecture technique

```
┌─────────────────────────────────────────────────────────────┐
│                        Application                           │
├─────────────────────────────────────────────────────────────┤
│  Screens    │  Components  │  Contexts   │  Hooks            │
├─────────────────────────────────────────────────────────────┤
│                      Providers Layer                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Auth   │  │Database │  │ Storage │  │ Search  │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│                     Backend Services                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  NexusServ  │  │   Firebase  │  │   Supabase  │         │
│  │ (selfhosted)│  │   (free)    │  │    (pro)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Structure du projet

```
src/
├── config/              # Configuration de l'application
├── theme/               # Système de thème (light/dark)
├── types/               # Types TypeScript
├── providers/           # Providers abstraits
│   ├── auth/           # Authentification
│   ├── database/       # Base de données
│   ├── storage/        # Stockage fichiers
│   └── search/         # Recherche full-text
├── contexts/            # React Contexts
├── hooks/               # Custom hooks
├── components/          # Composants réutilisables
│   ├── common/         # UI de base
│   ├── layout/         # Layout components
│   └── product/        # Composants produit
├── screens/             # Écrans de l'application
│   ├── auth/           # Login, Register, etc.
│   ├── products/       # Liste et détail produit
│   ├── categories/     # Catégories
│   └── search/         # Recherche
├── navigation/          # Configuration navigation
└── utils/               # Utilitaires
```

## Technologies utilisées

### Core
- **React Native** 0.72+ avec **Expo**
- **TypeScript** pour le typage statique
- **React Navigation** 6.x pour la navigation

### UI
- **@expo/vector-icons** pour les icônes
- Système de thème personnalisé (light/dark)
- Composants UI natifs stylisés

### Backend (au choix)
| Service | Self-hosted | Firebase | Supabase |
|---------|-------------|----------|----------|
| Auth | JWT custom | Firebase Auth | Supabase Auth |
| Database | PostgreSQL | Firestore | PostgreSQL |
| Storage | MinIO/S3 | Firebase Storage | Supabase Storage |
| Search | Meilisearch | - | - |
| Notifications | ntfy | FCM | - |

## Configuration

### Variables d'environnement

```env
# Mode de l'application
APP_MODE=selfhosted|free|pro

# Self-hosted (NexusServ)
API_URL=https://api.example.com
MEILISEARCH_HOST=https://search.example.com
MEILISEARCH_API_KEY=your-key

# Firebase
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
FIREBASE_PROJECT_ID=project-id
FIREBASE_STORAGE_BUCKET=project.appspot.com

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

### Configuration de l'application

```typescript
// src/config/app.config.ts
import { setConfig } from './config';

setConfig({
  mode: 'selfhosted',
  app: {
    name: 'Ma Boutique',
    version: '1.0.0',
    bundleId: 'com.example.shop',
  },
  features: {
    wishlist: true,
    reviews: true,
    darkMode: true,
    socialLogin: true,
  },
  // ... providers config
});
```

## Installation

```bash
# Cloner le repository
git clone https://github.com/Full-Gor/Eco-jsx.git
cd Eco-jsx

# Installer les dépendances
npm install

# Installer les dépendances optionnelles selon le backend choisi
# Pour Firebase:
npm install firebase

# Pour Supabase:
npm install @supabase/supabase-js

# Pour NexusServ avec temps réel:
npm install socket.io-client

# Lancer l'application
npx expo start
```

## Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'feat: add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](../LICENSE) pour plus de détails.
