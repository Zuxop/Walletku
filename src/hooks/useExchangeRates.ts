'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchExchangeRates, convertCurrency, CurrencyCode } from '@/lib/utils/multiCurrency';

interface ExchangeRateState {
  rates: Record<string, number> | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useExchangeRates(baseCurrency: CurrencyCode = 'IDR') {
  const [state, setState] = useState<ExchangeRateState>({
    rates: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchRates = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const rates = await fetchExchangeRates(baseCurrency);
      setState({
        rates,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Gagal memuat kurs mata uang',
      }));
    }
  }, [baseCurrency]);

  const convert = useCallback(async (
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode
  ): Promise<number> => {
    return await convertCurrency(amount, from, to);
  }, []);

  useEffect(() => {
    fetchRates();
    
    // Refresh rates every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchRates]);

  return {
    ...state,
    refetch: fetchRates,
    convert,
  };
}
