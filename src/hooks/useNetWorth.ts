'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DompetWithSaldo, HutangPiutang } from '@/types/database';

interface NetWorthData {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetsBreakdown: {
    tunai: number;
    bank: number;
    ewallet: number;
    investasi: number;
    lainnya: number;
    piutang: number;
  };
  liabilitiesBreakdown: {
    hutang: number;
    piutang: number;
  };
  loading: boolean;
  error: string | null;
}

export function useNetWorth() {
  const [data, setData] = useState<NetWorthData>({
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    assetsBreakdown: {
      tunai: 0,
      bank: 0,
      ewallet: 0,
      investasi: 0,
      lainnya: 0,
      piutang: 0,
    },
    liabilitiesBreakdown: {
      hutang: 0,
      piutang: 0,
    },
    loading: true,
    error: null,
  });

  const supabase = createClient();

  const calculateNetWorth = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      // Fetch all wallets with current balance
      const { data: dompetData, error: dompetError } = await supabase
        .from('dompet')
        .select('*')
        .eq('is_archived', false);

      if (dompetError) throw dompetError;

      const { data: saldoData, error: saldoError } = await supabase
        .from('saldo_dompet')
        .select('*');

      if (saldoError) throw saldoError;

      // Calculate assets by type
      const dompetWithSaldo: DompetWithSaldo[] = (dompetData || []).map((d) => {
        const saldo = (saldoData || []).find((s) => s.id === d.id);
        return {
          ...d,
          saldo_sekarang: saldo?.saldo_sekarang || d.saldo_awal,
        };
      });

      const assetsBreakdown = {
        tunai: 0,
        bank: 0,
        ewallet: 0,
        investasi: 0,
        lainnya: 0,
        piutang: 0,
      };

      let totalAssets = 0;
      dompetWithSaldo.forEach((d) => {
        totalAssets += d.saldo_sekarang;
        if (d.tipe === 'tunai') assetsBreakdown.tunai += d.saldo_sekarang;
        else if (d.tipe === 'bank') assetsBreakdown.bank += d.saldo_sekarang;
        else if (d.tipe === 'ewallet') assetsBreakdown.ewallet += d.saldo_sekarang;
        else if (d.tipe === 'investasi') assetsBreakdown.investasi += d.saldo_sekarang;
        else assetsBreakdown.lainnya += d.saldo_sekarang;
      });

      // Fetch all debts (hutang/piutang)
      const { data: hutangData, error: hutangError } = await supabase
        .from('hutang_piutang')
        .select('*')
        .eq('is_lunas', false);

      if (hutangError) throw hutangError;

      // Calculate liabilities
      const liabilitiesBreakdown = {
        hutang: 0,
        piutang: 0,
      };

      let totalLiabilities = 0;
      (hutangData || []).forEach((h: HutangPiutang) => {
        const sisa = h.jumlah_total - h.jumlah_terbayar;
        if (h.tipe === 'hutang') {
          liabilitiesBreakdown.hutang += sisa;
          totalLiabilities += sisa;
        } else {
          liabilitiesBreakdown.piutang += sisa;
          // Piutang adalah asset, tapi kita pisahkan untuk tracking
        }
      });

      // Piutang is actually an asset (money owed to you)
      const totalPiutang = liabilitiesBreakdown.piutang;
      totalAssets += totalPiutang;
      assetsBreakdown.piutang = totalPiutang;

      setData({
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
        assetsBreakdown,
        liabilitiesBreakdown: {
          hutang: liabilitiesBreakdown.hutang,
          piutang: totalPiutang, // Piutang as asset
        },
        loading: false,
        error: null,
      });
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Terjadi kesalahan',
      }));
    }
  }, [supabase]);

  useEffect(() => {
    calculateNetWorth();

    // Subscribe to changes
    const channel = supabase
      .channel('networth-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaksi' }, () => {
        calculateNetWorth();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hutang_piutang' }, () => {
        calculateNetWorth();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [calculateNetWorth, supabase]);

  return { ...data, refetch: calculateNetWorth };
}
