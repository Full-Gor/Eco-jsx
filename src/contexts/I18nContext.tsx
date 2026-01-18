/**
 * I18n Context
 * Internationalization and localization
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { I18nProvider } from '../providers/i18n';
import type { LocaleInfo, TranslationParams, TranslationDictionary } from '../types/advanced';

/** I18n context value */
interface I18nContextValue {
  /** Current locale code */
  locale: string;
  /** Set current locale */
  setLocale: (locale: string) => Promise<void>;
  /** Translate a key */
  t: (key: string, params?: TranslationParams) => string;
  /** Translate with pluralization */
  tp: (key: string, count: number, params?: TranslationParams) => string;
  /** Check if translation exists */
  hasTranslation: (key: string) => boolean;
  /** Get all supported locales */
  supportedLocales: LocaleInfo[];
  /** Get current locale info */
  currentLocaleInfo: LocaleInfo | undefined;
  /** Format number */
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** Format date */
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  /** Format relative time */
  formatRelativeTime: (date: Date | string) => string;
  /** Load additional translations */
  loadTranslations: (locale: string, translations: TranslationDictionary) => void;
  /** Is provider ready */
  isReady: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** I18n provider props */
interface I18nProviderComponentProps {
  children: React.ReactNode;
  provider: I18nProvider;
}

/**
 * I18n Provider Component
 */
export function I18nProviderComponent({ children, provider }: I18nProviderComponentProps) {
  const [locale, setLocaleState] = useState(provider.getCurrentLocale());
  const [isReady, setIsReady] = useState(false);
  const initRef = useRef(false);

  // Initialize provider
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      await provider.initialize();
      setLocaleState(provider.getCurrentLocale());
      setIsReady(true);
    };

    init();

    // Listen for locale changes
    const unsubscribe = provider.onLocaleChange((newLocale) => {
      setLocaleState(newLocale);
    });

    return () => {
      unsubscribe();
      provider.dispose();
    };
  }, [provider]);

  const setLocale = useCallback(
    async (newLocale: string) => {
      await provider.setLocale(newLocale);
    },
    [provider]
  );

  const t = useCallback(
    (key: string, params?: TranslationParams) => {
      return provider.t(key, params);
    },
    [provider, locale] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const tp = useCallback(
    (key: string, count: number, params?: TranslationParams) => {
      return provider.tp(key, count, params);
    },
    [provider, locale] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const hasTranslation = useCallback(
    (key: string) => {
      return provider.hasTranslation(key);
    },
    [provider, locale] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return provider.formatNumber(value, options);
    },
    [provider, locale] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const formatDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      return provider.formatDate(date, options);
    },
    [provider, locale] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const formatRelativeTime = useCallback(
    (date: Date | string) => {
      return provider.formatRelativeTime(date);
    },
    [provider, locale] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const loadTranslations = useCallback(
    (targetLocale: string, translations: TranslationDictionary) => {
      provider.loadTranslations(targetLocale, translations);
    },
    [provider]
  );

  const value: I18nContextValue = {
    locale,
    setLocale,
    t,
    tp,
    hasTranslation,
    supportedLocales: provider.getSupportedLocales(),
    currentLocaleInfo: provider.getLocaleInfo(locale),
    formatNumber,
    formatDate,
    formatRelativeTime,
    loadTranslations,
    isReady,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to use i18n
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

/**
 * Hook to get translation function
 * Shorthand for useI18n().t
 */
export function useTranslation() {
  const { t, tp, locale } = useI18n();
  return { t, tp, locale };
}

export { I18nProviderComponent as I18nProvider };
