/**
 * Les réglages que l'assistante sait changer quand on le lui demande (B7).
 *
 * Beau, 14/10 : « mets le mode light » → l'assistante a répondu qu'il n'existe
 * que les modes Simple et Expert. Faux : le thème clair ou sombre existe. Ces
 * demandes ne passent plus par un modèle : on les reconnaît ici, on applique
 * le réglage tout de suite, et la réponse dit exactement ce qui a changé.
 */
import type { ThemeChoice } from './theme';
import type { AppMode } from './types';
import { CURRENCIES } from './money';

export type SettingsIntent =
  | { kind: 'theme'; value: ThemeChoice }
  | { kind: 'lang'; value: 'fr' | 'en' }
  | { kind: 'mode'; value: AppMode }
  | { kind: 'currency'; code: string | null }
  | { kind: 'list' };

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'").toLowerCase();

/** Mots courants pour une devise ; le code ISO (EUR, XAF…) est reconnu aussi. */
const CURRENCY_WORDS: [RegExp, string][] = [
  [/\b(euros?|eur)\b/, 'EUR'],
  [/\b(dollars? canadiens?|cad)\b/, 'CAD'],
  [/\b(dollars? americains?|dollars?|usd)\b/, 'USD'],
  [/\b(livres? sterling|livres?|gbp|pounds?)\b/, 'GBP'],
  [/\b(fcfa|f cfa|xaf)\b/, 'XAF'],
  [/\bxof\b/, 'XOF'],
  [/\b(nairas?|ngn)\b/, 'NGN'],
  [/\b(cedis?|ghs)\b/, 'GHS'],
  [/\b(shillings? kenyans?|kes)\b/, 'KES'],
  [/\b(dirhams?|mad)\b/, 'MAD'],
];

function currencyIn(q: string): string | null {
  for (const [re, code] of CURRENCY_WORDS) if (re.test(q) && CURRENCIES.some((c) => c.code === code)) return code;
  const iso = q.toUpperCase().match(/\b[A-Z]{3}\b/g) ?? [];
  return iso.find((c) => CURRENCIES.some((x) => x.code === c)) ?? null;
}

export function settingsIntent(question: string): SettingsIntent | null {
  const q = plain(question.trim());
  if (!q) return null;

  // « Quels réglages ? » : ce que l'assistante peut changer.
  if (/\b(quels?|quelles?|que)\b.*\b(reglages?|parametres?|options?)\b/.test(q) || /\bwhat settings\b/.test(q)) return { kind: 'list' };

  // Thème : il faut un mot d'affichage ET une couleur, pour ne pas prendre
  // « les ventes de la nuit » pour une demande de thème.
  const display = /\b(mode|theme|affichage|ecran|fond|couleur|interface|appli|application)\b/.test(q) || /\b(dark|light)\s*mode\b/.test(q);
  if (display) {
    if (/\b(sombre|nuit|dark|noir|fonce)\b/.test(q)) return { kind: 'theme', value: 'dark' };
    if (/\b(clair|jour|light|blanc)\b/.test(q)) return { kind: 'theme', value: 'light' };
    if (/\b(theme|affichage)\b/.test(q) && /\b(automatique|auto|systeme|telephone|ordinateur)\b/.test(q)) return { kind: 'theme', value: 'system' };
  }

  // Langue de l'application (« réponds en anglais » n'est pas un réglage :
  // c'est une demande à l'assistante, laissée au modèle).
  const appWord = /\b(langue|language|application|appli|interface|menus?|passe|passer|mets|mettre|change|changer|switch|affiche)\b/.test(q);
  if (appWord && !/\breponds?\b|\breponse\b|\becris\b/.test(q)) {
    if (/\b(en anglais|in english|to english|anglais|english)\b/.test(q)) return { kind: 'lang', value: 'en' };
    if (/\b(en francais|in french|to french|francais|french)\b/.test(q)) return { kind: 'lang', value: 'fr' };
  }

  // Mode de l'application.
  if (/\b(mode|vue|version)\s+(expert|complet|comptable)\b/.test(q) || /\b(passe|passer|mets|active|activer)\b.*\bexpert\b/.test(q)) return { kind: 'mode', value: 'EXPERT' };
  if (/\b(mode|vue|version)\s+(simple|simplifie|facile)\b/.test(q) || /\b(passe|passer|mets|active|activer)\b.*\bsimple\b/.test(q)) return { kind: 'mode', value: 'SIMPLE' };

  // Devise : un verbe de changement et le mot devise ou monnaie.
  if (/\b(devise|monnaie|currency)\b/.test(q) && /\b(change|changer|passe|passer|mets|mettre|utilise|utiliser|switch|set)\b/.test(q)) {
    return { kind: 'currency', code: currencyIn(q) };
  }
  return null;
}
