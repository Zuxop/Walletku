'use client';

import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Timer, LogOut } from 'lucide-react';

interface AutoLogoutDialogProps {
  isOpen: boolean;
  onStay: () => void;
  onLogout: () => void;
  warningSeconds?: number;
}

export function AutoLogoutDialog({
  isOpen,
  onStay,
  onLogout,
  warningSeconds = 60,
}: AutoLogoutDialogProps) {
  const [countdown, setCountdown] = useState(warningSeconds);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(warningSeconds);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, warningSeconds, onLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-orange-500" />
            Sesi Akan Berakhir
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Anda telah tidak aktif selama beberapa waktu. Demi keamanan, Anda akan
              otomatis logout dalam:
            </p>
            <div className="flex items-center justify-center py-4">
              <div className="text-4xl font-bold text-orange-600 tabular-nums">
                {formatTime(countdown)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Klik &quot;Tetap Masuk&quot; untuk melanjutkan sesi Anda.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={onLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout Sekarang
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onStay}
            className="gap-2 bg-primary"
          >
            <Timer className="h-4 w-4" />
            Tetap Masuk
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
