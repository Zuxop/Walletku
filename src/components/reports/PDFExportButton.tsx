'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { generateTransactionPDF, generateMonthlyReportPDF, downloadPDF } from '@/lib/utils/pdfExport';
import type { Transaksi, Dompet, Kategori } from '@/types/database';

interface PDFExportButtonProps {
  transaksi: Transaksi[];
  dompet: Dompet[];
  kategori: Kategori[];
}

export function PDFExportButton({ transaksi, dompet, kategori }: PDFExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
  const [month, setMonth] = useState<string>(new Date().getMonth() + 1 + '');
  const [year, setYear] = useState<string>(new Date().getFullYear() + '');

  const handleExport = async () => {
    setLoading(true);
    try {
      // Calculate summary
      const totalIncome = transaksi
        .filter(t => t.tipe === 'pemasukan')
        .reduce((sum, t) => sum + t.jumlah, 0);
      
      const totalExpense = transaksi
        .filter(t => t.tipe === 'pengeluaran')
        .reduce((sum, t) => sum + t.jumlah, 0);

      const period = reportType === 'monthly' 
        ? new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        : reportType === 'yearly'
        ? `Tahun ${year}`
        : 'Kustom';

      const blob = await generateMonthlyReportPDF(
        parseInt(month),
        parseInt(year),
        {
          title: reportType === 'monthly' ? 'Laporan Bulanan' : 'Laporan Transaksi',
          period,
          transaksi: transaksi.slice(0, 50), // Limit to 50 transactions
          dompet,
          kategori,
          summary: {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
          },
        }
      );

      const filename = `aturla-wallet-${reportType}-${month}-${year}.pdf`;
      downloadPDF(blob, filename);
      
      toast.success('PDF berhasil diunduh!');
      setOpen(false);
    } catch (error) {
      console.error('PDF Export error:', error);
      toast.error('Gagal membuat PDF. Pastikan jsPDF terinstall.');
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" />
          Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Laporan PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Jenis Laporan</label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Laporan Bulanan</SelectItem>
                <SelectItem value="yearly">Laporan Tahunan</SelectItem>
                <SelectItem value="custom">Laporan Kustom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bulan</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2000, i).toLocaleDateString('id-ID', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tahun</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
            <p>Laporan akan berisi:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Ringkasan transaksi</li>
              <li>Daftar pemasukan & pengeluaran</li>
              <li>Status dompet</li>
              <li>Total saldo</li>
            </ul>
          </div>

          <Button
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Membuat PDF...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
