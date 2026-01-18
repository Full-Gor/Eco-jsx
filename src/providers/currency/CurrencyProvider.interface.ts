/**
 * Currency Provider Interface
 * Multi-currency support with exchange rates
 */

import type { BaseProvider, ApiResponse } from '../types';
import type { CurrencyInfo, ExchangeRates, PriceDisplayOptions } from '../../types/advanced';

/** Currency provider configuration */
export interface CurrencyProviderConfig {
  /** Default currency code */
  defaultCurrency: string;
  /** Supported currencies */
  supportedCurrencies: CurrencyInfo[];
  /** Exchange rates API URL (optional) */
  exchangeRateApiUrl?: string;
  /** API key for exchange rates */
  apiKey?: string;
  /** Cache duration in milliseconds */
  cacheDuration?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/** Currency change callback */
export type CurrencyChangeCallback = (currency: string) => void;

/** Currency provider interface */
export interface CurrencyProvider extends BaseProvider {
  type: 'currency';

  /**
   * Get current currency
   */
  getCurrentCurrency(): string;

  /**
   * Set current currency
   * @param currency - Currency code (e.g., 'EUR', 'USD')
   */
  setCurrency(currency: string): Promise<void>;

  /**
   * Convert amount between currencies
   * @param amount - Amount to convert
   * @param from - Source currency code
   * @param to - Target currency code
   */
  convert(amount: number, from: string, to: string): Promise<number>;

  /**
   * Format amount in currency
   * @param amount - Amount to format
   * @param currency - Currency code (uses current if not specified)
   * @param options - Display options
   */
  format(amount: number, currency?: string, options?: PriceDisplayOptions): string;

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): CurrencyInfo[];

  /**
   * Get currency info by code
   */
  getCurrencyInfo(code: string): CurrencyInfo | undefined;

  /**
   * Get current exchange rates
   */
  getExchangeRates(): Promise<ApiResponse<ExchangeRates>>;

  /**
   * Refresh exchange rates
   */
  refreshRates(): Promise<ApiResponse<ExchangeRates>>;

  /**
   * Listen for currency changes
   */
  onCurrencyChange(callback: CurrencyChangeCallback): () => void;

  /**
   * Parse formatted currency string to number
   */
  parse(formattedValue: string, currency?: string): number;
}

export type { CurrencyProviderConfig as CurrencyConfig };
