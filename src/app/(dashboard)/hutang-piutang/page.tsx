'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, ArrowDownCircle, ArrowUpCircle, Trash2, Edit2, AlertCircle, CheckCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useHutang } from '@/hooks/useHutang';
import { hutangPiutangSchema, type HutangPiutangInput } from '@/lib/validations/dompet';
import { formatRupiah } from '@/lib/utils/currency';
import { formatTanggal } from '@/lib/utils/date';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { HutangPiutang } from '@/types/database';

export default function HutangPiutangPage() {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HutangPiutang | null>(null);
  const [activeTab, setActiveTab] = useState('hutang');
  const [bayarOpen, setBayarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HutangPiutang | null>(null);
  
  const { hutang, piutang, totalHutangAktif, totalPiutangAktif, loading, refetch } = useHutang();
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
        <h1 className="text-2xl font-bold">Hutang & Piutang</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit' : 'Tambah'} {activeTab === 'hutang' ? 'Hutang' : 'Piutang'}</DialogTitle>
            </DialogHeader>
            <HutangForm
              item={editingItem}
              defaultTipe={activeTab as 'hutang' | 'piutang'}
              onSuccess={() => {
                setOpen(false);
                setEditingItem(null);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
              Total Hutang Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatRupiah(totalHutangAktif)}</p>
            <p className="text-sm text-gray-500">{hutang.filter(h => !h.is_lunas).length} hutang belum lunas</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-green-600" />
              Total Piutang Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatRupiah(totalPiutangAktif)}</p>
            <p className="text-sm text-gray-500">{piutang.filter(p => !p.is_lunas).length} piutang belum diterima</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hutang" className="flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4" />
            Hutang ({hutang.length})
          </TabsTrigger>
          <TabsTrigger value="piutang" className="flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            Piutang ({piutang.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hutang" className="mt-4">
          <HutangList
            items={hutang}
            onEdit={(h) => {
              setEditingItem(h);
              setOpen(true);
            }}
            onBayar={(h) => {
              setSelectedItem(h);
              setBayarOpen(true);
            }}
            onDelete={async (id) => {
              if (confirm('Yakin ingin menghapus?')) {
                const { error } = await supabase.from('hutang_piutang').delete().eq('id', id);
                if (error) toast.error('Gagal menghapus');
                else {
                  toast.success('Berhasil dihapus');
                  refetch();
                }
              }
            }}
          />
        </TabsContent>

        <TabsContent value="piutang" className="mt-4">
          <HutangList
            items={piutang}
            onEdit={(p) => {
              setEditingItem(p);
              setOpen(true);
            }}
            onBayar={(p) => {
              setSelectedItem(p);
              setBayarOpen(true);
            }}
            onDelete={async (id) => {
              if (confirm('Yakin ingin menghapus?')) {
                const { error } = await supabase.from('hutang_piutang').delete().eq('id', id);
                if (error) toast.error('Gagal menghapus');
                else {
                  toast.success('Berhasil dihapus');
                  refetch();
                }
              }
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Bayar Dialog */}
      <Dialog open={bayarOpen} onOpenChange={setBayarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bayar {activeTab === 'hutang' ? 'Hutang' : 'Piutang'} - {selectedItem?.nama_kontak}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <BayarForm
              item={selectedItem}
              onSuccess={() => {
                setBayarOpen(false);
                setSelectedItem(null);
                refetch();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Hutang List Component
interface HutangListProps {
  items: any[];
  onEdit: (h: any) => void;
  onBayar: (h: any) => void;
  onDelete: (id: string) => void;
}

function HutangList({ items, onEdit, onBayar, onDelete }: HutangListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Belum ada data"
        description="Tambahkan data untuk mulai melacak"
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className={item.isLewatJatuhTempo ? 'border-red-300' : ''}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-medium text-lg">{item.nama_kontak}</h3>
                {item.isLewatJatuhTempo && (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    Lewat Jatuh Tempo
                  </span>
                )}
                {item.is_lunas && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1 mt-1">
                    <CheckCircle className="h-3 w-3" />
                    Lunas
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                {!item.is_lunas && (
                  <Button variant="ghost" size="sm" onClick={() => onBayar(item)}>
                    Bayar
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total: {formatRupiah(item.jumlah_total)}</span>
                <span className="text-gray-600">
                  Terbayar: {formatRupiah(item.jumlah_terbayar)} ({item.persentase}%)
                </span>
              </div>
              <Progress value={item.persentase} className="h-2" />
              <div className="flex justify-between text-sm">
                <span className={item.sisa > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                  Sisa: {formatRupiah(item.sisa)}
                </span>
                {item.jatuh_tempo && (
                  <span className="text-gray-500">
                    Jatuh tempo: {formatTanggal(item.jatuh_tempo)}
                  </span>
                )}
              </div>
              {item.catatan && (
                <p className="text-sm text-gray-500 mt-2">{item.catatan}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Hutang Form Component
interface HutangFormProps {
  item?: HutangPiutang | null;
  defaultTipe: 'hutang' | 'piutang';
  onSuccess: () => void;
}

function HutangForm({ item, defaultTipe, onSuccess }: HutangFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<HutangPiutangInput>({
    resolver: zodResolver(hutangPiutangSchema),
    defaultValues: {
      tipe: item?.tipe || defaultTipe,
      nama_kontak: item?.nama_kontak || '',
      jumlah_total: item?.jumlah_total || 0,
      bunga_persen: item?.bunga_persen || 0,
      jatuh_tempo: item?.jatuh_tempo || '',
      catatan: item?.catatan || '',
    },
  });

  const onSubmit = async (data: HutangPiutangInput) => {
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        toast.error('Anda harus login terlebih dahulu');
        return;
      }

      if (item) {
        const { error } = await supabase
          .from('hutang_piutang')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', item.id);

        if (error) throw error;
        toast.success('Berhasil diperbarui');
      } else {
        const { error } = await supabase.from('hutang_piutang').insert({
          ...data,
          user_id: userData.user.id,
          jumlah_terbayar: 0,
          is_lunas: false,
        });

        if (error) throw error;
        toast.success('Berhasil dibuat');
      }

      onSuccess();
    } catch (error) {
      toast.error('Gagal menyimpan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="tipe">Tipe</Label>
        <select
          id="tipe"
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          {...register('tipe')}
          disabled={!!item}
        >
          <option value="hutang">Hutang (Saya meminjam)</option>
          <option value="piutang">Piutang (Saya meminjamkan)</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama_kontak">Nama Kontak</Label>
        <Input id="nama_kontak" placeholder="Contoh: John Doe" {...register('nama_kontak')} />
        {errors.nama_kontak && <p className="text-sm text-red-500">{errors.nama_kontak.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="jumlah_total">Jumlah Total</Label>
        <Input id="jumlah_total" type="number" placeholder="0" {...register('jumlah_total', { valueAsNumber: true })} />
        {errors.jumlah_total && <p className="text-sm text-red-500">{errors.jumlah_total.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bunga_persen">Bunga (%)</Label>
        <Input id="bunga_persen" type="number" placeholder="0" {...register('bunga_persen', { valueAsNumber: true })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jatuh_tempo">Jatuh Tempo</Label>
        <Input id="jatuh_tempo" type="date" {...register('jatuh_tempo')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="catatan">Catatan</Label>
        <Input id="catatan" placeholder="Catatan tambahan" {...register('catatan')} />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Menyimpan...' : item ? 'Simpan Perubahan' : 'Simpan'}
      </Button>
    </form>
  );
}

// Bayar Form Component
interface BayarFormProps {
  item: any;
  onSuccess: () => void;
}

function BayarForm({ item, onSuccess }: BayarFormProps) {
  const [jumlah, setJumlah] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jumlah || parseInt(jumlah) <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    const jumlahBayar = parseInt(jumlah);
    if (jumlahBayar > item.sisa) {
      toast.error('Jumlah melebihi sisa');
      return;
    }

    try {
      setIsLoading(true);
      
      // Insert cicilan
      const { error: cicilanError } = await supabase
        .from('cicilan_hutang')
        .insert({
          hutang_id: item.id,
          jumlah: jumlahBayar,
          tanggal: new Date().toISOString(),
        });

      if (cicilanError) throw cicilanError;

      // Update hutang_piutang
      const terbayarBaru = item.jumlah_terbayar + jumlahBayar;
      const is_lunas = terbayarBaru >= item.jumlah_total;

      const { error: updateError } = await supabase
        .from('hutang_piutang')
        .update({
          jumlah_terbayar: terbayarBaru,
          is_lunas,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      toast.success('Pembayaran berhasil!');
      onSuccess();
    } catch (error) {
      toast.error('Gagal memproses pembayaran');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Jumlah Pembayaran</Label>
        <Input
          type="number"
          placeholder="0"
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value)}
          min={1}
          max={item.sisa}
        />
        <p className="text-xs text-gray-500">Sisa: {formatRupiah(item.sisa)}</p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Memproses...' : 'Bayar'}
      </Button>
    </form>
  );
}
