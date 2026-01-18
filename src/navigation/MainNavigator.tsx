/**
 * Main Tab Navigator
 */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { useTheme } from '../theme';

// Placeholder screens - will be implemented in later phases
import { HomeScreen } from '../screens/home/HomeScreen';
import { CategoriesScreen } from '../screens/categories/CategoriesScreen';
import { CartScreen } from '../screens/cart/CartScreen';
import { FavoritesScreen } from '../screens/favorites/FavoritesScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const getTabIcon = (routeName: keyof MainTabParamList, focused: boolean): IconName => {
  const icons: Record<keyof MainTabParamList, { focused: IconName; unfocused: IconName }> = {
    Home: { focused: 'home', unfocused: 'home-outline' },
    Categories: { focused: 'grid', unfocused: 'grid-outline' },
    Cart: { focused: 'cart', unfocused: 'cart-outline' },
    Favorites: { focused: 'heart', unfocused: 'heart-outline' },
    Profile: { focused: 'person', unfocused: 'person-outline' },
  };

  return focused ? icons[routeName].focused : icons[routeName].unfocused;
};

const tabLabels: Record<keyof MainTabParamList, string> = {
  Home: 'Accueil',
  Categories: 'Catégories',
  Cart: 'Panier',
  Favorites: 'Favoris',
  Profile: 'Profil',
};

export function MainNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: theme.sizing.tabBar + (Platform.OS === 'ios' ? 20 : 0),
          paddingTop: theme.spacing.xs,
          paddingBottom: Platform.OS === 'ios' ? 20 : theme.spacing.xs,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarLabelStyle: {
          ...theme.typography.labelSmall,
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default MainNavigator;
