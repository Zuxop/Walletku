'use client';

import Link from 'next/link';
import { ArrowRight, PiggyBank, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatRupiah } from '@/lib/utils/currency';
import type { Budget, Kategori, Transaksi } from '@/types/database';
import { cn } from '@/lib/utils';

interface BudgetOverviewProps {
  budget: (Budget & { kategori: Kategori | null })[];
  transaksi: Transaksi[];
}

interface BudgetWithProgress extends Budget {
  kategori: Kategori | null;
  terpakai: number;
  persentase: number;
  status: 'aman' | 'perhatian' | 'melebihi';
}

export function BudgetOverview({ budget, transaksi }: BudgetOverviewProps) {
  // Calculate budget progress
  const budgetWithProgress: BudgetWithProgress[] = budget.map((b) => {
    const terpakai = transaksi
      .filter((t) => t.tipe === 'pengeluaran' && t.kategori_id === b.kategori_id)
      .reduce((acc, t) => acc + t.jumlah, 0);

    const persentase = Math.min(Math.round((terpakai / b.jumlah) * 100), 100);
    let status: 'aman' | 'perhatian' | 'melebihi' = 'aman';
    if (persentase >= 100) status = 'melebihi';
    else if (persentase >= b.notif_persen) status = 'perhatian';

    return {
      ...b,
      terpakai,
      persentase,
      status,
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aman':
        return 'bg-green-500';
      case 'perhatian':
        return 'bg-yellow-500';
      case 'melebihi':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aman':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'perhatian':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'melebihi':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-indigo-600" />
          Budget
        </CardTitle>
        <Link href="/budget">
          <Button variant="ghost" size="sm" className="text-indigo-600">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {budgetWithProgress.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">Belum ada budget</p>
            <Link href="/budget">
              <Button variant="link" size="sm" className="text-indigo-600">
                Buat budget sekarang
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetWithProgress.map((b) => (
              <div key={b.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: b.kategori?.warna || '#6366f1' }}
                    />
                    <span className="text-sm font-medium">{b.kategori?.nama}</span>
                    {getStatusIcon(b.status)}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatRupiah(b.terpakai)} / {formatRupiah(b.jumlah)}
                  </span>
                </div>
                <Progress
                  value={b.persentase}
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  {b.persentase}% terpakai
                  {b.status === 'melebihi' && (
                    <span className="text-red-500 ml-1">(Melebihi budget!)</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
