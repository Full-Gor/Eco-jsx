/**
 * Forgot Password Screen
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
import { Header } from '../../components/layout';
import { AuthStackParamList } from '../../navigation/types';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

export function ForgotPasswordScreen() {
  const theme = useTheme();
  const navigation = useNavigation<ForgotPasswordNavigationProp>();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // TODO: Implement actual password reset logic
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1500);
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
            Nous avons envoyé un lien de réinitialisation à{'\n'}
            <Text style={{ fontWeight: '600' }}>{email}</Text>
          </Text>

          <Button
            variant="outline"
            onPress={() => navigation.navigate('Login')}
            size="lg"
            fullWidth
            style={{ marginTop: 32 }}
          >
            Retour à la connexion
          </Button>
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
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Réinitialiser le mot de passe
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Entrez votre adresse email et nous vous enverrons un lien pour
            réinitialiser votre mot de passe
          </Text>

          <View style={styles.form}>
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
          </View>

          <Button
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            fullWidth
            disabled={!email.includes('@')}
          >
            Envoyer le lien
          </Button>
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
    lineHeight: 24,
  },
  form: {
    marginBottom: 24,
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
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ForgotPasswordScreen;
