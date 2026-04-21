'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRupiah } from '@/lib/utils/currency';
import type { Transaksi } from '@/types/database';

interface CalendarViewProps {
  transaksi: Transaksi[];
  onSelectDate?: (date: string) => void;
}

export function CalendarView({ transaksi, onSelectDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Previous month days to show
  const prevMonthDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  // Group transactions by date
  const transactionsByDate: Record<string, { pemasukan: number; pengeluaran: number; count: number }> = {};
  
  transaksi?.forEach((t) => {
    const date = t.tanggal.split('T')[0];
    if (!transactionsByDate[date]) {
      transactionsByDate[date] = { pemasukan: 0, pengeluaran: 0, count: 0 };
    }
    if (t.tipe === 'pemasukan') {
      transactionsByDate[date].pemasukan += t.jumlah;
    } else if (t.tipe === 'pengeluaran') {
      transactionsByDate[date].pengeluaran += t.jumlah;
    }
    transactionsByDate[date].count++;
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    onSelectDate?.(dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const [y, m, d] = selectedDate.split('-').map(Number);
    return d === day && m === month + 1 && y === year;
  };

  // Generate calendar days
  const days: JSX.Element[] = [];
  
  // Previous month padding
  for (let i = 0; i < prevMonthDays; i++) {
    days.push(
      <div key={`prev-${i}`} className="h-20 border border-gray-100 bg-gray-50/50" />
    );
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = transactionsByDate[dateStr];
    const hasTransactions = dayData && dayData.count > 0;

    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={`h-20 border border-gray-100 p-1 text-left transition-all hover:bg-gray-50 ${
          isToday(day) ? 'bg-indigo-50 border-indigo-200' : ''
        } ${isSelected(day) ? 'ring-2 ring-indigo-500' : ''}`}
      >
        <div className="flex flex-col h-full">
          <span className={`text-sm font-medium ${isToday(day) ? 'text-indigo-600' : 'text-gray-700'}`}>
            {day}
          </span>
          {hasTransactions && (
            <div className="mt-auto space-y-0.5">
              {dayData.pemasukan > 0 && (
                <div className="flex items-center gap-0.5 text-xs text-green-600">
                  <ArrowUpCircle className="h-3 w-3" />
                  <span className="truncate">{formatRupiah(dayData.pemasukan)}</span>
                </div>
              )}
              {dayData.pengeluaran > 0 && (
                <div className="flex items-center gap-0.5 text-xs text-red-600">
                  <ArrowDownCircle className="h-3 w-3" />
                  <span className="truncate">{formatRupiah(dayData.pengeluaran)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Kalender Transaksi</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {monthNames[month]} {year}
          </span>
          <Button variant="ghost" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-0 mb-1">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0">
          {days}
        </div>

        {/* Selected date transactions */}
        {selectedDate && transactionsByDate[selectedDate] && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">
              Transaksi {selectedDate}
            </h4>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <ArrowUpCircle className="h-4 w-4" />
                Pemasukan: {formatRupiah(transactionsByDate[selectedDate].pemasukan)}
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <ArrowDownCircle className="h-4 w-4" />
                Pengeluaran: {formatRupiah(transactionsByDate[selectedDate].pengeluaran)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
