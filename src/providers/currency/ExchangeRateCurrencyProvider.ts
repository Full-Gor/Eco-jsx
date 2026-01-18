/**
 * Exchange Rate Currency Provider
 * Currency conversion with exchange rate API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiResponse } from '../types';
import type {
  CurrencyProvider,
  CurrencyProviderConfig,
  CurrencyChangeCallback,
} from './CurrencyProvider.interface';
import type { CurrencyInfo, ExchangeRates, PriceDisplayOptions } from '../../types/advanced';

/** Storage keys */
const CURRENCY_STORAGE_KEY = '@app/currency';
const RATES_CACHE_KEY = '@app/exchange_rates';

/** Default currencies */
const DEFAULT_CURRENCIES: CurrencyInfo[] = [
  { code: 'EUR', symbol: '\u20AC', name: 'Euro', decimals: 2, symbolPosition: 'after' },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, symbolPosition: 'before' },
  { code: 'GBP', symbol: '\u00A3', name: 'British Pound', decimals: 2, symbolPosition: 'before' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2, symbolPosition: 'before' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2, symbolPosition: 'before' },
  { code: 'JPY', symbol: '\u00A5', name: 'Japanese Yen', decimals: 0, symbolPosition: 'before' },
];

/**
 * Create Exchange Rate currency provider
 */
export function createExchangeRateCurrencyProvider(
  config: CurrencyProviderConfig
): CurrencyProvider {
  const {
    defaultCurrency,
    supportedCurrencies = DEFAULT_CURRENCIES,
    exchangeRateApiUrl,
    apiKey,
    cacheDuration = 3600000, // 1 hour
    debug = false,
  } = config;

  let isInitialized = false;
  let currentCurrency = defaultCurrency;
  let cachedRates: ExchangeRates | null = null;
  let ratesCacheTime = 0;

  const currencyChangeListeners: Set<CurrencyChangeCallback> = new Set();

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log('[ExchangeRateCurrency]', ...args);
    }
  };

  /** Notify currency change listeners */
  const notifyCurrencyChange = (currency: string) => {
    currencyChangeListeners.forEach((cb) => cb(currency));
  };

  /** Fetch exchange rates from API */
  const fetchExchangeRates = async (): Promise<ApiResponse<ExchangeRates>> => {
    if (!exchangeRateApiUrl) {
      // Return default rates (1:1 for all)
      const defaultRates: ExchangeRates = {
        base: defaultCurrency,
        rates: Object.fromEntries(supportedCurrencies.map((c) => [c.code, 1])),
        updatedAt: new Date().toISOString(),
      };
      return { success: true, data: defaultRates };
    }

    try {
      const url = apiKey
        ? `${exchangeRateApiUrl}?apikey=${apiKey}`
        : exchangeRateApiUrl;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Normalize response (different APIs have different formats)
      const rates: ExchangeRates = {
        base: data.base || defaultCurrency,
        rates: data.rates || data.conversion_rates || {},
        updatedAt: data.date || data.time_last_update_utc || new Date().toISOString(),
      };

      return { success: true, data: rates };
    } catch (error) {
      log('Error fetching exchange rates:', error);
      return {
        success: false,
        error: { code: 'FETCH_ERROR', message: String(error) },
      };
    }
  };

  /** Load rates from cache */
  const loadCachedRates = async (): Promise<void> => {
    try {
      const cached = await AsyncStorage.getItem(RATES_CACHE_KEY);
      if (cached) {
        const { rates, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheDuration) {
          cachedRates = rates;
          ratesCacheTime = timestamp;
          log('Loaded cached rates');
        }
      }
    } catch (error) {
      log('Error loading cached rates:', error);
    }
  };

  /** Save rates to cache */
  const saveCachedRates = async (rates: ExchangeRates): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        RATES_CACHE_KEY,
        JSON.stringify({ rates, timestamp: Date.now() })
      );
    } catch (error) {
      log('Error saving cached rates:', error);
    }
  };

  return {
    name: 'exchange-rate-currency',
    type: 'currency',

    async initialize(): Promise<void> {
      if (isInitialized) return;

      log('Initializing Exchange Rate currency provider');

      // Load saved currency preference
      try {
        const savedCurrency = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
        if (savedCurrency && supportedCurrencies.some((c) => c.code === savedCurrency)) {
          currentCurrency = savedCurrency;
          log('Loaded saved currency:', savedCurrency);
        }
      } catch (error) {
        log('Error loading saved currency:', error);
      }

      // Load cached rates
      await loadCachedRates();

      // Fetch fresh rates in background
      if (!cachedRates || Date.now() - ratesCacheTime > cacheDuration) {
        const result = await fetchExchangeRates();
        if (result.success && result.data) {
          cachedRates = result.data;
          ratesCacheTime = Date.now();
          await saveCachedRates(result.data);
        }
      }

      isInitialized = true;
    },

    isReady(): boolean {
      return isInitialized;
    },

    async dispose(): Promise<void> {
      currencyChangeListeners.clear();
      isInitialized = false;
      log('Provider disposed');
    },

    getCurrentCurrency(): string {
      return currentCurrency;
    },

    async setCurrency(currency: string): Promise<void> {
      if (!supportedCurrencies.some((c) => c.code === currency)) {
        log('Unsupported currency:', currency);
        return;
      }

      currentCurrency = currency;
      log('Currency set to:', currency);

      // Save preference
      try {
        await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currency);
      } catch (error) {
        log('Error saving currency:', error);
      }

      notifyCurrencyChange(currency);
    },

    async convert(amount: number, from: string, to: string): Promise<number> {
      if (from === to) return amount;

      // Ensure rates are loaded
      if (!cachedRates) {
        const result = await fetchExchangeRates();
        if (result.success && result.data) {
          cachedRates = result.data;
          ratesCacheTime = Date.now();
        } else {
          // Return original amount if rates unavailable
          return amount;
        }
      }

      if (!cachedRates) {
        return amount;
      }

      const rates = cachedRates.rates;
      const base = cachedRates.base;

      // Convert to base currency first, then to target
      let amountInBase = amount;
      if (from !== base) {
        const fromRate = rates[from];
        if (!fromRate) {
          log('Unknown currency:', from);
          return amount;
        }
        amountInBase = amount / fromRate;
      }

      if (to === base) {
        return amountInBase;
      }

      const toRate = rates[to];
      if (!toRate) {
        log('Unknown currency:', to);
        return amount;
      }

      return amountInBase * toRate;
    },

    format(amount: number, currency?: string, options?: PriceDisplayOptions): string {
      const curr = currency || currentCurrency;
      const currencyInfo = supportedCurrencies.find((c) => c.code === curr);

      if (!currencyInfo) {
        return `${curr} ${amount.toFixed(2)}`;
      }

      const decimals = options?.decimals ?? currencyInfo.decimals;
      const formattedAmount = amount.toFixed(decimals);

      const showSymbol = options?.showSymbol !== false;
      const showCode = options?.showCode === true;

      let result = formattedAmount;

      if (showSymbol) {
        if (currencyInfo.symbolPosition === 'before') {
          result = `${currencyInfo.symbol}${formattedAmount}`;
        } else {
          result = `${formattedAmount} ${currencyInfo.symbol}`;
        }
      }

      if (showCode) {
        result = `${result} ${curr}`;
      }

      return result;
    },

    getSupportedCurrencies(): CurrencyInfo[] {
      return supportedCurrencies;
    },

    getCurrencyInfo(code: string): CurrencyInfo | undefined {
      return supportedCurrencies.find((c) => c.code === code);
    },

    async getExchangeRates(): Promise<ApiResponse<ExchangeRates>> {
      if (cachedRates && Date.now() - ratesCacheTime < cacheDuration) {
        return { success: true, data: cachedRates };
      }

      return this.refreshRates();
    },

    async refreshRates(): Promise<ApiResponse<ExchangeRates>> {
      const result = await fetchExchangeRates();
      if (result.success && result.data) {
        cachedRates = result.data;
        ratesCacheTime = Date.now();
        await saveCachedRates(result.data);
      }
      return result;
    },

    onCurrencyChange(callback: CurrencyChangeCallback): () => void {
      currencyChangeListeners.add(callback);
      return () => currencyChangeListeners.delete(callback);
    },

    parse(formattedValue: string, currency?: string): number {
      const curr = currency || currentCurrency;
      const currencyInfo = supportedCurrencies.find((c) => c.code === curr);

      // Remove currency symbols and formatting
      let cleanValue = formattedValue
        .replace(currencyInfo?.symbol || '', '')
        .replace(curr, '')
        .replace(/[^\d.,\-]/g, '')
        .trim();

      // Handle different decimal separators
      // If both . and , exist, assume . is thousands separator and , is decimal
      if (cleanValue.includes('.') && cleanValue.includes(',')) {
        cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
      } else if (cleanValue.includes(',')) {
        // Could be decimal or thousands - check position
        const commaPos = cleanValue.indexOf(',');
        if (cleanValue.length - commaPos <= 3) {
          // Likely decimal separator
          cleanValue = cleanValue.replace(',', '.');
        } else {
          // Likely thousands separator
          cleanValue = cleanValue.replace(/,/g, '');
        }
      }

      return parseFloat(cleanValue) || 0;
    },
  };
}
