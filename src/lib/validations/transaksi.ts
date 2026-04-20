import * as z from 'zod';

export const transaksiSchema = z.object({
  tipe: z.enum(['pemasukan', 'pengeluaran', 'transfer']),
  jumlah: z.number().min(1, 'Jumlah harus lebih dari 0'),
  kategori_id: z.string().uuid().optional().nullable(),
  dompet_id: z.string().uuid('Pilih dompet'),
  dompet_tujuan_id: z.string().uuid().optional().nullable(),
  tanggal: z.string().datetime(),
  catatan: z.string().max(500, 'Catatan maksimal 500 karakter').optional().nullable(),
  is_recurring: z.boolean().optional(),
  is_pending: z.boolean().optional(),
});

export const recurringRuleSchema = z.object({
  tipe: z.enum(['pemasukan', 'pengeluaran', 'transfer']),
  jumlah: z.number().min(1, 'Jumlah harus lebih dari 0'),
  kategori_id: z.string().uuid().optional().nullable(),
  dompet_id: z.string().uuid('Pilih dompet'),
  dompet_tujuan_id: z.string().uuid().optional().nullable(),
  frekuensi: z.enum(['harian', 'mingguan', 'bulanan', 'tahunan']),
  hari_ke: z.number().min(1).max(31).optional().nullable(),
  tanggal_mulai: z.string().date(),
  tanggal_selesai: z.string().date().optional().nullable(),
  catatan: z.string().max(500).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const transferSchema = z.object({
  dompet_asal_id: z.string().uuid('Pilih dompet asal'),
  dompet_tujuan_id: z.string().uuid('Pilih dompet tujuan'),
  jumlah: z.number().min(1, 'Jumlah harus lebih dari 0'),
  tanggal: z.string().datetime(),
  catatan: z.string().max(500).optional().nullable(),
}).refine((data) => data.dompet_asal_id !== data.dompet_tujuan_id, {
  message: 'Dompet asal dan tujuan tidak boleh sama',
  path: ['dompet_tujuan_id'],
});

export type TransaksiInput = z.infer<typeof transaksiSchema>;
export type RecurringRuleInput = z.infer<typeof recurringRuleSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
