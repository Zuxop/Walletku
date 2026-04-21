// Multi-currency support with Real-time Exchange Rates

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

// Cache for exchange rates
interface ExchangeRateCache {
  rates: Record<string, number>;
  base: string;
  timestamp: number;
}

let rateCache: ExchangeRateCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// FREE Exchange Rate API (using exchangerate-api.com free tier)
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest';

// Fetch real-time exchange rates
export async function fetchExchangeRates(base: string = 'IDR'): Promise<Record<string, number>> {
  try {
    // Check cache first
    if (rateCache && 
        rateCache.base === base && 
        Date.now() - rateCache.timestamp < CACHE_DURATION) {
      return rateCache.rates;
    }

    // Fetch from API
    const response = await fetch(`${EXCHANGE_RATE_API}/${base}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    
    // Update cache
    rateCache = {
      rates: data.rates,
      base: data.base,
      timestamp: Date.now(),
    };

    // Store in localStorage for offline use
    if (typeof window !== 'undefined') {
      localStorage.setItem('exchange_rates_cache', JSON.stringify(rateCache));
    }

    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Try to use cached rates from localStorage
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('exchange_rates_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.rates;
      }
    }
    
    // Fallback rates (approximate)
    return getFallbackRates(base);
  }
}

// Fallback rates if API fails
function getFallbackRates(base: string): Record<string, number> {
  const fallbackRates: Record<string, Record<string, number>> = {
    IDR: {
      USD: 0.000064,
      EUR: 0.000059,
      SGD: 0.000086,
      MYR: 0.00030,
      JPY: 0.0096,
      GBP: 0.000050,
      AUD: 0.000098,
      CNY: 0.00046,
      KRW: 0.087,
      THB: 0.0023,
      HKD: 0.00050,
      PHP: 0.0037,
      VND: 1.52,
      IDR: 1,
    },
    USD: {
      IDR: 15600,
      EUR: 0.92,
      SGD: 1.34,
      MYR: 4.70,
      JPY: 150,
      GBP: 0.79,
      AUD: 1.53,
      CNY: 7.19,
      KRW: 1330,
      THB: 35.7,
      HKD: 7.82,
      PHP: 56.5,
      VND: 23800,
      USD: 1,
    },
  };

  return fallbackRates[base] || fallbackRates.IDR;
}

// Convert amount between currencies
export async function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number> {
  if (from === to) return amount;

  const rates = await fetchExchangeRates(from);
  const rate = rates[to];

  if (!rate) {
    throw new Error(`Exchange rate not found for ${from} to ${to}`);
  }

  return amount * rate;
}

// Format currency with symbol
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'IDR',
  hideValues = false
): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  
  if (hideValues) {
    return `${currency?.symbol || ''} •••••••`;
  }

  // Special formatting for different currencies
  switch (currencyCode) {
    case 'IDR':
    case 'VND':
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    
    case 'JPY':
    case 'KRW':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    
    default:
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
  }
}

// Parse currency input
export function parseCurrencyInput(value: string, currencyCode: CurrencyCode = 'IDR'): number {
  const cleanValue = value.replace(/[^0-9.,]/g, '');
  
  // Handle different decimal separators
  if (currencyCode === 'IDR' || currencyCode === 'VND') {
    return parseInt(cleanValue.replace(/[.,]/g, ''), 10) || 0;
  }
  
  return parseFloat(cleanValue.replace(',', '')) || 0;
}

// Get currency symbol
export function getCurrencySymbol(currencyCode: CurrencyCode): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || 'Rp';
}

// Get currency info
export function getCurrencyInfo(currencyCode: CurrencyCode) {
  return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
}

// Calculate total in base currency
export async function calculateTotalInBaseCurrency(
  amounts: Array<{ amount: number; currency: CurrencyCode }>,
  baseCurrency: CurrencyCode = 'IDR'
): Promise<number> {
  let total = 0;
  
  for (const { amount, currency } of amounts) {
    if (currency === baseCurrency) {
      total += amount;
    } else {
      const converted = await convertCurrency(amount, currency, baseCurrency);
      total += converted;
    }
  }
  
  return total;
}

// Hook untuk useCurrency - React Hook
export function useCurrency() {
  const getRates = async () => {
    return await fetchExchangeRates('IDR');
  };

  const convert = async (amount: number, from: CurrencyCode, to: CurrencyCode) => {
    return await convertCurrency(amount, from, to);
  };

  return {
    supportedCurrencies: SUPPORTED_CURRENCIES,
    format: formatCurrency,
    parse: parseCurrencyInput,
    getSymbol: getCurrencySymbol,
    getInfo: getCurrencyInfo,
    getRates,
    convert,
  };
}
