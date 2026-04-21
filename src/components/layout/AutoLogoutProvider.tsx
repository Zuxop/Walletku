'use client';

import { useState, useCallback } from 'react';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { AutoLogoutDialog } from '@/components/auth/AutoLogoutDialog';

interface AutoLogoutProviderProps {
  children: React.ReactNode;
  timeoutMinutes?: number;
  isEnabled?: boolean;
}

export function AutoLogoutProvider({
  children,
  timeoutMinutes = 15,
  isEnabled = true,
}: AutoLogoutProviderProps) {
  const [showWarning, setShowWarning] = useState(false);

  const handleWarning = useCallback(() => {
    setShowWarning(true);
  }, []);

  const handleLogout = useCallback(() => {
    setShowWarning(false);
  }, []);

  const handleStay = useCallback(() => {
    setShowWarning(false);
  }, []);

  useAutoLogout({
    timeoutMinutes,
    warningMinutes: 1,
    onWarning: handleWarning,
    onLogout: handleLogout,
    isEnabled,
  });

  return (
    <>
      {children}
      <AutoLogoutDialog
        isOpen={showWarning}
        onStay={handleStay}
        onLogout={handleLogout}
        warningSeconds={60}
      />
    </>
  );
}
