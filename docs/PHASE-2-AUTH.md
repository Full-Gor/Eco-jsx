# Phase 2 - Authentification & Utilisateur

## Vue d'ensemble

Cette phase implémente le système d'authentification multi-backend et la gestion des utilisateurs. Elle fournit une abstraction complète permettant de basculer entre différents providers d'authentification sans modifier le code métier.

## Architecture

```
src/
├── providers/
│   └── auth/
│       ├── AuthProvider.interface.ts   # Interface commune
│       ├── NexusServAuthProvider.ts    # Auth auto-hébergé
│       ├── FirebaseAuthProvider.ts     # Firebase Auth
│       ├── SupabaseAuthProvider.ts     # Supabase Auth
│       └── index.ts
├── contexts/
│   └── AuthContext.tsx                 # Context React
├── screens/
│   └── auth/
│       ├── LoginScreen.tsx
│       ├── RegisterScreen.tsx
│       ├── ForgotPasswordScreen.tsx
│       └── index.ts
└── types/
    └── user.ts                         # Types utilisateur
```

## Providers d'authentification

### Interface commune (IAuthProvider)

```typescript
interface IAuthProvider extends BaseProvider {
  // Authentification de base
  login(credentials: LoginCredentials): Promise<ApiResponse<AuthSession>>;
  register(data: RegisterData): Promise<ApiResponse<AuthSession>>;
  logout(): Promise<ApiResponse<void>>;

  // Gestion utilisateur
  getCurrentUser(): Promise<ApiResponse<User | null>>;
  updateProfile(updates: Partial<User>): Promise<ApiResponse<User>>;
  changePassword(current: string, newPass: string): Promise<ApiResponse<void>>;
  deleteAccount(): Promise<ApiResponse<void>>;

  // Mot de passe
  resetPassword(request: PasswordResetRequest): Promise<ApiResponse<void>>;
  confirmResetPassword(confirm: PasswordResetConfirm): Promise<ApiResponse<void>>;

  // Token
  refreshToken(): Promise<ApiResponse<AuthSession>>;

  // Social (optionnel)
  socialLogin?(data: SocialAuthData): Promise<ApiResponse<AuthSession>>;

  // Email (optionnel)
  verifyEmail?(token: string): Promise<ApiResponse<void>>;
  sendEmailVerification?(): Promise<ApiResponse<void>>;

  // État
  getAuthStatus(): AuthStatus;
  onAuthStateChange(callback: AuthStateChangeCallback): Unsubscribe;
  isAuthenticated(): boolean;
}
```

### 1. NexusServAuthProvider (Auto-hébergé)

Provider pour authentification JWT personnalisée via l'API NexusServ.

**Fonctionnalités :**
- Login/Register via REST API
- Stockage sécurisé du token (AsyncStorage)
- Refresh token automatique
- Gestion des erreurs avec codes personnalisés

**Configuration :**
```typescript
{
  type: 'selfhosted',
  apiUrl: 'https://api.nexusserv.com',
  jwtSecret: 'optional-for-client'
}
```

### 2. FirebaseAuthProvider

Provider utilisant Firebase Authentication avec chargement dynamique du SDK.

**Fonctionnalités :**
- Email/Password authentication
- Social login (Google, Apple, Facebook)
- Email verification
- Password reset via Firebase
- Auth state persistence

**Configuration :**
```typescript
{
  type: 'firebase',
  apiKey: 'AIza...',
  authDomain: 'project.firebaseapp.com',
  projectId: 'project-id'
}
```

### 3. SupabaseAuthProvider

Provider utilisant Supabase Auth avec son client JavaScript.

**Fonctionnalités :**
- Email/Password authentication
- Magic link authentication
- Social OAuth providers
- Session management automatique
- Real-time auth state sync

**Configuration :**
```typescript
{
  type: 'supabase',
  url: 'https://xxx.supabase.co',
  anonKey: 'eyJ...'
}
```

## Types Utilisateur

### User

```typescript
interface User {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}
```

### AuthSession

```typescript
interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
}
```

### AuthStatus

```typescript
type AuthStatus =
  | 'idle'           // État initial
  | 'loading'        // Vérification en cours
  | 'authenticated'  // Utilisateur connecté
  | 'unauthenticated'; // Non connecté
```

## Context d'authentification

### AuthContext

```typescript
interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  status: AuthStatus;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
}
```

### Utilisation

```typescript
import { useAuth } from './contexts';

function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View>
      <Text>Bonjour {user?.displayName}</Text>
      <Button onPress={handleLogout}>Déconnexion</Button>
    </View>
  );
}
```

## Écrans d'authentification

### LoginScreen

- Champs email et mot de passe
- Validation en temps réel
- Bouton "Mot de passe oublié"
- Lien vers l'inscription
- Support biométrique (optionnel)
- Social login buttons

### RegisterScreen

- Formulaire complet (nom, email, mot de passe)
- Validation des champs
- Acceptation des CGU
- Création de compte

### ForgotPasswordScreen

- Saisie de l'email
- Envoi du lien de réinitialisation
- Message de confirmation

## Sécurité

### Stockage des tokens

```typescript
// Stockage sécurisé avec AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@refresh_token';

// En production, utiliser react-native-keychain pour plus de sécurité
```

### Validation

- Validation email avec regex
- Mot de passe minimum 8 caractères
- Vérification du format des données

### Refresh Token

Le refresh automatique est géré par les providers :
- Vérifie l'expiration avant chaque requête
- Refresh transparent si nécessaire
- Logout si refresh échoue

## Configuration

### Activer un provider

```typescript
// Dans app.config.ts
{
  auth: [
    {
      type: 'firebase',
      enabled: true,
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
    }
  ]
}
```

### Feature flags

```typescript
{
  features: {
    socialLogin: true,      // Activer social login
    biometricAuth: true,    // Activer auth biométrique
    guestCheckout: false,   // Désactiver checkout invité
  }
}
```

## Tests

```typescript
// Mock du provider pour les tests
const mockAuthProvider: IAuthProvider = {
  login: jest.fn().mockResolvedValue({ success: true, data: mockSession }),
  logout: jest.fn().mockResolvedValue({ success: true }),
  // ...
};
```

## Prochaines étapes

La Phase 3 implémente le catalogue produits avec les providers de base de données et de stockage.
