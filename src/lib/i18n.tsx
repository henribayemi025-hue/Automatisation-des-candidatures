import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { EN } from './lang/en';

export type Lang = 'fr' | 'en';

const KEY = 'finia.lang';

/** Langue courante, lue par t() sans passer par React (les composants se re-rendent via le contexte). */
let current: Lang = detect();

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'fr' || saved === 'en') return saved;
  } catch {
    /* stockage indisponible */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

export function getLang(): Lang {
  return current;
}

/**
 * Traduit un texte écrit en français. La clé EST le texte français : rien à
 * inventer, et un texte sans traduction reste lisible en français.
 * Les variables s'écrivent {nom} dans le texte.
 */
export function t(fr: string, vars?: Record<string, string | number>): string {
  let out = current === 'en' ? (EN[fr] ?? fr) : fr;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

export function locale(): string {
  return current === 'en' ? 'en-GB' : 'fr-FR';
}

interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangValue>({ lang: current, setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);

  // `current` doit changer AVANT le rendu qui suit, pas dans un effet après :
  // les composants remontés par key={lang} appellent t() pendant ce rendu, et
  // liraient encore l'ancienne langue. C'était le second défaut derrière
  // « je clique sur Français, rien ne se passe ».
  const setLang = useCallback((l: Lang) => {
    current = l;
    setLangState(l);
  }, []);

  useEffect(() => {
    current = lang;
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* sans gravité */
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  // key={lang} force le re-rendu complet : tous les t() relisent la langue.
  return (
    <LangContext.Provider value={value}>
      <div key={lang} className="contents">
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLang(): LangValue {
  return useContext(LangContext);
}

const LANG_NAMES: Record<Lang, string> = { fr: 'Français', en: 'English' };

/**
 * FR / EN en haut des écrans ; en toutes lettres (« Français », « English »)
 * dans les réglages, avec `full`. La langue active est marquée : cliquer sur
 * celle déjà choisie ne change rien, et ça se voit.
 */
export function LanguageSwitch({ className = '', full = false }: { className?: string; full?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={`inline-flex rounded-pill border border-hairline bg-white p-0.5 font-semibold ${full ? 'text-[13px]' : 'text-[12px]'} ${className}`}
      role="group"
      aria-label="Langue / Language"
    >
      {(['fr', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`rounded-pill transition ${full ? 'px-4 py-1.5' : 'px-2.5 py-1 uppercase'} ${lang === l ? 'bg-teal text-white' : 'text-muted hover:text-ink'}`}
          aria-pressed={lang === l}
          lang={l}
        >
          {full ? LANG_NAMES[l] : l}
        </button>
      ))}
    </div>
  );
}
