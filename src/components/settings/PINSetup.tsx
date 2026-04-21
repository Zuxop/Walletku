'use client';

import { useState, useEffect } from 'react';
import { Lock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PINSetup } from '@/components/auth/PINLock';
import { toast } from 'react-hot-toast';

export function PINSetupSettings() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    const enabled = localStorage.getItem('pin_enabled') === 'true';
    setIsEnabled(enabled);
  }, []);

  const handleEnable = () => {
    setShowSetup(true);
  };

  const handleDisable = () => {
    if (confirm('Yakin ingin menonaktifkan PIN?')) {
      localStorage.removeItem('app_pin_hash');
      localStorage.removeItem('pin_enabled');
      setIsEnabled(false);
      toast.success('PIN dinonaktifkan');
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    setIsEnabled(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            PIN Lock
          </CardTitle>
          <CardDescription>
            {isEnabled 
              ? 'PIN aktif. Aplikasi akan terkunci otomatis saat tidak digunakan.'
              : 'Aktifkan PIN untuk keamanan tambahan saat mengakses aplikasi.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <Check className="h-5 w-5" />
                <span className="font-medium">PIN aktif</span>
              </div>
              <Button
                variant="destructive"
                onClick={handleDisable}
                className="w-full"
              >
                Nonaktifkan PIN
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleEnable}
                className="w-full"
              >
                Aktifkan PIN
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atur PIN</DialogTitle>
          </DialogHeader>
          <PINSetup
            onComplete={handleSetupComplete}
            onCancel={() => setShowSetup(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
