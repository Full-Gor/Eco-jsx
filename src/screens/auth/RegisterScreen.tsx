/**
 * Register Screen
 * Functional registration with multi-backend support
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button, Input } from '../../components/common';
import { useToast } from '../../components/common/Toast';
import { Header } from '../../components/layout';
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

export function RegisterScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RegisterNavigationProp>();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Le mot de passe doit contenir une majuscule';
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Le mot de passe doit contenir un chiffre';
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
        // Navigation will be handled by the auth state change
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

  const Checkbox = ({
    checked,
    onPress,
    label,
    error,
  }: {
    checked: boolean;
    onPress: () => void;
    label: React.ReactNode;
    error?: string;
  }) => (
    <View style={styles.checkboxContainer}>
      <TouchableOpacity
        style={[
          styles.checkbox,
          {
            borderColor: error ? theme.colors.error : theme.colors.border,
            backgroundColor: checked ? theme.colors.primary : 'transparent',
          },
        ]}
        onPress={onPress}
        disabled={loading}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </TouchableOpacity>
      <TouchableOpacity onPress={onPress} style={styles.checkboxLabel} disabled={loading}>
        {typeof label === 'string' ? (
          <Text style={[styles.checkboxText, { color: theme.colors.text }]}>{label}</Text>
        ) : (
          label
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        showBack
        onBackPress={() => navigation.goBack()}
        title="Créer un compte"
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
            Bienvenue !
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Créez votre compte pour commencer vos achats
          </Text>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
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
              <View style={{ width: theme.spacing.md }} />
              <View style={styles.halfInput}>
                <Input
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

            <View style={{ height: theme.spacing.md }} />

            <Input
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

            <View style={{ height: theme.spacing.md }} />

            <Input
              label="Mot de passe"
              placeholder="Minimum 8 caractères"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError('password');
              }}
              secureTextEntry
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
              error={errors.password}
              editable={!loading}
            />

            <View style={{ height: theme.spacing.md }} />

            <Input
              label="Confirmer le mot de passe"
              placeholder="Répétez votre mot de passe"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearError('confirmPassword');
              }}
              secureTextEntry
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
              error={errors.confirmPassword}
              editable={!loading}
            />

            <View style={{ height: theme.spacing.lg }} />

            <Checkbox
              checked={acceptTerms}
              onPress={() => {
                setAcceptTerms(!acceptTerms);
                clearError('terms');
              }}
              error={errors.terms}
              label={
                <Text style={[styles.checkboxText, { color: theme.colors.text }]}>
                  J'accepte les{' '}
                  <Text style={{ color: theme.colors.primary }}>
                    conditions d'utilisation
                  </Text>{' '}
                  et la{' '}
                  <Text style={{ color: theme.colors.primary }}>
                    politique de confidentialité
                  </Text>
                </Text>
              }
            />

            {errors.terms && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.terms}
              </Text>
            )}

            <View style={{ height: theme.spacing.sm }} />

            <Checkbox
              checked={newsletter}
              onPress={() => setNewsletter(!newsletter)}
              label="Je souhaite recevoir les offres et nouveautés par email"
            />
          </View>

          <Button onPress={handleRegister} loading={loading} size="lg" fullWidth>
            Créer mon compte
          </Button>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Déjà un compte ?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                Se connecter
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
  row: {
    flexDirection: 'row',
  },
  halfInput: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxText: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 34,
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

export default RegisterScreen;
