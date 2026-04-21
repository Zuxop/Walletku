'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Target, AlertCircle, ChevronLeft, ChevronRight, Trash2, Edit2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useBudget } from '@/hooks/useBudget';
import { useKategori } from '@/hooks/useKategori';
import { budgetSchema, type BudgetInput } from '@/lib/validations/dompet';
import { formatRupiah } from '@/lib/utils/currency';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { Budget } from '@/types/database';

export default function BudgetPage() {
  const [open, setOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const { budget, loading, refetch } = useBudget(currentMonth, currentYear);
  const { kategori } = useKategori();
  const supabase = createClient();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const totalBudget = budget?.reduce((acc, b) => acc + b.jumlah, 0) || 0;
  const totalSpent = budget?.reduce((acc, b) => acc + b.terpakai, 0) || 0;
  const totalRemaining = totalBudget - totalSpent;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budget</h1>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>
          <Button variant="ghost" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatRupiah(totalBudget)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Terpakai</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatRupiah(totalSpent)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sisa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatRupiah(totalRemaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Budget Button */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBudget ? 'Edit Budget' : 'Tambah Budget'}</DialogTitle>
            </DialogHeader>
            <BudgetForm
              budget={editingBudget}
              kategori={kategori}
              currentMonth={currentMonth}
              currentYear={currentYear}
              onSuccess={() => {
                setOpen(false);
                setEditingBudget(null);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget List */}
      {budget && budget.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budget.map((b) => (
            <Card key={b.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: b.kategori?.warna + '20' }}
                    >
                      <span className="text-xl">{b.kategori?.ikon || '💰'}</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{b.kategori?.nama || 'Tanpa Kategori'}</CardTitle>
                      <p className="text-sm text-gray-500">Budget: {formatRupiah(b.jumlah)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingBudget(b);
                        setOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={async () => {
                        if (confirm('Yakin ingin menghapus budget ini?')) {
                          const { error } = await supabase.from('budget').delete().eq('id', b.id);
                          if (error) toast.error('Gagal menghapus budget');
                          else {
                            toast.success('Budget berhasil dihapus');
                            refetch();
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Terpakai: {formatRupiah(b.terpakai)}</span>
                  <span className={b.sisa >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Sisa: {formatRupiah(b.sisa)}
                  </span>
                </div>
                
                <Progress value={b.persentase} className="h-2" />
                
                <div className="flex items-center gap-2">
                  {b.status === 'melebihi' && (
                    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      <AlertCircle className="h-3 w-3" />
                      Melebihi Budget
                    </span>
                  )}
                  {b.status === 'perhatian' && (
                    <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      <AlertCircle className="h-3 w-3" />
                      Hampir Melebihi ({b.persentase}%)
                    </span>
                  )}
                  {b.status === 'aman' && (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      <Target className="h-3 w-3" />
                      Aman ({b.persentase}%)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Wallet />}
          title="Belum ada budget"
          description="Tambahkan budget untuk mengatur pengeluaran per kategori"
          actionLabel="Tambah Budget"
          onAction={() => setOpen(true)}
        />
      )}
    </div>
  );
}

// Budget Form Component
interface BudgetFormProps {
  budget?: Budget | null;
  kategori: any[];
  currentMonth: number;
  currentYear: number;
  onSuccess: () => void;
}

function BudgetForm({ budget, kategori, currentMonth, currentYear, onSuccess }: BudgetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      kategori_id: budget?.kategori_id || '',
      jumlah: budget?.jumlah || 0,
      periode: (budget?.periode as any) || 'bulanan',
      bulan: budget?.bulan || currentMonth,
      tahun: budget?.tahun || currentYear,
      notif_persen: budget?.notif_persen || 80,
    },
  });

  const onSubmit = async (data: BudgetInput) => {
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        toast.error('Anda harus login terlebih dahulu');
        return;
      }

      if (budget) {
        const { error } = await supabase
          .from('budget')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', budget.id);

        if (error) throw error;
        toast.success('Budget berhasil diperbarui');
      } else {
        const { error } = await supabase.from('budget').insert({
          ...data,
          user_id: userData.user.id,
        });

        if (error) throw error;
        toast.success('Budget berhasil dibuat');
      }

      onSuccess();
    } catch (error) {
      toast.error('Gagal menyimpan budget');
    } finally {
      setIsLoading(false);
    }
  };

  const kategoriPengeluaran = kategori?.filter((k) => k.tipe === 'pengeluaran');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="kategori">Kategori</Label>
        <Select
          value={watch('kategori_id')}
          onValueChange={(v) => setValue('kategori_id', v ?? '')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            {kategoriPengeluaran?.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                <span className="mr-2">{k.ikon}</span>
                {k.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.kategori_id && (
          <p className="text-sm text-red-500">{errors.kategori_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="jumlah">Jumlah Budget</Label>
        <Input
          id="jumlah"
          type="number"
          placeholder="0"
          {...register('jumlah', { valueAsNumber: true })}
        />
        {errors.jumlah && (
          <p className="text-sm text-red-500">{errors.jumlah.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notif_persen">Peringatan Saat Mencapai (%)</Label>
        <Input
          id="notif_persen"
          type="number"
          min={50}
          max={100}
          {...register('notif_persen', { valueAsNumber: true })}
        />
        <p className="text-xs text-gray-500">Akan memperingatkan saat pengeluaran mencapai persentase ini</p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Menyimpan...' : budget ? 'Simpan Perubahan' : 'Buat Budget'}
      </Button>
    </form>
  );
}
