export function formatRupiah(angka: number, hideValues = false): string {
  if (hideValues) {
    return 'Rp •••••••';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
}

export function parseRupiah(value: string): number {
  const cleanValue = value.replace(/[^0-9]/g, '');
  return parseInt(cleanValue, 10) || 0;
}

export function formatNumber(angka: number): string {
  return new Intl.NumberFormat('id-ID').format(angka);
}

export function formatCompactNumber(angka: number): string {
  return new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(angka);
}
