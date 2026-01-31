
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Initialize from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem('app-theme-preference');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setThemeMode(stored as 'light' | 'dark' | 'system');
    }
    // If no stored preference, we default to 'system' (state init), which is correct.
  }, []);

  // Effect to determine actual Dark Mode based on mode & system
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let shouldBeDark = false;
      if (themeMode === 'system') {
        shouldBeDark = mediaQuery.matches;
      } else {
        shouldBeDark = themeMode === 'dark';
      }
      setIsDarkMode(shouldBeDark);

      const root = document.documentElement;
      if (shouldBeDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    if (themeMode === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [themeMode]);

  const toggleDarkMode = () => {
    setThemeMode(prev => {
      // Logic: If current EFFECTIVE state is dark, switch to forced light. 
      // If current EFFECTIVE state is light, switch to forced dark.
      // This breaks out of 'system' mode into manual override.
      const next = isDarkMode ? 'light' : 'dark';
      localStorage.setItem('app-theme-preference', next);
      return next;
    });
  };

  const value = useMemo(() => ({ isDarkMode, toggleDarkMode }), [isDarkMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
