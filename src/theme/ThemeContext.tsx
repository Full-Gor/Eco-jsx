/**
 * Theme Context and Provider
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { useColorScheme, Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from './colors';
import { typography, TypographyVariant } from './typography';
import { spacing, borderRadius, shadows, sizing, screenPadding } from './spacing';

/** Theme mode */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Theme object */
export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  sizing: typeof sizing;
  screenPadding: typeof screenPadding;
}

/** Theme context type */
interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = '@app_theme_mode';

/** Create light theme */
const createLightTheme = (): Theme => ({
  mode: 'light',
  isDark: false,
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  sizing,
  screenPadding,
});

/** Create dark theme */
const createDarkTheme = (): Theme => ({
  mode: 'dark',
  isDark: true,
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  sizing,
  screenPadding,
});

/** Default context value */
const defaultContext: ThemeContextType = {
  theme: createLightTheme(),
  themeMode: 'system',
  setThemeMode: () => {},
  toggleTheme: () => {},
};

/** Theme context */
const ThemeContext = createContext<ThemeContextType>(defaultContext);

/** Theme provider props */
interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

/** Theme Provider component */
export function ThemeProvider({ children, initialMode = 'system' }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialMode);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadThemePreference();
  }, []);

  // Save theme preference
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setThemeMode(themeMode === 'dark' ? 'light' : themeMode === 'light' ? 'dark' : 'light');
  }, [themeMode, setThemeMode]);

  // Calculate effective theme
  const effectiveColorScheme: ColorSchemeName = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme || 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  // Create theme object
  const theme = useMemo<Theme>(() => {
    return effectiveColorScheme === 'dark' ? createDarkTheme() : createLightTheme();
  }, [effectiveColorScheme]);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'system') {
        // Theme will automatically update via effectiveColorScheme
      }
    });

    return () => subscription.remove();
  }, [themeMode]);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      themeMode,
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode, setThemeMode, toggleTheme]
  );

  // Don't render until we've loaded the saved preference
  if (!isInitialized) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Hook to access theme */
export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context.theme;
}

/** Hook to access theme context */
export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

/** Hook to get styled colors */
export function useColors(): ThemeColors {
  const theme = useTheme();
  return theme.colors;
}

/** Hook to check if dark mode */
export function useIsDarkMode(): boolean {
  const theme = useTheme();
  return theme.isDark;
}

export default ThemeProvider;
