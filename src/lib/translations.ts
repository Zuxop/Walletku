// Simple translation system for ID/EN

export type Language = 'id' | 'en';

interface Translations {
  [key: string]: {
    id: string;
    en: string;
  };
}

export const translations: Translations = {
  // Navigation
  'nav.dashboard': {
    id: 'Dashboard',
    en: 'Dashboard',
  },
  'nav.transactions': {
    id: 'Transaksi',
    en: 'Transactions',
  },
  'nav.wallets': {
    id: 'Dompet',
    en: 'Wallets',
  },
  'nav.budget': {
    id: 'Budget',
    en: 'Budget',
  },
  'nav.goals': {
    id: 'Tujuan',
    en: 'Goals',
  },
  'nav.debts': {
    id: 'Hutang',
    en: 'Debts',
  },
  'nav.reports': {
    id: 'Laporan',
    en: 'Reports',
  },
  'nav.categories': {
    id: 'Kategori',
    en: 'Categories',
  },
  'nav.settings': {
    id: 'Pengaturan',
    en: 'Settings',
  },

  // Common actions
  'action.add': {
    id: 'Tambah',
    en: 'Add',
  },
  'action.edit': {
    id: 'Edit',
    en: 'Edit',
  },
  'action.delete': {
    id: 'Hapus',
    en: 'Delete',
  },
  'action.save': {
    id: 'Simpan',
    en: 'Save',
  },
  'action.cancel': {
    id: 'Batal',
    en: 'Cancel',
  },
  'action.close': {
    id: 'Tutup',
    en: 'Close',
  },
  'action.search': {
    id: 'Cari',
    en: 'Search',
  },
  'action.filter': {
    id: 'Filter',
    en: 'Filter',
  },
  'action.export': {
    id: 'Ekspor',
    en: 'Export',
  },
  'action.import': {
    id: 'Impor',
    en: 'Import',
  },

  // Common labels
  'label.total': {
    id: 'Total',
    en: 'Total',
  },
  'label.income': {
    id: 'Pemasukan',
    en: 'Income',
  },
  'label.expense': {
    id: 'Pengeluaran',
    en: 'Expense',
  },
  'label.balance': {
    id: 'Saldo',
    en: 'Balance',
  },
  'label.date': {
    id: 'Tanggal',
    en: 'Date',
  },
  'label.category': {
    id: 'Kategori',
    en: 'Category',
  },
  'label.wallet': {
    id: 'Dompet',
    en: 'Wallet',
  },
  'label.amount': {
    id: 'Jumlah',
    en: 'Amount',
  },
  'label.note': {
    id: 'Catatan',
    en: 'Note',
  },
  'label.status': {
    id: 'Status',
    en: 'Status',
  },

  // Dashboard
  'dashboard.summary': {
    id: 'Ringkasan',
    en: 'Summary',
  },
  'dashboard.netWorth': {
    id: 'Total Kekayaan',
    en: 'Net Worth',
  },
  'dashboard.thisMonth': {
    id: 'Bulan Ini',
    en: 'This Month',
  },
  'dashboard.recentTransactions': {
    id: 'Transaksi Terbaru',
    en: 'Recent Transactions',
  },
  'dashboard.viewAll': {
    id: 'Lihat Semua',
    en: 'View All',
  },
  'dashboard.noTransactions': {
    id: 'Belum ada transaksi',
    en: 'No transactions yet',
  },

  // Settings
  'settings.profile': {
    id: 'Profil',
    en: 'Profile',
  },
  'settings.language': {
    id: 'Bahasa',
    en: 'Language',
  },
  'settings.theme': {
    id: 'Tema',
    en: 'Theme',
  },
  'settings.notifications': {
    id: 'Notifikasi',
    en: 'Notifications',
  },
  'settings.security': {
    id: 'Keamanan',
    en: 'Security',
  },
  'settings.data': {
    id: 'Data',
    en: 'Data',
  },
  'settings.languageDescription': {
    id: 'Pilih bahasa yang Anda inginkan',
    en: 'Choose your preferred language',
  },
  'settings.indonesian': {
    id: 'Bahasa Indonesia',
    en: 'Indonesian',
  },
  'settings.english': {
    id: 'English',
    en: 'English',
  },

  // Messages
  'message.success': {
    id: 'Berhasil!',
    en: 'Success!',
  },
  'message.error': {
    id: 'Terjadi kesalahan',
    en: 'An error occurred',
  },
  'message.loading': {
    id: 'Memuat...',
    en: 'Loading...',
  },
  'message.empty': {
    id: 'Data tidak ditemukan',
    en: 'No data found',
  },
  'message.confirmDelete': {
    id: 'Apakah Anda yakin ingin menghapus?',
    en: 'Are you sure you want to delete?',
  },
};

export function t(key: string, lang: Language = 'id'): string {
  const translation = translations[key];
  if (!translation) return key;
  return translation[lang] || translation.id;
}
