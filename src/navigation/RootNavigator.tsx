/**
 * Root Navigator
 */

import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { useTheme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  /** Override initial auth state (for testing) */
  initialAuthenticated?: boolean;
}

export function RootNavigator({ initialAuthenticated = false }: RootNavigatorProps) {
  const theme = useTheme();

  // TODO: Replace with actual auth state from AuthProvider
  const [isAuthenticated] = useState(initialAuthenticated);

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
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default RootNavigator;
