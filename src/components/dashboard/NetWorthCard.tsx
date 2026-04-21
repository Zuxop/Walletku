'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Wallet, Scale, PiggyBank, Landmark, CreditCard, Smartphone, Briefcase, CircleDollarSign } from 'lucide-react';
import { useNetWorth } from '@/hooks/useNetWorth';
import { formatCurrency } from '@/lib/utils/currency';

export function NetWorthCard() {
  const { totalAssets, totalLiabilities, netWorth, assetsBreakdown, loading, error } = useNetWorth();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-red-500">Gagal memuat data net worth</p>
        </CardContent>
      </Card>
    );
  }

  const assetItems = [
    { label: 'Tunai', value: assetsBreakdown.tunai, icon: Wallet, color: 'bg-green-100 text-green-600' },
    { label: 'Bank', value: assetsBreakdown.bank, icon: Landmark, color: 'bg-blue-100 text-blue-600' },
    { label: 'E-Wallet', value: assetsBreakdown.ewallet, icon: Smartphone, color: 'bg-purple-100 text-purple-600' },
    { label: 'Investasi', value: assetsBreakdown.investasi, icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
    { label: 'Piutang', value: assetsBreakdown.piutang, icon: CircleDollarSign, color: 'bg-cyan-100 text-cyan-600' },
    { label: 'Lainnya', value: assetsBreakdown.lainnya, icon: Briefcase, color: 'bg-gray-100 text-gray-600' },
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="h-5 w-5 text-primary" />
          Total Kekayaan Bersih (Net Worth)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Net Worth Display */}
        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
          <p className="text-sm text-muted-foreground mb-1">Total Kekayaan Bersih</p>
          <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatRupiah(netWorth)}
          </p>
        </div>

        {/* Assets vs Liabilities */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                <PiggyBank className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Aset</span>
            </div>
            <p className="text-xl font-bold text-green-700 dark:text-green-300">
              {formatRupiah(totalAssets)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm font-medium text-red-800 dark:text-red-200">Hutang</span>
            </div>
            <p className="text-xl font-bold text-red-700 dark:text-red-300">
              {formatRupiah(totalLiabilities)}
            </p>
          </div>
        </div>

        {/* Asset Breakdown */}
        {assetItems.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Rincian Aset:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {assetItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <div className={`p-1.5 rounded-md ${item.color}`}>
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium truncate">{formatRupiah(item.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {totalAssets + totalLiabilities > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rasio Aset vs Hutang</span>
              <span>{Math.round((totalAssets / (totalAssets + totalLiabilities)) * 100)}% Aset</span>
            </div>
            <div className="h-3 w-full rounded-full bg-red-100 dark:bg-red-900/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                style={{
                  width: `${Math.min(100, (totalAssets / (totalAssets + totalLiabilities)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
