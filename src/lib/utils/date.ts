import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatTanggal(tanggal: string | Date): string {
  const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal;
  return format(date, 'dd MMMM yyyy', { locale: id });
}

export function formatTanggalSingkat(tanggal: string | Date): string {
  const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal;
  return format(date, 'dd MMM yyyy', { locale: id });
}

export function formatTanggalWaktu(tanggal: string | Date): string {
  const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal;
  return format(date, 'dd MMMM yyyy HH:mm', { locale: id });
}

export function formatRelatif(tanggal: string | Date): string {
  const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal;
  return formatDistanceToNow(date, { locale: id, addSuffix: true });
}

export function formatTanggalGroup(tanggal: string | Date): string {
  const date = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal;
  
  if (isToday(date)) {
    return 'Hari ini';
  }
  if (isYesterday(date)) {
    return 'Kemarin';
  }
  return format(date, 'EEEE, dd MMMM yyyy', { locale: id });
}

export function getNamaBulan(bulan: number): string {
  const bulanNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return bulanNames[bulan - 1] || '';
}

export function getBulanIni(): number {
  return new Date().getMonth() + 1;
}

export function getTahunIni(): number {
  return new Date().getFullYear();
}

export function getAwalBulan(bulan?: number, tahun?: number): Date {
  const now = new Date();
  return new Date(tahun || now.getFullYear(), (bulan || now.getMonth() + 1) - 1, 1);
}

export function getAkhirBulan(bulan?: number, tahun?: number): Date {
  const now = new Date();
  const y = tahun || now.getFullYear();
  const m = (bulan || now.getMonth() + 1);
  return new Date(y, m, 0, 23, 59, 59);
}
