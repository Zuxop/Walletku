import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { BudgetOverview } from '@/components/dashboard/BudgetOverview';
import { QuickAdd } from '@/components/dashboard/QuickAdd';
import { CalendarView } from '@/components/dashboard/CalendarView';
import { InsightsCard } from '@/components/dashboard/InsightsCard';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date();
  const awalBulan = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const akhirBulan = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Fetch data
  const { data: transaksi } = await supabase
    .from('transaksi')
    .select(`
      *,
      kategori(*),
      dompet(*)
    `)
    .gte('tanggal', awalBulan)
    .lte('tanggal', akhirBulan)
    .order('tanggal', { ascending: false });

  const { data: dompet } = await supabase
    .from('saldo_dompet')
    .select('*');

  const { data: budget } = await supabase
    .from('budget')
    .select(`
      *,
      kategori(*)
    `)
    .eq('bulan', now.getMonth() + 1)
    .eq('tahun', now.getFullYear())
    .limit(3);

  const totalSaldo = (dompet || []).reduce((acc, d) => acc + (d.saldo_sekarang || 0), 0);
  const pemasukan = (transaksi || [])
    .filter(t => t.tipe === 'pemasukan')
    .reduce((acc, t) => acc + t.jumlah, 0);
  const pengeluaran = (transaksi || [])
    .filter(t => t.tipe === 'pengeluaran')
    .reduce((acc, t) => acc + t.jumlah, 0);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Beranda" 
        description="Ringkasan keuangan bulan ini"
      />

      <SummaryCards
        totalSaldo={totalSaldo}
        pemasukanBulanIni={pemasukan}
        pengeluaranBulanIni={pengeluaran}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InsightsCard 
            transaksi={transaksi || []} 
            budget={budget || []}
          />
          <RecentTransactions transaksi={transaksi?.slice(0, 5) || []} />
          <CalendarView transaksi={transaksi || []} />
        </div>
        <div className="space-y-6">
          <BudgetOverview budget={budget || []} transaksi={transaksi || []} />
          <QuickAdd />
        </div>
      </div>
    </div>
  );
}
