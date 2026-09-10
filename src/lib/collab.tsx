import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { RealtimeChannel, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { hasContent, loadCache, useStoreActions } from './store';
import { emptyDB, normalizeDB, replay } from './reducer';
import type { DB, Member, MemberRole, Presence, WorkspaceEvent } from './types';
import { t } from './i18n';

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'pending' | 'error';

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  role: MemberRole;
}

interface LocalConflict {
  localDb: DB;
}

interface CollabValue {
  user: User | null;
  loading: boolean;
  guest: boolean;
  displayName: string;
  avatarUrl: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Vrai si une session enregistrée a expiré : on le dit au lieu de basculer en mode local. */
  sessionExpired: boolean;
  lastEmail: string;
  continueAsGuest: () => void;

  workspace: Workspace | null;
  workspaces: Workspace[];
  switchWorkspace: (id: string) => void;
  members: Member[];
  invitations: Workspace[];
  inviteMember: (email: string, role: MemberRole) => Promise<string | null>;
  removeMember: (email: string) => Promise<void>;
  acceptInvitation: (workspaceId: string) => Promise<void>;

  presence: Presence[];
  sync: SyncStatus;
  pending: number;
  localConflict: LocalConflict | null;
  resolveLocalConflict: (choice: 'keep-cloud' | 'import-local') => Promise<void>;
  rebuild: () => Promise<void>;
  setPage: (page: string) => void;
}

const CollabContext = createContext<CollabValue | null>(null);
const GUEST_KEY = 'finia.guest';
const AUTH_KEY = 'finia.auth';
const EMAIL_KEY = 'finia.last-email';
const LAST_WS_KEY = 'finia.workspace';
const OUTBOX_PREFIX = 'finia.outbox.';
const COMPACT_AFTER = 300;

function frenchError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return t('Email ou mot de passe incorrect.');
  if (m.includes('already registered') || m.includes('user already'))
    return t('Cet email a déjà un compte. Connectez-vous avec votre mot de passe habituel — le même compte fonctionne sur toutes les applications Finjaro.');
  if (m.includes('password should be at least')) return t('Mot de passe trop court (6 caractères minimum).');
  if (m.includes('invalid email') || m.includes('validate email')) return t('Adresse email invalide.');
  if (m.includes('rate limit')) return t('Trop de tentatives, réessayez dans quelques minutes.');
  if (m.includes('network') || m.includes('fetch')) return t('Connexion impossible : vérifiez votre réseau.');
  return message;
}

function nameOf(user: User | null): string {
  if (!user) return 'Utilisateur';
  const meta = user.user_metadata ?? {};
  return (meta.name as string) || (meta.full_name as string) || user.email?.split('@')[0] || 'Utilisateur';
}

function avatarOf(user: User | null): string | null {
  const meta = user?.user_metadata ?? {};
  return (meta.avatar_url as string) || (meta.picture as string) || null;
}

function readOutbox(ws: string): WorkspaceEvent[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_PREFIX + ws) ?? '[]');
  } catch {
    return [];
  }
}

function writeOutbox(ws: string, events: WorkspaceEvent[]) {
  localStorage.setItem(OUTBOX_PREFIX + ws, JSON.stringify(events));
}

interface EventRow {
  id: string;
  seq: number;
  actor_id: string | null;
  actor_name: string;
  at: string;
  type: string;
  payload: Record<string, unknown>;
}

function rowToEvent(r: EventRow): WorkspaceEvent {
  return { id: r.id, seq: r.seq, actorId: r.actor_id, actorName: r.actor_name, at: r.at, type: r.type, payload: r.payload };
}

export function CollabProvider({ children }: { children: ReactNode }) {
  const store = useStoreActions();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(() => {
    if (localStorage.getItem(GUEST_KEY) !== '1') return false;
    // On ne reprend le mode local que s'il contient déjà du travail : sinon on repropose la connexion.
    const cached = loadCache('guest');
    if (hasContent(cached) || cached?.company.onboarded) return true;
    localStorage.removeItem(GUEST_KEY);
    return false;
  });
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Workspace[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [sync, setSync] = useState<SyncStatus>('offline');
  const [pending, setPending] = useState(0);
  const [localConflict, setLocalConflict] = useState<LocalConflict | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [lastEmail, setLastEmail] = useState(() => localStorage.getItem(EMAIL_KEY) ?? '');

  const lastSeq = useRef(0);
  const snapshotSeq = useRef(0);
  const applied = useRef(new Set<string>());
  const channel = useRef<RealtimeChannel | null>(null);
  const page = useRef('/');
  const workspaceRef = useRef<Workspace | null>(null);
  workspaceRef.current = workspace;
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  // ---------- Session ----------
  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      let session = data.session;
      // Jeton enregistré mais session absente (expirée, appareil resté fermé, réseau coupé) :
      // on tente de la reprendre avant de considérer la personne comme déconnectée.
      if (!session && localStorage.getItem(AUTH_KEY)) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed.session;
        if (!session) setSessionExpired(true);
      }
      if (session?.user.email) {
        localStorage.setItem(EMAIL_KEY, session.user.email);
        setLastEmail(session.user.email);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionExpired(false);
        if (session.user.email) {
          localStorage.setItem(EMAIL_KEY, session.user.email);
          setLastEmail(session.user.email);
        }
      }
      setUser((prev) => (prev?.id === session?.user?.id ? prev : (session?.user ?? null)));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    store.setActor({ id: user?.id ?? null, name: nameOf(user) });
  }, [user, store]);

  // ---------- Chargement d'un espace ----------
  const loadWorkspace = useCallback(
    async (ws: Workspace) => {
      setSync('syncing');
      store.setScope(ws.id);
      const cached = loadCache(ws.id);
      if (cached) store.replaceState(cached);

      const { data: row, error } = await supabase
        .from('finia_workspaces')
        .select('data, snapshot_seq')
        .eq('id', ws.id)
        .maybeSingle();
      if (error || !row) {
        setSync('error');
        return;
      }
      snapshotSeq.current = Number(row.snapshot_seq ?? 0);

      const { data: rows, error: evError } = await supabase
        .from('finia_events')
        .select('id, seq, actor_id, actor_name, at, type, payload')
        .eq('workspace_id', ws.id)
        .gt('seq', snapshotSeq.current)
        .order('seq', { ascending: true });
      if (evError) {
        setSync('error');
        return;
      }
      const events = (rows as EventRow[]).map(rowToEvent);
      applied.current = new Set(events.map((e) => e.id));
      lastSeq.current = events.length ? events[events.length - 1].seq! : snapshotSeq.current;
      const base = normalizeDB(row.data as Partial<DB>);
      store.replaceState(replay(base, events));
      setSync('synced');
    },
    [store],
  );

  const pushEvent = useCallback(async (ws: string, ev: WorkspaceEvent): Promise<boolean> => {
    const { data, error } = await supabase
      .from('finia_events')
      .insert({
        id: ev.id,
        workspace_id: ws,
        actor_id: ev.actorId,
        actor_name: ev.actorName,
        at: ev.at,
        type: ev.type,
        payload: ev.payload,
      })
      .select('seq')
      .maybeSingle();
    if (error) return false;
    applied.current.add(ev.id);
    if (data?.seq && data.seq > lastSeq.current) lastSeq.current = data.seq;
    return true;
  }, []);

  const flushOutbox = useCallback(async () => {
    const ws = workspaceRef.current;
    if (!ws || !userRef.current) return;
    const queue = readOutbox(ws.id);
    if (!queue.length) {
      setPending(0);
      return;
    }
    setSync('syncing');
    const remaining: WorkspaceEvent[] = [];
    for (const ev of queue) {
      const ok = await pushEvent(ws.id, ev);
      if (!ok) remaining.push(ev);
    }
    writeOutbox(ws.id, remaining);
    setPending(remaining.length);
    setSync(remaining.length ? 'pending' : 'synced');
  }, [pushEvent]);

  /** Reconstruit l'état depuis le cloud : tous les appareils convergent vers le même résultat. */
  const rebuild = useCallback(async () => {
    const ws = workspaceRef.current;
    if (!ws || !userRef.current) return;
    await flushOutbox();
    await loadWorkspace(ws);
  }, [flushOutbox, loadWorkspace]);

  const compactIfNeeded = useCallback(async () => {
    const ws = workspaceRef.current;
    if (!ws || ws.role !== 'owner') return;
    if (lastSeq.current - snapshotSeq.current < COMPACT_AFTER) return;
    const { error } = await supabase
      .from('finia_workspaces')
      .update({ data: store.getState() as unknown as Record<string, unknown>, snapshot_seq: lastSeq.current, updated_at: new Date().toISOString() })
      .eq('id', ws.id);
    if (!error) snapshotSeq.current = lastSeq.current;
  }, [store]);

  // Chaque action locale part immédiatement ; en cas d'échec réseau elle attend en file.
  useEffect(() => {
    return store.subscribe(async (ev) => {
      const ws = workspaceRef.current;
      if (!ws || !userRef.current) return;
      setSync('syncing');
      const ok = await pushEvent(ws.id, ev);
      if (ok) {
        setSync(readOutbox(ws.id).length ? 'pending' : 'synced');
        void compactIfNeeded();
      } else {
        const queue = readOutbox(ws.id);
        queue.push(ev);
        writeOutbox(ws.id, queue);
        setPending(queue.length);
        setSync('pending');
      }
    });
  }, [store, pushEvent, compactIfNeeded]);

  // ---------- Découverte des espaces à la connexion ----------
  useEffect(() => {
    if (!user) {
      setWorkspace(null);
      setWorkspaces([]);
      setMembers([]);
      setInvitations([]);
      setPresence([]);
      setSync('offline');
      store.setScope('guest');
      store.replaceState(loadCache('guest') ?? emptyDB());
      return;
    }

    let cancelled = false;
    (async () => {
      setSync('syncing');
      const email = (user.email ?? '').toLowerCase();

      const [{ data: owned }, { data: memberRows }, { data: invitedRows }] = await Promise.all([
        supabase.from('finia_workspaces').select('id, name, owner_id, data').eq('owner_id', user.id),
        supabase
          .from('finia_members')
          .select('workspace_id, role, status, email, user_id')
          .eq('status', 'active')
          .or(`user_id.eq.${user.id},email.eq.${email}`),
        supabase.from('finia_members').select('workspace_id, role').eq('status', 'invited').eq('email', email),
      ]);
      if (cancelled) return;

      type OwnedRow = { id: string; name: string; owner_id: string; data: Partial<DB> };
      const list: Workspace[] = [];
      let ownedRow: OwnedRow | undefined = owned?.[0] as OwnedRow | undefined;

      const guestDb = loadCache('guest');
      const guestHasWork = hasContent(guestDb);

      if (!ownedRow && !(memberRows?.length)) {
        // Premier passage : l'espace est créé avec le travail local éventuel comme point de départ.
        const initial = guestHasWork && guestDb ? guestDb : emptyDB();
        const { data: created } = await supabase
          .from('finia_workspaces')
          .insert({
            owner_id: user.id,
            name: initial.company.name,
            data: initial as unknown as Record<string, unknown>,
            snapshot_seq: 0,
          })
          .select('id, name, owner_id, data')
          .maybeSingle();
        if (created) {
          ownedRow = created as OwnedRow;
          if (guestHasWork) localStorage.removeItem('finia.cache.guest');
        }
      } else if (ownedRow && guestHasWork && guestDb) {
        // Travail local ET espace en ligne : la personne tranche, rien n'est écrasé en silence.
        if (!hasContent(normalizeDB(ownedRow.data))) {
          await supabase
            .from('finia_workspaces')
            .update({ data: guestDb as unknown as Record<string, unknown>, snapshot_seq: 0 })
            .eq('id', ownedRow.id);
          localStorage.removeItem('finia.cache.guest');
        } else {
          setLocalConflict({ localDb: guestDb });
        }
      }

      if (ownedRow) list.push({ id: ownedRow.id, name: ownedRow.name, ownerId: ownedRow.owner_id, role: 'owner' });

      const memberIds = (memberRows ?? []).map((m) => m.workspace_id as string).filter((id) => id !== ownedRow?.id);
      if (memberIds.length) {
        const { data: wsRows } = await supabase.from('finia_workspaces').select('id, name, owner_id').in('id', memberIds);
        for (const w of wsRows ?? []) {
          const m = memberRows!.find((x) => x.workspace_id === w.id);
          list.push({ id: w.id, name: w.name, ownerId: w.owner_id, role: (m?.role as MemberRole) ?? 'cashier' });
        }
        // Rattache l'identifiant aux invitations acceptées par email.
        await supabase
          .from('finia_members')
          .update({ user_id: user.id, display_name: nameOf(user), updated_at: new Date().toISOString() })
          .eq('email', email)
          .is('user_id', null);
      }

      const invIds = (invitedRows ?? []).map((m) => m.workspace_id as string);
      if (invIds.length) {
        const { data: wsRows } = await supabase.from('finia_workspaces').select('id, name, owner_id').in('id', invIds);
        setInvitations(
          (wsRows ?? []).map((w) => ({
            id: w.id,
            name: w.name,
            ownerId: w.owner_id,
            role: (invitedRows!.find((x) => x.workspace_id === w.id)?.role as MemberRole) ?? 'cashier',
          })),
        );
      } else {
        setInvitations([]);
      }

      if (cancelled) return;
      setWorkspaces(list);
      const wanted = localStorage.getItem(LAST_WS_KEY);
      const chosen = list.find((w) => w.id === wanted) ?? list[0] ?? null;
      setWorkspace(chosen);
      if (!chosen) setSync('error');
    })();
    return () => {
      cancelled = true;
    };
  }, [user, store]);

  // ---------- Espace actif : chargement, temps réel, présence ----------
  useEffect(() => {
    if (!workspace || !user) return;
    localStorage.setItem(LAST_WS_KEY, workspace.id);
    let active = true;

    (async () => {
      await loadWorkspace(workspace);
      if (!active) return;
      await flushOutbox();
      const { data } = await supabase.from('finia_members').select('*').eq('workspace_id', workspace.id).neq('status', 'removed');
      if (active) {
        setMembers(
          (data ?? []).map((m) => ({
            workspaceId: m.workspace_id,
            email: m.email,
            userId: m.user_id,
            role: m.role,
            displayName: m.display_name,
            status: m.status,
          })),
        );
      }
    })();

    const ch = supabase.channel(`finia-ws-${workspace.id}`, { config: { presence: { key: user.id } } });
    ch.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'finia_events', filter: `workspace_id=eq.${workspace.id}` },
      (msg) => {
        const ev = rowToEvent(msg.new as EventRow);
        if (applied.current.has(ev.id)) return;
        applied.current.add(ev.id);
        if (ev.seq && ev.seq > lastSeq.current) lastSeq.current = ev.seq;
        store.applyRemote([ev]);
      },
    );
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<Presence>();
      const list: Presence[] = [];
      for (const key of Object.keys(state)) {
        const latest = state[key][state[key].length - 1];
        if (latest) list.push({ key, name: latest.name, avatar: latest.avatar, page: latest.page });
      }
      setPresence(list);
    });
    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ name: nameOf(user), avatar: avatarOf(user), page: page.current });
      }
    });
    channel.current = ch;

    const wake = () => {
      if (document.visibilityState === 'visible') void rebuild();
    };
    window.addEventListener('online', wake);
    window.addEventListener('focus', wake);
    document.addEventListener('visibilitychange', wake);

    return () => {
      active = false;
      window.removeEventListener('online', wake);
      window.removeEventListener('focus', wake);
      document.removeEventListener('visibilitychange', wake);
      void supabase.removeChannel(ch);
      channel.current = null;
      setPresence([]);
    };
  }, [workspace, user, store, loadWorkspace, flushOutbox, rebuild]);

  const value = useMemo<CollabValue>(
    () => ({
      user,
      loading,
      guest,
      sessionExpired,
      lastEmail,
      displayName: nameOf(user),
      avatarUrl: avatarOf(user),

      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? frenchError(error.message) : null;
      },
      async signUp(email, password, name) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, app: 'finia' } },
        });
        return error ? frenchError(error.message) : null;
      },
      async signInWithGoogle() {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin + window.location.pathname },
        });
      },
      async signOut() {
        await supabase.auth.signOut();
        localStorage.removeItem(GUEST_KEY);
        setGuest(false);
      },
      continueAsGuest() {
        localStorage.setItem(GUEST_KEY, '1');
        setSessionExpired(false);
        setGuest(true);
      },

      workspace,
      workspaces,
      switchWorkspace(id) {
        const next = workspaces.find((w) => w.id === id);
        if (next) setWorkspace(next);
      },
      members,
      invitations,
      async inviteMember(email, role) {
        if (!workspace) return t('Aucun espace actif.');
        const clean = email.trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return t('Adresse email invalide.');
        const { error } = await supabase.from('finia_members').upsert(
          {
            workspace_id: workspace.id,
            email: clean,
            role,
            status: 'active',
            invited_by: user?.id ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'workspace_id,email' },
        );
        if (error) return frenchError(error.message);
        const { data } = await supabase.from('finia_members').select('*').eq('workspace_id', workspace.id).neq('status', 'removed');
        setMembers(
          (data ?? []).map((m) => ({
            workspaceId: m.workspace_id,
            email: m.email,
            userId: m.user_id,
            role: m.role,
            displayName: m.display_name,
            status: m.status,
          })),
        );
        return null;
      },
      async removeMember(email) {
        if (!workspace) return;
        await supabase
          .from('finia_members')
          .update({ status: 'removed', updated_at: new Date().toISOString() })
          .eq('workspace_id', workspace.id)
          .eq('email', email);
        setMembers((prev) => prev.filter((m) => m.email !== email));
      },
      async acceptInvitation(workspaceId) {
        if (!user) return;
        await supabase
          .from('finia_members')
          .update({ status: 'active', user_id: user.id, display_name: nameOf(user), updated_at: new Date().toISOString() })
          .eq('workspace_id', workspaceId)
          .eq('email', (user.email ?? '').toLowerCase());
        const inv = invitations.find((w) => w.id === workspaceId);
        if (inv) {
          setInvitations((prev) => prev.filter((w) => w.id !== workspaceId));
          setWorkspaces((prev) => [...prev, inv]);
          setWorkspace(inv);
        }
      },

      presence,
      sync,
      pending,
      localConflict,
      async resolveLocalConflict(choice) {
        if (!localConflict) return;
        if (choice === 'import-local' && workspace && workspace.role === 'owner') {
          await supabase
            .from('finia_workspaces')
            .update({ data: localConflict.localDb as unknown as Record<string, unknown>, snapshot_seq: lastSeq.current })
            .eq('id', workspace.id);
          await loadWorkspace(workspace);
        }
        localStorage.removeItem('finia.cache.guest');
        setLocalConflict(null);
      },
      rebuild,
      setPage(p) {
        page.current = p;
        if (channel.current && user) {
          void channel.current.track({ name: nameOf(user), avatar: avatarOf(user), page: p });
        }
      },
    }),
    [user, loading, guest, sessionExpired, lastEmail, workspace, workspaces, members, invitations, presence, sync, pending, localConflict, rebuild, loadWorkspace],
  );

  return <CollabContext.Provider value={value}>{children}</CollabContext.Provider>;
}

export function useCollab(): CollabValue {
  const ctx = useContext(CollabContext);
  if (!ctx) throw new Error('useCollab doit être utilisé dans CollabProvider');
  return ctx;
}

/** Ce que chaque rôle a le droit de voir. */
export function canAccess(role: MemberRole | null, area: 'sell' | 'stock' | 'finance' | 'accounting' | 'team' | 'settings'): boolean {
  if (!role) return true;
  switch (role) {
    case 'owner':
    case 'manager':
      return true;
    case 'cashier':
      return area === 'sell' || area === 'stock';
    case 'accountant':
      return area !== 'team' && area !== 'settings';
  }
}
