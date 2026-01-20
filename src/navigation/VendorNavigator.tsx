/**
 * Vendor Tab Navigator
 * Bottom tabs for vendor-specific screens
 */

import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VendorTabParamList, VendorStackParamList } from './types';
import { useTheme } from '../theme';

// Screens
import { VendorDashboardScreen } from '../screens/vendor/VendorDashboardScreen';
import { MyShopScreen } from '../screens/vendor/MyShopScreen';
import { MyProductsScreen } from '../screens/vendor/MyProductsScreen';
import { AddEditProductScreen } from '../screens/vendor/AddEditProductScreen';
import { VendorOrdersScreen } from '../screens/vendor/VendorOrdersScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<VendorTabParamList>();
const Stack = createNativeStackNavigator<VendorStackParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const getTabIcon = (routeName: keyof VendorTabParamList, focused: boolean): IconName => {
  const icons: Record<keyof VendorTabParamList, { focused: IconName; unfocused: IconName }> = {
    VendorDashboard: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
    MyShop: { focused: 'storefront', unfocused: 'storefront-outline' },
    MyProducts: { focused: 'cube', unfocused: 'cube-outline' },
    VendorOrders: { focused: 'receipt', unfocused: 'receipt-outline' },
    VendorProfile: { focused: 'person', unfocused: 'person-outline' },
  };

  return focused ? icons[routeName].focused : icons[routeName].unfocused;
};

const tabLabels: Record<keyof VendorTabParamList, string> = {
  VendorDashboard: 'Tableau de bord',
  MyShop: 'Ma Boutique',
  MyProducts: 'Produits',
  VendorOrders: 'Commandes',
  VendorProfile: 'Profil',
};

/** My Products Stack Navigator */
function MyProductsStackNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="MyProductsScreen"
        component={MyProductsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddProduct"
        component={AddEditProductScreen}
        options={{ title: 'Ajouter un produit' }}
      />
      <Stack.Screen
        name="EditProduct"
        component={AddEditProductScreen}
        options={{ title: 'Modifier le produit' }}
      />
    </Stack.Navigator>
  );
}

/** Main Vendor Tab Navigator */
export function VendorNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Calculate tab bar height - add extra padding for Android navigation bar
  const bottomPadding = Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 40);
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tab.Navigator
      initialRouteName="VendorDashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }: TabIconProps) => (
          <Ionicons
            name={getTabIcon(route.name, focused)}
            size={22}
            color={color}
          />
        ),
        tabBarLabel: tabLabels[route.name],
      })}
    >
      <Tab.Screen name="VendorDashboard" component={VendorDashboardScreen} />
      <Tab.Screen name="MyShop" component={MyShopScreen} />
      <Tab.Screen name="MyProducts" component={MyProductsStackNavigator} />
      <Tab.Screen name="VendorOrders" component={VendorOrdersScreen} />
      <Tab.Screen name="VendorProfile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default VendorNavigator;
