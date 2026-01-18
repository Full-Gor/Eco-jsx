/**
 * Welcome Screen
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { Button } from '../../components/common';
import { AuthStackParamList } from '../../navigation/types';

type WelcomeNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<WelcomeNavigationProp>();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Logo/Illustration placeholder */}
        <View
          style={[
            styles.illustrationContainer,
            { backgroundColor: theme.colors.primaryLight + '20' },
          ]}
        >
          <Text style={[styles.logoText, { color: theme.colors.primary }]}>
            🛍️
          </Text>
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          Bienvenue
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Découvrez notre sélection de produits et profitez d'offres exclusives
        </Text>
      </View>

      <View style={[styles.buttons, { paddingHorizontal: theme.spacing.lg }]}>
        <Button
          onPress={() => navigation.navigate('Login')}
          size="lg"
          fullWidth
        >
          Se connecter
        </Button>
        <View style={{ height: theme.spacing.md }} />
        <Button
          variant="outline"
          onPress={() => navigation.navigate('Register')}
          size="lg"
          fullWidth
        >
          Créer un compte
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  illustrationContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    paddingBottom: 24,
  },
});

export default WelcomeScreen;
