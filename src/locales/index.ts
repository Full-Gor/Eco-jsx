/**
 * Locales Index
 * Translation files for internationalization
 */

import en from './en.json';
import fr from './fr.json';
import type { LocaleInfo, TranslationDictionary } from '../types/advanced';

/** Supported locales */
export const supportedLocales: LocaleInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
];

/** Translation dictionaries */
export const translations: Record<string, TranslationDictionary> = {
  en: en as unknown as TranslationDictionary,
  fr: fr as unknown as TranslationDictionary,
};

/** Default locale */
export const defaultLocale = 'en';

/** Get translations for a locale */
export function getTranslations(locale: string): TranslationDictionary {
  return translations[locale] || translations[defaultLocale];
}

/** Get locale info */
export function getLocaleInfo(code: string): LocaleInfo | undefined {
  return supportedLocales.find((l) => l.code === code);
}

export { en, fr };
