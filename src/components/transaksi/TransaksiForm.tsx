'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { transaksiSchema, type TransaksiInput } from '@/lib/validations/transaksi';
import { createClient } from '@/lib/supabase/client';
import { AttachmentUpload } from './AttachmentUpload';
import { TagSelector } from './TagSelector';
import type { Transaksi } from '@/types/database';

interface TransaksiFormProps {
  transaksi?: Transaksi | null;
  onSuccess?: () => void;
}

export function TransaksiForm({ transaksi, onSuccess }: TransaksiFormProps) {
  const isEditing = !!transaksi;
  const [tipe, setTipe] = useState<'pengeluaran' | 'pemasukan' | 'transfer'>(
    transaksi?.tipe || 'pengeluaran'
  );
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransaksiInput>({
    resolver: zodResolver(transaksiSchema),
    defaultValues: {
      tipe: transaksi?.tipe || 'pengeluaran',
      jumlah: transaksi?.jumlah || 0,
      tanggal: transaksi?.tanggal || new Date().toISOString(),
      is_recurring: transaksi?.is_recurring || false,
      is_pending: transaksi?.is_pending || false,
      kategori_id: transaksi?.kategori_id || null,
      dompet_tujuan_id: transaksi?.dompet_tujuan_id || null,
      catatan: transaksi?.catatan || null,
      dompet_id: transaksi?.dompet_id || '',
    },
  });

  const jumlah = watch('jumlah');
  const [attachments, setAttachments] = useState<string[]>(transaksi?.lampiran || []);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Load existing tags when editing
  useEffect(() => {
    if (transaksi?.id) {
      supabase
        .from('transaksi_tags')
        .select('tag_id')
        .eq('transaksi_id', transaksi.id)
        .then(({ data }) => {
          if (data) {
            setSelectedTags(data.map(t => t.tag_id));
          }
        });
    }
  }, [transaksi?.id]);

  const onSubmit = async (data: TransaksiInput) => {
    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        toast.error('Anda harus login terlebih dahulu');
        return;
      }

      if (isEditing && transaksi) {
        // Update existing
        const { error } = await supabase
          .from('transaksi')
          .update({
            ...data,
            lampiran: attachments,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaksi.id);

        if (error) {
          toast.error(error.message);
          return;
        }

        // Update tags - delete existing and insert new
        await supabase.from('transaksi_tags').delete().eq('transaksi_id', transaksi.id);
        if (selectedTags.length > 0) {
          const tagInserts = selectedTags.map(tagId => ({
            transaksi_id: transaksi.id,
            tag_id: tagId,
          }));
          await supabase.from('transaksi_tags').insert(tagInserts);
        }

        toast.success('Transaksi berhasil diperbarui!');
      } else {
        // Create new
        const { data: transaksiData, error } = await supabase.from('transaksi')
          .insert({
            ...data,
            user_id: userData.user.id,
            lampiran: attachments,
            tipe,
          })
          .select()
          .single();

        if (error) throw error;

        // Save tags
        if (selectedTags.length > 0 && transaksiData?.id) {
          const tagInserts = selectedTags.map(tagId => ({
            transaksi_id: transaksiData.id,
            tag_id: tagId,
          }));
          await supabase.from('transaksi_tags').insert(tagInserts);
        }

        toast.success('Transaksi berhasil ditambahkan!');
      }
      onSuccess?.();
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tipe Transaksi */}
      <Tabs
        value={tipe}
        onValueChange={(v) => {
          setTipe(v as 'pengeluaran' | 'pemasukan' | 'transfer');
          setValue('tipe', v as 'pengeluaran' | 'pemasukan' | 'transfer');
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="pengeluaran"
            className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
          >
            <ArrowDownCircle className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Pengeluaran</span>
          </TabsTrigger>
          <TabsTrigger
            value="pemasukan"
            className="data-[state=active]:bg-green-50 data-[state=active]:text-green-600"
          >
            <ArrowUpCircle className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Pemasukan</span>
          </TabsTrigger>
          <TabsTrigger
            value="transfer"
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
          >
            <ArrowLeftRight className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Transfer</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Jumlah */}
      <div className="space-y-2">
        <Label>Jumlah</Label>
        <CurrencyInput
          value={jumlah}
          onChange={(value) => setValue('jumlah', value)}
          placeholder="0"
        />
        {errors.jumlah && (
          <p className="text-sm text-red-500">{errors.jumlah.message}</p>
        )}
      </div>

      {/* Tanggal */}
      <div className="space-y-2">
        <Label htmlFor="tanggal">Tanggal & Waktu</Label>
        <div className="relative">
          <Input
            id="tanggal"
            type="datetime-local"
            {...register('tanggal')}
          />
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Catatan */}
      <div className="space-y-2">
        <Label htmlFor="catatan">Catatan (Opsional)</Label>
        <Textarea
          id="catatan"
          placeholder="Tambahkan catatan..."
          {...register('catatan')}
          rows={3}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags / Label</Label>
        <TagSelector
          selectedTags={selectedTags}
          onChange={setSelectedTags}
        />
      </div>

      {/* Attachments */}
      <div className="space-y-2">
        <Label>Lampiran</Label>
        <AttachmentUpload
          transactionId={transaksi?.id}
          attachments={attachments}
          onUpload={setAttachments}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={isLoading}
      >
        {isLoading ? 'Menyimpan...' : isEditing ? 'Perbarui Transaksi' : 'Simpan Transaksi'}
      </Button>
    </form>
  );
}
