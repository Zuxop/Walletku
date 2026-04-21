import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatRupiah } from './currency';
import { formatTanggal } from './date';
import type { Transaksi, TransaksiWithRelations } from '@/types/database';

export function exportToCSV(
  transaksi: Transaksi[],
  filename: string
): void {
  const headers = ['Tanggal', 'Tipe', 'Jumlah', 'Kategori', 'Dompet', 'Catatan'];
  const rows = transaksi.map((t) => [
    formatTanggal(t.tanggal),
    t.tipe,
    t.jumlah,
    t.kategori_id || '-',
    t.dompet_id,
    t.catatan || '-',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

export interface ExportData {
  transaksi: TransaksiWithRelations[];
  summary: {
    totalMasuk: number;
    totalKeluar: number;
    net: number;
  };
}

export function exportToExcel(data: ExportData, filename: string): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Transaksi
  const transaksiData = data.transaksi.map((t) => ({
    Tanggal: formatTanggal(t.tanggal),
    Tipe: t.tipe,
    Jumlah: t.jumlah,
    Kategori: t.kategori?.nama || '-',
    Dompet: t.dompet?.nama || '-',
    'Dompet Tujuan': t.dompet_tujuan?.nama || '-',
    Catatan: t.catatan || '-',
  }));
  const ws1 = XLSX.utils.json_to_sheet(transaksiData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Transaksi');

  // Sheet 2: Ringkasan
  const summaryData = [
    { Keterangan: 'Total Pemasukan', Jumlah: data.summary.totalMasuk },
    { Keterangan: 'Total Pengeluaran', Jumlah: data.summary.totalKeluar },
    { Keterangan: 'Selisih (Net)', Jumlah: data.summary.net },
  ];
  const ws2 = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan');

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export interface LaporanData {
  periode: string;
  totalMasuk: number;
  totalKeluar: number;
  net: number;
  kategoriData: { nama: string; jumlah: number }[];
}

export function exportToPDF(laporan: LaporanData, filename: string): void {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('Aturla Wallet - Laporan Keuangan', 14, 20);

  doc.setFontSize(12);
  doc.text(`Periode: ${laporan.periode}`, 14, 30);

  // Summary
  doc.setFontSize(14);
  doc.text('Ringkasan', 14, 45);

  doc.setFontSize(10);
  (doc as unknown as { autoTable: (options: object) => void }).autoTable({
    startY: 50,
    head: [['Keterangan', 'Jumlah']],
    body: [
      ['Total Pemasukan', formatRupiah(laporan.totalMasuk)],
      ['Total Pengeluaran', formatRupiah(laporan.totalKeluar)],
      ['Selisih (Net)', formatRupiah(laporan.net)],
    ],
  });

  // Kategori breakdown
  doc.setFontSize(14);
  doc.text('Pengeluaran per Kategori', 14, (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15);

  (doc as unknown as { autoTable: (options: object) => void }).autoTable({
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20,
    head: [['Kategori', 'Jumlah']],
    body: laporan.kategoriData.map((k) => [k.nama, formatRupiah(k.jumlah)]),
  });

  doc.save(`${filename}.pdf`);
}

// Import functions
export interface ImportRow {
  tanggal: string;
  tipe: 'pemasukan' | 'pengeluaran' | 'transfer';
  jumlah: number;
  kategori_id?: string;
  dompet_id: string;
  catatan?: string;
}

export function parseCSV(csvContent: string): ImportRow[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: ImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length !== headers.length) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      row[header.toLowerCase()] = values[index];
    });

    // Validate and convert
    const tipe = row.tipe?.toLowerCase();
    if (!['pemasukan', 'pengeluaran', 'transfer'].includes(tipe)) continue;

    const jumlah = parseFloat(row.jumlah);
    if (isNaN(jumlah) || jumlah <= 0) continue;

    rows.push({
      tanggal: row.tanggal || new Date().toISOString(),
      tipe,
      jumlah,
      dompet_id: row.dompet || '',
      kategori_id: row.kategori || undefined,
      catatan: row.catatan || undefined,
    });
  }

  return rows;
}

export function importFromCSV(
  file: File,
  onSuccess: (data: ImportRow[]) => void,
  onError: (error: string) => void
): void {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const data = parseCSV(content);
      if (data.length === 0) {
        onError('File CSV kosong atau format tidak valid');
        return;
      }
      onSuccess(data);
    } catch (err) {
      onError('Gagal membaca file CSV');
    }
  };

  reader.onerror = () => {
    onError('Gagal membaca file');
  };

  reader.readAsText(file);
}
