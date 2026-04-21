'use client';

import { useState, useEffect } from 'react';
import { DollarSign, RefreshCw, TrendingUp, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { SUPPORTED_CURRENCIES, CurrencyCode, formatCurrency } from '@/lib/utils/multiCurrency';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

interface CurrencySelectorProps {
  currentCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
}

export function CurrencySelector({ currentCurrency, onCurrencyChange }: CurrencySelectorProps) {
  const { rates, loading, error, lastUpdated, refetch } = useExchangeRates('IDR');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(currentCurrency);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    if (selectedCurrency === currentCurrency) return;

    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      const { error } = await supabase
        .from('profiles')
        .update({
          mata_uang: selectedCurrency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.user.id);

      if (error) throw error;

      onCurrencyChange(selectedCurrency);
      toast.success(`Mata uang diubah ke ${selectedCurrency}`);
    } catch (error) {
      toast.error('Gagal mengubah mata uang');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate exchange rate example
  const getRateExample = (currency: CurrencyCode): string => {
    if (!rates || currency === 'IDR') return '';
    const rate = rates[currency];
    if (!rate) return '';
    
    return `1 IDR = ${rate.toFixed(6)} ${currency}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Mata Uang & Kurs
        </CardTitle>
        <CardDescription>
          Pilih mata uang default dan lihat kurs real-time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Currency Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Mata Uang Default</label>
          <Select
            value={selectedCurrency}
            onValueChange={(v) => setSelectedCurrency(v as CurrencyCode)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih mata uang" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <span className="flex items-center gap-2">
                    <span>{currency.flag}</span>
                    <span>{currency.code}</span>
                    <span className="text-gray-500">- {currency.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedCurrency !== 'IDR' && (
            <p className="text-sm text-gray-500">
              {getRateExample(selectedCurrency)}
            </p>
          )}
        </div>

        {/* Exchange Rates Display */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <span className="font-medium text-sm">Kurs Real-time (IDR)</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Memuat kurs...</div>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : rates ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {['USD', 'EUR', 'SGD', 'JPY', 'GBP', 'MYR'].map((code) => {
                const rate = rates[code];
                if (!rate) return null;
                
                const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
                return (
                  <div key={code} className="flex justify-between py-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      {currency?.flag} {code}
                    </span>
                    <span className="font-medium">
                      {rate < 0.01 ? rate.toFixed(6) : rate.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}

          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-3">
              Diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
            </p>
          )}
        </div>

        {/* Sample Conversion */}
        {rates && selectedCurrency !== 'IDR' && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Contoh Konversi</p>
            <div className="space-y-1 text-sm">
              <p>Rp 100,000 = {formatCurrency(100000 * (rates[selectedCurrency] || 0), selectedCurrency)}</p>
              <p>Rp 1,000,000 = {formatCurrency(1000000 * (rates[selectedCurrency] || 0), selectedCurrency)}</p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={selectedCurrency === currentCurrency || isSaving}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Wallet Currency Selector Component
interface WalletCurrencySelectorProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  disabled?: boolean;
}

export function WalletCurrencySelector({ value, onChange, disabled }: WalletCurrencySelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as CurrencyCode)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Pilih mata uang" />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CURRENCIES.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <span className="flex items-center gap-2">
              <span>{currency.flag}</span>
              <span className="font-medium">{currency.code}</span>
              <span className="text-gray-500">{currency.symbol}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
