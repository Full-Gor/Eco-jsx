/**
 * Theme exports
 */

// Colors
export { palette, lightColors, darkColors } from './colors';
export type { ThemeColors } from './colors';

// Typography
export {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  typography,
} from './typography';
export type { TypographyVariant } from './typography';

// Spacing
export {
  spacing,
  borderRadius,
  shadows,
  sizing,
  screenPadding,
} from './spacing';
export type { Spacing, BorderRadius, Shadow } from './spacing';

// Theme Context
export {
  ThemeProvider,
  useTheme,
  useThemeContext,
  useColors,
  useIsDarkMode,
} from './ThemeContext';
export type { Theme, ThemeMode } from './ThemeContext';
