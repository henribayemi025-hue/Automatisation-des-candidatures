// D'où vient la personne (demande d'Alpha et de Beau, 02/10).
//
// WhatsApp et TikTok n'envoient pas de site d'origine : on lit donc le mot
// mis dans le lien d'arrivée, ?src= ou utm_source (avant le #, ou dans le
// #/route?src=). On garde celui de la visite (session) et le PREMIER vu
// pendant 30 jours. Rien de personnel : juste le mot, nettoyé.

const SESSION_KEY = 'finia.src';
const FIRST_KEY = 'finia.src.first';
const THIRTY_DAYS = 30 * 24 * 3600 * 1000;

function clean(v: string | null): string {
  return (v ?? '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
}

/** À appeler une fois au démarrage, avant que le routeur ne touche à l'adresse. */
export function captureSource(): void {
  try {
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.slice(window.location.hash.indexOf('?')) : '';
    const params = [new URLSearchParams(window.location.search), new URLSearchParams(hashQuery)];
    const src = params.map((p) => clean(p.get('src')) || clean(p.get('utm_source'))).find(Boolean) ?? '';
    if (!src) return;
    sessionStorage.setItem(SESSION_KEY, src);
    const first = JSON.parse(localStorage.getItem(FIRST_KEY) ?? 'null') as { v: string; at: number } | null;
    if (!first || Date.now() - first.at > THIRTY_DAYS) localStorage.setItem(FIRST_KEY, JSON.stringify({ v: src, at: Date.now() }));
  } catch {
    // Stockage bloqué (navigation privée) : on fait sans étiquette.
  }
}

/** Étiquettes connues : la première (30 jours) et celle de la visite. */
export function currentSource(): { first: string; visit: string } {
  let first = '';
  let visit = '';
  try {
    const f = JSON.parse(localStorage.getItem(FIRST_KEY) ?? 'null') as { v: string; at: number } | null;
    if (f && Date.now() - f.at <= THIRTY_DAYS) first = clean(f.v);
    visit = clean(sessionStorage.getItem(SESSION_KEY));
  } catch {
    /* sans stockage, sans étiquette */
  }
  return { first: first || visit, visit: visit || first };
}
