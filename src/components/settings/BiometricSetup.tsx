'use client';

import { useState, useEffect } from 'react';
import { Fingerprint, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  isBiometricSupported,
  getBiometricType,
  registerBiometric,
  isBiometricEnabled,
  disableBiometric,
  storeBiometricCredentialId,
  arrayBufferToBase64,
} from '@/lib/utils/biometric';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

export function BiometricSetup() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const supabase = createClient();

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    const isSupported = await isBiometricSupported();
    setSupported(isSupported);
    setEnabled(isBiometricEnabled());
    setBiometricType(getBiometricType());
  };

  const handleEnable = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Anda harus login terlebih dahulu');
        return;
      }

      // Register biometric
      const credential = await registerBiometric(
        userData.user.id,
        userData.user.email || '',
        userData.user.user_metadata?.nama_lengkap || userData.user.email || 'User'
      );

      if (credential) {
        // Store credential ID
        const credentialId = arrayBufferToBase64(credential.rawId);
        storeBiometricCredentialId(credentialId);

        // Save to Supabase profile
        const { error } = await supabase
          .from('profiles')
          .update({
            biometric_enabled: true,
            biometric_credential_id: credentialId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userData.user.id);

        if (error) throw error;

        setEnabled(true);
        toast.success(`${biometricType} berhasil diaktifkan!`);
      }
    } catch (error: any) {
      console.error('Error enabling biometric:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Izin ditolak. Mohon izinkan akses biometric.');
      } else if (error.name === 'AbortError') {
        toast.error('Proses dibatalkan.');
      } else {
        toast.error('Gagal mengaktifkan biometric. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    try {
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          biometric_enabled: false,
          biometric_credential_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.user.id);

      if (error) throw error;

      // Clear local storage
      disableBiometric();
      setEnabled(false);
      toast.success(`${biometricType} dinonaktifkan`);
    } catch (error) {
      toast.error('Gagal menonaktifkan biometric');
    } finally {
      setLoading(false);
    }
  };

  if (supported === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            {biometricType}
          </CardTitle>
          <CardDescription>Memeriksa dukungan perangkat...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Tidak Tersedia
          </CardTitle>
          <CardDescription>
            Perangkat Anda tidak mendukung biometric authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Biometric (Fingerprint/Face ID) tidak tersedia di perangkat ini.
              Pastikan perangkat Anda memiliki sensor fingerprint atau Face ID yang aktif.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          {biometricType}
        </CardTitle>
        <CardDescription>
          {enabled
            ? `${biometricType} aktif. Anda dapat login dengan ${biometricType.toLowerCase()}.`
            : `Aktifkan ${biometricType} untuk login lebih cepat dan aman.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <Check className="h-5 w-5" />
              <span className="font-medium">{biometricType} aktif</span>
            </div>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Memproses...' : `Nonaktifkan ${biometricType}`}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {biometricType} memungkinkan Anda login tanpa memasukkan password.
                Data biometric Anda tidak pernah meninggalkan perangkat.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleEnable}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Memproses...' : `Aktifkan ${biometricType}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
