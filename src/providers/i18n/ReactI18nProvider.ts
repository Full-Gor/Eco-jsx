/**
 * React i18n Provider
 * Simple i18n implementation for React Native
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  I18nProvider,
  I18nProviderConfig,
  LocaleChangeCallback,
} from './I18nProvider.interface';
import type {
  LocaleInfo,
  TranslationParams,
  TranslationDictionary,
  PluralRules,
} from '../../types/advanced';

/** Storage key for locale preference */
const LOCALE_STORAGE_KEY = '@app/locale';

/**
 * Create React i18n provider
 */
export function createReactI18nProvider(
  config: I18nProviderConfig
): I18nProvider {
  const {
    defaultLocale,
    fallbackLocale = defaultLocale,
    supportedLocales,
    translations: initialTranslations = {},
    debug = false,
  } = config;

  let isInitialized = false;
  let currentLocale = defaultLocale;
  const translations: Record<string, TranslationDictionary> = { ...initialTranslations };
  const localeChangeListeners: Set<LocaleChangeCallback> = new Set();

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log('[ReactI18n]', ...args);
    }
  };

  /** Get nested value from object by dot-notation key */
  const getNestedValue = (
    obj: TranslationDictionary,
    key: string
  ): string | PluralRules | undefined => {
    const keys = key.split('.');
    let current: TranslationDictionary | string | PluralRules | undefined = obj;

    for (const k of keys) {
      if (current === undefined || typeof current === 'string') {
        return undefined;
      }
      if (typeof current === 'object' && 'one' in current) {
        // This is PluralRules, not a nested dictionary
        return undefined;
      }
      current = (current as TranslationDictionary)[k] as TranslationDictionary | string | PluralRules | undefined;
    }

    if (typeof current === 'string') {
      return current;
    }
    if (typeof current === 'object' && current !== null && 'one' in current) {
      return current as PluralRules;
    }
    return undefined;
  };

  /** Interpolate parameters in string */
  const interpolate = (str: string, params: TranslationParams): string => {
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return params[key]?.toString() ?? `{{${key}}}`;
    });
  };

  /** Get plural form for count */
  const getPluralForm = (count: number, locale: string): keyof PluralRules => {
    const rules = new Intl.PluralRules(locale);
    return rules.select(count) as keyof PluralRules;
  };

  /** Notify locale change listeners */
  const notifyLocaleChange = (locale: string) => {
    localeChangeListeners.forEach((cb) => cb(locale));
  };

  return {
    name: 'react-i18n',
    type: 'i18n',

    async initialize(): Promise<void> {
      if (isInitialized) return;

      log('Initializing React i18n provider');

      // Load saved locale preference
      try {
        const savedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        if (savedLocale && supportedLocales.some((l) => l.code === savedLocale)) {
          currentLocale = savedLocale;
          log('Loaded saved locale:', savedLocale);
        }
      } catch (error) {
        log('Error loading saved locale:', error);
      }

      isInitialized = true;
    },

    isReady(): boolean {
      return isInitialized;
    },

    async dispose(): Promise<void> {
      localeChangeListeners.clear();
      isInitialized = false;
      log('Provider disposed');
    },

    getCurrentLocale(): string {
      return currentLocale;
    },

    async setLocale(locale: string): Promise<void> {
      if (!supportedLocales.some((l) => l.code === locale)) {
        log('Unsupported locale:', locale);
        return;
      }

      currentLocale = locale;
      log('Locale set to:', locale);

      // Save preference
      try {
        await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
      } catch (error) {
        log('Error saving locale:', error);
      }

      notifyLocaleChange(locale);
    },

    t(key: string, params?: TranslationParams): string {
      // Try current locale
      let value = translations[currentLocale]
        ? getNestedValue(translations[currentLocale], key)
        : undefined;

      // Fallback to fallback locale
      if (value === undefined && fallbackLocale !== currentLocale) {
        value = translations[fallbackLocale]
          ? getNestedValue(translations[fallbackLocale], key)
          : undefined;
      }

      // Return key if not found
      if (value === undefined) {
        log('Missing translation:', key, 'for locale:', currentLocale);
        return key;
      }

      // Handle string value
      if (typeof value === 'string') {
        return params ? interpolate(value, params) : value;
      }

      // Handle plural rules (return 'other' as default)
      if (typeof value === 'object' && 'one' in value) {
        const str = value.other || value.one;
        return params ? interpolate(str, params) : str;
      }

      return key;
    },

    tp(key: string, count: number, params?: TranslationParams): string {
      // Try current locale
      let value = translations[currentLocale]
        ? getNestedValue(translations[currentLocale], key)
        : undefined;

      // Fallback to fallback locale
      if (value === undefined && fallbackLocale !== currentLocale) {
        value = translations[fallbackLocale]
          ? getNestedValue(translations[fallbackLocale], key)
          : undefined;
      }

      if (value === undefined) {
        log('Missing translation:', key, 'for locale:', currentLocale);
        return key;
      }

      const allParams = { ...params, count };

      // Handle plural rules
      if (typeof value === 'object' && 'one' in value) {
        const form = getPluralForm(count, currentLocale);
        const str = value[form] || value.other || value.one;
        return interpolate(str, allParams);
      }

      // Handle string value
      if (typeof value === 'string') {
        return interpolate(value, allParams);
      }

      return key;
    },

    hasTranslation(key: string): boolean {
      const value = translations[currentLocale]
        ? getNestedValue(translations[currentLocale], key)
        : undefined;
      return value !== undefined;
    },

    getSupportedLocales(): LocaleInfo[] {
      return supportedLocales;
    },

    getLocaleInfo(code: string): LocaleInfo | undefined {
      return supportedLocales.find((l) => l.code === code);
    },

    loadTranslations(locale: string, newTranslations: TranslationDictionary): void {
      translations[locale] = {
        ...translations[locale],
        ...newTranslations,
      };
      log('Loaded translations for:', locale);
    },

    onLocaleChange(callback: LocaleChangeCallback): () => void {
      localeChangeListeners.add(callback);
      return () => localeChangeListeners.delete(callback);
    },

    formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
      return new Intl.NumberFormat(currentLocale, options).format(value);
    },

    formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(currentLocale, options).format(dateObj);
    },

    formatRelativeTime(date: Date | string): string {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' });

      if (diffDays > 0) {
        return rtf.format(-diffDays, 'day');
      } else if (diffHours > 0) {
        return rtf.format(-diffHours, 'hour');
      } else if (diffMins > 0) {
        return rtf.format(-diffMins, 'minute');
      } else {
        return rtf.format(-diffSecs, 'second');
      }
    },
  };
}
