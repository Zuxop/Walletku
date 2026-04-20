import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  hideValues: boolean;
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  currencyFormat: 'dot' | 'comma';
  firstDayOfWeek: 'monday' | 'sunday';
  privacyMode: boolean;
  toggleSidebar: () => void;
  toggleHideValues: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAccentColor: (color: string) => void;
  setCurrencyFormat: (format: 'dot' | 'comma') => void;
  setFirstDayOfWeek: (day: 'monday' | 'sunday') => void;
  togglePrivacyMode: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      hideValues: false,
      theme: 'system',
      accentColor: '#6366f1',
      currencyFormat: 'dot',
      firstDayOfWeek: 'monday',
      privacyMode: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleHideValues: () =>
        set((state) => ({ hideValues: !state.hideValues })),
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setCurrencyFormat: (currencyFormat) => set({ currencyFormat }),
      setFirstDayOfWeek: (firstDayOfWeek) => set({ firstDayOfWeek }),
      togglePrivacyMode: () =>
        set((state) => ({ privacyMode: !state.privacyMode })),
    }),
    {
      name: 'ui-storage',
    }
  )
);
