'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { toast } from 'react-hot-toast';
import type { Kategori, Transaksi } from '@/types/database';

interface SplitItem {
  kategori_id: string;
  jumlah: number;
  catatan: string;
}

interface SplitTransactionFormProps {
  transaksi: Transaksi;
  kategori: Kategori[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function SplitTransactionForm({ transaksi, kategori, onSuccess, onCancel }: SplitTransactionFormProps) {
  const [items, setItems] = useState<SplitItem[]>([
    { kategori_id: '', jumlah: 0, catatan: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const totalJumlah = transaksi.jumlah;
  const allocatedJumlah = items.reduce((sum, item) => sum + item.jumlah, 0);
  const remainingJumlah = totalJumlah - allocatedJumlah;

  const addItem = () => {
    if (remainingJumlah <= 0) {
      toast.error('Jumlah sudah habis');
      return;
    }
    setItems([...items, { kategori_id: '', jumlah: remainingJumlah, catatan: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error('Minimal 1 item');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SplitItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    // Validation
    if (items.some(item => !item.kategori_id || item.jumlah <= 0)) {
      toast.error('Semua item harus memiliki kategori dan jumlah');
      return;
    }

    if (Math.abs(allocatedJumlah - totalJumlah) > 0.01) {
      toast.error(`Jumlah tidak sesuai. Tersisa: ${formatRupiah(remainingJumlah)}`);
      return;
    }

    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      // Create split transactions
      for (const item of items) {
        const { error } = await supabase.from('transaksi').insert({
          user_id: userData.user.id,
          tipe: transaksi.tipe,
          jumlah: item.jumlah,
          kategori_id: item.kategori_id,
          dompet_id: transaksi.dompet_id,
          tanggal: transaksi.tanggal,
          catatan: `${transaksi.catatan || 'Split'} - ${item.catatan || 'Item'}`,
          parent_id: transaksi.id, // Link to parent
        });

        if (error) throw error;
      }

      // Mark original as split
      await supabase.from('transaksi').update({
        is_split: true,
        updated_at: new Date().toISOString(),
      }).eq('id', transaksi.id);

      toast.success(`Transaksi berhasil dipecah menjadi ${items.length} item!`);
      onSuccess();
    } catch (error) {
      toast.error('Gagal memecah transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fill remaining when categories change
  useEffect(() => {
    if (items.length === 1 && items[0].kategori_id && items[0].jumlah === 0) {
      updateItem(0, 'jumlah', totalJumlah);
    }
  }, [items[0]?.kategori_id]);

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Total Transaksi</p>
        <p className="text-2xl font-bold">{formatRupiah(totalJumlah)}</p>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-green-600">Terisi: {formatRupiah(allocatedJumlah)}</span>
          <span className={remainingJumlah === 0 ? 'text-green-600' : 'text-orange-600'}>
            Tersisa: {formatRupiah(remainingJumlah)}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${Math.min((allocatedJumlah / totalJumlah) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3 bg-white">
            <div className="flex justify-between items-center">
              <span className="font-medium">Item {index + 1}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategori</Label>
                <Select
                  value={item.kategori_id}
                  onValueChange={(v) => updateItem(index, 'kategori_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {kategori
                      ?.filter(k => k.tipe === transaksi.tipe)
                      .map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.ikon} {k.nama}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Jumlah</Label>
                <CurrencyInput
                  value={item.jumlah}
                  onChange={(v) => updateItem(index, 'jumlah', v)}
                />
              </div>
            </div>

            <div>
              <Label>Catatan Item</Label>
              <Input
                placeholder="Catatan opsional..."
                value={item.catatan}
                onChange={(e) => updateItem(index, 'catatan', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        disabled={remainingJumlah <= 0}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Tambah Item
      </Button>

      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || remainingJumlah !== 0 || items.some(i => !i.kategori_id)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          {isLoading ? 'Menyimpan...' : 'Pecah Transaksi'}
        </Button>
      </div>
    </div>
  );
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}
