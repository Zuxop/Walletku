'use client';

import { useState, useEffect } from 'react';
import { Plus, Wallet, Pencil, Trash2, ArrowUpRight, ArrowDownRight, ArrowUpDown, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { useDompet } from '@/hooks/useDompet';
import { useTransaksi } from '@/hooks/useTransaksi';
import { formatRupiah } from '@/lib/utils/currency';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { Dompet } from '@/types/database';

export default function DompetPage() {
  const [open, setOpen] = useState(false);
  const [editingDompet, setEditingDompet] = useState<Dompet | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'sort'>('grid');
  const [orderedDompet, setOrderedDompet] = useState<Dompet[]>([]);
  
  const { dompet, loading: isLoading, refetch: mutate } = useDompet();
  const { transaksi } = useTransaksi();
  const supabase = createClient();

  useEffect(() => {
    if (dompet) {
      setOrderedDompet([...dompet].sort((a, b) => (a.urutan || 0) - (b.urutan || 0)));
    }
  }, [dompet]);

  // Calculate balance for each wallet
  const getWalletBalance = (walletId: string) => {
    if (!transaksi) return 0;
    return transaksi
      .filter((t) => t.dompet_id === walletId && !t.is_pending)
      .reduce((acc, t) => {
        if (t.tipe === 'pemasukan') return acc + t.jumlah;
        if (t.tipe === 'pengeluaran') return acc - t.jumlah;
        return acc;
      }, 0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dompet ini?')) return;
    
    try {
      const { error } = await supabase.from('dompet').delete().eq('id', id);
      if (error) throw error;
      toast.success('Dompet berhasil dihapus');
      mutate();
    } catch {
      toast.error('Gagal menghapus dompet');
    }
  };

  const totalBalance = dompet?.reduce((acc, d) => acc + getWalletBalance(d.id), 0) || 0;

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader
        title="Dompet"
        description="Kelola dompet dan saldo keuanganmu"
      />

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-white/80 text-sm font-normal">
            Total Saldo Semua Dompet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatRupiah(totalBalance)}</p>
          <p className="text-white/70 text-sm mt-1">
            {dompet?.length || 0} dompet aktif
          </p>
        </CardContent>
      </Card>

      {/* Add Wallet Button */}
      <div className="flex justify-end">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'sort' : 'grid')}
            className="hidden md:flex"
          >
            {viewMode === 'grid' ? (
              <>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Urutkan
              </>
            ) : (
              <>
                <LayoutGrid className="h-4 w-4 mr-2" />
                Grid
              </>
            )}
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Dompet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDompet ? 'Edit Dompet' : 'Tambah Dompet Baru'}
                </DialogTitle>
              </DialogHeader>
              <DompetForm
                dompet={editingDompet}
                onSuccess={() => {
                  setOpen(false);
                  setEditingDompet(null);
                  mutate();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

      {/* Wallet List */}
      {dompet && dompet.length > 0 ? (
        viewMode === 'sort' ? (
          <SortableWalletList
            dompet={orderedDompet}
            onReorder={setOrderedDompet}
            onEdit={(d) => {
              setEditingDompet(d);
              setOpen(true);
            }}
            onDelete={handleDelete}
          />
        ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dompet.map((wallet) => {
            const balance = getWalletBalance(wallet.id);
            const isPositive = balance >= 0;

            return (
              <Card key={wallet.id} className="relative group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: wallet.warna + '20' }}
                      >
                        {wallet.ikon || '💰'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {wallet.nama}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {wallet.tipe}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingDompet(wallet);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => handleDelete(wallet.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">Saldo</p>
                    <p
                      className={`text-2xl font-bold ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatRupiah(balance)}
                    </p>
                  </div>

                  {wallet.catatan && (
                    <p className="text-sm text-gray-500 mt-1">
                      {wallet.catatan}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Belum ada dompet"
          description="Tambahkan dompet pertama Anda untuk mulai mencatat transaksi"
          icon={Wallet}
        />
      )}
    </div>
  );
}

// Dompet Form Component
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dompetSchema, type DompetInput } from '@/lib/validations/dompet';

const ICONS = ['💰', '💳', '🏦', '💵', '🪙', '💎', '🏧', '📱'];
const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
          />
        )}
      </div>
    </div>
        <Label>Warna</Label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('warna', color)}
              className={`w-8 h-8 rounded-full transition-all ${
                selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="catatan">Catatan (Opsional)</Label>
        <Input
          id="catatan"
          placeholder="Catatan tentang dompet ini"
          {...register('catatan')}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Menyimpan...' : dompet ? 'Simpan Perubahan' : 'Buat Dompet'}
      </Button>
    </form>
  );
}
