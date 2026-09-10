import { NavLink } from 'react-router-dom';
import { IconHome, IconMenu, IconMonitor, IconReceipt, IconWallet } from './Icons';

/**
 * Barre d'onglets flottante, même recette que la marketplace Finjaro :
 * pastille translucide détachée du bord, onglet actif en pastille blanche
 * avec son libellé, les autres en icône seule.
 */
const TABS = [
  { to: '/', label: 'Accueil', icon: IconHome, color: '#C25E38', end: true },
  { to: '/pos', label: 'Vendre', icon: IconMonitor, color: '#2F6D62' },
  { to: '/caisse', label: 'Caisse', icon: IconWallet, color: '#B8860B' },
  { to: '/ventes', label: 'Ventes', icon: IconReceipt, color: '#7C5295' },
];

export const TAB_BAR_SPACE = 'pb-[104px] lg:pb-8';

export default function TabBar({ onMenu }: { onMenu: () => void }) {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] lg:hidden">
      <div className="pointer-events-auto flex items-center gap-1 rounded-pill bg-white/80 p-1.5 shadow-[0_10px_30px_rgba(23,27,38,0.18)] ring-1 ring-black/5 backdrop-blur-xl">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `relative flex min-w-0 items-center justify-center gap-1.5 rounded-pill py-2.5 transition-all duration-200 ${
                isActive ? 'flex-[1.7] bg-white shadow-sm' : 'flex-1 active:scale-90'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span style={{ color: isActive ? t.color : '#6B6B6B' }}>
                  <t.icon className="h-[22px] w-[22px]" />
                </span>
                {isActive && (
                  <span className="truncate text-[12px] font-semibold" style={{ color: t.color }}>
                    {t.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={onMenu}
          aria-label="Menu"
          className="flex flex-1 items-center justify-center rounded-pill py-2.5 text-muted active:scale-90"
        >
          <IconMenu className="h-[22px] w-[22px]" />
        </button>
      </div>
    </nav>
  );
}
