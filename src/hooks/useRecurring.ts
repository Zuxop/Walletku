'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RecurringRule, RecurringRuleWithRelations } from '@/types/database';

export function useRecurring() {
  const [rules, setRules] = useState<RecurringRuleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('recurring_rules')
        .select(`
          *,
          kategori(*),
          dompet(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      setRules(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const addRule = async (newRule: Omit<RecurringRule, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'last_generated_at'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      const { data, error: supabaseError } = await supabase
        .from('recurring_rules')
        .insert({ ...newRule, user_id: userData.user.id })
        .select()
        .single();

      if (supabaseError) throw supabaseError;
      await fetchRules();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const updateRule = async (id: string, updates: Partial<RecurringRule>) => {
    try {
      const { error: supabaseError } = await supabase
        .from('recurring_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (supabaseError) throw supabaseError;
      await fetchRules();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('recurring_rules')
        .delete()
        .eq('id', id);

      if (supabaseError) throw supabaseError;
      await fetchRules();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  const generateTransaction = async (ruleId: string) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) throw new Error('Rule tidak ditemukan');

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      // Create transaction from rule
      const { error: transaksiError } = await supabase
        .from('transaksi')
        .insert({
          user_id: userData.user.id,
          tipe: rule.tipe,
          jumlah: rule.jumlah,
          kategori_id: rule.kategori_id,
          dompet_id: rule.dompet_id,
          dompet_tujuan_id: rule.dompet_tujuan_id,
          tanggal: new Date().toISOString(),
          catatan: `Transaksi otomatis: ${rule.catatan || ''}`,
          is_recurring: true,
          recurring_rule_id: rule.id,
        });

      if (transaksiError) throw transaksiError;

      // Update last_generated_at
      await supabase
        .from('recurring_rules')
        .update({ last_generated_at: new Date().toISOString() })
        .eq('id', ruleId);

      await fetchRules();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan' };
    }
  };

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rules,
    loading,
    error,
    refetch: fetchRules,
    addRule,
    updateRule,
    deleteRule,
    generateTransaction,
  };
}
