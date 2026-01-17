/**
 * Typography system for the application
 */

import { Platform, TextStyle } from 'react-native';

/** Font families */
export const fontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
};

/** Font weights */
export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

/** Font sizes */
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 40,
};

/** Line heights */
export const lineHeight = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 26,
  '2xl': 28,
  '3xl': 32,
  '4xl': 36,
  '5xl': 40,
  '6xl': 48,
};

/** Typography variants */
export const typography = {
  // Display styles
  displayLarge: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['6xl'],
    lineHeight: lineHeight['6xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  } as TextStyle,

  displayMedium: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['5xl'],
    lineHeight: lineHeight['5xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: -0.25,
  } as TextStyle,

  displaySmall: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['4xl'],
    lineHeight: lineHeight['4xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: 0,
  } as TextStyle,

  // Headline styles
  headlineLarge: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize['3xl'],
    lineHeight: lineHeight['3xl'],
    fontWeight: fontWeight.semibold,
    letterSpacing: 0,
  } as TextStyle,

  headlineMedium: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight['2xl'],
    fontWeight: fontWeight.semibold,
    letterSpacing: 0,
  } as TextStyle,

  headlineSmall: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0,
  } as TextStyle,

  // Title styles
  titleLarge: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.15,
  } as TextStyle,

  titleMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.1,
  } as TextStyle,

  titleSmall: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.1,
  } as TextStyle,

  // Body styles
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.regular,
    letterSpacing: 0.5,
  } as TextStyle,

  bodyMedium: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.regular,
    letterSpacing: 0.25,
  } as TextStyle,

  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.regular,
    letterSpacing: 0.4,
  } as TextStyle,

  // Label styles
  labelLarge: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.1,
  } as TextStyle,

  labelMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.5,
  } as TextStyle,

  labelSmall: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.5,
  } as TextStyle,

  // Caption styles
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.regular,
    letterSpacing: 0.4,
  } as TextStyle,

  // Button text
  button: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,

  // Link text
  link: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.25,
    textDecorationLine: 'underline',
  } as TextStyle,
};

export type TypographyVariant = keyof typeof typography;
