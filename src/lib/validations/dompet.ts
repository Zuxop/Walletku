import * as z from 'zod';

export const dompetSchema = z.object({
  nama: z.string().min(1, 'Nama dompet wajib diisi').max(50, 'Nama maksimal 50 karakter'),
  tipe: z.enum(['tunai', 'bank', 'ewallet', 'investasi', 'lainnya']),
  saldo_awal: z.number().optional(),
  mata_uang: z.string().optional(),
  warna: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna harus hex (contoh: #6366f1)').optional(),
  ikon: z.string().optional(),
  catatan: z.string().max(500).optional().nullable(),
});

export const budgetSchema = z.object({
  kategori_id: z.string().uuid('Pilih kategori'),
  jumlah: z.number().min(1, 'Jumlah budget harus lebih dari 0'),
  periode: z.enum(['bulanan', 'tahunan', 'custom']).optional(),
  bulan: z.number().min(1).max(12).optional().nullable(),
  tahun: z.number().min(2000).max(2100).optional(),
  tanggal_mulai: z.string().date().optional().nullable(),
  tanggal_selesai: z.string().date().optional().nullable(),
  carry_over: z.boolean().optional(),
  notif_persen: z.number().min(50).max(100).optional(),
});

export const tujuanKeuanganSchema = z.object({
  nama: z.string().min(1, 'Nama tujuan wajib diisi').max(50, 'Nama maksimal 50 karakter'),
  target_jumlah: z.number().min(1, 'Target jumlah harus lebih dari 0'),
  deadline: z.string().date().optional().nullable(),
  ikon: z.string().optional(),
  warna: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  catatan: z.string().max(500).optional().nullable(),
});

export const hutangPiutangSchema = z.object({
  tipe: z.enum(['hutang', 'piutang']),
  nama_kontak: z.string().min(1, 'Nama kontak wajib diisi').max(100),
  jumlah_total: z.number().min(1, 'Jumlah harus lebih dari 0'),
  bunga_persen: z.number().min(0).max(100).default(0),
  jatuh_tempo: z.string().date().optional().nullable(),
  catatan: z.string().max(500).optional().nullable(),
});

export const kategoriSchema = z.object({
  nama: z.string().min(1, 'Nama kategori wajib diisi').max(50),
  tipe: z.enum(['pemasukan', 'pengeluaran']),
  ikon: z.string().default('circle'),
  warna: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
  parent_id: z.string().uuid().optional().nullable(),
});

export type DompetInput = z.infer<typeof dompetSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type TujuanKeuanganInput = z.infer<typeof tujuanKeuanganSchema>;
export type HutangPiutangInput = z.infer<typeof hutangPiutangSchema>;
export type KategoriInput = z.infer<typeof kategoriSchema>;
