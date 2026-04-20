'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatRupiah } from '@/lib/utils/currency';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  totalSaldo: number;
  pemasukanBulanIni: number;
  pengeluaranBulanIni: number;
}

function AnimatedNumber({ value, formatter, hide }: { value: number; formatter: (n: number, hide: boolean) => string; hide: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{formatter(displayValue, hide)}</span>;
}

export function SummaryCards({
  totalSaldo,
  pemasukanBulanIni,
  pengeluaranBulanIni,
}: SummaryCardsProps) {
  const { hideValues, toggleHideValues } = useUIStore();
  const net = pemasukanBulanIni - pengeluaranBulanIni;

  const cards = [
    {
      title: 'Total Saldo',
      value: totalSaldo,
      icon: Wallet,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Pemasukan Bulan Ini',
      value: pemasukanBulanIni,
      icon: ArrowUpRight,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Pengeluaran Bulan Ini',
      value: pengeluaranBulanIni,
      icon: ArrowDownRight,
      color: 'bg-red-500',
      lightColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
    {
      title: 'Selisih (Net)',
      value: net,
      icon: TrendingUp,
      color: net >= 0 ? 'bg-emerald-500' : 'bg-orange-500',
      lightColor: net >= 0 ? 'bg-emerald-50' : 'bg-orange-50',
      textColor: net >= 0 ? 'text-emerald-600' : 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={cn('p-2 rounded-lg', card.lightColor)}>
                  <Icon className={cn('h-5 w-5', card.textColor)} />
                </div>
                {index === 0 && (
                  <button
                    onClick={toggleHideValues}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-500">{card.title}</p>
                <p className={cn('text-lg lg:text-xl font-bold mt-1', card.textColor)}>
                  <AnimatedNumber
                    value={card.value}
                    formatter={formatRupiah}
                    hide={hideValues}
                  />
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
