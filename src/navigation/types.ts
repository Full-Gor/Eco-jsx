/**
 * Navigation types
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

/** Auth Stack param list */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  Welcome: undefined;
};

/** Main Tab param list */
export type MainTabParamList = {
  Home: undefined;
  Categories: undefined;
  Cart: undefined;
  Favorites: undefined;
  Profile: undefined;
};

/** Home Stack param list */
export type HomeStackParamList = {
  HomeScreen: undefined;
  ProductDetails: { productId: string };
  ProductList: { categoryId?: string; search?: string; title?: string };
  Search: undefined;
};

/** Categories Stack param list */
export type CategoriesStackParamList = {
  CategoriesScreen: undefined;
  CategoryProducts: { categoryId: string; categoryName: string };
  SubCategories: { categoryId: string; categoryName: string };
};

/** Cart Stack param list */
export type CartStackParamList = {
  CartScreen: undefined;
  Checkout: undefined;
  CheckoutAddress: undefined;
  CheckoutPayment: undefined;
  CheckoutConfirmation: undefined;
  OrderSuccess: { orderId: string };
};

/** Favorites Stack param list */
export type FavoritesStackParamList = {
  FavoritesScreen: undefined;
};

/** Profile Stack param list */
export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Addresses: undefined;
  AddAddress: { addressId?: string };
  EditAddress: { addressId: string };
  PaymentMethods: undefined;
  AddPaymentMethod: undefined;
  Orders: undefined;
  OrderDetails: { orderId: string };
  Notifications: undefined;
  Language: undefined;
  Security: undefined;
  Help: undefined;
  Contact: undefined;
  Terms: undefined;
  Privacy: undefined;
};

/** Root Stack param list */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Modal: undefined;
};

/** Screen props types */

// Root Stack screen props
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// Auth Stack screen props
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AuthStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

// Main Tab screen props
export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

// Home Stack screen props
export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    MainTabScreenProps<'Home'>
  >;

// Categories Stack screen props
export type CategoriesStackScreenProps<T extends keyof CategoriesStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<CategoriesStackParamList, T>,
    MainTabScreenProps<'Categories'>
  >;

// Cart Stack screen props
export type CartStackScreenProps<T extends keyof CartStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<CartStackParamList, T>,
    MainTabScreenProps<'Cart'>
  >;

// Favorites Stack screen props
export type FavoritesStackScreenProps<T extends keyof FavoritesStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<FavoritesStackParamList, T>,
    MainTabScreenProps<'Favorites'>
  >;

// Profile Stack screen props
export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    MainTabScreenProps<'Profile'>
  >;

/** Declaration for TypeScript */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
