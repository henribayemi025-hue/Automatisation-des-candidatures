/** « 3 », « 2,5 », « -3 », « 1 000 » → nombre ; vide ou illisible → NaN. */
export function parseQty(raw: string): number {
  const clean = raw.replace(/[\s  ]/g, '').replace(',', '.');
  return clean ? Number(clean) : NaN;
}

/** Une quantité affichée comme on l'écrit : « 1,5 » en français, « 1.5 » en anglais ; trois décimales au plus. */
export function formatQty(n: number, lang: 'fr' | 'en' = 'fr'): string {
  const s = String(Number(n.toFixed(3)));
  return lang === 'fr' ? s.replace('.', ',') : s;
}
