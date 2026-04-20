'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Kategori } from '@/types/database';

export function useKategori() {
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchKategori = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error: supabaseError } = await supabase
        .from('kategori')
        .select('*')
        .eq('is_archived', false)
        .order('tipe', { ascending: true })
        .order('urutan', { ascending: true });

      if (supabaseError) throw supabaseError;

      setKategori(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const addKategori = async (newKategori: Omit<Kategori, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      const { data, error: supabaseError } = await supabase
        .from('kategori')
        .insert({ ...newKategori, user_id: userData.user.id })
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      await fetchKategori();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const updateKategori = async (id: string, updates: Partial<Kategori>) => {
    try {
      const { error: supabaseError } = await supabase
        .from('kategori')
        .update(updates)
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      await fetchKategori();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const archiveKategori = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('kategori')
        .update({ is_archived: true })
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      await fetchKategori();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const reorderKategori = async (orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, index) =>
        supabase.from('kategori').update({ urutan: index }).eq('id', id)
      );

      await Promise.all(updates);
      await fetchKategori();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  useEffect(() => {
    fetchKategori();
  }, [fetchKategori]);

  const kategoriPemasukan = kategori.filter((k) => k.tipe === 'pemasukan');
  const kategoriPengeluaran = kategori.filter((k) => k.tipe === 'pengeluaran');

  return {
    kategori,
    kategoriPemasukan,
    kategoriPengeluaran,
    loading,
    error,
    refetch: fetchKategori,
    addKategori,
    updateKategori,
    archiveKategori,
    reorderKategori,
  };
}
