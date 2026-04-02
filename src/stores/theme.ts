import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme = 'boutique' | 'void' | 'forest' | 'rose';

interface ThemeStore {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'boutique',
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },
    }),
    {
      name: 'arbitury-theme',
    }
  )
);
