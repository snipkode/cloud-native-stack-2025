export type CurrencyType = 'IDR' | 'USD';

export interface CurrencyConfig {
  currency: CurrencyType;
  locale: string;
  maximumFractionDigits: number;
}

/**
 * Configuration for different currencies
 */
export const CURRENCY_CONFIG: Record<CurrencyType, CurrencyConfig> = {
  IDR: {
    currency: 'IDR',
    locale: 'id-ID',
    maximumFractionDigits: 0
  },
  USD: {
    currency: 'USD',
    locale: 'en-US',
    maximumFractionDigits: 2
  }
};

/**
 * Format currency for display based on currency type
 */
export const formatCurrency = (amount: number, currency: CurrencyType = 'IDR'): string => {
  const config = CURRENCY_CONFIG[currency];
  return amount.toLocaleString(config.locale, { 
    style: 'currency', 
    currency: config.currency, 
    maximumFractionDigits: config.maximumFractionDigits
  });
};

/**
 * Format amount as currency for display using default currency
 */
export const formatDisplayCurrency = (amount: number, currency: CurrencyType = 'IDR'): string => {
  return formatCurrency(amount, currency);
};