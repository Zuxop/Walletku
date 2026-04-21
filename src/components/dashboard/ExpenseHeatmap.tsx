'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface DayData {
  date: string;
  expense: number;
  income: number;
}

export function ExpenseHeatmap() {
  const user = useAuthStore((state) => state.user);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayData, setDayData] = useState<Record<string, DayData>>({});
  const [loading, setLoading] = useState(true);
  const [maxExpense, setMaxExpense] = useState(0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('transaksi')
        .select('tanggal, tipe, jumlah')
        .eq('user_id', user.id)
        .gte('tanggal', firstDay)
        .lte('tanggal', lastDay);

      if (error) {
        console.error('Error fetching heatmap data:', error);
        setLoading(false);
        return;
      }

      // Aggregate data by date
      const aggregated: Record<string, DayData> = {};
      let maxExp = 0;

      data?.forEach((t) => {
        const date = t.tanggal;
        if (!aggregated[date]) {
          aggregated[date] = { date, expense: 0, income: 0 };
        }
        if (t.tipe === 'pengeluaran') {
          aggregated[date].expense += t.jumlah;
          if (aggregated[date].expense > maxExp) {
            maxExp = aggregated[date].expense;
          }
        } else if (t.tipe === 'pemasukan') {
          aggregated[date].income += t.jumlah;
        }
      });

      setDayData(aggregated);
      setMaxExpense(maxExp);
      setLoading(false);
    };

    fetchData();
  }, [user, year, month]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const getDaysInMonth = () => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    return new Date(year, month, 1).getDay();
  };

  const getIntensityLevel = (expense: number): number => {
    if (maxExpense === 0 || expense === 0) return 0;
    const ratio = expense / maxExpense;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  const getHeatmapColor = (level: number): string => {
    switch (level) {
      case 0: return 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100';
      case 1: return 'bg-green-200 dark:bg-green-900/40 hover:bg-green-300';
      case 2: return 'bg-yellow-200 dark:bg-yellow-900/40 hover:bg-yellow-300';
      case 3: return 'bg-orange-200 dark:bg-orange-900/40 hover:bg-orange-300';
      case 4: return 'bg-red-300 dark:bg-red-900/50 hover:bg-red-400';
      default: return 'bg-gray-50 dark:bg-gray-900';
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            Heatmap Pengeluaran
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {monthNames[month]} {year}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse text-sm text-muted-foreground">Memuat data...</div>
          </div>
        ) : (
          <>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {days.map((day) => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const data = dayData[dateStr];
                const expense = data?.expense || 0;
                const income = data?.income || 0;
                const intensity = getIntensityLevel(expense);

                return (
                  <div
                    key={day}
                    className={`
                      aspect-square rounded-md flex flex-col items-center justify-center
                      cursor-pointer transition-all relative
                      ${getHeatmapColor(intensity)}
                    `}
                    title={expense > 0 || income > 0 
                      ? `Tanggal ${day}: Pengeluaran ${formatRupiah(expense)}, Pemasukan ${formatRupiah(income)}` 
                      : `Tanggal ${day}: Tidak ada transaksi`
                    }
                  >
                    <span className={`text-sm font-medium ${
                      expense > 0 || income > 0 ? 'text-gray-900 dark:text-gray-100' : 'text-muted-foreground'
                    }`}>
                      {day}
                    </span>
                    {expense > 0 && (
                      <span className="text-[8px] text-gray-600 dark:text-gray-400">
                        {formatRupiah(expense).replace('Rp', '').replace('.', '').split(',')[0]}k
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">Pengeluaran:</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-50 dark:bg-gray-900 border" />
                  <span>0</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900/40" />
                  <span>Rendah</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-200 dark:bg-yellow-900/40" />
                  <span>Sedang</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-200 dark:bg-orange-900/40" />
                  <span>Tinggi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-300 dark:bg-red-900/50" />
                  <span>Sangat Tinggi</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
