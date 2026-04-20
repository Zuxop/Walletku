'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { formatRupiah, parseRupiah } from '@/lib/utils/currency';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = 'Rp 0',
  disabled = false,
  className,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value > 0) {
      setDisplayValue(formatRupiah(value).replace('Rp', '').trim());
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseRupiah(rawValue);
    
    onChange(numericValue);
    
    if (numericValue > 0) {
      setDisplayValue(formatRupiah(numericValue).replace('Rp', '').trim());
    } else {
      setDisplayValue('');
    }
  };

  const handleFocus = () => {
    if (value > 0) {
      setDisplayValue(String(value));
    }
  };

  const handleBlur = () => {
    if (value > 0) {
      setDisplayValue(formatRupiah(value).replace('Rp', '').trim());
    } else {
      setDisplayValue('');
    }
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
        Rp
      </span>
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`pl-10 text-right ${className}`}
      />
    </div>
  );
}
