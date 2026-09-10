import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useDB } from '../lib/store';
import { useAuth } from '../lib/auth';
import {
  IconBook,
  IconBox,
  IconCard,
  IconCart,
  IconChart,
  IconDoc,
  IconGrid,
  IconHistory,
  IconLayers,
  IconMenu,
  IconMonitor,
  IconMoon,
  IconReceipt,
  IconScale,
  IconSettings,
  IconShield,
  IconSparkle,
  IconSun,
  IconUsers,
  IconWallet,
  IconX,
} from './Icons';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: string;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Tableau de bord', icon: <IconGrid /> },
      { to: '/assistant', label: 'Finia IA', icon: <IconSparkle />, badge: 'IA' },
      { to: '/pos', label: 'Point de vente', icon: <IconMonitor /> },
      { to: '/caisse', label: 'Caisse', icon: <IconWallet /> },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { to: '/produits', label: 'Produits', icon: <IconBox /> },
      { to: '/achats', label: 'Achats & réappro', icon: <IconCart /> },
      { to: '/stock', label: 'Stock & mouvements', icon: <IconLayers /> },
      { to: '/ventes', label: 'Ventes', icon: <IconReceipt /> },
      { to: '/devis', label: 'Devis', icon: <IconDoc /> },
      { to: '/tiers', label: 'Clients & fournisseurs', icon: <IconUsers /> },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/dettes', label: 'Dettes & créances', icon: <IconCard /> },
      { to: '/depenses', label: 'Dépenses', icon: <IconWallet /> },
      { to: '/analyse', label: 'Analyse', icon: <IconChart /> },
      { to: '/rapports', label: 'Rapports', icon: <IconDoc /> },
    ],
  },
  {
    title: 'Comptabilité',
    items: [
      { to: '/livre-caisse', label: 'Livre de caisse', icon: <IconBook /> },
      { to: '/journal', label: 'Journal des écritures', icon: <IconReceipt /> },
      { to: '/grand-livre', label: 'Grand livre', icon: <IconBook /> },
      { to: '/balance', label: 'Balance générale', icon: <IconScale /> },
      { to: '/etats', label: 'Bilan & résultat', icon: <IconChart /> },
      { to: '/plan-comptable', label: 'Plan comptable', icon: <IconLayers /> },
    ],
  },
  {
    title: 'Contrôle',
    items: [
      { to: '/audit', label: 'Audit', icon: <IconShield /> },
      { to: '/historique', label: "Piste d'audit", icon: <IconHistory /> },
      { to: '/parametres', label: 'Paramètres', icon: <IconSettings /> },
    ],
  },
];

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('finia.theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('finia.theme', dark ? 'dark' : 'light');
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

const SYNC_LABEL = {
  offline: { text: 'Local', dot: 'bg-slate-400' },
  syncing: { text: 'Synchronisation…', dot: 'bg-amber-500 animate-pulse' },
  synced: { text: 'Sauvegardé en ligne', dot: 'bg-teal-500' },
  error: { text: 'Erreur de synchronisation', dot: 'bg-rose-500' },
} as const;

export default function Layout({ children }: { children: ReactNode }) {
  const { company } = useDB();
  const { user, sync, signOut } = useAuth();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen">
      {open && (
        <button
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-ink-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-ink-900 text-slate-300 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brass to-brand-500 font-display text-lg font-bold text-ink-950">
              F
            </div>
            <div className="leading-tight">
              <div className="font-display text-[17px] font-bold text-white">Finia</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brass">
                Accounting
              </div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 lg:hidden">
            <IconX />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
          {NAV.map((group, i) => (
            <div key={i} className="mb-4">
              {group.title && (
                <div className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                      isActive
                        ? 'bg-brand-500/20 text-white shadow-[inset_2px_0_0_0] shadow-brass'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                    }`
                  }
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-md bg-brand-500 px-1.5 py-0.5 text-[9px] font-extrabold text-ink-950">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <div className="text-[13px] font-semibold text-white">{company.name}</div>
          <div className="text-[11px] text-slate-500">
            {company.chart} · {company.currency}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-[264px]">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-hairline bg-cream/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-ink-900/90 sm:px-6">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10 lg:hidden">
            <IconMenu />
          </button>
          <span
            className="hidden items-center gap-2 rounded-full border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 sm:inline-flex"
            title={user ? user.email ?? '' : 'Mode local : créez un compte pour sauvegarder en ligne'}
          >
            <span className={`h-2 w-2 rounded-full ${SYNC_LABEL[user ? sync : 'offline'].dot}`} />
            {user ? SYNC_LABEL[sync].text : 'Local (sans compte)'}
          </span>
          <div className="flex-1" />
          <span className="hidden text-xs font-medium text-slate-500 dark:text-slate-400 sm:block">
            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={toggle}
            aria-label="Changer de thème"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
          >
            {dark ? <IconSun /> : <IconMoon />}
          </button>
          <button
            onClick={() => void signOut()}
            title={user ? `Déconnecter ${user.email ?? ''}` : 'Quitter le mode local'}
            className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold uppercase text-white"
          >
            {(user?.email ?? 'ME').slice(0, 2)}
          </button>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
