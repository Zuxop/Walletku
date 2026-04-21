// PDF Export using jsPDF
// Note: User needs to run: npm install jspdf

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Transaksi, Dompet, Kategori, Budget } from '@/types/database';

interface ReportData {
  title: string;
  period: string;
  transaksi: Transaksi[];
  dompet: Dompet[];
  kategori: Kategori[];
  budgets?: Budget[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

export async function generateTransactionPDF(data: ReportData): Promise<Blob> {
  const doc = new jsPDF();
  const { title, period, transaksi, dompet, summary } = data;

  // Title
  doc.setFontSize(20);
  doc.text('Aturla Wallet', 14, 20);
  
  doc.setFontSize(16);
  doc.text(title, 14, 30);
  
  doc.setFontSize(12);
  doc.text(`Periode: ${period}`, 14, 40);
  
  // Summary Section
  doc.setFontSize(14);
  doc.text('Ringkasan', 14, 55);
  
  doc.setFontSize(11);
  doc.text(`Total Pemasukan: ${formatRupiah(summary.totalIncome)}`, 14, 65);
  doc.text(`Total Pengeluaran: ${formatRupiah(summary.totalExpense)}`, 14, 72);
  doc.text(`Saldo: ${formatRupiah(summary.balance)}`, 14, 79);

  // Transactions Table
  const tableData = transaksi.map(t => [
    formatDate(t.tanggal),
    t.catatan || '-',
    t.kategori?.nama || '-',
    t.dompet?.nama || '-',
    t.tipe === 'pemasukan' ? formatRupiah(t.jumlah) : '',
    t.tipe === 'pengeluaran' ? formatRupiah(t.jumlah) : '',
  ]);

  (doc as any).autoTable({
    head: [['Tanggal', 'Catatan', 'Kategori', 'Dompet', 'Pemasukan', 'Pengeluaran']],
    body: tableData,
    startY: 90,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [99, 102, 241] }, // Indigo color
  });

  // Wallet Summary
  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  doc.setFontSize(14);
  doc.text('Ringkasan Dompet', 14, finalY + 15);

  const walletData = dompet.map(d => [
    d.nama,
    d.tipe,
    formatRupiah(d.saldo),
  ]);

  (doc as any).autoTable({
    head: [['Nama', 'Tipe', 'Saldo']],
    body: walletData,
    startY: finalY + 20,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [99, 102, 241] },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Dicetak dari Aturla Wallet - ${new Date().toLocaleDateString('id-ID')}`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }

  return doc.output('blob');
}

export async function generateMonthlyReportPDF(
  month: number,
  year: number,
  data: ReportData
): Promise<Blob> {
  const monthName = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const title = `Laporan Bulanan - ${monthName}`;
  
  return generateTransactionPDF({
    ...data,
    title,
    period: monthName,
  });
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Export for different report types
export const PDF_TEMPLATES = {
  monthly: 'Laporan Bulanan',
  yearly: 'Laporan Tahunan',
  custom: 'Laporan Kustom',
  wallet: 'Ringkasan Dompet',
  category: 'Analisis Kategori',
} as const;
