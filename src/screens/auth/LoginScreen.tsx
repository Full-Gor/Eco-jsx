/**
 * Login Screen
 * Functional login with multi-backend support
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../../theme';
import { Button, Input } from '../../components/common';
import { useToast } from '../../components/common/Toast';
import { Header } from '../../components/layout';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks';
import { isValidEmail } from '../../utils';

// Required for Google Auth
WebBrowser.maybeCompleteAuthSession();

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

// Google OAuth Client IDs - Replace with your own from Google Cloud Console
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

export function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginNavigationProp>();
  const { login, socialLogin } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Google Auth Setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  // Handle Google Auth Response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleLogin(authentication.accessToken);
      }
    } else if (response?.type === 'error') {
      showToast('Échec de la connexion Google', 'error');
      setSocialLoading(false);
    }
  }, [response]);

  const handleGoogleLogin = async (accessToken: string) => {
    try {
      // Get user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const userInfo = await userInfoResponse.json();

      // Send to our backend for authentication
      const result = await socialLogin({
        provider: 'google',
        token: accessToken,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      });

      if (result.success) {
        showToast('Connexion Google réussie !', 'success');
      } else {
        showToast(result.error?.message || 'Échec de la connexion', 'error');
      }
    } catch (error) {
      showToast('Erreur lors de la connexion Google', 'error');
    } finally {
      setSocialLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email invalide';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await login({
        email: email.trim().toLowerCase(),
        password,
        rememberMe: true,
      });

      if (result.success) {
        showToast('Connexion réussie !', 'success');
        // Navigation will be handled by the auth state change
      } else {
        showToast(result.error?.message || 'Échec de la connexion', 'error');
      }
    } catch (error) {
      showToast('Une erreur est survenue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    if (provider === 'google') {
      if (!GOOGLE_CLIENT_ID && !GOOGLE_IOS_CLIENT_ID && !GOOGLE_ANDROID_CLIENT_ID) {
        showToast('Configuration Google manquante. Ajoutez EXPO_PUBLIC_GOOGLE_CLIENT_ID dans .env', 'error');
        return;
      }
      setSocialLoading(true);
      promptAsync();
    } else if (provider === 'apple') {
      // Apple Sign In - needs expo-apple-authentication
      showToast('Connexion Apple bientôt disponible', 'info');
    } else if (provider === 'facebook') {
      // Facebook Login - needs expo-facebook
      showToast('Connexion Facebook bientôt disponible', 'info');
    }
  };

  const SocialButton = ({
    provider,
    icon,
    label,
    color,
  }: {
    provider: 'google' | 'apple' | 'facebook';
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.socialButton,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: socialLoading ? 0.6 : 1,
        },
      ]}
      onPress={() => handleSocialLogin(provider)}
      activeOpacity={0.7}
      disabled={loading || socialLoading}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.socialButtonText, { color: theme.colors.text }]}>
        {socialLoading && provider === 'google' ? 'Connexion...' : label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        showBack
        onBackPress={() => navigation.goBack()}
        title="Connexion"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: theme.spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Bon retour !
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Connectez-vous pour accéder à votre compte
          </Text>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              error={errors.email}
              editable={!loading}
            />

            <View style={{ height: theme.spacing.lg }} />

            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
              secureTextEntry
              autoComplete="password"
              leftIcon="lock-closed-outline"
              error={errors.password}
              editable={!loading}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
              disabled={loading}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
          </View>

          <Button onPress={handleLogin} loading={loading} size="lg" fullWidth>
            Se connecter
          </Button>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
              ou continuer avec
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <View style={styles.socialButtons}>
            <SocialButton
              provider="google"
              icon="logo-google"
              label="Google"
              color="#DB4437"
            />
            <SocialButton
              provider="apple"
              icon="logo-apple"
              label="Apple"
              color={theme.isDark ? '#FFFFFF' : '#000000'}
            />
            <SocialButton
              provider="facebook"
              icon="logo-facebook"
              label="Facebook"
              color="#4267B2"
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Pas encore de compte ?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
              <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                Créer un compte
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
