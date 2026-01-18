/**
 * i18n Provider Interface
 * Internationalization and localization support
 */

import type { BaseProvider } from '../types';
import type { LocaleInfo, TranslationParams, TranslationDictionary } from '../../types/advanced';

/** i18n provider configuration */
export interface I18nProviderConfig {
  /** Default locale */
  defaultLocale: string;
  /** Fallback locale when translation is missing */
  fallbackLocale?: string;
  /** Supported locales */
  supportedLocales: LocaleInfo[];
  /** Initial translations (optional) */
  translations?: Record<string, TranslationDictionary>;
  /** Enable debug logging */
  debug?: boolean;
}

/** Locale change callback */
export type LocaleChangeCallback = (locale: string) => void;

/** i18n provider interface */
export interface I18nProvider extends BaseProvider {
  type: 'i18n';

  /**
   * Get current locale
   */
  getCurrentLocale(): string;

  /**
   * Set current locale
   * @param locale - Locale code (e.g., 'en', 'fr')
   */
  setLocale(locale: string): Promise<void>;

  /**
   * Translate a key
   * @param key - Translation key (e.g., 'common.welcome')
   * @param params - Optional interpolation parameters
   */
  t(key: string, params?: TranslationParams): string;

  /**
   * Translate with pluralization
   * @param key - Translation key
   * @param count - Count for pluralization
   * @param params - Optional interpolation parameters
   */
  tp(key: string, count: number, params?: TranslationParams): string;

  /**
   * Check if a translation exists
   * @param key - Translation key
   */
  hasTranslation(key: string): boolean;

  /**
   * Get all supported locales
   */
  getSupportedLocales(): LocaleInfo[];

  /**
   * Get locale info by code
   */
  getLocaleInfo(code: string): LocaleInfo | undefined;

  /**
   * Load translations for a locale
   * @param locale - Locale code
   * @param translations - Translations dictionary
   */
  loadTranslations(locale: string, translations: TranslationDictionary): void;

  /**
   * Listen for locale changes
   */
  onLocaleChange(callback: LocaleChangeCallback): () => void;

  /**
   * Format number according to locale
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string;

  /**
   * Format date according to locale
   */
  formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string;

  /**
   * Format relative time
   */
  formatRelativeTime(date: Date | string): string;
}

export type { I18nProviderConfig as I18nConfig };
