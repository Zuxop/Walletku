'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tag } from '@/types/database';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('tags')
        .select('*')
        .order('nama', { ascending: true });

      if (supabaseError) throw supabaseError;
      setTags(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const addTag = async (nama: string, warna: string = '#6366f1') => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      const { data, error: supabaseError } = await supabase
        .from('tags')
        .insert({ nama, warna, user_id: userData.user.id })
        .select()
        .single();

      if (supabaseError) throw supabaseError;
      await fetchTags();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (supabaseError) throw supabaseError;
      await fetchTags();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    loading,
    error,
    refetch: fetchTags,
    addTag,
    deleteTag,
  };
}
