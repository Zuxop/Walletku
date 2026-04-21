'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Play, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRecurring } from '@/hooks/useRecurring';
import { recurringRuleSchema, type RecurringRuleInput } from '@/lib/validations/transaksi';
import { formatRupiah } from '@/lib/utils/currency';
import { toast } from 'react-hot-toast';
import type { Kategori, Dompet, RecurringRuleWithRelations } from '@/types/database';

interface RecurringListProps {
  rules: RecurringRuleWithRelations[];
  kategori: Kategori[];
  dompet: Dompet[];
  onSuccess: () => void;
}

export function RecurringList({ rules, kategori, dompet, onSuccess }: RecurringListProps) {
  const [open, setOpen] = useState(false);
  const { addRule, deleteRule, generateTransaction } = useRecurring();

  const handleGenerate = async (ruleId: string) => {
    const result = await generateTransaction(ruleId);
    if (result.success) {
      toast.success('Transaksi berhasil dibuat!');
      onSuccess();
    } else {
      toast.error(result.error || 'Gagal membuat transaksi');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus aturan ini?')) {
      const result = await deleteRule(id);
      if (result.success) {
        toast.success('Aturan berhasil dihapus');
        onSuccess();
      } else {
        toast.error(result.error || 'Gagal menghapus');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Aturan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Transaksi Berkala</DialogTitle>
            </DialogHeader>
            <RecurringForm
              kategori={kategori}
              dompet={dompet}
              onSuccess={() => {
                setOpen(false);
                onSuccess();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <RefreshCw className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Belum ada transaksi berkala</p>
          <p className="text-sm">Tambahkan aturan untuk membuat transaksi otomatis</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      {rule.tipe === 'pemasukan' && <ArrowUpCircle className="h-5 w-5 text-green-600" />}
                      {rule.tipe === 'pengeluaran' && <ArrowDownCircle className="h-5 w-5 text-red-600" />}
                      {rule.tipe === 'transfer' && <ArrowLeftRight className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-medium">{formatRupiah(rule.jumlah)}</p>
                      <p className="text-sm text-gray-500">
                        {rule.kategori?.nama || 'Tanpa Kategori'} • {rule.dompet?.nama || 'Tanpa Dompet'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getFrekuensiText(rule.frekuensi, rule.hari_ke)} • Mulai: {rule.tanggal_mulai}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGenerate(rule.id)}
                      title="Buat transaksi sekarang"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {rule.catatan && (
                  <p className="text-sm text-gray-500 mt-2">{rule.catatan}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Recurring Form Component
interface RecurringFormProps {
  kategori: Kategori[];
  dompet: Dompet[];
  onSuccess: () => void;
}

function RecurringForm({ kategori, dompet, onSuccess }: RecurringFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tipe, setTipe] = useState<'pemasukan' | 'pengeluaran' | 'transfer'>('pengeluaran');
  const { addRule } = useRecurring();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecurringRuleInput>({
    resolver: zodResolver(recurringRuleSchema),
    defaultValues: {
      tipe: 'pengeluaran',
      jumlah: 0,
      frekuensi: 'bulanan',
      hari_ke: 1,
      tanggal_mulai: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: RecurringRuleInput) => {
    try {
      setIsLoading(true);
      const result = await addRule(data);
      
      if (result.success) {
        toast.success('Aturan berhasil dibuat!');
        onSuccess();
      } else {
        toast.error(result.error || 'Gagal membuat aturan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      {/* Tipe Transaksi */}
      <Tabs
        value={tipe}
        onValueChange={(v) => {
          setTipe(v as 'pemasukan' | 'pengeluaran' | 'transfer');
          setValue('tipe', v as 'pemasukan' | 'pengeluaran' | 'transfer');
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pengeluaran" className="flex items-center gap-1">
            <ArrowDownCircle className="h-4 w-4" />
            Pengeluaran
          </TabsTrigger>
          <TabsTrigger value="pemasukan" className="flex items-center gap-1">
            <ArrowUpCircle className="h-4 w-4" />
            Pemasukan
          </TabsTrigger>
          <TabsTrigger value="transfer" className="flex items-center gap-1">
            <ArrowLeftRight className="h-4 w-4" />
            Transfer
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Jumlah */}
      <div className="space-y-2">
        <Label htmlFor="jumlah">Jumlah</Label>
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

      {/* Dompet */}
      <div className="space-y-2">
        <Label htmlFor="dompet">Dompet</Label>
        <Select
          value={watch('dompet_id')}
          onValueChange={(v) => setValue('dompet_id', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih dompet" />
          </SelectTrigger>
          <SelectContent>
            {dompet?.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.dompet_id && (
          <p className="text-sm text-red-500">{errors.dompet_id.message}</p>
        )}
      </div>

      {/* Kategori */}
      <div className="space-y-2">
        <Label htmlFor="kategori">Kategori (Opsional)</Label>
        <Select
          value={watch('kategori_id') || ''}
          onValueChange={(v) => setValue('kategori_id', v || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tanpa Kategori</SelectItem>
            {kategori
              ?.filter((k) => k.tipe === tipe)
              .map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.ikon} {k.nama}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Frekuensi */}
      <div className="space-y-2">
        <Label htmlFor="frekuensi">Frekuensi</Label>
        <Select
          value={watch('frekuensi')}
          onValueChange={(v) => setValue('frekuensi', v as 'harian' | 'mingguan' | 'bulanan' | 'tahunan')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih frekuensi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="harian">Harian</SelectItem>
            <SelectItem value="mingguan">Mingguan</SelectItem>
            <SelectItem value="bulanan">Bulanan</SelectItem>
            <SelectItem value="tahunan">Tahunan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hari Ke */}
      {watch('frekuensi') === 'bulanan' && (
        <div className="space-y-2">
          <Label htmlFor="hari_ke">Tanggal (1-31)</Label>
          <Input
            id="hari_ke"
            type="number"
            min={1}
            max={31}
            {...register('hari_ke', { valueAsNumber: true })}
          />
        </div>
      )}

      {/* Tanggal Mulai */}
      <div className="space-y-2">
        <Label htmlFor="tanggal_mulai">Tanggal Mulai</Label>
        <Input
          id="tanggal_mulai"
          type="date"
          {...register('tanggal_mulai')}
        />
      </div>

      {/* Catatan */}
      <div className="space-y-2">
        <Label htmlFor="catatan">Catatan</Label>
        <Input
          id="catatan"
          placeholder="Catatan transaksi"
          {...register('catatan')}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Menyimpan...' : 'Simpan Aturan'}
      </Button>
    </form>
  );
}

// Helper function
function getFrekuensiText(frekuensi: string, hariKe?: number | null): string {
  switch (frekuensi) {
    case 'harian':
      return 'Setiap hari';
    case 'mingguan':
      return 'Setiap minggu';
    case 'bulanan':
      return `Setiap tanggal ${hariKe || 1}`;
    case 'tahunan':
      return 'Setiap tahun';
    default:
      return frekuensi;
  }
}
