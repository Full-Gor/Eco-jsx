/**
 * E-Commerce Mobile Multi-Backend Application
 * Phase 2: Auth & User
 */

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

import { ThemeProvider, useTheme } from './src/theme';
import { ToastProvider } from './src/components/common/Toast';
import { AuthProvider, useAuth, CatalogProvider, CartProvider, VendorProvider } from './src/contexts';
import { RootNavigator } from './src/navigation';
import { SplashScreen } from './src/screens/splash/SplashScreen';

/** App content with theme and auth access */
function AppContent() {
  const theme = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Show splash screen with wave animation
  if (showSplash) {
    return <SplashScreen onAnimationComplete={() => setShowSplash(false)} />;
  }

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: theme.isDark,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.error,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        },
      }}
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <RootNavigator initialAuthenticated={isAuthenticated} />
    </NavigationContainer>
  );
}

/** App with Auth Provider */
function AppWithAuth() {
  return (
    <AuthProvider>
      <VendorProvider>
        <CatalogProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </CatalogProvider>
      </VendorProvider>
    </AuthProvider>
  );
}

/** Main App component */
export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppWithAuth />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
