'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileSpreadsheet, Loader2, Info } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { exportUserData, downloadJSON, convertToCSV, downloadCSV } from '@/lib/utils/gdprExport';
import toast from 'react-hot-toast';

export function DataExport() {
  const user = useAuthStore((state) => state.user);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = async () => {
    if (!user) {
      toast.error('Anda harus login terlebih dahulu');
      return;
    }

    setIsExporting(true);
    try {
      const data = await exportUserData(user.id);
      downloadJSON(data);
      toast.success('Data berhasil diekspor dalam format JSON');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!user) {
      toast.error('Anda harus login terlebih dahulu');
      return;
    }

    setIsExporting(true);
    try {
      const data = await exportUserData(user.id);
      
      // Export transaksi as CSV (most useful)
      if (data.transaksi.length > 0) {
        const csv = convertToCSV(data.transaksi);
        downloadCSV(csv, `aturla-transactions-${new Date().toISOString().split('T')[0]}.csv`);
        toast.success(`${data.transaksi.length} transaksi berhasil diekspor ke CSV`);
      } else {
        toast('Tidak ada transaksi untuk diekspor', { icon: <Info className="h-4 w-4 text-blue-500" /> });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Ekspor Data
        </CardTitle>
        <CardDescription>
          Unduh semua data Anda dalam format JSON atau CSV untuk backup atau analisis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            onClick={handleExportJSON}
            disabled={isExporting}
            className="justify-start gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileJson className="h-4 w-4 text-blue-500" />
            )}
            <div className="text-left">
              <p className="font-medium">Ekspor JSON</p>
              <p className="text-xs text-muted-foreground">Semua data lengkap</p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="justify-start gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-green-500" />
            )}
            <div className="text-left">
              <p className="font-medium">Ekspor CSV</p>
              <p className="text-xs text-muted-foreground">Hanya transaksi</p>
            </div>
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          <p className="font-medium mb-1">Catatan:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>JSON: Berisi semua data (profil, dompet, transaksi, dll)</li>
            <li>CSV: Hanya data transaksi untuk Excel/Google Sheets</li>
            <li>Data bersifat pribadi dan rahasia</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
