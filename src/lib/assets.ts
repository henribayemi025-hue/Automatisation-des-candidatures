import type { Depreciation, FixedAsset, ISODate, Minor } from './types';

/**
 * Amortissement linéaire, calculé au mois. Un four acheté 1 200 000 sur 5 ans
 * coûte 20 000 par mois : c'est ce qu'on passe en charge chaque mois, au lieu
 * de sortir 1 200 000 d'un coup le jour de l'achat.
 *
 * Tout est en unités mineures entières. Le dernier mois absorbe l'arrondi pour
 * que la somme des dotations tombe exactement sur la base amortissable.
 */

/** Base amortissable : ce qui sera réellement passé en charge sur la durée. */
export function depreciableBase(asset: FixedAsset): Minor {
  return Math.max(0, asset.cost - asset.salvage);
}

/** Période AAAA-MM d'une date. */
export function periodOf(date: ISODate): string {
  return date.slice(0, 7);
}

/** Nombre de mois entre deux périodes AAAA-MM, la première comptant pour 1. */
export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm) + 1;
}

/** Mois écoulés du plan à la fin de la période demandée, borné à la durée. */
export function elapsedMonths(asset: FixedAsset, period: string): number {
  const start = periodOf(asset.acquiredOn);
  if (period < start) return 0;
  return Math.min(asset.months, monthsBetween(start, period));
}

/**
 * Cumul dû à la fin d'une période. On calcule un cumul plutôt qu'une mensualité
 * répétée : l'arrondi ne dérive jamais, et le dernier mois tombe juste.
 */
export function accumulatedAt(asset: FixedAsset, period: string): Minor {
  const base = depreciableBase(asset);
  if (asset.months <= 0 || base === 0) return 0;
  const elapsed = elapsedMonths(asset, period);
  if (elapsed >= asset.months) return base;
  return Math.round((base * elapsed) / asset.months);
}

/** Ce qu'il reste à passer pour une période donnée, compte tenu du déjà passé. */
export function dueFor(asset: FixedAsset, period: string, alreadyPosted: Minor): Minor {
  if (asset.status === 'DISPOSED' && asset.disposedOn && periodOf(asset.disposedOn) < period) return 0;
  return Math.max(0, accumulatedAt(asset, period) - alreadyPosted);
}

export interface DepreciationLine {
  asset: FixedAsset;
  /** Déjà comptabilisé avant cette période. */
  posted: Minor;
  /** À comptabiliser pour la période. */
  amount: Minor;
  /** Valeur nette comptable après la dotation. */
  netValue: Minor;
}

/**
 * Plan de dotation d'une période : un bien par ligne, avec ce qui reste à
 * passer. Les périodes oubliées se rattrapent d'elles-mêmes, puisqu'on
 * raisonne en cumul.
 */
export function depreciationPlan(
  assets: FixedAsset[],
  history: Depreciation[],
  period: string,
): DepreciationLine[] {
  return assets
    .map((asset) => {
      const posted = history
        .filter((d) => d.assetId === asset.id && d.period <= period)
        .reduce((s, d) => s + d.amount, 0);
      const amount = dueFor(asset, period, posted);
      return { asset, posted, amount, netValue: asset.cost - (posted + amount) };
    })
    .filter((l) => l.amount > 0);
}

/** Valeur nette comptable d'un bien : ce qu'il « vaut » encore au bilan. */
export function netValue(asset: FixedAsset, history: Depreciation[]): Minor {
  const posted = history.filter((d) => d.assetId === asset.id).reduce((s, d) => s + d.amount, 0);
  return asset.cost - posted;
}

/** Dotation déjà comptabilisée sur un bien. */
export function postedFor(asset: FixedAsset, history: Depreciation[]): Minor {
  return history.filter((d) => d.assetId === asset.id).reduce((s, d) => s + d.amount, 0);
}

/** Durées d'usage courantes, proposées à la saisie. */
export const USEFUL_LIVES: { label: string; months: number }[] = [
  { label: 'Matériel informatique — 3 ans', months: 36 },
  { label: 'Mobilier et agencement — 5 ans', months: 60 },
  { label: 'Matériel et outillage — 5 ans', months: 60 },
  { label: 'Véhicule — 4 ans', months: 48 },
  { label: 'Construction — 20 ans', months: 240 },
];
