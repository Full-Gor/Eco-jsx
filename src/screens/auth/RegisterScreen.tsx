/**
 * Register Screen
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
import { useTheme } from '../../theme';
import { Button, Input } from '../../components/common';
import { Header } from '../../components/layout';
import { AuthStackParamList } from '../../navigation/types';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RegisterNavigationProp>();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    // TODO: Implement actual registration logic
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        showBack
        onBackPress={() => navigation.goBack()}
        title="Inscription"
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
            Créer un compte
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Rejoignez-nous pour profiter de nos offres
          </Text>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Prénom"
                  placeholder="Jean"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoComplete="given-name"
                />
              </View>
              <View style={{ width: theme.spacing.md }} />
              <View style={styles.halfInput}>
                <Input
                  label="Nom"
                  placeholder="Dupont"
                  value={lastName}
                  onChangeText={setLastName}
                  autoComplete="family-name"
                />
              </View>
            </View>

            <View style={{ height: theme.spacing.lg }} />

            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
            />

            <View style={{ height: theme.spacing.lg }} />

            <Input
              label="Mot de passe"
              placeholder="Minimum 8 caractères"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
            />

            <View style={{ height: theme.spacing.lg }} />

            <Input
              label="Confirmer le mot de passe"
              placeholder="Retapez votre mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
              error={
                confirmPassword && password !== confirmPassword
                  ? 'Les mots de passe ne correspondent pas'
                  : undefined
              }
            />
          </View>

          <Button onPress={handleRegister} loading={loading} size="lg" fullWidth>
            Créer mon compte
          </Button>

          <Text style={[styles.terms, { color: theme.colors.textTertiary }]}>
            En créant un compte, vous acceptez nos{' '}
            <Text style={{ color: theme.colors.primary }}>
              Conditions d'utilisation
            </Text>{' '}
            et notre{' '}
            <Text style={{ color: theme.colors.primary }}>
              Politique de confidentialité
            </Text>
          </Text>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Déjà un compte ?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
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
  terms: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
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
