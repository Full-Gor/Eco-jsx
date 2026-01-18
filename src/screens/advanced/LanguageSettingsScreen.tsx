/**
 * Language Settings Screen
 * Language and currency selection
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useI18n } from '../../contexts/I18nContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface LanguageSettingsScreenProps {
  navigation: {
    goBack: () => void;
  };
}

/**
 * Language Settings Screen Component
 */
export function LanguageSettingsScreen({
  navigation,
}: LanguageSettingsScreenProps) {
  const { locale, setLocale, supportedLocales, t } = useI18n();
  const { currency, setCurrency, supportedCurrencies, format } = useCurrency();

  const handleLocaleChange = useCallback(
    async (code: string) => {
      await setLocale(code);
    },
    [setLocale]
  );

  const handleCurrencyChange = useCallback(
    async (code: string) => {
      await setCurrency(code);
    },
    [setCurrency]
  );

  return (
    <ScrollView style={styles.container}>
      {/* Language Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <Text style={styles.sectionDescription}>
          {t('settings.languageDescription')}
        </Text>

        <View style={styles.optionsList}>
          {supportedLocales.map((localeInfo) => (
            <TouchableOpacity
              key={localeInfo.code}
              style={[
                styles.optionItem,
                locale === localeInfo.code && styles.optionItemSelected,
              ]}
              onPress={() => handleLocaleChange(localeInfo.code)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionFlag}>{localeInfo.flag}</Text>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{localeInfo.nativeName}</Text>
                  <Text style={styles.optionSubtitle}>{localeInfo.name}</Text>
                </View>
              </View>
              {locale === localeInfo.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Currency Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.currency')}</Text>
        <Text style={styles.sectionDescription}>
          {t('settings.currencyDescription')}
        </Text>

        <View style={styles.optionsList}>
          {supportedCurrencies.map((currencyInfo) => (
            <TouchableOpacity
              key={currencyInfo.code}
              style={[
                styles.optionItem,
                currency === currencyInfo.code && styles.optionItemSelected,
              ]}
              onPress={() => handleCurrencyChange(currencyInfo.code)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={styles.currencySymbol}>
                  <Text style={styles.currencySymbolText}>
                    {currencyInfo.symbol}
                  </Text>
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{currencyInfo.name}</Text>
                  <Text style={styles.optionSubtitle}>
                    {currencyInfo.code} • {format(99.99, currencyInfo.code)}
                  </Text>
                </View>
              </View>
              {currency === currencyInfo.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          {t('settings.currencyNote')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },
  optionsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  optionItemSelected: {
    backgroundColor: '#e8f4ff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  currencySymbol: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currencySymbolText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});
