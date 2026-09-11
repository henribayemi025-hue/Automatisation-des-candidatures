import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useDB, useStoreActions } from '../lib/store';
import { canAccess, useCollab } from '../lib/collab';
import { DEMO_KEY } from '../pages/Demo';
import { LanguageSwitch } from '../lib/i18n';
import AppSwitcher from './AppSwitcher';
import AssistantDrawer from './AssistantDrawer';
import ModuleIntro from './ModuleIntro';
import PresenceAvatars, { Avatar } from './PresenceAvatars';
import TabBar, { TAB_BAR_SPACE } from './TabBar';
import {
  IconBook,
  IconBox,
  IconCard,
  IconCart,
  IconChart,
  IconChevronDown,
  IconDoc,
  IconHistory,
  IconHome,
  IconLayers,
  IconLogout,
  IconMonitor,
  IconReceipt,
  IconScale,
  IconSettings,
  IconShield,
  IconSparkle,
  IconUsers,
  IconWallet,
  IconX,
  IconCamera,
} from './Icons';
import { t } from '../lib/i18n';

type Area = 'sell' | 'stock' | 'finance' | 'accounting' | 'team' | 'settings';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  area: Area;
  expert?: boolean;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Accueil', icon: <IconHome />, area: 'sell' },
      { to: '/pos', label: 'Vendre', icon: <IconMonitor />, area: 'sell' },
      { to: '/caisse', label: 'Caisse', icon: <IconWallet />, area: 'sell' },
      { to: '/rattrapage', label: 'Rattrapage', icon: <IconCamera />, area: 'sell' },
    ],
  },
  {
    title: 'Ma boutique',
    items: [
      { to: '/produits', label: 'Produits', icon: <IconBox />, area: 'stock' },
      { to: '/stock', label: 'Stock', icon: <IconLayers />, area: 'stock' },
      { to: '/achats', label: 'Achats', icon: <IconCart />, area: 'stock' },
      { to: '/tiers', label: 'Clients & fournisseurs', icon: <IconUsers />, area: 'sell' },
    ],
  },
  {
    title: 'Mon argent',
    items: [
      { to: '/ventes', label: 'Ventes', icon: <IconReceipt />, area: 'sell' },
      { to: '/devis', label: 'Devis', icon: <IconDoc />, area: 'sell' },
      { to: '/dettes', label: 'Dettes & crédits', icon: <IconCard />, area: 'finance' },
      { to: '/depenses', label: 'Dépenses', icon: <IconWallet />, area: 'finance' },
      { to: '/analyse', label: 'Résultats', icon: <IconChart />, area: 'finance' },
      { to: '/rapports', label: 'Documents', icon: <IconDoc />, area: 'finance' },
      { to: '/livre-caisse', label: 'Livre de caisse', icon: <IconBook />, area: 'finance' },
    ],
  },
  {
    title: 'Comptabilité',
    items: [
      { to: '/journal', label: 'Journal des écritures', icon: <IconReceipt />, area: 'accounting', expert: true },
      { to: '/grand-livre', label: 'Grand livre', icon: <IconBook />, area: 'accounting', expert: true },
      { to: '/balance', label: 'Balance générale', icon: <IconScale />, area: 'accounting', expert: true },
      { to: '/etats', label: 'Bilan & résultat', icon: <IconChart />, area: 'accounting', expert: true },
      { to: '/plan-comptable', label: 'Plan comptable', icon: <IconLayers />, area: 'accounting', expert: true },
      { to: '/audit', label: 'Audit', icon: <IconShield />, area: 'accounting', expert: true },
    ],
  },
  {
    title: 'Plus',
    items: [
      { to: '/equipe', label: 'Équipe', icon: <IconUsers />, area: 'team' },
      { to: '/historique', label: 'Historique', icon: <IconHistory />, area: 'finance' },
      { to: '/assistant', label: 'Assistant', icon: <IconSparkle />, area: 'sell' },
      { to: '/parametres', label: 'Paramètres', icon: <IconSettings />, area: 'settings' },
    ],
  },
];

const SYNC_LABEL = {
  offline: { text: 'Local', dot: 'bg-muted' },
  syncing: { text: 'Synchronisation…', dot: 'bg-brass animate-pulse' },
  synced: { text: 'Sauvegardé en ligne', dot: 'bg-[#2A9D8F]' },
  pending: { text: 'En attente de réseau', dot: 'bg-brass' },
  error: { text: 'Hors ligne', dot: 'bg-[#D14343]' },
} as const;

export default function Layout({ children }: { children: ReactNode }) {
  const { company } = useDB();
  const { user, sync, pending, signOut, workspace, workspaces, switchWorkspace, invitations, acceptInvitation, displayName, avatarUrl, setPage } =
    useCollab();
  const { resetAll } = useStoreActions();
  const [demo, setDemo] = useState(() => localStorage.getItem(DEMO_KEY) === '1');
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  /** Quitter la démonstration : on efface l'exemple et on propose la connexion. */
  function leaveDemo() {
    resetAll();
    localStorage.removeItem(DEMO_KEY);
    setDemo(false);
    void signOut();
  }
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  const expert = company.mode === 'EXPERT';
  const role = workspace?.role ?? null;

  useEffect(() => {
    setOpen(false);
    setMenu(false);
    setPage(location.pathname);
  }, [location.pathname, setPage]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  const groups = NAV.map((g) => ({
    ...g,
    items: g.items.filter((it) => (expert || !it.expert) && canAccess(role, it.area)),
  })).filter((g) => g.items.length > 0);

  const status = user ? SYNC_LABEL[sync] : SYNC_LABEL.offline;

  const sidebar = (
    <>
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <NavLink to="/" className="leading-tight">
          <span className="block font-display text-[22px] font-bold text-teal">{t('Finjaro')}</span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6A3D]">{t('Accounting')}</span>
        </NavLink>
        <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-muted lg:hidden" aria-label={t('Fermer')}>
          <IconX />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6 scrollbar-thin">
        {groups.map((group, i) => (
          <div key={i} className="mb-4">
            {group.title && (
              <div className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{t(group.title)}</div>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `mb-0.5 flex items-center gap-3 rounded-input px-3 py-2.5 text-body transition ${
                    isActive ? 'bg-teal-light font-semibold text-teal' : 'text-ink hover:bg-base'
                  }`
                }
              >
                {item.icon}
                <span className="flex-1">{t(item.label)}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-hairline px-5 py-4">
        <div className="text-caption font-semibold text-ink">{workspace?.name ?? company.name}</div>
        <div className="text-[11px] text-muted">
          {company.mode === 'EXPERT' ? t('Mode expert') : t('Mode simple')} · {company.currency || t('devise à choisir')}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {open && <button aria-label={t('Fermer le menu')} onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden" />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-hairline bg-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-[272px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-hairline bg-white px-3 sm:px-5">
          <AppSwitcher />

          {workspaces.length > 1 ? (
            <div className="relative">
              <select
                value={workspace?.id ?? ''}
                onChange={(e) => switchWorkspace(e.target.value)}
                aria-label={t('Espace de travail')}
                className="appearance-none rounded-input border border-hairline bg-white py-1.5 pl-3 pr-8 text-caption font-semibold"
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <IconChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>
          ) : (
            <span className="hidden truncate text-caption font-semibold text-ink sm:block">{workspace?.name ?? company.name}</span>
          )}

          <div className="flex-1" />

          <PresenceAvatars />

          <span
            className="hidden items-center gap-2 rounded-pill border border-hairline bg-base px-3 py-1.5 text-[12px] font-medium text-muted md:inline-flex"
            title={user ? (user.email ?? '') : 'Mode local : créez un compte pour sauvegarder en ligne et travailler à plusieurs'}
          >
            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
            {user ? t(status.text) : t('Local (sans compte)')}
            {pending > 0 && <span className="rounded-pill bg-brass px-1.5 text-[10px] font-bold text-ink">{pending}</span>}
          </span>

          <div ref={menuRef} className="relative">
            <button onClick={() => setMenu((v) => !v)} aria-label={t('Mon compte')} className="rounded-full">
              <Avatar name={displayName} src={avatarUrl} size={34} />
            </button>
            {menu && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-card border border-hairline bg-white p-2 shadow-[0_18px_40px_rgba(23,27,38,0.16)]">
                <div className="px-3 py-2">
                  <div className="text-body font-semibold text-ink">{displayName}</div>
                  <div className="truncate text-caption text-muted">{user?.email ?? t('Sans compte — données sur cet appareil')}</div>
                </div>
                <div className="my-1 border-t border-hairline" />
                <div className="px-3 py-2"><LanguageSwitch /></div>
                <NavLink to="/parametres" className="flex items-center gap-3 rounded-input px-3 py-2 text-body hover:bg-base">
                  <IconSettings />
                  {t('Paramètres')}
                </NavLink>
                <NavLink to="/equipe" className="flex items-center gap-3 rounded-input px-3 py-2 text-body hover:bg-base">
                  <IconUsers />
                  {t('Équipe')}
                </NavLink>
                <button
                  onClick={() => void signOut()}
                  className="flex w-full items-center gap-3 rounded-input px-3 py-2 text-left text-body text-[#D14343] hover:bg-[#FDEDED]"
                >
                  <IconLogout />
                  {user ? t('Se déconnecter') : t('Quitter le mode local')}
                </button>
              </div>
            )}
          </div>
        </header>

        {demo && (
          <div className="flex flex-wrap items-center gap-3 border-b border-brass/40 bg-[#FBF1DF] px-4 py-2.5 text-caption text-ink sm:px-6">
            <span>
              <strong>{t('Démonstration')}</strong> — {t('chiffres d’exemple, gardés sur cet appareil. Tout est modifiable.')}
            </span>
            <button onClick={leaveDemo} className="btn-primary px-3 py-1.5 text-caption">
              {t('Créer mon compte')}
            </button>
          </div>
        )}

        {invitations.length > 0 && (
          <div className="border-b border-brass/40 bg-[#FBF1DF] px-4 py-3 text-caption text-ink sm:px-6">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center gap-3">
                <span>
                  {t('Vous êtes invité à rejoindre l’espace')} <strong>{inv.name}</strong>.
                </span>
                <button onClick={() => void acceptInvitation(inv.id)} className="btn-primary px-3 py-1.5 text-caption">
                  {t('Rejoindre')}
                </button>
              </div>
            ))}
          </div>
        )}

        <main className={`flex-1 px-4 pt-5 sm:px-6 lg:px-8 lg:pt-7 ${TAB_BAR_SPACE}`}>
          <div className="mx-auto max-w-[1280px]">
            <ModuleIntro />
            {children}
          </div>
        </main>
      </div>

      <TabBar onMenu={() => setOpen(true)} />
      <AssistantDrawer />
    </div>
  );
}
