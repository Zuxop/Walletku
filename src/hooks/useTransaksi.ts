'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Transaksi, TransaksiWithRelations } from '@/types/database';

export function useTransaksi(bulan?: number, tahun?: number) {
  const [transaksi, setTransaksi] = useState<TransaksiWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTransaksi = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const targetBulan = bulan || now.getMonth() + 1;
      const targetTahun = tahun || now.getFullYear();

      const awalBulan = new Date(targetTahun, targetBulan - 1, 1).toISOString();
      const akhirBulan = new Date(targetTahun, targetBulan, 0, 23, 59, 59).toISOString();

      const { data, error: supabaseError } = await supabase
        .from('transaksi')
        .select(`
          *,
          kategori(*),
          dompet(*),
          dompet_tujuan:dompet!transaksi_dompet_tujuan_id_fkey(*)
        `)
        .gte('tanggal', awalBulan)
        .lte('tanggal', akhirBulan)
        .order('tanggal', { ascending: false });

      if (supabaseError) throw supabaseError;

      setTransaksi(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun, supabase]);

  const addTransaksi = async (newTransaksi: Omit<Transaksi, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('transaksi')
        .insert(newTransaksi)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      await fetchTransaksi();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const updateTransaksi = async (id: string, updates: Partial<Transaksi>) => {
    try {
      const { error: supabaseError } = await supabase
        .from('transaksi')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      await fetchTransaksi();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const deleteTransaksi = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('transaksi')
        .delete()
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      await fetchTransaksi();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  useEffect(() => {
    fetchTransaksi();
  }, [fetchTransaksi]);

  return {
    transaksi,
    loading,
    error,
    refetch: fetchTransaksi,
    addTransaksi,
    updateTransaksi,
    deleteTransaksi,
  };
}
