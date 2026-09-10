import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useStore } from './store';
import type { DB } from './types';

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error';

interface AuthValue {
  user: User | null;
  loading: boolean;
  guest: boolean;
  sync: SyncStatus;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);
const GUEST_KEY = 'finia.guest';

function frenchError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (m.includes('already registered') || m.includes('user already'))
    return 'Cet email a déjà un compte. Connectez-vous avec votre mot de passe habituel — le même compte fonctionne sur toutes les applications Finjaro.';
  if (m.includes('password should be at least')) return 'Mot de passe trop court (6 caractères minimum).';
  if (m.includes('invalid email') || m.includes('validate email')) return 'Adresse email invalide.';
  if (m.includes('rate limit')) return 'Trop de tentatives, réessayez dans quelques minutes.';
  if (m.includes('network') || m.includes('fetch')) return 'Connexion impossible : vérifiez votre réseau.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(() => localStorage.getItem(GUEST_KEY) === '1');
  const [sync, setSync] = useState<SyncStatus>('offline');

  /** Vrai pendant l'hydratation : les changements ne doivent pas repartir vers le cloud. */
  const hydrating = useRef(false);
  const pulled = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        pulled.current = false;
        setSync('offline');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Tirage initial : à la connexion, l'état du cloud fait foi s'il existe.
  useEffect(() => {
    if (!user || pulled.current) return;
    pulled.current = true;
    setSync('syncing');
    supabase
      .from('finia_workspaces')
      .select('data')
      .eq('owner_id', user.id)
      .maybeSingle()
      .then(async ({ data: row, error }) => {
        if (error) {
          setSync('error');
          return;
        }
        if (row && row.data && Object.keys(row.data).length > 0) {
          hydrating.current = true;
          store.hydrate(row.data as DB);
          setSync('synced');
        } else {
          const { error: upsertError } = await supabase.from('finia_workspaces').upsert(
            {
              owner_id: user.id,
              name: store.db.company.name,
              data: store.db as unknown as Record<string, unknown>,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'owner_id' },
          );
          setSync(upsertError ? 'error' : 'synced');
        }
      });
  }, [user, store]);

  // Poussée continue : chaque changement local part vers le cloud (débouncé).
  useEffect(() => {
    if (!user || !pulled.current) return;
    if (hydrating.current) {
      hydrating.current = false;
      return;
    }
    setSync('syncing');
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const { error } = await supabase.from('finia_workspaces').upsert(
        {
          owner_id: user.id,
          name: store.db.company.name,
          data: store.db as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'owner_id' },
      );
      setSync(error ? 'error' : 'synced');
    }, 1200);
    return () => clearTimeout(timer.current);
  }, [store.db, user]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      guest,
      sync,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? frenchError(error.message) : null;
      },
      async signUp(email, password) {
        // `app` marque l'origine du compte : les comptes créés ici restent
        // distinguables des inscriptions Finjaro dans la base partagée.
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { app: 'finia' } },
        });
        return error ? frenchError(error.message) : null;
      },
      async signOut() {
        await supabase.auth.signOut();
        localStorage.removeItem(GUEST_KEY);
        setGuest(false);
      },
      continueAsGuest() {
        localStorage.setItem(GUEST_KEY, '1');
        setGuest(true);
      },
    }),
    [user, loading, guest, sync],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
