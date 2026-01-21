/**
 * Register Screen - Neumorphic Pastel Blue Design
 *
 * PALETTE HARMONIEUSE :
 * - Fond principal : #d4e5f7 (bleu ciel pastel doux)
 * - Ombre claire : #ffffff (blanc pur)
 * - Ombre sombre : #b3c7db (bleu-gris doux)
 * - Accent : #7eb8e2 (bleu plus soutenu pour focus)
 */

import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import {
  NeumorphicInput,
  NeumorphicButton,
  NeumorphicCard,
  NeumorphicCheckbox,
  neumorphicColors,
} from '../../components/auth';
import { useToast } from '../../components/common/Toast';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../hooks';
import { isValidEmail } from '../../utils';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RegisterNavigationProp>();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email invalide';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Une majuscule requise';
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Un chiffre requis';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmez votre mot de passe';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!acceptTerms) {
      newErrors.terms = 'Vous devez accepter les conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await register({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        acceptTerms,
        newsletter,
      });

      if (result.success) {
        showToast('Compte créé avec succès !', 'success');
      } else {
        showToast(result.error?.message || 'Échec de l\'inscription', 'error');
      }
    } catch (error) {
      showToast('Une erreur est survenue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((e) => ({ ...e, [field]: undefined }));
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
            <Text style={styles.title}>Register</Text>

            {/* Form */}
            <View style={styles.form}>
              {/* Name Row */}
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <NeumorphicInput
                    label="Prénom"
                    placeholder="Jean"
                    value={firstName}
                    onChangeText={(text) => {
                      setFirstName(text);
                      clearError('firstName');
                    }}
                    autoCapitalize="words"
                    autoComplete="given-name"
                    leftIcon="person-outline"
                    error={errors.firstName}
                    editable={!loading}
                  />
                </View>
                <View style={styles.spacer} />
                <View style={styles.halfInput}>
                  <NeumorphicInput
                    label="Nom"
                    placeholder="Dupont"
                    value={lastName}
                    onChangeText={(text) => {
                      setLastName(text);
                      clearError('lastName');
                    }}
                    autoCapitalize="words"
                    autoComplete="family-name"
                    error={errors.lastName}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Email Field */}
              <NeumorphicInput
                label="Email"
                placeholder="votre@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearError('email');
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
                label="Mot de passe"
                placeholder="Minimum 8 caractères"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError('password');
                }}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                error={errors.password}
                editable={!loading}
              />

              {/* Confirm Password Field */}
              <NeumorphicInput
                label="Confirmer le mot de passe"
                placeholder="Répétez votre mot de passe"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  clearError('confirmPassword');
                }}
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                leftIcon="lock-closed-outline"
                rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                error={errors.confirmPassword}
                editable={!loading}
              />

              {/* Terms Checkbox */}
              <View style={styles.checkboxSection}>
                <NeumorphicCheckbox
                  checked={acceptTerms}
                  onPress={() => {
                    setAcceptTerms(!acceptTerms);
                    clearError('terms');
                  }}
                  error={!!errors.terms}
                  disabled={loading}
                  label={
                    <Text style={styles.checkboxText}>
                      J'accepte les{' '}
                      <Text style={styles.checkboxLink}>conditions d'utilisation</Text>
                      {' '}et la{' '}
                      <Text style={styles.checkboxLink}>politique de confidentialité</Text>
                    </Text>
                  }
                />
                {errors.terms && (
                  <Text style={styles.errorText}>{errors.terms}</Text>
                )}

                {/* Newsletter Checkbox */}
                <NeumorphicCheckbox
                  checked={newsletter}
                  onPress={() => setNewsletter(!newsletter)}
                  disabled={loading}
                  label="Je souhaite recevoir les offres et nouveautés par email"
                />
              </View>

              {/* Submit Button */}
              <NeumorphicButton
                title="Créer mon compte"
                onPress={handleRegister}
                loading={loading}
                size="lg"
              />
            </View>
          </NeumorphicCard>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.footerLink}>Se connecter</Text>
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
    paddingTop: 80,
    paddingBottom: 40,
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
    fontSize: 42,
    fontWeight: '500',
    color: neumorphicColors.text,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  form: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
  },
  halfInput: {
    flex: 1,
  },
  spacer: {
    width: 12,
  },
  checkboxSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  checkboxText: {
    fontSize: 14,
    color: neumorphicColors.text,
    lineHeight: 20,
  },
  checkboxLink: {
    color: neumorphicColors.accent,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: neumorphicColors.error,
    marginTop: 4,
    marginLeft: 34,
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

export default RegisterScreen;
