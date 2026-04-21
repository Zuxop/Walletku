import type { Transaksi, Budget } from '@/types/database';

export interface FinancialInsight {
  type: 'warning' | 'success' | 'info' | 'tip';
  title: string;
  message: string;
  action?: string;
}

export function generateInsights(
  transaksi: Transaksi[],
  budget: Budget[],
  previousMonthTransaksi?: Transaksi[]
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  
  if (!transaksi || transaksi.length === 0) {
    return [{
      type: 'info',
      title: 'Selamat Datang!',
      message: 'Mulai catat transaksi pertama Anda untuk melihat insight keuangan.',
      action: '/transaksi'
    }];
  }

  // Calculate totals
  const totalPemasukan = transaksi
    .filter(t => t.tipe === 'pemasukan')
    .reduce((sum, t) => sum + t.jumlah, 0);
  
  const totalPengeluaran = transaksi
    .filter(t => t.tipe === 'pengeluaran')
    .reduce((sum, t) => sum + t.jumlah, 0);

  // Insight 1: Spending vs Income
  if (totalPengeluaran > totalPemasukan) {
    insights.push({
      type: 'warning',
      title: 'Pengeluaran Melebihi Pemasukan',
      message: `Anda menghabiskan ${formatCurrency(totalPengeluaran - totalPemasukan)} lebih banyak dari yang Anda hasilkan bulan ini.`,
      action: '/budget'
    });
  } else if (totalPemasukan > 0) {
    const savingsRate = ((totalPemasukan - totalPengeluaran) / totalPemasukan) * 100;
    if (savingsRate >= 20) {
      insights.push({
        type: 'success',
        title: 'Hebat! Tabungan Anda Baik',
        message: `Anda berhasil menabung ${savingsRate.toFixed(1)}% dari pemasukan Anda.`,
      });
    }
  }

  // Insight 2: Budget alerts
  budget?.forEach(b => {
    if (b.terpakai > b.jumlah) {
      insights.push({
        type: 'warning',
        title: `Budget ${b.kategori?.nama || 'Kategori'} Habis`,
        message: `Anda telah melebihi budget sebesar ${formatCurrency(b.terpakai - b.jumlah)}.`,
        action: '/budget'
      });
    } else if (b.terpakai > b.jumlah * 0.8) {
      insights.push({
        type: 'info',
        title: `Budget ${b.kategori?.nama || 'Kategori'} Hampir Habis`,
        message: `Anda telah menggunakan ${((b.terpakai / b.jumlah) * 100).toFixed(0)}% dari budget.`,
      });
    }
  });

  // Insight 3: Month over month comparison
  if (previousMonthTransaksi && previousMonthTransaksi.length > 0) {
    const prevPengeluaran = previousMonthTransaksi
      .filter(t => t.tipe === 'pengeluaran')
      .reduce((sum, t) => sum + t.jumlah, 0);
    
    const change = ((totalPengeluaran - prevPengeluaran) / prevPengeluaran) * 100;
    
    if (change > 20) {
      insights.push({
        type: 'warning',
        title: 'Pengeluaran Meningkat Signifikan',
        message: `Pengeluaran Anda naik ${change.toFixed(1)}% dibanding bulan lalu.`,
      });
    } else if (change < -10) {
      insights.push({
        type: 'success',
        title: 'Pengeluaran Berkurang',
        message: `Bagus! Pengeluaran Anda turun ${Math.abs(change).toFixed(1)}% dibanding bulan lalu.`,
      });
    }
  }

  // Insight 4: Top spending category
  const pengeluaranByKategori: Record<string, number> = {};
  transaksi
    .filter(t => t.tipe === 'pengeluaran')
    .forEach(t => {
      const key = t.kategori?.nama || 'Lainnya';
      pengeluaranByKategori[key] = (pengeluaranByKategori[key] || 0) + t.jumlah;
    });
  
  const topKategori = Object.entries(pengeluaranByKategori)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (topKategori && totalPengeluaran > 0) {
    const percentage = (topKategori[1] / totalPengeluaran) * 100;
    if (percentage > 40) {
      insights.push({
        type: 'tip',
        title: 'Pengeluaran Terbesar Anda',
        message: `${percentage.toFixed(0)}% pengeluaran Anda untuk ${topKategori[0]}. Pertimbangkan untuk mengatur budget.`,
        action: '/budget'
      });
    }
  }

  // Insight 5: Transaction frequency tip
  const uniqueDays = new Set(transaksi.map(t => t.tanggal.split('T')[0])).size;
  if (uniqueDays > 0 && transaksi.length / uniqueDays > 3) {
    insights.push({
      type: 'tip',
      title: 'Tips: Kurangi Transaksi Kecil',
      message: 'Anda melakukan banyak transaksi kecil. Pertimbangkan menggabungkan pembelian untuk mengurangi biaya admin.',
    });
  }

  return insights.slice(0, 5); // Max 5 insights
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

// AI Recommendation system
export interface Recommendation {
  id: string;
  type: 'saving' | 'budgeting' | 'investment' | 'debt';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialImpact: string;
}

export function generateRecommendations(
  totalIncome: number,
  totalExpense: number,
  savingsGoal: number,
  currentSavings: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Emergency fund recommendation
  const emergencyFundTarget = totalIncome * 6;
  if (currentSavings < emergencyFundTarget) {
    const monthlyNeeded = (emergencyFundTarget - currentSavings) / 12;
    recommendations.push({
      id: '1',
      type: 'saving',
      priority: 'high',
      title: 'Dana Darurat',
      description: `Target dana darurat Anda: ${formatCurrency(emergencyFundTarget)}. Simpan ${formatCurrency(monthlyNeeded)} per bulan untuk mencapai target dalam 1 tahun.`,
      potentialImpact: `Keamanan finansial dan ketenangan pikiran`
    });
  }

  // 50/30/20 rule recommendation
  const needs = totalIncome * 0.5;
  const wants = totalIncome * 0.3;
  const savings = totalIncome * 0.2;
  
  if (totalExpense > needs) {
    recommendations.push({
      id: '2',
      type: 'budgeting',
      priority: 'high',
      title: 'Atur Ulang Budget (Aturan 50/30/20)',
      description: `Kebutuhan Anda (${formatCurrency(totalExpense)}) melebihi 50% pemasukan. Kurangi pengeluaran atau cari penghasilan tambahan.`,
      potentialImpact: 'Keseimbangan keuangan yang lebih baik'
    });
  }

  // Investment recommendation
  if (currentSavings > emergencyFundTarget * 0.5) {
    const investableAmount = (currentSavings - emergencyFundTarget * 0.5) * 0.1;
    recommendations.push({
      id: '3',
      type: 'investment',
      priority: 'medium',
      title: 'Mulai Berinvestasi',
      description: `Anda memiliki tabungan lebih. Pertimbangkan investasi ${formatCurrency(investableAmount)} per bulan di instrumen seperti reksadana atau saham.`,
      potentialImpact: 'Pertumbuhan kekayaan jangka panjang'
    });
  }

  return recommendations;
}
