/**
 * Main Tab Navigator
 */

import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { useTheme } from '../theme';

// Screens
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
  const insets = useSafeAreaInsets();

  // Calculate tab bar height - add extra padding for Android navigation bar
  // Use larger padding for Android to ensure tabs are above system navigation buttons
  const bottomPadding = Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 48);
  const tabBarHeight = 70 + bottomPadding;

  return (
    <Tab.Navigator
      initialRouteName="Home"
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
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }: TabIconProps) => (
          <Ionicons
            name={getTabIcon(route.name, focused)}
            size={24}
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
