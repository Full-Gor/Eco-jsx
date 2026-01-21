/**
 * Login Screen - Neumorphic Pastel Blue Design
 *
 * PALETTE HARMONIEUSE :
 * - Fond principal : #d4e5f7 (bleu ciel pastel doux)
 * - Ombre claire : #ffffff (blanc pur)
 * - Ombre sombre : #b3c7db (bleu-gris doux)
 * - Accent : #7eb8e2 (bleu plus soutenu pour focus)
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
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import {
  NeumorphicInput,
  NeumorphicButton,
  NeumorphicCard,
  NeumorphicSocialButton,
  NeumorphicDivider,
  neumorphicColors,
} from '../../components/auth';
import { useToast } from '../../components/common/Toast';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks';
import { isValidEmail } from '../../utils';

// Required for Google Auth
WebBrowser.maybeCompleteAuthSession();

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

// Google OAuth Client IDs
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginNavigationProp>();
  const { login, socialLogin } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const userInfo = await userInfoResponse.json();

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
        showToast('Configuration Google manquante', 'error');
        return;
      }
      setSocialLoading(true);
      promptAsync();
    } else if (provider === 'apple') {
      showToast('Connexion Apple bientôt disponible', 'info');
    } else if (provider === 'facebook') {
      showToast('Connexion Facebook bientôt disponible', 'info');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={neumorphicColors.background} />

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <View style={styles.backButtonInner}>
          <LinearGradient
            colors={[neumorphicColors.shadowDark, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="chevron-back" size={24} color={neumorphicColors.text} />
        </View>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card Container */}
          <NeumorphicCard style={styles.cardContainer}>
            {/* Title */}
            <Text style={styles.title}>Login</Text>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Field */}
              <NeumorphicInput
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

              {/* Password Field */}
              <NeumorphicInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                }}
                secureTextEntry={!showPassword}
                autoComplete="password"
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                error={errors.password}
                editable={!loading}
              />

              {/* Submit Button */}
              <NeumorphicButton
                title="Submit"
                onPress={handleLogin}
                loading={loading}
                size="lg"
              />
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </NeumorphicCard>

          {/* Divider */}
          <NeumorphicDivider text="ou continuer avec" />

          {/* Social Buttons */}
          <View style={styles.socialButtons}>
            <NeumorphicSocialButton
              provider="google"
              onPress={() => handleSocialLogin('google')}
              loading={socialLoading}
              disabled={loading}
            />
            <NeumorphicSocialButton
              provider="apple"
              onPress={() => handleSocialLogin('apple')}
              disabled={loading || socialLoading}
            />
            <NeumorphicSocialButton
              provider="facebook"
              onPress={() => handleSocialLogin('facebook')}
              disabled={loading || socialLoading}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
            >
              <Text style={styles.footerLink}>Créer un compte</Text>
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
    backgroundColor: neumorphicColors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT * 0.85,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    zIndex: 10,
  },
  backButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: neumorphicColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardContainer: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 450,
  },
  title: {
    fontSize: 48,
    fontWeight: '500',
    color: neumorphicColors.text,
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  form: {
    gap: 8,
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: neumorphicColors.accent,
    fontWeight: '400',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: neumorphicColors.textLight,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: neumorphicColors.accent,
  },
});

export default LoginScreen;
