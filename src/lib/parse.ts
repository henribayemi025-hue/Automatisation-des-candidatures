/** « 3 », « 2,5 », « -3 », « 1 000 » → nombre ; vide ou illisible → NaN. */
export function parseQty(raw: string): number {
  const clean = raw.replace(/[\s  ]/g, '').replace(',', '.');
  return clean ? Number(clean) : NaN;
}
