'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Dompet, DompetWithSaldo, SaldoDompet } from '@/types/database';

export function useDompet() {
  const [dompet, setDompet] = useState<DompetWithSaldo[]>([]);
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchDompet = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: dompetData, error: dompetError } = await supabase
        .from('dompet')
        .select('*')
        .eq('is_archived', false)
        .order('urutan', { ascending: true });

      if (dompetError) throw dompetError;

      const { data: saldoData, error: saldoError } = await supabase
        .from('saldo_dompet')
        .select('*');

      if (saldoError) throw saldoError;

      const dompetWithSaldo: DompetWithSaldo[] = (dompetData || []).map((d) => {
        const saldo = (saldoData as SaldoDompet[] || []).find((s) => s.id === d.id);
        return {
          ...d,
          saldo_sekarang: saldo?.saldo_sekarang || d.saldo_awal,
        };
      });

      setDompet(dompetWithSaldo);
      setTotalSaldo(dompetWithSaldo.reduce((acc, d) => acc + d.saldo_sekarang, 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const addDompet = async (newDompet: Omit<Dompet, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      const { data, error: supabaseError } = await supabase
        .from('dompet')
        .insert({ ...newDompet, user_id: userData.user.id })
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      await fetchDompet();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const updateDompet = async (id: string, updates: Partial<Dompet>) => {
    try {
      const { error: supabaseError } = await supabase
        .from('dompet')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      await fetchDompet();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const archiveDompet = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('dompet')
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      await fetchDompet();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  useEffect(() => {
    fetchDompet();

    const channel = supabase
      .channel('dompet-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaksi' }, () => {
        fetchDompet();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDompet, supabase]);

  return {
    dompet,
    totalSaldo,
    loading,
    error,
    refetch: fetchDompet,
    addDompet,
    updateDompet,
    archiveDompet,
  };
}
