'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, FileText, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useLaporan } from '@/hooks/useLaporan';
import { formatRupiah } from '@/lib/utils/currency';
import { formatTanggal } from '@/lib/utils/date';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

export default function LaporanPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const { data, loading } = useLaporan(currentMonth, currentYear);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data || data.jumlahTransaksi === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
          <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
            <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {monthNames[currentMonth - 1]} {currentYear}
            </span>
            <Button variant="ghost" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <EmptyState
          icon={FileText}
          title="Belum ada data"
          description="Tambahkan transaksi untuk melihat laporan"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
        <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>
          <Button variant="ghost" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-green-600" />
              Pemasukan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatRupiah(data.totalMasuk)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
              Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatRupiah(data.totalKeluar)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Selisih (Net)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${data.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatRupiah(data.net)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-indigo-600" />
              Jumlah Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.jumlahTransaksi}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pengeluaran">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pengeluaran" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Pengeluaran per Kategori
          </TabsTrigger>
          <TabsTrigger value="pemasukan" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Pemasukan per Kategori
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pengeluaran" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengeluaran per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {data.pengeluaranPerKategori.length > 0 ? (
                <div className="space-y-4">
                  {data.pengeluaranPerKategori.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.nama}</span>
                        <span className="text-gray-600">
                          {formatRupiah(item.jumlah)} ({item.persentase}%)
                        </span>
                      </div>
                      <Progress value={item.persentase} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Tidak ada pengeluaran</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pemasukan" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pemasukan per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {data.pemasukanPerKategori.length > 0 ? (
                <div className="space-y-4">
                  {data.pemasukanPerKategori.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.nama}</span>
                        <span className="text-gray-600">
                          {formatRupiah(item.jumlah)} ({item.persentase}%)
                        </span>
                      </div>
                      <Progress value={item.persentase} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Tidak ada pemasukan</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Harian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Tanggal</th>
                  <th className="text-right py-2 text-green-600">Pemasukan</th>
                  <th className="text-right py-2 text-red-600">Pengeluaran</th>
                  <th className="text-right py-2">Selisih</th>
                </tr>
              </thead>
              <tbody>
                {data.transaksiPerHari.slice().reverse().map((hari, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2">{formatTanggal(hari.tanggal)}</td>
                    <td className="text-right py-2 text-green-600">
                      {hari.masuk > 0 ? formatRupiah(hari.masuk) : '-'}
                    </td>
                    <td className="text-right py-2 text-red-600">
                      {hari.keluar > 0 ? formatRupiah(hari.keluar) : '-'}
                    </td>
                    <td className={`text-right py-2 font-medium ${
                      hari.masuk - hari.keluar >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatRupiah(hari.masuk - hari.keluar)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
