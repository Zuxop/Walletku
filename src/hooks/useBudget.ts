'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Budget, BudgetWithProgress, Kategori } from '@/types/database';

export function useBudget(bulan?: number, tahun?: number) {
  const [budget, setBudget] = useState<BudgetWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const targetBulan = bulan || new Date().getMonth() + 1;
  const targetTahun = tahun || new Date().getFullYear();

  const fetchBudget = useCallback(async () => {
    try {
      setLoading(true);

      const { data: budgetData, error: budgetError } = await supabase
        .from('budget')
        .select(`
          *,
          kategori(*)
        `)
        .eq('bulan', targetBulan)
        .eq('tahun', targetTahun);

      if (budgetError) throw budgetError;

      const awalBulan = new Date(targetTahun, targetBulan - 1, 1).toISOString();
      const akhirBulan = new Date(targetTahun, targetBulan, 0, 23, 59, 59).toISOString();

      const { data: transaksiData, error: transaksiError } = await supabase
        .from('transaksi')
        .select('kategori_id, jumlah')
        .eq('tipe', 'pengeluaran')
        .gte('tanggal', awalBulan)
        .lte('tanggal', akhirBulan);

      if (transaksiError) throw transaksiError;

      const pengeluaranPerKategori: Record<string, number> = {};
      transaksiData?.forEach((t) => {
        if (t.kategori_id) {
          pengeluaranPerKategori[t.kategori_id] = (pengeluaranPerKategori[t.kategori_id] || 0) + t.jumlah;
        }
      });

      const budgetWithProgress: BudgetWithProgress[] = (budgetData || []).map((b) => {
        const terpakai = pengeluaranPerKategori[b.kategori_id] || 0;
        const sisa = b.jumlah - terpakai;
        const persentase = Math.min(Math.round((terpakai / b.jumlah) * 100), 100);
        
        let status: 'aman' | 'perhatian' | 'melebihi' = 'aman';
        if (persentase >= 100) status = 'melebihi';
        else if (persentase >= b.notif_persen) status = 'perhatian';

        return {
          ...b,
          kategori: b.kategori as Kategori,
          terpakai,
          sisa,
          persentase,
          status,
        };
      });

      setBudget(budgetWithProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [targetBulan, targetTahun, supabase]);

  const addBudget = async (newBudget: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      const { data, error: supabaseError } = await supabase
        .from('budget')
        .insert({ ...newBudget, user_id: userData.user.id })
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      await fetchBudget();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const { error: supabaseError } = await supabase
        .from('budget')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      await fetchBudget();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('budget')
        .delete()
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      await fetchBudget();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  return {
    budget,
    loading,
    error,
    refetch: fetchBudget,
    addBudget,
    updateBudget,
    deleteBudget,
  };
}
