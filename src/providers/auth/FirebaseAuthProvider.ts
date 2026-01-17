/**
 * Firebase Auth Provider
 * Authentication using Firebase Auth SDK
 *
 * Note: Requires firebase package to be installed:
 * npm install firebase
 */

import * as SecureStore from 'expo-secure-store';
import {
  IAuthProvider,
  AuthProviderOptions,
  AuthStateChangeCallback,
} from './AuthProvider.interface';
import {
  User,
  AuthSession,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  PasswordResetRequest,
  PasswordResetConfirm,
  SocialAuthData,
  AuthStatus,
} from '../../types/user';
import { ApiResponse, Unsubscribe } from '../../types/common';

/** Storage keys */
const STORAGE_KEYS = {
  USER: 'firebase_user',
};

/** Firebase configuration */
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

/** Firebase user to app user mapping */
const mapFirebaseUser = (firebaseUser: unknown): User => {
  const user = firebaseUser as {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
    emailVerified: boolean;
    metadata: {
      creationTime?: string;
      lastSignInTime?: string;
    };
  };

  const nameParts = user.displayName?.split(' ') || [];

  return {
    id: user.uid,
    email: user.email || '',
    firstName: nameParts[0] || undefined,
    lastName: nameParts.slice(1).join(' ') || undefined,
    displayName: user.displayName || undefined,
    avatar: user.photoURL || undefined,
    phone: user.phoneNumber || undefined,
    role: 'customer',
    isEmailVerified: user.emailVerified,
    createdAt: user.metadata.creationTime || new Date().toISOString(),
    updatedAt: user.metadata.lastSignInTime || new Date().toISOString(),
  };
};

/** Create Firebase Auth Provider */
export function createFirebaseAuthProvider(
  config: FirebaseConfig,
  options: AuthProviderOptions = {}
): IAuthProvider {
  const { persistSession = true } = options;

  let firebaseApp: unknown = null;
  let firebaseAuth: unknown = null;
  let currentUser: User | null = null;
  let authStatus: AuthStatus = 'loading';
  let firebaseUnsubscribe: (() => void) | null = null;
  let ready = false;
  const listeners: Set<AuthStateChangeCallback> = new Set();

  /** Notify all listeners of auth state change */
  const notifyListeners = () => {
    listeners.forEach((callback) => callback(currentUser));
  };

  /** Set auth status */
  const setAuthStatus = (status: AuthStatus) => {
    authStatus = status;
  };

  /** Initialize Firebase */
  const initializeFirebase = async () => {
    try {
      // Dynamic import to avoid bundling if not used
      const firebase = await import('firebase/app');
      const auth = await import('firebase/auth');

      // Initialize Firebase app if not already initialized
      const apps = firebase.getApps();
      if (apps.length === 0) {
        firebaseApp = firebase.initializeApp(config);
      } else {
        firebaseApp = apps[0];
      }

      firebaseAuth = auth.getAuth(firebaseApp as Parameters<typeof auth.getAuth>[0]);

      return { firebase, auth };
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw new Error('Firebase SDK not installed. Run: npm install firebase');
    }
  };

  /** Save user to secure storage */
  const saveUser = async (user: User) => {
    if (!persistSession) return;
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  /** Clear user from secure storage */
  const clearUser = async () => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  };

  const provider: IAuthProvider = {
    name: 'firebase',
    type: 'auth',

    async initialize(): Promise<void> {
      setAuthStatus('loading');

      try {
        const { auth } = await initializeFirebase();

        // Set up auth state listener
        firebaseUnsubscribe = auth.onAuthStateChanged(
          firebaseAuth as Parameters<typeof auth.onAuthStateChanged>[0],
          async (firebaseUser: unknown) => {
            if (firebaseUser) {
              currentUser = mapFirebaseUser(firebaseUser);
              setAuthStatus('authenticated');
              await saveUser(currentUser);
            } else {
              currentUser = null;
              setAuthStatus('unauthenticated');
              await clearUser();
            }
            notifyListeners();
          }
        );
        ready = true;
      } catch (error) {
        setAuthStatus('unauthenticated');
        ready = true;
        notifyListeners();
      }
    },

    isReady(): boolean {
      return ready;
    },

    async dispose(): Promise<void> {
      if (firebaseUnsubscribe) {
        firebaseUnsubscribe();
        firebaseUnsubscribe = null;
      }
      listeners.clear();
      currentUser = null;
      firebaseApp = null;
      firebaseAuth = null;
      ready = false;
    },

    async login(credentials: LoginCredentials): Promise<ApiResponse<AuthSession>> {
      try {
        const { auth } = await initializeFirebase();

        const userCredential = await auth.signInWithEmailAndPassword(
          firebaseAuth as Parameters<typeof auth.signInWithEmailAndPassword>[0],
          credentials.email,
          credentials.password
        );

        const firebaseUser = userCredential.user;
        const user = mapFirebaseUser(firebaseUser);
        const token = await (firebaseUser as { getIdToken: () => Promise<string> }).getIdToken();

        const session: AuthSession = {
          user,
          tokens: {
            accessToken: token,
            tokenType: 'Bearer',
          },
        };

        currentUser = user;
        setAuthStatus('authenticated');
        await saveUser(user);
        notifyListeners();

        return { success: true, data: session };
      } catch (error) {
        const err = error as { code?: string; message: string };
        return {
          success: false,
          error: {
            code: err.code || 'AUTH_ERROR',
            message: getFirebaseErrorMessage(err.code),
          },
        };
      }
    },

    async register(data: RegisterData): Promise<ApiResponse<AuthSession>> {
      try {
        const { auth } = await initializeFirebase();

        const userCredential = await auth.createUserWithEmailAndPassword(
          firebaseAuth as Parameters<typeof auth.createUserWithEmailAndPassword>[0],
          data.email,
          data.password
        );

        const firebaseUser = userCredential.user;

        // Update display name if provided
        if (data.firstName || data.lastName) {
          const displayName = [data.firstName, data.lastName].filter(Boolean).join(' ');
          await auth.updateProfile(
            firebaseUser as Parameters<typeof auth.updateProfile>[0],
            { displayName }
          );
        }

        const user = mapFirebaseUser(firebaseUser);
        const token = await (firebaseUser as { getIdToken: () => Promise<string> }).getIdToken();

        const session: AuthSession = {
          user,
          tokens: {
            accessToken: token,
            tokenType: 'Bearer',
          },
        };

        currentUser = user;
        setAuthStatus('authenticated');
        await saveUser(user);
        notifyListeners();

        return { success: true, data: session };
      } catch (error) {
        const err = error as { code?: string; message: string };
        return {
          success: false,
          error: {
            code: err.code || 'AUTH_ERROR',
            message: getFirebaseErrorMessage(err.code),
          },
        };
      }
    },

    async logout(): Promise<ApiResponse<void>> {
      try {
        const { auth } = await initializeFirebase();
        await auth.signOut(firebaseAuth as Parameters<typeof auth.signOut>[0]);

        currentUser = null;
        setAuthStatus('unauthenticated');
        await clearUser();
        notifyListeners();

        return { success: true };
      } catch (error) {
        const err = error as { message: string };
        return {
          success: false,
          error: {
            code: 'LOGOUT_ERROR',
            message: err.message,
          },
        };
      }
    },

    async getCurrentUser(): Promise<ApiResponse<User | null>> {
      try {
        const { auth } = await initializeFirebase();
        const firebaseUser = (firebaseAuth as { currentUser: unknown }).currentUser;

        if (firebaseUser) {
          const user = mapFirebaseUser(firebaseUser);
          currentUser = user;
          return { success: true, data: user };
        }

        return { success: true, data: null };
      } catch (error) {
        return { success: true, data: currentUser };
      }
    },

    async resetPassword(request: PasswordResetRequest): Promise<ApiResponse<void>> {
      try {
        const { auth } = await initializeFirebase();
        await auth.sendPasswordResetEmail(
          firebaseAuth as Parameters<typeof auth.sendPasswordResetEmail>[0],
          request.email
        );
        return { success: true };
      } catch (error) {
        const err = error as { code?: string; message: string };
        return {
          success: false,
          error: {
            code: err.code || 'RESET_ERROR',
            message: getFirebaseErrorMessage(err.code),
          },
        };
      }
    },

    async confirmResetPassword(confirm: PasswordResetConfirm): Promise<ApiResponse<void>> {
      try {
        const { auth } = await initializeFirebase();
        await auth.confirmPasswordReset(
          firebaseAuth as Parameters<typeof auth.confirmPasswordReset>[0],
          confirm.token,
          confirm.newPassword
        );
        return { success: true };
      } catch (error) {
        const err = error as { code?: string; message: string };
        return {
          success: false,
          error: {
            code: err.code || 'RESET_ERROR',
            message: getFirebaseErrorMessage(err.code),
          },
        };
      }
    },

    async refreshToken(): Promise<ApiResponse<AuthSession>> {
      try {
        const firebaseUser = (firebaseAuth as { currentUser: unknown }).currentUser;
        if (!firebaseUser) {
          return {
            success: false,
            error: {
              code: 'NOT_AUTHENTICATED',
              message: 'No user is currently signed in',
            },
          };
        }

        const token = await (firebaseUser as { getIdToken: (force: boolean) => Promise<string> }).getIdToken(true);
        const user = mapFirebaseUser(firebaseUser);

        return {
          success: true,
          data: {
            user,
            tokens: {
              accessToken: token,
              tokenType: 'Bearer',
            },
          },
        };
      } catch (error) {
        const err = error as { message: string };
        return {
          success: false,
          error: {
            code: 'REFRESH_ERROR',
            message: err.message,
          },
        };
      }
    },

    async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
      try {
        const { auth } = await initializeFirebase();
        const firebaseUser = (firebaseAuth as { currentUser: unknown }).currentUser;

        if (!firebaseUser) {
          return {
            success: false,
            error: {
              code: 'NOT_AUTHENTICATED',
              message: 'No user is currently signed in',
            },
          };
        }

        const profileUpdates: { displayName?: string; photoURL?: string } = {};

        if (updates.firstName || updates.lastName || updates.displayName) {
          profileUpdates.displayName =
            updates.displayName ||
            [updates.firstName, updates.lastName].filter(Boolean).join(' ');
        }

        if (updates.avatar) {
          profileUpdates.photoURL = updates.avatar;
        }

        if (Object.keys(profileUpdates).length > 0) {
          await auth.updateProfile(
            firebaseUser as Parameters<typeof auth.updateProfile>[0],
            profileUpdates
          );
        }

        // Update email if provided
        if (updates.email && updates.email !== currentUser?.email) {
          await auth.updateEmail(
            firebaseUser as Parameters<typeof auth.updateEmail>[0],
            updates.email
          );
        }

        const updatedUser = mapFirebaseUser(
          (firebaseAuth as { currentUser: unknown }).currentUser
        );
        currentUser = updatedUser;
        await saveUser(updatedUser);
        notifyListeners();

        return { success: true, data: updatedUser };
      } catch (error) {
        const err = error as { code?: string; message: string };
        return {
          success: false,
          error: {
            code: err.code || 'UPDATE_ERROR',
            message: getFirebaseErrorMessage(err.code),
          },
        };
      }
    },

    async changePassword(
      currentPassword: string,
      newPassword: string
    ): Promise<ApiResponse<void>> {
      try {
        const { auth } = await initializeFirebase();
        const firebaseUser = (firebaseAuth as { currentUser: unknown }).currentUser;

        if (!firebaseUser) {
          return {
            success: false,
            error: {
              code: 'NOT_AUTHENTICATED',
              message: 'No user is currently signed in',
            },
          };
        }

        // Re-authenticate user before changing password
        const credential = auth.EmailAuthProvider.credential(
          currentUser?.email || '',
          currentPassword
        );

        await auth.reauthenticateWithCredential(
          firebaseUser as Parameters<typeof auth.reauthenticateWithCredential>[0],
          credential
        );

        await auth.updatePassword(
          firebaseUser as Parameters<typeof auth.updatePassword>[0],
          newPassword
        );

        return { success: true };
      } catch (error) {
        const err = error as { code?: string; message: string };
        return {
          success: false,
          error: {
            code: err.code || 'PASSWORD_ERROR',
            message: getFirebaseErrorMessage(err.code),
          },
        };
      }
    },

    async deleteAccount(): Promise<ApiResponse<void>> {
      try {
        const firebaseUser = (firebaseAuth as { currentUser: unknown }).currentUser;

        if (!firebaseUser) {
          return {
            success: false,
            error: {
              code: 'NOT_AUTHENTICATED',
              message: 'No user is currently signed in',
            },
          };
        }

        await (firebaseUser as { delete: () => Promise<void> }).delete();

        currentUser = null;
        setAuthStatus('unauthenticated');
        await clearUser();
        notifyListeners();

        return { success: true };
      } catch (error) {
        const err = error as { code?: string; message: string };
        return {
          success: false,
          error: {
            code: err.code || 'DELETE_ERROR',
            message: getFirebaseErrorMessage(err.code),
          },
        };
      }
    },

    async socialLogin(data: SocialAuthData): Promise<ApiResponse<AuthSession>> {
      try {
        const { auth } = await initializeFirebase();

        let credential;
        switch (data.provider) {
          case 'google':
            credential = auth.GoogleAuthProvider.credential(data.token);
            break;
          case 'apple':
            credential = new (auth as unknown as {
              OAuthProvider: new (provider: string) => {
                credential: (opts: { idToken: string }) => unknown
              }
            }).OAuthProvider('apple.com').credential({ idToken: data.token });
            break;
          case 'facebook':
            credential = auth.FacebookAuthProvider.credential(data.token);
            break;
          default:
            return {
              success: false,
              error: {
                code: 'UNSUPPORTED_PROVIDER',
                message: `Social login with ${data.provider} is not supported`,
              },
            };
        }

        const userCredential = await auth.signInWithCredential(
          firebaseAuth as Parameters<typeof auth.signInWithCredential>[0],
          credential
        );

        const firebaseUser = userCredential.user;
        const user = mapFirebaseUser(firebaseUser);
        const token = await (firebaseUser as { getIdToken: () => Promise<string> }).getIdToken();

        const session: AuthSession = {
          user,
          tokens: {
            accessToken: token,
            tokenType: 'Bearer',
          },
        };

        currentUser = user;
        setAuthStatus('authenticated');
        await saveUser(user);
        notifyListeners();

        return { success: true, data: session };
      } catch (error) {
        const err = error as { code?: string; message: string };
        return {
          success: false,
          error: {
            code: err.code || 'SOCIAL_LOGIN_ERROR',
            message: getFirebaseErrorMessage(err.code),
          },
        };
      }
    },

    async verifyEmail(): Promise<ApiResponse<void>> {
      try {
        const { auth } = await initializeFirebase();
        const firebaseUser = (firebaseAuth as { currentUser: unknown }).currentUser;

        if (!firebaseUser) {
          return {
            success: false,
            error: {
              code: 'NOT_AUTHENTICATED',
              message: 'No user is currently signed in',
            },
          };
        }

        await auth.sendEmailVerification(
          firebaseUser as Parameters<typeof auth.sendEmailVerification>[0]
        );

        return { success: true };
      } catch (error) {
        const err = error as { code?: string; message: string };
        return {
          success: false,
          error: {
            code: err.code || 'VERIFICATION_ERROR',
            message: getFirebaseErrorMessage(err.code),
          },
        };
      }
    },

    async sendEmailVerification(): Promise<ApiResponse<void>> {
      // In Firebase, verifyEmail sends the verification email
      // Call with empty string as token is not needed for sending
      return this.verifyEmail?.('') || Promise.resolve({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } });
    },

    getAuthStatus(): AuthStatus {
      return authStatus;
    },

    onAuthStateChange(callback: AuthStateChangeCallback): Unsubscribe {
      listeners.add(callback);
      callback(currentUser);

      return () => {
        listeners.delete(callback);
      };
    },

    isAuthenticated(): boolean {
      return authStatus === 'authenticated' && currentUser !== null;
    },
  };

  return provider;
}

/** Map Firebase error codes to user-friendly messages */
function getFirebaseErrorMessage(code?: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
    'auth/invalid-email': 'Adresse email invalide',
    'auth/operation-not-allowed': 'Opération non autorisée',
    'auth/weak-password': 'Le mot de passe est trop faible',
    'auth/user-disabled': 'Ce compte a été désactivé',
    'auth/user-not-found': 'Aucun compte trouvé avec cette adresse email',
    'auth/wrong-password': 'Mot de passe incorrect',
    'auth/invalid-credential': 'Identifiants invalides',
    'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard',
    'auth/network-request-failed': 'Erreur de connexion réseau',
    'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action',
  };

  return messages[code || ''] || 'Une erreur est survenue';
}

export default createFirebaseAuthProvider;
