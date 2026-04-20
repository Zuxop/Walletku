'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/utils/currency';
import { formatTanggalGroup } from '@/lib/utils/date';
import type { TransaksiWithRelations } from '@/types/database';
import { cn } from '@/lib/utils';

interface RecentTransactionsProps {
  transaksi: TransaksiWithRelations[];
}

const tipeConfig = {
  pemasukan: { icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-50', label: 'Masuk' },
  pengeluaran: { icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-50', label: 'Keluar' },
  transfer: { icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Transfer' },
};

export function RecentTransactions({ transaksi }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Transaksi Terbaru</CardTitle>
        <Link href="/transaksi">
          <Button variant="ghost" size="sm" className="text-indigo-600">
            Lihat Semua
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {transaksi.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Belum ada transaksi bulan ini</p>
            <p className="text-sm">Yuk, catat transaksi pertamamu!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transaksi.slice(0, 5).map((t) => {
              const config = tipeConfig[t.tipe];
              const Icon = config.icon;

              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={cn('p-2 rounded-lg', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {t.kategori?.nama || (t.tipe === 'transfer' ? 'Transfer' : 'Tanpa Kategori')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.dompet?.nama} • {formatTanggalGroup(t.tanggal)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-semibold text-sm', config.color)}>
                      {t.tipe === 'pengeluaran' ? '-' : '+'}
                      {formatRupiah(t.jumlah)}
                    </p>
                    {t.catatan && (
                      <p className="text-xs text-gray-400 truncate max-w-[100px]">
                        {t.catatan}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
