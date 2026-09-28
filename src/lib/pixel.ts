import { inNativeApp } from './shell';

/**
 * Pixel Meta (Facebook/Instagram) de Beau, pour mesurer ses campagnes de
 * publicité. Identifiant public — il apparaît dans le code de n'importe
 * quelle page qui l'utilise, ce n'est pas une clé secrète.
 *
 * Règles reprises de la place de marché (même identifiant Meta, même
 * décision de Beau, 28/09) :
 * - Accord obligatoire avant chargement dans l'UE, l'EEE, le Royaume-Uni et
 *   la Suisse (RGPD/ePrivacy). Pays inconnu (avant l'installation, ou
 *   « Autre ») : bandeau par précaution, même règle. Ailleurs, la mention
 *   dans la politique de confidentialité suffit.
 * - Jamais l'image de repli `facebook.com/tr?...&noscript=1` posée en
 *   JavaScript : elle ne sert qu'aux navigateurs sans JavaScript dans
 *   l'extrait de Meta, et injectée en plus du suivi normal elle compte
 *   chaque page deux fois (défaut trouvé et corrigé côté place de marché le
 *   28/09 — des chiffres de pub gonflés).
 */
export const PIXEL_ID = '1530672592412912';

const EU_EEA_UK_CH = new Set([
  'France', 'Belgique', 'Luxembourg', 'Royaume-Uni', 'Irlande', 'Allemagne',
  'Espagne', 'Italie', 'Portugal', 'Pays-Bas', 'Suisse',
]);

export function requiresConsent(country: string | undefined): boolean {
  if (!country || country === 'Autre') return true;
  return EU_EEA_UK_CH.has(country);
}

const CONSENT_KEY = 'finia.pixel.consent';

export function getConsent(): 'accepted' | 'declined' | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'accepted' || v === 'declined' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: 'accepted' | 'declined') {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    // Navigation privée ou stockage bloqué : le bandeau réapparaîtra la
    // prochaine fois, sans autre conséquence.
  }
}

let loaded = false;

/** Charge le pixel Meta une seule fois par session de navigation. */
export function loadPixel() {
  // Jamais dans la fenêtre de l'application Finjaro des magasins (voir
  // shell.ts) : un pixel publicitaire DANS une app native relève du pistage
  // inter-app au sens d'Apple (App Tracking Transparency) et expose l'app à
  // un refus en revue. Même garde-fou que la place de marché.
  if (loaded || typeof window === 'undefined' || inNativeApp()) return;
  loaded = true;
  const w = window as unknown as { fbq?: any; _fbq?: any };
  if (!w.fbq) {
    const fbq: any = (...args: unknown[]) => {
      fbq.callMethod ? fbq.callMethod.apply(fbq, args) : fbq.queue.push(args);
    };
    w.fbq = fbq;
    w._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
  w.fbq('init', PIXEL_ID);
  w.fbq('track', 'PageView');
  lastView = currentPath();
}

// L'écran dont la page vue est déjà comptée. Au premier affichage, le
// bandeau (enfant d'App) charge le pixel et compte la page, PUIS l'effet
// d'App appelle trackPageView pour le même écran : sans ce repère, la
// première page partait deux fois chez Meta.
let lastView: string | null = null;

function currentPath(): string {
  // Routeur par dièse : l'écran est dans `#/…`, pas dans le chemin.
  return window.location.hash.replace(/^#/, '').split('?')[0] || '/';
}

/** Un PageView par écran — sans effet tant que le pixel n'est pas chargé. */
export function trackPageView() {
  const w = window as unknown as { fbq?: (...args: unknown[]) => void };
  if (!loaded || !w.fbq) return;
  const path = currentPath();
  if (path === lastView) return;
  lastView = path;
  w.fbq('track', 'PageView');
}
