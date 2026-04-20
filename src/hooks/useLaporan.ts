'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Transaksi, Kategori } from '@/types/database';

interface LaporanData {
  totalMasuk: number;
  totalKeluar: number;
  net: number;
  jumlahTransaksi: number;
  pengeluaranPerKategori: { nama: string; jumlah: number; persentase: number }[];
  pemasukanPerKategori: { nama: string; jumlah: number; persentase: number }[];
  transaksiPerHari: { tanggal: string; masuk: number; keluar: number }[];
}

export function useLaporan(bulan?: number, tahun?: number) {
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const targetBulan = bulan || new Date().getMonth() + 1;
  const targetTahun = tahun || new Date().getFullYear();

  const fetchLaporan = useCallback(async () => {
    try {
      setLoading(true);

      const awalBulan = new Date(targetTahun, targetBulan - 1, 1).toISOString();
      const akhirBulan = new Date(targetTahun, targetBulan, 0, 23, 59, 59).toISOString();

      const { data: transaksiData, error: transaksiError } = await supabase
        .from('transaksi')
        .select(`
          *,
          kategori(*)
        `)
        .gte('tanggal', awalBulan)
        .lte('tanggal', akhirBulan);

      if (transaksiError) throw transaksiError;

      const transaksi = transaksiData || [];

      const totalMasuk = transaksi
        .filter((t) => t.tipe === 'pemasukan')
        .reduce((acc, t) => acc + t.jumlah, 0);

      const totalKeluar = transaksi
        .filter((t) => t.tipe === 'pengeluaran')
        .reduce((acc, t) => acc + t.jumlah, 0);

      // Pengeluaran per kategori
      const pengeluaranKategoriMap: Record<string, number> = {};
      transaksi
        .filter((t) => t.tipe === 'pengeluaran')
        .forEach((t) => {
          const kategoriNama = (t.kategori as Kategori)?.nama || 'Lainnya';
          pengeluaranKategoriMap[kategoriNama] = (pengeluaranKategoriMap[kategoriNama] || 0) + t.jumlah;
        });

      const pengeluaranPerKategori = Object.entries(pengeluaranKategoriMap)
        .map(([nama, jumlah]) => ({
          nama,
          jumlah,
          persentase: Math.round((jumlah / totalKeluar) * 100) || 0,
        }))
        .sort((a, b) => b.jumlah - a.jumlah);

      // Pemasukan per kategori
      const pemasukanKategoriMap: Record<string, number> = {};
      transaksi
        .filter((t) => t.tipe === 'pemasukan')
        .forEach((t) => {
          const kategoriNama = (t.kategori as Kategori)?.nama || 'Lainnya';
          pemasukanKategoriMap[kategoriNama] = (pemasukanKategoriMap[kategoriNama] || 0) + t.jumlah;
        });

      const pemasukanPerKategori = Object.entries(pemasukanKategoriMap)
        .map(([nama, jumlah]) => ({
          nama,
          jumlah,
          persentase: Math.round((jumlah / totalMasuk) * 100) || 0,
        }))
        .sort((a, b) => b.jumlah - a.jumlah);

      // Transaksi per hari untuk chart
      const perHariMap: Record<string, { masuk: number; keluar: number }> = {};
      transaksi.forEach((t) => {
        const tanggal = t.tanggal.split('T')[0];
        if (!perHariMap[tanggal]) {
          perHariMap[tanggal] = { masuk: 0, keluar: 0 };
        }
        if (t.tipe === 'pemasukan') {
          perHariMap[tanggal].masuk += t.jumlah;
        } else if (t.tipe === 'pengeluaran') {
          perHariMap[tanggal].keluar += t.jumlah;
        }
      });

      const transaksiPerHari = Object.entries(perHariMap)
        .map(([tanggal, { masuk, keluar }]) => ({
          tanggal,
          masuk,
          keluar,
        }))
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

      setData({
        totalMasuk,
        totalKeluar,
        net: totalMasuk - totalKeluar,
        jumlahTransaksi: transaksi.length,
        pengeluaranPerKategori,
        pemasukanPerKategori,
        transaksiPerHari,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [targetBulan, targetTahun, supabase]);

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  return {
    data,
    loading,
    error,
    refetch: fetchLaporan,
  };
}
