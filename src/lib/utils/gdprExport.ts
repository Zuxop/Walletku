import { supabase } from '@/lib/supabase/client';
import type {
  Profile,
  Dompet,
  Kategori,
  Transaksi,
  Budget,
  TujuanKeuangan,
  KontribusiTujuan,
  HutangPiutang,
  CicilanHutang,
  RecurringRule,
  Tag,
} from '@/types/database';

export interface UserDataExport {
  export_metadata: {
    user_id: string;
    exported_at: string;
    version: string;
    format: 'JSON';
  };
  profile: Profile | null;
  dompet: Dompet[];
  kategori: Kategori[];
  transaksi: Transaksi[];
  budgets: Budget[];
  tujuan_keuangan: TujuanKeuangan[];
  kontribusi_tujuan: KontribusiTujuan[];
  hutang_piutang: HutangPiutang[];
  cicilan_hutang: CicilanHutang[];
  recurring_rules: RecurringRule[];
  tags: Tag[];
}

export async function exportUserData(userId: string): Promise<UserDataExport> {
  // Fetch all user data from Supabase
  const [
    { data: profile },
    { data: dompet },
    { data: kategori },
    { data: transaksi },
    { data: budgets },
    { data: tujuan_keuangan },
    { data: kontribusi_tujuan },
    { data: hutang_piutang },
    { data: recurring_rules },
    { data: tags },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('dompet').select('*').eq('user_id', userId),
    supabase.from('kategori').select('*').eq('user_id', userId),
    supabase.from('transaksi').select('*').eq('user_id', userId),
    supabase.from('budgets').select('*').eq('user_id', userId),
    supabase.from('tujuan_keuangan').select('*').eq('user_id', userId),
    supabase.from('kontribusi_tujuan').select('*').eq('user_id', userId),
    supabase.from('hutang_piutang').select('*').eq('user_id', userId),
    supabase.from('recurring_rules').select('*').eq('user_id', userId),
    supabase.from('tags').select('*').eq('user_id', userId),
  ]);

  // Fetch cicilan_hutang separately (needs hutang_ids)
  const hutangIds = hutang_piutang?.map((h) => h.id) || [];
  let cicilan_hutang: CicilanHutang[] = [];
  
  if (hutangIds.length > 0) {
    const { data: cicilan } = await supabase
      .from('cicilan_hutang')
      .select('*')
      .in('hutang_id', hutangIds);
    cicilan_hutang = cicilan || [];
  }

  const exportData: UserDataExport = {
    export_metadata: {
      user_id: userId,
      exported_at: new Date().toISOString(),
      version: '1.0',
      format: 'JSON',
    },
    profile: profile || null,
    dompet: dompet || [],
    kategori: kategori || [],
    transaksi: transaksi || [],
    budgets: budgets || [],
    tujuan_keuangan: tujuan_keuangan || [],
    kontribusi_tujuan: kontribusi_tujuan || [],
    hutang_piutang: hutang_piutang || [],
    cicilan_hutang,
    recurring_rules: recurring_rules || [],
    tags: tags || [],
  };

  return exportData;
}

export function downloadJSON(data: UserDataExport, filename?: string): void {
  const defaultFilename = `aturla-wallet-export-${data.export_metadata.user_id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function convertToCSV(data: unknown[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0] as Record<string, unknown>);
  const rows = data.map((item) =>
    headers.map((header) => {
      const value = (item as Record<string, unknown>)[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    })
  );
  
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
