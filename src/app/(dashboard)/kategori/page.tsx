'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, ArrowUpCircle, ArrowDownCircle, Trash2, Edit2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKategori } from '@/hooks/useKategori';
import { kategoriSchema, type KategoriInput } from '@/lib/validations/dompet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { Kategori } from '@/types/database';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];

export default function KategoriPage() {
  const [open, setOpen] = useState(false);
  const [editingKategori, setEditingKategori] = useState<Kategori | null>(null);
  const [activeTab, setActiveTab] = useState('pengeluaran');
  
  const { kategori, kategoriPemasukan, kategoriPengeluaran, loading, refetch } = useKategori();
  const supabase = createClient();

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
        <h1 className="text-2xl font-bold">Kategori</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingKategori ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
            </DialogHeader>
            <KategoriForm
              kategori={editingKategori}
              defaultTipe={activeTab as 'pemasukan' | 'pengeluaran'}
              onSuccess={() => {
                setOpen(false);
                setEditingKategori(null);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pengeluaran" className="flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4" />
            Pengeluaran ({kategoriPengeluaran.length})
          </TabsTrigger>
          <TabsTrigger value="pemasukan" className="flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            Pemasukan ({kategoriPemasukan.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pengeluaran" className="mt-4">
          <KategoriList
            kategori={kategoriPengeluaran}
            onEdit={(k) => {
              setEditingKategori(k);
              setOpen(true);
            }}
            onDelete={async (id) => {
              if (confirm('Yakin ingin menghapus kategori ini?')) {
                const { error } = await supabase.from('kategori').delete().eq('id', id);
                if (error) toast.error('Gagal menghapus kategori');
                else {
                  toast.success('Kategori berhasil dihapus');
                  refetch();
                }
              }
            }}
          />
        </TabsContent>

        <TabsContent value="pemasukan" className="mt-4">
          <KategoriList
            kategori={kategoriPemasukan}
            onEdit={(k) => {
              setEditingKategori(k);
              setOpen(true);
            }}
            onDelete={async (id) => {
              if (confirm('Yakin ingin menghapus kategori ini?')) {
                const { error } = await supabase.from('kategori').delete().eq('id', id);
                if (error) toast.error('Gagal menghapus kategori');
                else {
                  toast.success('Kategori berhasil dihapus');
                  refetch();
                }
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Kategori List Component
interface KategoriListProps {
  kategori: Kategori[];
  onEdit: (k: Kategori) => void;
  onDelete: (id: string) => void;
}

function KategoriList({ kategori, onEdit, onDelete }: KategoriListProps) {
  if (kategori.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="Belum ada kategori"
        description="Tambahkan kategori untuk mengelompokkan transaksi"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {kategori.map((k) => (
        <Card key={k.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: k.warna + '20' }}
                >
                  {k.ikon}
                </div>
                <span className="font-medium">{k.nama}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(k)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                {!k.is_default && (
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onDelete(k.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Kategori Form Component
interface KategoriFormProps {
  kategori?: Kategori | null;
  defaultTipe: 'pemasukan' | 'pengeluaran';
  onSuccess: () => void;
}

function KategoriForm({ kategori, defaultTipe, onSuccess }: KategoriFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<KategoriInput>({
    resolver: zodResolver(kategoriSchema),
    defaultValues: {
      nama: kategori?.nama || '',
      tipe: kategori?.tipe || defaultTipe,
      ikon: kategori?.ikon || 'circle',
      warna: kategori?.warna || '#6366f1',
    },
  });

  const selectedColor = watch('warna');

  const onSubmit = async (data: KategoriInput) => {
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        toast.error('Anda harus login terlebih dahulu');
        return;
      }

      if (kategori) {
        const { error } = await supabase
          .from('kategori')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', kategori.id);

        if (error) throw error;
        toast.success('Kategori berhasil diperbarui');
      } else {
        const { error } = await supabase.from('kategori').insert({
          ...data,
          user_id: userData.user.id,
        });

        if (error) throw error;
        toast.success('Kategori berhasil dibuat');
      }

      onSuccess();
    } catch (error) {
      toast.error('Gagal menyimpan kategori');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="nama">Nama Kategori</Label>
        <Input id="nama" placeholder="Contoh: Makanan, Transportasi" {...register('nama')} />
        {errors.nama && <p className="text-sm text-red-500">{errors.nama.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipe">Tipe</Label>
        <select
          id="tipe"
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          {...register('tipe')}
          disabled={!!kategori}
        >
          <option value="pengeluaran">Pengeluaran</option>
          <option value="pemasukan">Pemasukan</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ikon">Ikon (Emoji)</Label>
        <Input id="ikon" placeholder="Contoh: 🍔, 🚗, 💰" {...register('ikon')} />
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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Menyimpan...' : kategori ? 'Simpan Perubahan' : 'Buat Kategori'}
      </Button>
    </form>
  );
}
