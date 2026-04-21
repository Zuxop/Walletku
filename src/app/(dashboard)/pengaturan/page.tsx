'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Bell, Shield, LogOut, Fingerprint, Lock } from 'lucide-react';
import { PrivasiSettings } from '@/components/settings/PrivasiSettings';
import { BiometricSetup } from '@/components/settings/BiometricSetup';
import { PINSetupSettings } from '@/components/settings/PINSetup';
import { CurrencySelector } from '@/components/settings/CurrencySelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import type { CurrencyCode } from '@/lib/utils/multiCurrency';
import { useRouter } from 'next/navigation';

export default function PengaturanPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      toast.error('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (formData: any) => {
    try {
      setIsSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.user.id);

      if (error) throw error;
      toast.success('Profil berhasil diperbarui');
      fetchProfile();
    } catch (error) {
      toast.error('Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>

      <Tabs defaultValue="profil">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profil" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifikasi" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifikasi
          </TabsTrigger>
          <TabsTrigger value="privasi" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privasi
          </TabsTrigger>
          <TabsTrigger value="keamanan" className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Keamanan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="mt-6 space-y-6">
          <ProfilSettings profile={profile} onSave={handleSaveProfile} isSaving={isSaving} />
          <CurrencySelector 
            currentCurrency={(profile?.mata_uang as CurrencyCode) || 'IDR'}
            onCurrencyChange={(currency) => setProfile(prev => prev ? {...prev, mata_uang: currency} : null)}
          />
        </TabsContent>

        <TabsContent value="notifikasi" className="mt-6">
          <NotifikasiSettings profile={profile} onSave={handleSaveProfile} isSaving={isSaving} />
        </TabsContent>

        <TabsContent value="privasi" className="mt-6">
          <PrivasiSettings profile={profile} onSave={handleSaveProfile} isSaving={isSaving} />
        </TabsContent>

        <TabsContent value="keamanan" className="mt-6 space-y-6">
          <PINSetupSettings />
          <BiometricSetup />
        </TabsContent>
      </Tabs>

      {/* Logout Section */}
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium">Keluar</h3>
                <p className="text-sm text-gray-500">Keluar dari akun Anda</p>
              </div>
            </div>
            <Button variant="destructive" onClick={handleLogout}>
              Keluar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Profil Settings Component
interface ProfilSettingsProps {
  profile: Profile | null;
  onSave: (data: any) => void;
  isSaving: boolean;
}

function ProfilSettings({ profile, onSave, isSaving }: ProfilSettingsProps) {
  const [formData, setFormData] = useState({
    nama_lengkap: profile?.nama_lengkap || '',
    mata_uang: profile?.mata_uang || 'IDR',
    bahasa: profile?.bahasa || 'id',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Profil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nama">Nama Lengkap</Label>
          <Input
            id="nama"
            value={formData.nama_lengkap}
            onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
            placeholder="Nama lengkap Anda"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mata_uang">Mata Uang</Label>
          <select
            id="mata_uang"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={formData.mata_uang}
            onChange={(e) => setFormData({ ...formData, mata_uang: e.target.value })}
          >
            <option value="IDR">IDR - Rupiah Indonesia</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="SGD">SGD - Singapore Dollar</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bahasa">Bahasa</Label>
          <select
            id="bahasa"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={formData.bahasa}
            onChange={(e) => setFormData({ ...formData, bahasa: e.target.value })}
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>

        <Button 
          onClick={() => onSave(formData)} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Notifikasi Settings Component
interface NotifikasiSettingsProps {
  profile: Profile | null;
  onSave: (data: any) => void;
  isSaving: boolean;
}

function NotifikasiSettings({ profile, onSave, isSaving }: NotifikasiSettingsProps) {
  const [settings, setSettings] = useState({
    notif_harian: profile?.notif_harian ?? true,
    notif_budget: profile?.notif_budget ?? true,
    notif_hutang: profile?.notif_hutang ?? true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Notifikasi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Pengingat Harian</Label>
            <p className="text-sm text-gray-500">Kirim notifikasi untuk mencatat transaksi harian</p>
          </div>
          <Switch
            checked={settings.notif_harian}
            onCheckedChange={(checked) => setSettings({ ...settings, notif_harian: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Peringatan Budget</Label>
            <p className="text-sm text-gray-500">Notifikasi saat budget hampir habis</p>
          </div>
          <Switch
            checked={settings.notif_budget}
            onCheckedChange={(checked) => setSettings({ ...settings, notif_budget: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Peringatan Hutang</Label>
            <p className="text-sm text-gray-500">Notifikasi jatuh tempo hutang/piutang</p>
          </div>
          <Switch
            checked={settings.notif_hutang}
            onCheckedChange={(checked) => setSettings({ ...settings, notif_hutang: checked })}
          />
        </div>

        <Button 
          onClick={() => onSave(settings)} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Privasi Settings Component
interface PrivasiSettingsProps {
  profile: Profile | null;
  onSave: (data: any) => void;
  isSaving: boolean;
}

function PrivasiSettings({ profile, onSave, isSaving }: PrivasiSettingsProps) {
  const [settings, setSettings] = useState({
    privacy_mode: profile?.privacy_mode ?? false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Privasi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <Label>Mode Privasi</Label>
            </div>
            <p className="text-sm text-gray-500">Sembunyikan jumlah saldo di halaman utama</p>
          </div>
          <Switch
            checked={settings.privacy_mode}
            onCheckedChange={(checked) => setSettings({ ...settings, privacy_mode: checked })}
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Keamanan Akun</h4>
          <p className="text-sm text-gray-500">
            Data Anda dilindungi dengan enkripsi end-to-end. Password dan PIN tidak disimpan dalam bentuk plain text.
          </p>
        </div>

        <Button 
          onClick={() => onSave(settings)} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
