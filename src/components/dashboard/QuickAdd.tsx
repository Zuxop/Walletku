'use client';

import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TransaksiForm } from '@/components/transaksi/TransaksiForm';

const quickActions = [
  {
    label: 'Pemasukan',
    icon: ArrowUpRight,
    color: 'bg-green-500 hover:bg-green-600',
    tipe: 'pemasukan' as const,
  },
  {
    label: 'Pengeluaran',
    icon: ArrowDownRight,
    color: 'bg-red-500 hover:bg-red-600',
    tipe: 'pengeluaran' as const,
  },
  {
    label: 'Transfer',
    icon: ArrowLeftRight,
    color: 'bg-blue-500 hover:bg-blue-600',
    tipe: 'transfer' as const,
  },
];

export function QuickAdd() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Tambah Cepat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Dialog key={action.label}>
                <DialogTrigger>
                  <div className="flex flex-col items-center gap-1 py-3 px-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <div className={`p-2 rounded-full ${action.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs">{action.label}</span>
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah {action.label}</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <TransaksiForm />
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
