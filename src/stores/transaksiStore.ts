import { create } from 'zustand';
import type { TransaksiWithRelations } from '@/types/database';

interface TransaksiState {
  transaksi: TransaksiWithRelations[];
  loading: boolean;
  filter: {
    bulan: number;
    tahun: number;
    tipe: string | null;
    kategori_id: string | null;
    dompet_id: string | null;
    search: string;
  };
  setTransaksi: (transaksi: TransaksiWithRelations[]) => void;
  addTransaksi: (transaksi: TransaksiWithRelations) => void;
  updateTransaksi: (id: string, transaksi: Partial<TransaksiWithRelations>) => void;
  removeTransaksi: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setFilter: (filter: Partial<TransaksiState['filter']>) => void;
  resetFilter: () => void;
}

const getBulanIni = () => new Date().getMonth() + 1;
const getTahunIni = () => new Date().getFullYear();

export const useTransaksiStore = create<TransaksiState>()((set) => ({
  transaksi: [],
  loading: false,
  filter: {
    bulan: getBulanIni(),
    tahun: getTahunIni(),
    tipe: null,
    kategori_id: null,
    dompet_id: null,
    search: '',
  },
  setTransaksi: (transaksi) => set({ transaksi }),
  addTransaksi: (transaksi) =>
    set((state) => ({ transaksi: [transaksi, ...state.transaksi] })),
  updateTransaksi: (id, updatedTransaksi) =>
    set((state) => ({
      transaksi: state.transaksi.map((t) =>
        t.id === id ? { ...t, ...updatedTransaksi } : t
      ),
    })),
  removeTransaksi: (id) =>
    set((state) => ({
      transaksi: state.transaksi.filter((t) => t.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
  setFilter: (filter) => set((state) => ({ filter: { ...state.filter, ...filter } })),
  resetFilter: () =>
    set({
      filter: {
        bulan: getBulanIni(),
        tahun: getTahunIni(),
        tipe: null,
        kategori_id: null,
        dompet_id: null,
        search: '',
      },
    }),
}));
