'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Target, Trash2, Edit2, TrendingUp, Calendar, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useTujuan } from '@/hooks/useTujuan';
import { tujuanKeuanganSchema, type TujuanKeuanganInput } from '@/lib/validations/dompet';
import { formatRupiah } from '@/lib/utils/currency';
import { formatTanggal } from '@/lib/utils/date';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { TujuanKeuangan } from '@/types/database';

const ICONS = ['🎯', '🏠', '🚗', '✈️', '📚', '💍', '🎓', '🏥', '💻', '📱', '👶', '🎁', '🏦', '💼', '⚽', '🎸', '🎨', '🔧'];
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];

export default function TujuanPage() {
  const [open, setOpen] = useState(false);
  const [editingTujuan, setEditingTujuan] = useState<TujuanKeuangan | null>(null);
  const [contribOpen, setContribOpen] = useState(false);
  const [selectedTujuan, setSelectedTujuan] = useState<TujuanKeuangan | null>(null);
  
  const { tujuan, loading, refetch } = useTujuan();
  const supabase = createClient();

  const totalTarget = tujuan?.reduce((acc, t) => acc + t.target_jumlah, 0) || 0;
  const totalTerkumpul = tujuan?.reduce((acc, t) => acc + t.terkumpul, 0) || 0;
  const totalSisa = totalTarget - totalTerkumpul;

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
        <h1 className="text-2xl font-bold">Tujuan Keuangan</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Tujuan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTujuan ? 'Edit Tujuan' : 'Tambah Tujuan Baru'}</DialogTitle>
            </DialogHeader>
            <TujuanForm
              tujuan={editingTujuan}
              onSuccess={() => {
                setOpen(false);
                setEditingTujuan(null);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" />
              Total Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatRupiah(totalTarget)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-green-600" />
              Terkumpul
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatRupiah(totalTerkumpul)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Sisa Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatRupiah(totalSisa)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      {tujuan && tujuan.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tujuan.map((t) => (
            <Card key={t.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: t.warna + '20' }}
                    >
                      {t.ikon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{t.nama}</CardTitle>
                      <p className="text-sm text-gray-500">Target: {formatRupiah(t.target_jumlah)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTujuan(t);
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
                        if (confirm('Yakin ingin menghapus tujuan ini?')) {
                          const { error } = await supabase.from('tujuan_keuangan').delete().eq('id', t.id);
                          if (error) toast.error('Gagal menghapus tujuan');
                          else {
                            toast.success('Tujuan berhasil dihapus');
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
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Terkumpul: {formatRupiah(t.terkumpul)}</span>
                    <span className="font-medium">{t.persentase}%</span>
                  </div>
                  <Progress value={t.persentase} className="h-3" />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Sisa: {formatRupiah(t.target_jumlah - t.terkumpul)}</span>
                    {t.sisa_hari !== null && (
                      <span className={t.sisa_hari < 0 ? 'text-red-500' : ''}>
                        {t.sisa_hari < 0 ? `Terlewat ${Math.abs(t.sisa_hari)} hari` : `${t.sisa_hari} hari lagi`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Deadline & Estimasi */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {t.deadline && (
                    <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      <Calendar className="h-3 w-3" />
                      Deadline: {formatTanggal(t.deadline)}
                    </span>
                  )}
                  {t.estimasi_hari && (
                    <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <TrendingUp className="h-3 w-3" />
                      Estimasi tercapai: {t.estimasi_hari} hari
                    </span>
                  )}
                  {t.kontribusi_bulanan_rata && (
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">
                      <PiggyBank className="h-3 w-3" />
                      Rata-rata/bulan: {formatRupiah(t.kontribusi_bulanan_rata)}
                    </span>
                  )}
                </div>

                {/* Add Contribution Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedTujuan(t);
                    setContribOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kontribusi
                </Button>

                {t.catatan && (
                  <p className="text-sm text-gray-500 mt-2">{t.catatan}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="Belum ada tujuan keuangan"
          description="Tambahkan tujuan untuk mulai menabung, seperti dana darurat, liburan, atau pembelian besar"
          actionLabel="Tambah Tujuan"
          onAction={() => setOpen(true)}
        />
      )}

      {/* Contribution Dialog */}
      <Dialog open={contribOpen} onOpenChange={setContribOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kontribusi - {selectedTujuan?.nama}</DialogTitle>
          </DialogHeader>
          {selectedTujuan && (
            <KontribusiForm
              tujuan={selectedTujuan}
              onSuccess={() => {
                setContribOpen(false);
                setSelectedTujuan(null);
                refetch();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tujuan Form Component
interface TujuanFormProps {
  tujuan?: TujuanKeuangan | null;
  onSuccess: () => void;
}

function TujuanForm({ tujuan, onSuccess }: TujuanFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TujuanKeuanganInput>({
    resolver: zodResolver(tujuanKeuanganSchema),
    defaultValues: {
      nama: tujuan?.nama || '',
      target_jumlah: tujuan?.target_jumlah || 0,
      deadline: tujuan?.deadline || '',
      ikon: tujuan?.ikon || '🎯',
      warna: tujuan?.warna || '#6366f1',
      catatan: tujuan?.catatan || '',
    },
  });

  const selectedIcon = watch('ikon');
  const selectedColor = watch('warna');

  const onSubmit = async (data: TujuanKeuanganInput) => {
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        toast.error('Anda harus login terlebih dahulu');
        return;
      }

      if (tujuan) {
        const { error } = await supabase
          .from('tujuan_keuangan')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tujuan.id);

        if (error) throw error;
        toast.success('Tujuan berhasil diperbarui');
      } else {
        const { error } = await supabase.from('tujuan_keuangan').insert({
          ...data,
          user_id: userData.user.id,
          terkumpul: 0,
        });

        if (error) throw error;
        toast.success('Tujuan berhasil dibuat');
      }

      onSuccess();
    } catch (error) {
      toast.error('Gagal menyimpan tujuan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="nama">Nama Tujuan</Label>
        <Input
          id="nama"
          placeholder="Contoh: Dana Darurat, Liburan Bali"
          {...register('nama')}
        />
        {errors.nama && (
          <p className="text-sm text-red-500">{errors.nama.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_jumlah">Target Jumlah</Label>
        <Input
          id="target_jumlah"
          type="number"
          placeholder="0"
          {...register('target_jumlah', { valueAsNumber: true })}
        />
        {errors.target_jumlah && (
          <p className="text-sm text-red-500">{errors.target_jumlah.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline (Opsional)</Label>
        <Input
          id="deadline"
          type="date"
          {...register('deadline')}
        />
      </div>

      <div className="space-y-2">
        <Label>Ikon</Label>
        <div className="flex gap-2 flex-wrap">
          {ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setValue('ikon', icon)}
              className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border transition-all ${
                selectedIcon === icon
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
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
          placeholder="Catatan tentang tujuan ini"
          {...register('catatan')}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Menyimpan...' : tujuan ? 'Simpan Perubahan' : 'Buat Tujuan'}
      </Button>
    </form>
  );
}

// Kontribusi Form Component
interface KontribusiFormProps {
  tujuan: TujuanKeuangan;
  onSuccess: () => void;
}

function KontribusiForm({ tujuan, onSuccess }: KontribusiFormProps) {
  const [jumlah, setJumlah] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jumlah || parseInt(jumlah) <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        toast.error('Anda harus login terlebih dahulu');
        return;
      }

      // Insert kontribusi
      const { error: kontribusiError } = await supabase
        .from('kontribusi_tujuan')
        .insert({
          tujuan_id: tujuan.id,
          jumlah: parseInt(jumlah),
          tanggal: new Date().toISOString(),
        });

      if (kontribusiError) throw kontribusiError;

      // Update terkumpul
      const terkumpulBaru = tujuan.terkumpul + parseInt(jumlah);
      const { error: updateError } = await supabase
        .from('tujuan_keuangan')
        .update({
          terkumpul: terkumpulBaru,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tujuan.id);

      if (updateError) throw updateError;

      toast.success('Kontribusi berhasil ditambahkan!');
      onSuccess();
    } catch (error) {
      toast.error('Gagal menambahkan kontribusi');
    } finally {
      setIsLoading(false);
    }
  };

  const sisa = tujuan.target_jumlah - tujuan.terkumpul;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Jumlah Kontribusi</Label>
        <Input
          type="number"
          placeholder="0"
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value)}
          min={1}
        />
        <p className="text-xs text-gray-500">
          Sisa yang perlu dikumpulkan: {formatRupiah(sisa)}
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Menyimpan...' : 'Tambah Kontribusi'}
      </Button>
    </form>
  );
}
