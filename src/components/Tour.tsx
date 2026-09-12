import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDB } from '../lib/store';
import { sectorProfile, tracksStock } from '../lib/sector';
import { IconX } from './Icons';
import { t } from '../lib/i18n';

/**
 * Visite guidée. Huit écrans dans l'ordre où on présente l'application à
 * quelqu'un — un fiscaliste, un ami commerçant — avec deux phrases par écran.
 * Les mots suivent le métier : « Marchandises » pour un import-export,
 * « Carte » pour un restaurant, « Prestations » pour un salon.
 *
 * Elle se déclenche toute seule la première fois (démonstration, ou juste
 * après l'inscription), et se relance depuis le menu du compte.
 */

const DONE_KEY = 'finia.tour.done';
export const TOUR_EVENT = 'finia:tour';

/** Ouvre la visite depuis n'importe où (menu du compte, réglages, bandeau). */
export function startTour(): void {
  window.dispatchEvent(new CustomEvent(TOUR_EVENT));
}

interface Step {
  to: string;
  title: string;
  text: string;
}

export default function Tour() {
  const { company } = useDB();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  const trade = sectorProfile(company.sector);
  const withStock = tracksStock(company);

  const steps = useMemo<Step[]>(() => {
    const list: Step[] = [
      {
        to: '/',
        title: t('L’accueil'),
        text: t('Six chiffres comparés au mois ou à l’année d’avant : chiffre d’affaires, marge, résultat, trésorerie, ce qu’on vous doit, ce que vous devez. Un clic sur une carte ouvre le détail.'),
      },
      {
        to: '/pos',
        title: t(trade.sell),
        text: withStock
          ? t('On clique un article ou on scanne un code-barres, il tombe dans le panier, − et + pour la quantité, Valider. Le stock, la caisse et la comptabilité suivent tout seuls.')
          : t('On clique une prestation, elle tombe dans le panier, Valider. La caisse et la comptabilité suivent tout seules — pas de stock à gérer.'),
      },
      {
        to: '/produits',
        title: t(trade.itemsTitle),
        text: withStock
          ? t('Chaque article avec son prix, son coût d’achat, sa marge et son stock. Le coût suit les réceptions : prix moyen pondéré, comme dans un vrai logiciel.')
          : t('Chaque prestation avec son prix et son coût. Pas de quantité : un métier qui vend du temps ne compte pas des cartons.'),
      },
    ];
    if (withStock) {
      list.push({
        to: '/achats',
        title: t('Achats'),
        text: t('Un bon de commande, puis la réception. Pour un achat à l’étranger : facture en devise, taux, et les frais d’approche — douane, fret, transit — qui entrent dans le coût du stock.'),
      });
    }
    list.push(
      {
        to: '/personnel',
        title: t('Personnel'),
        text: t('Qui travaille ici, les présences pointées, les avances, la paie. L’avance est une créance, la charge est au brut, le net sort de la caisse : rien n’est compté deux fois.'),
      },
      {
        to: '/tva',
        title: t('Déclaration de TVA'),
        text: t('Collectée sur les ventes, déductible sur les achats et la douane, net à reverser ou crédit. Chaque ligne est une écriture du journal.'),
      },
      {
        to: '/etats',
        title: t('Bilan et compte de résultat'),
        text: t('Produits par un moteur en partie double : chaque opération de l’application a écrit ses lignes. L’équilibre du bilan est vérifié en permanence, et l’audit tourne sept contrôles.'),
      },
      {
        to: '/parametres',
        title: t('Paramètres'),
        text: t('Changez « Activité » pour voir l’application dans les mots d’un autre métier — import-export, restaurant, salon. Pays, devise, taxe et plan comptable se règlent ici aussi.'),
      },
    );
    return list;
  }, [trade, withStock]);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(DONE_KEY, '1');
    } catch {
      /* stockage indisponible : on ne bloque pas */
    }
  }, []);

  const go = useCallback(
    (n: number) => {
      const next = Math.max(0, Math.min(steps.length - 1, n));
      setI(next);
      if (steps[next].to !== pathname) navigate(steps[next].to);
    },
    [steps, pathname, navigate],
  );

  // Ouverture à la demande, depuis n'importe quel bouton.
  useEffect(() => {
    const start = () => {
      setI(0);
      setOpen(true);
      if (pathname !== '/') navigate('/');
    };
    window.addEventListener(TOUR_EVENT, start);
    return () => window.removeEventListener(TOUR_EVENT, start);
  }, [navigate, pathname]);

  // Première visite : on propose la visite une fois, jamais deux.
  useEffect(() => {
    let done = '1';
    try {
      done = localStorage.getItem(DONE_KEY) ?? '';
    } catch {
      done = '1';
    }
    if (!done && company.onboarded) {
      const id = window.setTimeout(() => {
        setI(0);
        setOpen(true);
      }, 900);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [company.onboarded]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(i + 1);
      if (e.key === 'ArrowLeft') go(i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, i, go, close]);

  if (!open) return null;
  const step = steps[i];
  const last = i === steps.length - 1;

  return (
    <div
      role="dialog"
      aria-label={t('Visite guidée')}
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-[60] rounded-card border border-brass/50 bg-surface p-4 shadow-[0_18px_40px_rgba(23,27,38,0.22)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A3D]">
            {t('Visite guidée')} · {i + 1}/{steps.length}
          </p>
          <h2 className="mt-0.5 font-display text-[20px] font-bold leading-tight text-ink">{step.title}</h2>
        </div>
        <button onClick={close} aria-label={t('Fermer')} className="rounded-full p-1.5 text-muted hover:bg-base">
          <IconX />
        </button>
      </div>
      <p className="mt-2 text-caption leading-relaxed text-ink/85">{step.text}</p>
      <div className="mt-3 flex items-center gap-1">
        {steps.map((s, k) => (
          <button
            key={s.to}
            onClick={() => go(k)}
            aria-label={s.title}
            className={`h-1.5 flex-1 rounded-full transition ${k <= i ? 'bg-teal' : 'bg-hairline'}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button onClick={() => go(i - 1)} disabled={i === 0} className="btn-ghost py-1.5 text-caption disabled:opacity-40">
          {t('Précédent')}
        </button>
        <div className="flex gap-2">
          {!last && (
            <button onClick={close} className="btn-ghost py-1.5 text-caption">
              {t('Passer')}
            </button>
          )}
          <button onClick={() => (last ? close() : go(i + 1))} className="btn-primary py-1.5 text-caption">
            {last ? t('Terminer') : t('Suivant')}
          </button>
        </div>
      </div>
    </div>
  );
}
