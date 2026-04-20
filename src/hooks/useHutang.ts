'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { HutangPiutang, CicilanHutang } from '@/types/database';

interface HutangWithProgress extends HutangPiutang {
  sisa: number;
  persentase: number;
  isLewatJatuhTempo: boolean;
}

export function useHutang() {
  const [hutang, setHutang] = useState<HutangWithProgress[]>([]);
  const [piutang, setPiutang] = useState<HutangWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchHutangPiutang = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error: supabaseError } = await supabase
        .from('hutang_piutang')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      const now = new Date();

      const withProgress = (data || []).map((h) => {
        const sisa = h.jumlah_total - h.jumlah_terbayar;
        const persentase = Math.min(Math.round((h.jumlah_terbayar / h.jumlah_total) * 100), 100);
        const isLewatJatuhTempo = !h.is_lunas && h.jatuh_tempo ? new Date(h.jatuh_tempo) < now : false;

        return {
          ...h,
          sisa,
          persentase,
          isLewatJatuhTempo,
        };
      });

      setHutang(withProgress.filter((h) => h.tipe === 'hutang'));
      setPiutang(withProgress.filter((h) => h.tipe === 'piutang'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const addHutangPiutang = async (newHutang: Omit<HutangPiutang, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'jumlah_terbayar' | 'is_lunas'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      const { data, error: supabaseError } = await supabase
        .from('hutang_piutang')
        .insert({
          ...newHutang,
          user_id: userData.user.id,
          jumlah_terbayar: 0,
          is_lunas: false,
        })
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      await fetchHutangPiutang();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const bayarCicilan = async (hutangId: string, jumlah: number, catatan?: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      const { error: cicilanError } = await supabase
        .from('cicilan_hutang')
        .insert({
          hutang_id: hutangId,
          jumlah,
          catatan,
        });

      if (cicilanError) throw cicilanError;

      // Update jumlah terbayar
      const item = [...hutang, ...piutang].find((h) => h.id === hutangId);
      if (item) {
        const terbayarBaru = item.jumlah_terbayar + jumlah;
        const is_lunas = terbayarBaru >= item.jumlah_total;

        const { error: updateError } = await supabase
          .from('hutang_piutang')
          .update({
            jumlah_terbayar: terbayarBaru,
            is_lunas,
            updated_at: new Date().toISOString(),
          })
          .eq('id', hutangId);

        if (updateError) throw updateError;
      }

      await fetchHutangPiutang();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  useEffect(() => {
    fetchHutangPiutang();
  }, [fetchHutangPiutang]);

  const totalHutangAktif = hutang.filter((h) => !h.is_lunas).reduce((acc, h) => acc + h.sisa, 0);
  const totalPiutangAktif = piutang.filter((p) => !p.is_lunas).reduce((acc, p) => acc + p.sisa, 0);

  return {
    hutang,
    piutang,
    totalHutangAktif,
    totalPiutangAktif,
    loading,
    error,
    refetch: fetchHutangPiutang,
    addHutangPiutang,
    bayarCicilan,
  };
}
