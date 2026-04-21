'use client';

import { useState, useRef } from 'react';
import { Plus, Filter, Download, Search, Repeat, Pencil, Trash2, X, Check, Split } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTransaksi } from '@/hooks/useTransaksi';
import { useDompet } from '@/hooks/useDompet';
import { useKategori } from '@/hooks/useKategori';
import { formatRupiah } from '@/lib/utils/currency';
import { formatTanggal } from '@/lib/utils/date';
import { exportToCSV, exportToExcel, importFromCSV, ImportRow } from '@/lib/utils/export';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { TransaksiForm } from '@/components/transaksi/TransaksiForm';
import { RecurringList } from '@/components/transaksi/RecurringList';
import { SplitTransactionForm } from '@/components/transaksi/SplitTransactionForm';
import { useRecurring } from '@/hooks/useRecurring';
import type { Transaksi } from '@/types/database';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export default function TransaksiPage() {
  const [open, setOpen] = useState(false);
  const [editingTransaksi, setEditingTransaksi] = useState<Transaksi | null>(
    null
  );
  const [filters, setFilters] = useState({
    tipe: '',
    dompet_id: '',
    kategori_id: '',
    search: '',
  });

  const { transaksi, loading: isLoading, refetch: mutate } = useTransaksi();
  const { dompet } = useDompet();
  const { kategori } = useKategori();
  const [isImporting, setIsImporting] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [splittingTransaksi, setSplittingTransaksi] = useState<Transaksi | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { rules: recurringRules, refetch: refetchRecurring } = useRecurring();
  const [recurringOpen, setRecurringOpen] = useState(false);
  const supabase = createClient();

  const handleExportCSV = () => {
    if (filteredTransaksi) {
      exportToCSV(filteredTransaksi, `transaksi-${new Date().toISOString().split('T')[0]}`);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    importFromCSV(
      file,
      async (data) => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) {
            toast.error('Anda harus login terlebih dahulu');
            return;
          }

          // Import transactions
          for (const row of data) {
            await supabase.from('transaksi').insert({
              ...row,
              user_id: userData.user.id,
            });
          }

          toast.success(`${data.length} transaksi berhasil diimport!`);
          mutate();
        } catch (error) {
          toast.error('Gagal mengimport transaksi');
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      },
      (error) => {
        toast.error(error);
        setIsImporting(false);
      }
    );
  };

  // Filter by search
  const filteredTransaksi = transaksi?.filter((t) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      t.catatan?.toLowerCase().includes(search) ||
      formatRupiah(t.jumlah).toLowerCase().includes(search)
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;

    try {
      const { error } = await supabase.from('transaksi').delete().eq('id', id);
      if (error) throw error;
      toast.success('Transaksi berhasil dihapus');
      mutate();
    } catch {
      toast.error('Gagal menghapus transaksi');
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transaksi')
        .update({ is_pending: false })
        .eq('id', id);
      if (error) throw error;
      toast.success('Transaksi dikonfirmasi');
      mutate();
    } catch {
      toast.error('Gagal mengkonfirmasi transaksi');
    }
  };

  // Calculate totals
  const totalPemasukan =
    filteredTransaksi
      ?.filter((t) => t.tipe === 'pemasukan' && !t.is_pending)
      .reduce((acc, t) => acc + t.jumlah, 0) || 0;

  const totalPengeluaran =
    filteredTransaksi
      ?.filter((t) => t.tipe === 'pengeluaran' && !t.is_pending)
      .reduce((acc, t) => acc + t.jumlah, 0) || 0;

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader
        title="Transaksi"
        description="Kelola semua transaksi keuanganmu"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-green-600 font-medium">Total Pemasukan</p>
            <p className="text-2xl font-bold text-green-700">
              {formatRupiah(totalPemasukan)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-sm text-red-600 font-medium">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-red-700">
              {formatRupiah(totalPengeluaran)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="p-4">
            <p className="text-sm text-indigo-600 font-medium">Selisih</p>
            <p
              className={`text-2xl font-bold ${
                totalPemasukan - totalPengeluaran >= 0
                  ? 'text-indigo-700'
                  : 'text-red-700'
              }`}
            >
              {formatRupiah(totalPemasukan - totalPengeluaran)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari transaksi..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-10"
              />
            </div>
            <Select
              value={filters.tipe}
              onValueChange={(v) => setFilters({ ...filters, tipe: v || '' })}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Tipe</SelectItem>
                <SelectItem value="pemasukan">Pemasukan</SelectItem>
                <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.dompet_id}
              onValueChange={(v) => setFilters({ ...filters, dompet_id: v || '' })}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Semua Dompet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Dompet</SelectItem>
                {dompet?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.kategori_id}
              onValueChange={(v) => setFilters({ ...filters, kategori_id: v || '' })}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Kategori</SelectItem>
                {kategori?.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Add Transaction Button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {filteredTransaksi?.length || 0} transaksi ditemukan
        </p>
        <div className="flex gap-2">
          <Dialog open={recurringOpen} onOpenChange={setRecurringOpen}>
            <DialogTrigger>
              <Button variant="outline">
                <Repeat className="mr-2 h-4 w-4" />
                Transaksi Berkala ({recurringRules.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Kelola Transaksi Berkala</DialogTitle>
              </DialogHeader>
              <RecurringList
                rules={recurringRules}
                kategori={kategori}
                dompet={dompet}
                onSuccess={() => {
                  refetchRecurring();
                }}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Transaksi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaksi ? 'Edit Transaksi' : 'Tambah Transaksi'}
                </DialogTitle>
              </DialogHeader>
              <TransaksiForm
                transaksi={editingTransaksi}
                onSuccess={() => {
                  setOpen(false);
                  setEditingTransaksi(null);
                  mutate();
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Split Transaction Dialog */}
          <Dialog open={splitOpen} onOpenChange={setSplitOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Pecah Transaksi</DialogTitle>
              </DialogHeader>
              {splittingTransaksi && (
                <SplitTransactionForm
                  transaksi={splittingTransaksi}
                  kategori={kategori || []}
                  onSuccess={() => {
                    setSplitOpen(false);
                    setSplittingTransaksi(null);
                    mutate();
                  }}
                  onCancel={() => {
                    setSplitOpen(false);
                    setSplittingTransaksi(null);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransaksi && filteredTransaksi.length > 0 ? (
        <div className="space-y-3">
          {filteredTransaksi.map((t) => (
            <TransaksiCard
              key={t.id}
              transaksi={t}
              dompet={dompet?.find((d) => d.id === t.dompet_id)}
              kategori={kategori?.find((k) => k.id === t.kategori_id)}
              onEdit={() => {
                setEditingTransaksi(t);
                setOpen(true);
              }}
              onDelete={() => handleDelete(t.id)}
              onConfirm={() => handleConfirm(t.id)}
              onSplit={() => {
                setSplittingTransaksi(t);
                setSplitOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum ada transaksi"
          description="Tambahkan transaksi pertama Anda"
          icon={ArrowLeftRight}
        />
      )}
    </div>
  );
}

// Transaction Card Component
function TransaksiCard({
  transaksi,
  dompet,
  kategori,
  onEdit,
  onDelete,
  onConfirm,
  onSplit,
}: {
  transaksi: Transaksi;
  dompet?: { nama: string; warna: string; ikon: string };
  kategori?: { nama: string; ikon: string; tipe: string };
  onEdit: () => void;
  onDelete: () => void;
  onConfirm: () => void;
  onSplit?: () => void;
}) {
  const isPemasukan = transaksi.tipe === 'pemasukan';
  const isPengeluaran = transaksi.tipe === 'pengeluaran';
  const isTransfer = transaksi.tipe === 'transfer';

  const Icon = isPemasukan
    ? ArrowUpRight
    : isPengeluaran
    ? ArrowDownRight
    : ArrowLeftRight;

  const colorClass = isPemasukan
    ? 'text-green-600 bg-green-50'
    : isPengeluaran
    ? 'text-red-600 bg-red-50'
    : 'text-blue-600 bg-blue-50';

  return (
    <Card className={`group ${transaksi.is_pending ? 'opacity-75' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-gray-900">
                {kategori?.nama || 'Tanpa Kategori'}
              </p>
              {transaksi.is_pending && (
                <Badge variant="outline" className="text-yellow-600">
                  Pending
                </Badge>
              )}
              {transaksi.is_recurring && (
                <Badge variant="outline" className="text-blue-600">
                  Berkala
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {dompet?.nama} • {formatTanggal(transaksi.tanggal)}
            </p>
            {transaksi.catatan && (
              <p className="text-sm text-gray-600 mt-1 truncate">
                {transaksi.catatan}
              </p>
            )}
          </div>

          <div className="text-right">
            <p
              className={`font-bold ${
                isPemasukan
                  ? 'text-green-600'
                  : isPengeluaran
                  ? 'text-red-600'
                  : 'text-blue-600'
              }`}
            >
              {isPemasukan ? '+' : isPengeluaran ? '-' : ''}
              {formatRupiah(transaksi.jumlah)}
            </p>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {transaksi.is_pending && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600"
                onClick={onConfirm}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {!transaksi.is_split && transaksi.tipe !== 'transfer' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600"
                onClick={onSplit}
              >
                <Split className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ...
