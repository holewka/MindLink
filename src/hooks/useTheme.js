import { useEffect, useState } from 'react';

const KEY = 'pref_theme'; // 'light' | 'dark' | 'system'

export default function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(KEY) || 'system');

  useEffect(() => {
    const root = document.documentElement;
    let active = theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      active = prefersDark ? 'dark' : 'light';
    }
    if (active === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    localStorage.setItem(KEY, theme);
  }, [theme]);

  return { theme, setTheme };
}
