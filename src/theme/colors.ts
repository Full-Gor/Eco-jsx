/**
 * Color palette for the application
 */

/** Base color palette */
export const palette = {
  // Primary colors
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  // Secondary colors
  secondary: {
    50: '#FCE4EC',
    100: '#F8BBD9',
    200: '#F48FB1',
    300: '#F06292',
    400: '#EC407A',
    500: '#E91E63',
    600: '#D81B60',
    700: '#C2185B',
    800: '#AD1457',
    900: '#880E4F',
  },

  // Neutral colors
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#000000',
  },

  // Success colors
  success: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  // Warning colors
  warning: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },

  // Error colors
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },

  // Info colors
  info: {
    50: '#E1F5FE',
    100: '#B3E5FC',
    200: '#81D4FA',
    300: '#4FC3F7',
    400: '#29B6F6',
    500: '#03A9F4',
    600: '#039BE5',
    700: '#0288D1',
    800: '#0277BD',
    900: '#01579B',
  },
} as const;

/** Light theme colors */
export const lightColors = {
  // Brand
  primary: palette.primary[600],
  primaryLight: palette.primary[400],
  primaryDark: palette.primary[800],
  secondary: palette.secondary[500],
  secondaryLight: palette.secondary[300],
  secondaryDark: palette.secondary[700],

  // Background
  background: palette.neutral[0],
  backgroundSecondary: palette.neutral[50],
  backgroundTertiary: palette.neutral[100],

  // Surface
  surface: palette.neutral[0],
  surfaceVariant: palette.neutral[100],
  surfaceDisabled: palette.neutral[200],

  // Text
  text: palette.neutral[900],
  textSecondary: palette.neutral[600],
  textTertiary: palette.neutral[500],
  textDisabled: palette.neutral[400],
  textInverse: palette.neutral[0],

  // Border
  border: palette.neutral[300],
  borderLight: palette.neutral[200],
  borderDark: palette.neutral[400],

  // Status
  success: palette.success[600],
  successBackground: palette.success[50],
  warning: palette.warning[700],
  warningBackground: palette.warning[50],
  error: palette.error[600],
  errorBackground: palette.error[50],
  info: palette.info[600],
  infoBackground: palette.info[50],

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',

  // Misc
  divider: palette.neutral[200],
  skeleton: palette.neutral[200],
  ripple: 'rgba(0, 0, 0, 0.12)',

  // Navigation
  tabBar: palette.neutral[0],
  tabBarActive: palette.primary[600],
  tabBarInactive: palette.neutral[500],

  // Input
  inputBackground: palette.neutral[100],
  inputBorder: palette.neutral[300],
  inputBorderFocused: palette.primary[600],
  inputPlaceholder: palette.neutral[500],

  // Card
  card: palette.neutral[0],
  cardShadow: 'rgba(0, 0, 0, 0.1)',

  // Rating
  rating: '#FFC107',
  ratingEmpty: palette.neutral[300],

  // Badge
  badge: palette.error[600],
  badgeText: palette.neutral[0],
};

/** Dark theme colors */
export const darkColors = {
  // Brand
  primary: palette.primary[400],
  primaryLight: palette.primary[300],
  primaryDark: palette.primary[600],
  secondary: palette.secondary[400],
  secondaryLight: palette.secondary[300],
  secondaryDark: palette.secondary[600],

  // Background
  background: palette.neutral[900],
  backgroundSecondary: palette.neutral[800],
  backgroundTertiary: palette.neutral[700],

  // Surface
  surface: palette.neutral[800],
  surfaceVariant: palette.neutral[700],
  surfaceDisabled: palette.neutral[600],

  // Text
  text: palette.neutral[50],
  textSecondary: palette.neutral[300],
  textTertiary: palette.neutral[400],
  textDisabled: palette.neutral[500],
  textInverse: palette.neutral[900],

  // Border
  border: palette.neutral[600],
  borderLight: palette.neutral[700],
  borderDark: palette.neutral[500],

  // Status
  success: palette.success[400],
  successBackground: 'rgba(76, 175, 80, 0.15)',
  warning: palette.warning[400],
  warningBackground: 'rgba(255, 152, 0, 0.15)',
  error: palette.error[400],
  errorBackground: 'rgba(244, 67, 54, 0.15)',
  info: palette.info[400],
  infoBackground: 'rgba(3, 169, 244, 0.15)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',

  // Misc
  divider: palette.neutral[700],
  skeleton: palette.neutral[700],
  ripple: 'rgba(255, 255, 255, 0.12)',

  // Navigation
  tabBar: palette.neutral[800],
  tabBarActive: palette.primary[400],
  tabBarInactive: palette.neutral[400],

  // Input
  inputBackground: palette.neutral[800],
  inputBorder: palette.neutral[600],
  inputBorderFocused: palette.primary[400],
  inputPlaceholder: palette.neutral[500],

  // Card
  card: palette.neutral[800],
  cardShadow: 'rgba(0, 0, 0, 0.3)',

  // Rating
  rating: '#FFC107',
  ratingEmpty: palette.neutral[600],

  // Badge
  badge: palette.error[500],
  badgeText: palette.neutral[0],
};

/** Theme colors interface */
export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceVariant: string;
  surfaceDisabled: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  textInverse: string;
  border: string;
  borderLight: string;
  borderDark: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  error: string;
  errorBackground: string;
  info: string;
  infoBackground: string;
  overlay: string;
  overlayLight: string;
  divider: string;
  skeleton: string;
  ripple: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  inputBackground: string;
  inputBorder: string;
  inputBorderFocused: string;
  inputPlaceholder: string;
  card: string;
  cardShadow: string;
  rating: string;
  ratingEmpty: string;
  badge: string;
  badgeText: string;
}
