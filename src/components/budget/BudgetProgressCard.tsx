'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/utils/currency';
import { Target, TrendingUp, TrendingDown, AlertCircle, Calendar, Wallet } from 'lucide-react';
import type { BudgetWithProgress } from '@/types/database';

interface BudgetProgressCardProps {
  budget: BudgetWithProgress;
}

export function BudgetProgressCard({ budget }: BudgetProgressCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aman':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-200 dark:border-green-800',
          progress: 'bg-green-500',
          badge: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
        };
      case 'perhatian':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-700 dark:text-yellow-300',
          border: 'border-yellow-200 dark:border-yellow-800',
          progress: 'bg-yellow-500',
          badge: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
        };
      case 'melebihi':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-200 dark:border-red-800',
          progress: 'bg-red-500',
          badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          text: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-200 dark:border-gray-800',
          progress: 'bg-gray-500',
          badge: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
        };
    }
  };

  const colors = getStatusColor(budget.status);

  // Calculate days remaining in current month
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysRemaining = lastDayOfMonth.getDate() - today.getDate();
  const daysInMonth = lastDayOfMonth.getDate();
  const daysPassed = daysInMonth - daysRemaining;
  const dailyBudget = budget.sisa / daysRemaining;

  return (
    <Card className={`${colors.bg} ${colors.border} border`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${colors.bg}`}>
              <Target className={`h-4 w-4 ${colors.text}`} />
            </div>
            <div>
              <CardTitle className={`text-base ${colors.text}`}>
                {budget.kategori?.nama || 'Budget'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {formatRupiah(budget.jumlah)} total budget
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`${colors.badge} text-xs`}>
            {budget.persentase.toFixed(0)}% digunakan
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className={`font-medium ${colors.text}`}>
              {formatRupiah(budget.terpakai)} / {formatRupiah(budget.jumlah)}
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={Math.min(budget.persentase, 100)} 
              className="h-3"
            />
            {budget.persentase > 100 && (
              <div className="absolute -top-1 right-0">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className={budget.persentase > 80 ? 'text-yellow-600 font-medium' : ''}>
              {budget.persentase > 100 ? 'Melebihi budget!' : `${(100 - budget.persentase).toFixed(0)}% tersisa`}
            </span>
            <span>100%</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className={`p-3 rounded-lg ${colors.bg} bg-opacity-50`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sisa Budget</span>
            </div>
            <p className={`text-sm font-semibold ${budget.sisa < 0 ? 'text-red-600' : colors.text}`}>
              {formatRupiah(budget.sisa)}
            </p>
          </div>
          
          <div className={`p-3 rounded-lg ${colors.bg} bg-opacity-50`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sisa Hari</span>
            </div>
            <p className="text-sm font-semibold">
              {daysRemaining} hari
            </p>
          </div>
        </div>

        {/* Daily Recommendation */}
        {budget.sisa > 0 && daysRemaining > 0 && (
          <div className={`p-3 rounded-lg ${colors.bg} bg-opacity-30 border border-dashed ${colors.border}`}>
            <div className="flex items-center gap-2">
              <TrendingDown className={`h-4 w-4 ${colors.text}`} />
              <div>
                <p className="text-xs text-muted-foreground">Rekomendasi pengeluaran harian:</p>
                <p className={`text-sm font-medium ${colors.text}`}>
                  {formatRupiah(dailyBudget)} / hari
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {budget.persentase >= 100 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Budget telah melebihi batas! {formatRupiah(Math.abs(budget.sisa))} over.</span>
          </div>
        )}
        {budget.persentase >= 80 && budget.persentase < 100 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Budget hampir habis! Sisa {formatRupiah(budget.sisa)}.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
