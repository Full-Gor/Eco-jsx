/**
 * Forgot Password Screen
 * Functional password reset with multi-backend support
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
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

type ForgotPasswordNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

export function ForgotPasswordScreen() {
  const theme = useTheme();
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const validate = (): boolean => {
    if (!email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    if (!isValidEmail(email)) {
      setError('Email invalide');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError(undefined);

    try {
      const result = await resetPassword({ email: email.trim().toLowerCase() });

      if (result.success) {
        setSent(true);
        showToast('Email de réinitialisation envoyé', 'success');
      } else {
        setError(result.error?.message || 'Impossible d\'envoyer l\'email');
        showToast(result.error?.message || 'Erreur lors de l\'envoi', 'error');
      }
    } catch (err) {
      setError('Une erreur est survenue');
      showToast('Une erreur est survenue', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header
          showBack
          onBackPress={() => navigation.goBack()}
          title="Mot de passe oublié"
        />

        <View style={styles.successContainer}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.successBackground },
            ]}
          >
            <Ionicons name="mail" size={48} color={theme.colors.success} />
          </View>

          <Text style={[styles.successTitle, { color: theme.colors.text }]}>
            Email envoyé !
          </Text>
          <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
            Si un compte existe avec cette adresse, vous recevrez un email avec les
            instructions pour réinitialiser votre mot de passe.
          </Text>
          <Text
            style={[
              styles.emailText,
              { color: theme.colors.text, marginTop: theme.spacing.md },
            ]}
          >
            {email}
          </Text>

          <View style={styles.successActions}>
            <Button
              variant="primary"
              onPress={() => navigation.navigate('Login')}
              size="lg"
              fullWidth
            >
              Retour à la connexion
            </Button>

            <Button
              variant="ghost"
              onPress={() => {
                setSent(false);
                setEmail('');
              }}
              size="md"
              style={{ marginTop: theme.spacing.md }}
            >
              Essayer une autre adresse
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        showBack
        onBackPress={() => navigation.goBack()}
        title="Mot de passe oublié"
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
          <View
            style={[
              styles.iconContainerSmall,
              { backgroundColor: theme.colors.primaryLight + '20' },
            ]}
          >
            <Ionicons name="key-outline" size={32} color={theme.colors.primary} />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            Mot de passe oublié ?
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Pas de panique ! Entrez votre adresse email et nous vous enverrons
            un lien pour réinitialiser votre mot de passe.
          </Text>

          <View style={styles.form}>
            <Input
              label="Adresse email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(undefined);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
              leftIcon="mail-outline"
              error={error}
              editable={!loading}
            />
          </View>

          <Button
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            fullWidth
          >
            Envoyer le lien de réinitialisation
          </Button>

          <Text
            style={[
              styles.helpText,
              { color: theme.colors.textTertiary, marginTop: theme.spacing.lg },
            ]}
          >
            Vous recevrez un email avec un lien sécurisé valable 1 heure.
          </Text>
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
  iconContainerSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  helpText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  successActions: {
    width: '100%',
    marginTop: 32,
  },
});

export default ForgotPasswordScreen;
