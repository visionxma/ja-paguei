import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePreferences } from '@/hooks/usePreferences';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { preferences, updatePreference, isLoading } = usePreferences();
  const [theme, setThemeState] = useState<Theme>(() => {
    // Read from localStorage for instant load before DB is ready
    return (localStorage.getItem('app-theme') as Theme) || 'dark';
  });

  // Sync from DB once loaded
  useEffect(() => {
    if (!isLoading && preferences?.theme) {
      setThemeState(preferences.theme as Theme);
    }
  }, [isLoading, preferences?.theme]);

  const resolvedTheme: 'dark' | 'light' =
    theme === 'system' ? getSystemTheme() : theme === 'light' ? 'light' : 'dark';

  // Apply class to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (resolvedTheme === 'light') {
      root.classList.add('light');
    }
    localStorage.setItem('app-theme', theme);
  }, [resolvedTheme, theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => setThemeState('system'); // force re-render
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('app-theme', t);
    updatePreference({ theme: t });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
