// Dates MÉTIER en heure locale (audit jour 4, n° 6 ; précautions d'Alpha du 02/10).
//
// toISOString() donne la date de Londres : à Toronto, une vente de 20 h était
// datée du lendemain ; à Douala, une vente de 0 h 30, de la veille. Le jour
// d'une vente, d'une dépense ou d'une clôture se lit donc sur l'horloge LOCALE.
// Les horodatages (création, synchro, finia_events.at) restent en temps
// universel : le tri et la reprise après coupure s'appuient dessus.

/** AAAA-MM-JJ du jour de `d`, à l'heure de l'appareil. */
export function localISO(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const j = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${j}`;
}
