import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/** Clair, sombre, ou le réglage du téléphone / de l'ordinateur. */
export type ThemeChoice = 'light' | 'dark' | 'system';

const KEY = 'finia.theme';
const ThemeContext = createContext<{ choice: ThemeChoice; setChoice: (c: ThemeChoice) => void; dark: boolean }>({
  choice: 'system',
  setChoice: () => {},
  dark: false,
});

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ThemeChoice>(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return saved === 'light' || saved === 'dark' ? saved : 'system';
    } catch {
      return 'system';
    }
  });
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const dark = choice === 'dark' || (choice === 'system' && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem(KEY, choice);
    } catch {
      // stockage indisponible : le choix vaut pour la session
    }
  }, [dark, choice]);

  const value = useMemo(() => ({ choice, setChoice, dark }), [choice, dark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
