export type TipeKategori = 'pemasukan' | 'pengeluaran' | 'transfer';
export type TipeDompet = 'tunai' | 'bank' | 'ewallet' | 'investasi' | 'lainnya';
export type TipeTransaksi = 'pemasukan' | 'pengeluaran' | 'transfer';
export type FrekuensiRecurring = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';
export type PeriodeBudget = 'bulanan' | 'tahunan' | 'custom';
export type TipeHutangPiutang = 'hutang' | 'piutang';

export interface Profile {
  id: string;
  nama_lengkap: string | null;
  avatar_url: string | null;
  mata_uang: string;
  bahasa: string;
  tema: string;
  notif_harian: boolean;
  notif_budget: boolean;
  notif_hutang: boolean;
  privacy_mode: boolean;
  biometric_enabled: boolean;
  biometric_credential_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  nama: string;
  warna: string;
  created_at: string;
}

export interface TransaksiTag {
  transaksi_id: string;
  tag_id: string;
  tag?: Tag;
}

export interface Kategori {
  id: string;
  user_id: string;
  nama: string;
  tipe: TipeKategori;
  ikon: string;
  warna: string;
  parent_id: string | null;
  urutan: number;
  is_archived: boolean;
  is_default: boolean;
  created_at: string;
}

export interface Dompet {
  id: string;
  user_id: string;
  nama: string;
  saldo_awal: number;
  mata_uang: string;
  tipe: TipeDompet;
  warna: string;
  ikon: string;
  urutan: number;
  is_archived: boolean;
  is_shared: boolean;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaksi {
  id: string;
  user_id: string;
  tipe: TipeTransaksi;
  jumlah: number;
  kategori_id: string | null;
  dompet_id: string;
  dompet_tujuan_id: string | null;
  tanggal: string;
  catatan: string | null;
  foto_url: string | null;
  lokasi_lat: number | null;
  lokasi_lng: number | null;
  lokasi_nama: string | null;
  is_recurring: boolean;
  recurring_id: string | null;
  is_pending: boolean;
  is_split: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransaksiTag {
  id: string;
  transaksi_id: string;
  tag: string;
}

export interface TransaksiSplit {
  id: string;
  transaksi_id: string;
  kategori_id: string | null;
  jumlah: number;
  catatan: string | null;
}

export interface RecurringRule {
  id: string;
  user_id: string;
  tipe: TipeTransaksi;
  jumlah: number;
  kategori_id: string | null;
  dompet_id: string;
  dompet_tujuan_id: string | null;
  frekuensi: FrekuensiRecurring;
  hari_ke: number | null;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  catatan: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_generated_at: string | null;
}

export interface RecurringRuleWithRelations extends RecurringRule {
  kategori: Kategori | null;
  dompet: Dompet | null;
}

export interface Budget {
  id: string;
  user_id: string;
  kategori_id: string;
  jumlah: number;
  periode: PeriodeBudget;
  bulan: number | null;
  tahun: number;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  carry_over: boolean;
  notif_persen: number;
  created_at: string;
  updated_at: string;
}

export interface TujuanKeuangan {
  id: string;
  user_id: string;
  nama: string;
  target_jumlah: number;
  terkumpul: number;
  deadline: string | null;
  ikon: string;
  warna: string;
  catatan: string | null;
  is_selesai: boolean;
  urutan: number;
  created_at: string;
  updated_at: string;
}

export interface KontribusiTujuan {
  id: string;
  tujuan_id: string;
  user_id: string;
  jumlah: number;
  tanggal: string;
  catatan: string | null;
}

export interface HutangPiutang {
  id: string;
  user_id: string;
  tipe: TipeHutangPiutang;
  nama_kontak: string;
  jumlah_total: number;
  jumlah_terbayar: number;
  mata_uang: string;
  bunga_persen: number;
  jatuh_tempo: string | null;
  catatan: string | null;
  is_lunas: boolean;
  created_at: string;
  updated_at: string;
}

export interface CicilanHutang {
  id: string;
  hutang_id: string;
  jumlah: number;
  tanggal: string;
  catatan: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  tipe: string;
  judul: string;
  pesan: string;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SaldoDompet {
  id: string;
  user_id: string;
  nama: string;
  tipe: TipeDompet;
  warna: string;
  ikon: string;
  mata_uang: string;
  saldo_sekarang: number;
}

export interface TransaksiWithRelations extends Transaksi {
  kategori?: Kategori | null;
  dompet?: Dompet | null;
  dompet_tujuan?: Dompet | null;
  tags?: TransaksiTag[];
  splits?: TransaksiSplit[];
}

export interface DompetWithSaldo extends Dompet {
  saldo_sekarang: number;
}

export interface BudgetWithProgress extends Budget {
  kategori?: Kategori;
  terpakai: number;
  sisa: number;
  persentase: number;
  status: 'aman' | 'perhatian' | 'melebihi';
}

export interface TujuanWithProgress extends TujuanKeuangan {
  persentase: number;
  sisa_hari: number | null;
  estimasi_hari: number | null;
  kontribusi_bulanan_rata: number;
}
