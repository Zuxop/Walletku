'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseAutoLogoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onWarning?: () => void;
  onLogout?: () => void;
  isEnabled?: boolean;
}

export function useAutoLogout({
  timeoutMinutes = 15,
  warningMinutes = 1,
  onWarning,
  onLogout,
  isEnabled = true,
}: UseAutoLogoutProps) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(() => {
    // Clear all storage
    sessionStorage.clear();
    localStorage.removeItem('app_pin_hash');
    localStorage.removeItem('pin_enabled');
    localStorage.removeItem('pin_unlocked');
    
    onLogout?.();
    
    // Redirect to login
    window.location.href = '/login';
  }, [onLogout]);

  const resetTimers = useCallback(() => {
    if (!isEnabled) return;

    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Set warning timer
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;
    warningRef.current = setTimeout(() => {
      onWarning?.();
    }, warningMs);

    // Set logout timer
    const timeoutMs = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
      logout();
    }, timeoutMs);
  }, [isEnabled, timeoutMinutes, warningMinutes, onWarning, logout]);

  useEffect(() => {
    if (!isEnabled) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      return;
    }

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown',
    ];

    const handleActivity = () => {
      resetTimers();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timer setup
    resetTimers();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [isEnabled, resetTimers]);

  return {
    resetTimers,
    logout,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = timeoutMinutes * 60 * 1000 - elapsed;
      return Math.max(0, remaining);
    },
  };
}
