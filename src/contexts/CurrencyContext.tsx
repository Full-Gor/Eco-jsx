/**
 * Currency Context
 * Multi-currency support
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { CurrencyProvider } from '../providers/currency';
import type { CurrencyInfo, ExchangeRates, PriceDisplayOptions } from '../types/advanced';

/** Currency context value */
interface CurrencyContextValue {
  /** Current currency code */
  currency: string;
  /** Set current currency */
  setCurrency: (currency: string) => Promise<void>;
  /** Convert amount between currencies */
  convert: (amount: number, from: string, to?: string) => Promise<number>;
  /** Format amount in currency */
  format: (amount: number, currency?: string, options?: PriceDisplayOptions) => string;
  /** Get all supported currencies */
  supportedCurrencies: CurrencyInfo[];
  /** Get current currency info */
  currentCurrencyInfo: CurrencyInfo | undefined;
  /** Get exchange rates */
  getExchangeRates: () => Promise<ExchangeRates | null>;
  /** Refresh exchange rates */
  refreshRates: () => Promise<void>;
  /** Parse formatted currency string */
  parse: (formattedValue: string, currency?: string) => number;
  /** Is provider ready */
  isReady: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

/** Currency provider props */
interface CurrencyProviderComponentProps {
  children: React.ReactNode;
  provider: CurrencyProvider;
}

/**
 * Currency Provider Component
 */
export function CurrencyProviderComponent({
  children,
  provider,
}: CurrencyProviderComponentProps) {
  const [currency, setCurrencyState] = useState(provider.getCurrentCurrency());
  const [isReady, setIsReady] = useState(false);
  const initRef = useRef(false);

  // Initialize provider
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      await provider.initialize();
      setCurrencyState(provider.getCurrentCurrency());
      setIsReady(true);
    };

    init();

    // Listen for currency changes
    const unsubscribe = provider.onCurrencyChange((newCurrency) => {
      setCurrencyState(newCurrency);
    });

    return () => {
      unsubscribe();
      provider.dispose();
    };
  }, [provider]);

  const setCurrency = useCallback(
    async (newCurrency: string) => {
      await provider.setCurrency(newCurrency);
    },
    [provider]
  );

  const convert = useCallback(
    async (amount: number, from: string, to?: string) => {
      return provider.convert(amount, from, to || currency);
    },
    [provider, currency]
  );

  const format = useCallback(
    (amount: number, currencyCode?: string, options?: PriceDisplayOptions) => {
      return provider.format(amount, currencyCode, options);
    },
    [provider, currency] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const getExchangeRates = useCallback(async (): Promise<ExchangeRates | null> => {
    const result = await provider.getExchangeRates();
    return result.success ? result.data || null : null;
  }, [provider]);

  const refreshRates = useCallback(async () => {
    await provider.refreshRates();
  }, [provider]);

  const parse = useCallback(
    (formattedValue: string, currencyCode?: string) => {
      return provider.parse(formattedValue, currencyCode);
    },
    [provider]
  );

  const value: CurrencyContextValue = {
    currency,
    setCurrency,
    convert,
    format,
    supportedCurrencies: provider.getSupportedCurrencies(),
    currentCurrencyInfo: provider.getCurrencyInfo(currency),
    getExchangeRates,
    refreshRates,
    parse,
    isReady,
  };

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

/**
 * Hook to use currency
 */
export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}

/**
 * Hook to format price
 * Shorthand for useCurrency().format
 */
export function usePrice() {
  const { format, currency, convert } = useCurrency();
  return { format, currency, convert };
}

export { CurrencyProviderComponent as CurrencyProvider };
