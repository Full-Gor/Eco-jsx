/**
 * Root Navigator
 * Handles conditional routing based on authentication and user role
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { VendorNavigator } from './VendorNavigator';
import { useTheme } from '../theme';
import { useAuth } from '../hooks';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  initialAuthenticated?: boolean;
}

export function RootNavigator({ initialAuthenticated }: RootNavigatorProps) {
  const theme = useTheme();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show nothing while checking auth state
  if (isLoading) {
    return null;
  }

  // Determine if user is a vendor (user, customer, client = regular user)
  const isVendor = user?.role === 'vendor' || user?.role === 'vendeur';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      {isAuthenticated ? (
        isVendor ? (
          <Stack.Screen name="Vendor" component={VendorNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default RootNavigator;
