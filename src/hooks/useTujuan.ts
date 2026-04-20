'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TujuanKeuangan, TujuanWithProgress, KontribusiTujuan } from '@/types/database';

export function useTujuan() {
  const [tujuan, setTujuan] = useState<TujuanWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTujuan = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error: supabaseError } = await supabase
        .from('tujuan_keuangan')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      const tujuanWithProgress: TujuanWithProgress[] = (data || []).map((t) => {
        const persentase = Math.min(Math.round((t.terkumpul / t.target_jumlah) * 100), 100);
        const sisa = t.target_jumlah - t.terkumpul;
        
        let sisa_hari: number | null = null;
        let estimasi_hari: number | null = null;
        
        if (t.deadline) {
          const deadline = new Date(t.deadline);
          const now = new Date();
          sisa_hari = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Hitung kontribusi rata-rata per bulan
        const createdDate = new Date(t.created_at);
        const now = new Date();
        const bulanBerlalu = Math.max(1, 
          (now.getFullYear() - createdDate.getFullYear()) * 12 + 
          (now.getMonth() - createdDate.getMonth())
        );
        const kontribusi_bulanan_rata = Math.round(t.terkumpul / bulanBerlalu);
        
        if (sisa > 0 && kontribusi_bulanan_rata > 0) {
          estimasi_hari = Math.ceil((sisa / kontribusi_bulanan_rata) * 30);
        }

        return {
          ...t,
          persentase,
          sisa_hari,
          estimasi_hari,
          kontribusi_bulanan_rata,
        };
      });

      setTujuan(tujuanWithProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const addTujuan = async (newTujuan: Omit<TujuanKeuangan, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'terkumpul'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      const { data, error: supabaseError } = await supabase
        .from('tujuan_keuangan')
        .insert({ ...newTujuan, user_id: userData.user.id, terkumpul: 0 })
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      await fetchTujuan();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const addKontribusi = async (tujuanId: string, jumlah: number, catatan?: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      const { error: kontribusiError } = await supabase
        .from('kontribusi_tujuan')
        .insert({
          tujuan_id: tujuanId,
          user_id: userData.user.id,
          jumlah,
          catatan,
        });

      if (kontribusiError) throw kontribusiError;

      // Update terkumpul di tujuan
      const tujuanSaatIni = tujuan.find((t) => t.id === tujuanId);
      if (tujuanSaatIni) {
        const terkumpulBaru = tujuanSaatIni.terkumpul + jumlah;
        const is_selesai = terkumpulBaru >= tujuanSaatIni.target_jumlah;

        const { error: updateError } = await supabase
          .from('tujuan_keuangan')
          .update({
            terkumpul: terkumpulBaru,
            is_selesai,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tujuanId);

        if (updateError) throw updateError;
      }

      await fetchTujuan();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  useEffect(() => {
    fetchTujuan();
  }, [fetchTujuan]);

  return {
    tujuan,
    loading,
    error,
    refetch: fetchTujuan,
    addTujuan,
    addKontribusi,
  };
}
