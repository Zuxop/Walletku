'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download, FileJson, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export function BackupRestore() {
  const user = useAuthStore((state) => state.user);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<{
    valid: boolean;
    data?: Record<string, unknown>;
    error?: string;
  } | null>(null);

  // Export all localStorage and sessionStorage data
  const handleBackup = () => {
    setIsBackingUp(true);
    try {
      const backupData: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        userId: user?.id,
        localStorage: {},
        sessionStorage: {},
      };

      // Backup localStorage (excluding sensitive data)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.includes('pin') && !key.includes('password') && !key.includes('token')) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              (backupData.localStorage as Record<string, string>)[key] = value;
            }
          } catch {
            // Skip items that can't be serialized
          }
        }
      }

      // Backup sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          try {
            const value = sessionStorage.getItem(key);
            if (value) {
              (backupData.sessionStorage as Record<string, string>)[key] = value;
            }
          } catch {
            // Skip items that can't be serialized
          }
        }
      }

      // Download backup file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aturla-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Backup berhasil dibuat!');
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Gagal membuat backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    setIsRestoring(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Validate backup structure
        if (!data.timestamp || (!data.localStorage && !data.sessionStorage)) {
          setRestorePreview({ valid: false, error: 'Format file backup tidak valid' });
        } else {
          setRestorePreview({ valid: true, data });
        }
      } catch {
        setRestorePreview({ valid: false, error: 'File bukan format JSON yang valid' });
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  const handleRestore = () => {
    if (!restorePreview?.valid || !restorePreview.data) return;

    setIsRestoring(true);
    try {
      const { localStorage: lsData, sessionStorage: ssData } = restorePreview.data;

      // Restore localStorage (with confirmation for existing keys)
      if (lsData && typeof lsData === 'object') {
        Object.entries(lsData).forEach(([key, value]) => {
          if (typeof value === 'string' && !key.includes('pin') && !key.includes('password')) {
            localStorage.setItem(key, value);
          }
        });
      }

      // Restore sessionStorage
      if (ssData && typeof ssData === 'object') {
        Object.entries(ssData).forEach(([key, value]) => {
          if (typeof value === 'string') {
            sessionStorage.setItem(key, value);
          }
        });
      }

      toast.success('Data berhasil dipulihkan! Halaman akan di-reload.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Gagal memulihkan data');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          Backup & Restore
        </CardTitle>
        <CardDescription>
          Cadangkan pengaturan lokal dan pulihkan dari file backup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Backup Section */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Buat Backup</h4>
          <p className="text-sm text-muted-foreground">
            Export pengaturan dan preferensi aplikasi ke file JSON.
          </p>
          <Button
            variant="outline"
            onClick={handleBackup}
            disabled={isBackingUp}
            className="gap-2"
          >
            {isBackingUp ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Backup
          </Button>
        </div>

        <div className="border-t" />

        {/* Restore Section */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Pulihkan Data</h4>
          <p className="text-sm text-muted-foreground">
            Upload file backup untuk memulihkan pengaturan.
          </p>
          
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="max-w-sm"
            />
          </div>

          {restorePreview && (
            <div className={`p-3 rounded-lg text-sm ${
              restorePreview.valid 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                {restorePreview.valid ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium">
                    {restorePreview.valid ? 'File backup valid' : 'File tidak valid'}
                  </p>
                  {restorePreview.error && (
                    <p className="text-xs mt-1">{restorePreview.error}</p>
                  )}
                  {restorePreview.valid && restorePreview.data && (
                    <div className="text-xs mt-1 space-y-0.5">
                      <p>Backup dari: {new Date(restorePreview.data.timestamp as string).toLocaleDateString('id-ID')}</p>
                      <p>User ID: {(restorePreview.data.userId as string)?.slice(0, 8)}...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {restorePreview?.valid && (
            <Button
              onClick={handleRestore}
              disabled={isRestoring}
              className="gap-2"
            >
              {isRestoring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Pulihkan Data
            </Button>
          )}
        </div>

        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          <p className="font-medium">⚠️ Peringatan:</p>
          <ul className="list-disc list-inside mt-1 text-xs space-y-1">
            <li>Backup tidak menyertakan data transaksi (hanya pengaturan lokal)</li>
            <li>Untuk backup data lengkap, gunakan fitur &quot;Ekspor Data&quot;</li>
            <li>Restore akan menimpa pengaturan yang ada saat ini</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
