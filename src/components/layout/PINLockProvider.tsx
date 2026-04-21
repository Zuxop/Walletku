'use client';

import { useState, useEffect } from 'react';
import { PINLock } from '@/components/auth/PINLock';
import { usePathname } from 'next/navigation';

export function PINLockProvider({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check if PIN is enabled
    const pinEnabled = localStorage.getItem('pin_enabled') === 'true';
    
    // Don't lock on public routes
    const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
    const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));
    
    if (pinEnabled && !isPublicRoute) {
      // Check if already unlocked in this session
      const sessionUnlocked = sessionStorage.getItem('pin_unlocked') === 'true';
      
      if (!sessionUnlocked) {
        setLocked(true);
      }
    }
    
    setInitialized(true);
  }, [pathname]);

  const handleUnlock = () => {
    sessionStorage.setItem('pin_unlocked', 'true');
    setLocked(false);
  };

  const handleForgotPIN = () => {
    // Clear session and redirect to login
    sessionStorage.removeItem('pin_unlocked');
    localStorage.removeItem('app_pin_hash');
    localStorage.removeItem('pin_enabled');
    window.location.href = '/login';
  };

  if (!initialized) {
    return null;
  }

  return (
    <>
      {children}
      {locked && (
        <PINLock 
          onUnlock={handleUnlock}
          onForgotPIN={handleForgotPIN}
        />
      )}
    </>
  );
}
