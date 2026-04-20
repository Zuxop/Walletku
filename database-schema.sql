-- Aturla Wallet Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE tipe_kategori AS ENUM ('pemasukan', 'pengeluaran', 'transfer');
CREATE TYPE tipe_dompet AS ENUM ('tunai', 'bank', 'ewallet', 'investasi', 'lainnya');
CREATE TYPE tipe_transaksi AS ENUM ('pemasukan', 'pengeluaran', 'transfer');
CREATE TYPE frekuensi_recurring AS ENUM ('harian', 'mingguan', 'bulanan', 'tahunan');
CREATE TYPE periode_budget AS ENUM ('bulanan', 'tahunan', 'custom');
CREATE TYPE tipe_hutang_piutang AS ENUM ('hutang', 'piutang');

-- ============================================
-- PROFILES (User Profiles)
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(100),
    avatar_url TEXT,
    mata_uang VARCHAR(3) DEFAULT 'IDR',
    bahasa VARCHAR(10) DEFAULT 'id',
    tema VARCHAR(20) DEFAULT 'light',
    pin_hash VARCHAR(255),
    notif_harian BOOLEAN DEFAULT true,
    notif_budget BOOLEAN DEFAULT true,
    notif_hutang BOOLEAN DEFAULT true,
    privacy_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- KATEGORI (Categories)
-- ============================================

CREATE TABLE kategori (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nama VARCHAR(50) NOT NULL,
    tipe tipe_kategori NOT NULL,
    ikon VARCHAR(50) DEFAULT 'circle',
    warna VARCHAR(7) DEFAULT '#6366f1',
    parent_id UUID REFERENCES kategori(id),
    urutan INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_kategori_updated_at 
    BEFORE UPDATE ON kategori 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE kategori ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON kategori
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON kategori
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON kategori
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON kategori
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- DOMPET (Wallets)
-- ============================================

CREATE TABLE dompet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nama VARCHAR(50) NOT NULL,
    tipe tipe_dompet NOT NULL,
    saldo_awal NUMERIC(15,2) DEFAULT 0,
    mata_uang VARCHAR(3) DEFAULT 'IDR',
    warna VARCHAR(7) DEFAULT '#6366f1',
    ikon VARCHAR(50) DEFAULT 'wallet',
    urutan INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    is_shared BOOLEAN DEFAULT false,
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_dompet_updated_at 
    BEFORE UPDATE ON dompet 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE dompet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets" ON dompet
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets" ON dompet
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets" ON dompet
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallets" ON dompet
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TRANSAKSI (Transactions)
-- ============================================

CREATE TABLE transaksi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipe tipe_transaksi NOT NULL,
    jumlah NUMERIC(15,2) NOT NULL CHECK (jumlah > 0),
    kategori_id UUID REFERENCES kategori(id),
    dompet_id UUID REFERENCES dompet(id),
    dompet_tujuan_id UUID REFERENCES dompet(id),
    tanggal TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    catatan TEXT,
    lampiran JSONB,
    is_recurring BOOLEAN DEFAULT false,
    recurring_rule_id UUID,
    is_pending BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_transaksi_updated_at 
    BEFORE UPDATE ON transaksi 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transaksi
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transaksi
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transaksi
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transaksi
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SALDO_DOMPET (Wallet Balance View)
-- ============================================

CREATE OR REPLACE VIEW saldo_dompet AS
SELECT 
    d.id,
    d.user_id,
    d.nama,
    d.saldo_awal,
    COALESCE(SUM(CASE 
        WHEN t.tipe = 'pemasukan' AND NOT t.is_pending THEN t.jumlah 
        WHEN t.tipe = 'pengeluaran' AND NOT t.is_pending THEN -t.jumlah 
        WHEN t.tipe = 'transfer' AND t.dompet_id = d.id AND NOT t.is_pending THEN -t.jumlah
        WHEN t.tipe = 'transfer' AND t.dompet_tujuan_id = d.id AND NOT t.is_pending THEN t.jumlah
        ELSE 0 
    END), 0) + d.saldo_awal as saldo_sekarang
FROM dompet d
LEFT JOIN transaksi t ON (t.dompet_id = d.id OR t.dompet_tujuan_id = d.id)
WHERE d.is_archived = false
GROUP BY d.id, d.user_id, d.nama, d.saldo_awal;

-- ============================================
-- RECURRING_RULES
-- ============================================

CREATE TABLE recurring_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipe tipe_transaksi NOT NULL,
    jumlah NUMERIC(15,2) NOT NULL CHECK (jumlah > 0),
    kategori_id UUID REFERENCES kategori(id),
    dompet_id UUID REFERENCES dompet(id),
    dompet_tujuan_id UUID REFERENCES dompet(id),
    frekuensi frekuensi_recurring NOT NULL,
    hari_ke INTEGER CHECK (hari_ke >= 1 AND hari_ke <= 31),
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE,
    catatan TEXT,
    is_active BOOLEAN DEFAULT true,
    last_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_recurring_rules_updated_at 
    BEFORE UPDATE ON recurring_rules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE recurring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring rules" ON recurring_rules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring rules" ON recurring_rules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring rules" ON recurring_rules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring rules" ON recurring_rules
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- BUDGETS
-- ============================================

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kategori_id UUID NOT NULL REFERENCES kategori(id),
    jumlah NUMERIC(15,2) NOT NULL CHECK (jumlah > 0),
    periode periode_budget DEFAULT 'bulanan',
    bulan INTEGER CHECK (bulan >= 1 AND bulan <= 12),
    tahun INTEGER NOT NULL,
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    carry_over BOOLEAN DEFAULT false,
    notif_persen INTEGER DEFAULT 80 CHECK (notif_persen >= 50 AND notif_persen <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_budgets_updated_at 
    BEFORE UPDATE ON budgets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets" ON budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets" ON budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON budgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON budgets
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TUJUAN_KEUANGAN (Financial Goals)
-- ============================================

CREATE TABLE tujuan_keuangan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nama VARCHAR(50) NOT NULL,
    target_jumlah NUMERIC(15,2) NOT NULL CHECK (target_jumlah > 0),
    jumlah_terkumpul NUMERIC(15,2) DEFAULT 0,
    deadline DATE,
    ikon VARCHAR(50) DEFAULT 'target',
    warna VARCHAR(7) DEFAULT '#6366f1',
    catatan TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_tujuan_keuangan_updated_at 
    BEFORE UPDATE ON tujuan_keuangan 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tujuan_keuangan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON tujuan_keuangan
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON tujuan_keuangan
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON tujuan_keuangan
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON tujuan_keuangan
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- HUTANG_PIUTANG (Debts/Receivables)
-- ============================================

CREATE TABLE hutang_piutang (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipe tipe_hutang_piutang NOT NULL,
    nama_kontak VARCHAR(100) NOT NULL,
    jumlah_total NUMERIC(15,2) NOT NULL CHECK (jumlah_total > 0),
    bunga_persen NUMERIC(5,2) DEFAULT 0,
    jatuh_tempo DATE,
    catatan TEXT,
    is_lunas BOOLEAN DEFAULT false,
    tanggal_lunas TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_hutang_piutang_updated_at 
    BEFORE UPDATE ON hutang_piutang 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE hutang_piutang ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own debts" ON hutang_piutang
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debts" ON hutang_piutang
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts" ON hutang_piutang
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts" ON hutang_piutang
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PEMBAYARAN_HUTANG (Debt Payments)
-- ============================================

CREATE TABLE pembayaran_hutang (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hutang_piutang_id UUID NOT NULL REFERENCES hutang_piutang(id) ON DELETE CASCADE,
    jumlah NUMERIC(15,2) NOT NULL CHECK (jumlah > 0),
    tanggal DATE NOT NULL,
    catatan TEXT,
    transaksi_id UUID REFERENCES transaksi(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pembayaran_hutang ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments for own debts" ON pembayaran_hutang
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM hutang_piutang hp 
            WHERE hp.id = hutang_piutang_id AND hp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert payments for own debts" ON pembayaran_hutang
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM hutang_piutang hp 
            WHERE hp.id = hutang_piutang_id AND hp.user_id = auth.uid()
        )
    );

-- ============================================
-- KONTRIBUSI_TUJUAN (Goal Contributions)
-- ============================================

CREATE TABLE kontribusi_tujuan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tujuan_id UUID NOT NULL REFERENCES tujuan_keuangan(id) ON DELETE CASCADE,
    jumlah NUMERIC(15,2) NOT NULL CHECK (jumlah > 0),
    tanggal DATE NOT NULL,
    catatan TEXT,
    transaksi_id UUID REFERENCES transaksi(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE kontribusi_tujuan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contributions for own goals" ON kontribusi_tujuan
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tujuan_keuangan tk 
            WHERE tk.id = tujuan_id AND tk.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert contributions for own goals" ON kontribusi_tujuan
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tujuan_keuangan tk 
            WHERE tk.id = tujuan_id AND tk.user_id = auth.uid()
        )
    );

-- ============================================
-- DEFAULT CATEGORIES (Optional)
-- ============================================

-- Create function to add default categories for new users
CREATE OR REPLACE FUNCTION add_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Pemasukan categories
    INSERT INTO kategori (user_id, nama, tipe, ikon, warna, is_default) VALUES
    (NEW.id, 'Gaji', 'pemasukan', 'briefcase', '#10b981', true),
    (NEW.id, 'Bonus', 'pemasukan', 'gift', '#10b981', true),
    (NEW.id, 'Investasi', 'pemasukan', 'trending-up', '#10b981', true),
    (NEW.id, 'Hadiah', 'pemasukan', 'box', '#10b981', true),
    (NEW.id, 'Lainnya', 'pemasukan', 'more-horizontal', '#10b981', true);

    -- Pengeluaran categories
    INSERT INTO kategori (user_id, nama, tipe, ikon, warna, is_default) VALUES
    (NEW.id, 'Makanan', 'pengeluaran', 'utensils', '#ef4444', true),
    (NEW.id, 'Transportasi', 'pengeluaran', 'car', '#ef4444', true),
    (NEW.id, 'Belanja', 'pengeluaran', 'shopping-bag', '#ef4444', true),
    (NEW.id, 'Hiburan', 'pengeluaran', 'film', '#ef4444', true),
    (NEW.id, 'Kesehatan', 'pengeluaran', 'heart', '#ef4444', true),
    (NEW.id, 'Pendidikan', 'pengeluaran', 'book', '#ef4444', true),
    (NEW.id, 'Tagihan', 'pengeluaran', 'file-text', '#ef4444', true),
    (NEW.id, 'Lainnya', 'pengeluaran', 'more-horizontal', '#ef4444', true);

    -- Create default wallet
    INSERT INTO dompet (user_id, nama, tipe, saldo_awal, ikon, warna) VALUES
    (NEW.id, 'Dompet Utama', 'tunai', 0, 'wallet', '#6366f1');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add default categories on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION add_default_categories();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_transaksi_user_id ON transaksi(user_id);
CREATE INDEX idx_transaksi_tanggal ON transaksi(tanggal);
CREATE INDEX idx_transaksi_dompet_id ON transaksi(dompet_id);
CREATE INDEX idx_transaksi_kategori_id ON transaksi(kategori_id);
CREATE INDEX idx_transaksi_tipe ON transaksi(tipe);

CREATE INDEX idx_kategori_user_id ON kategori(user_id);
CREATE INDEX idx_kategori_tipe ON kategori(tipe);

CREATE INDEX idx_dompet_user_id ON dompet(user_id);
CREATE INDEX idx_dompet_tipe ON dompet(tipe);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_periode ON budgets(periode, bulan, tahun);

CREATE INDEX idx_recurring_rules_user_id ON recurring_rules(user_id);
CREATE INDEX idx_recurring_rules_is_active ON recurring_rules(is_active);

CREATE INDEX idx_tujuan_keuangan_user_id ON tujuan_keuangan(user_id);
CREATE INDEX idx_hutang_piutang_user_id ON hutang_piutang(user_id);
