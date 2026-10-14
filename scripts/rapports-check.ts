/**
 * Document imprimable des rapports (audit jour 11, 14/10) : il s'ouvre dans la
 * même origine que l'application, donc rien de ce qu'on y écrit ne doit
 * pouvoir devenir du code — ni un nom de client venu de la place de marché,
 * ni un nom d'article, ni le nom de l'entreprise.
 *
 *   npx vite-node scripts/rapports-check.ts
 */
import { escapeHtml, reportHtml } from '../src/lib/report-doc';

const piege = '<img src=x onerror="alert(1)">';
const html = reportHtml({
  lang: 'fr',
  title: 'Ventes',
  subtitle: 'Historique',
  companyName: `Boutique ${piege}`,
  place: 'Douala</div><script>alert(2)</script>',
  period: 'Période du 2026-10-01 au 2026-10-14',
  meta: [['Devise', 'XAF'], ['CA de la période', '1 000 FCFA']],
  warning: `1 vente sans coût ${piege}`,
  head: ['Facture', 'Client'],
  rows: [['INV-1', piege], ['INV-2', "O'Neil & fils"]],
  totals: ['Total', '1 000'],
  empty: 'Aucune donnée',
  edited: 'Édité le 14/10/2026',
  lines: '2 ligne(s)',
});
const vide = reportHtml({ lang: 'en', title: 'Sales', subtitle: '', companyName: 'X', place: '—', period: '', meta: [], head: ['A', 'B'], rows: [], totals: ['T', '0'], empty: 'No data for this period', edited: '', lines: '0' });

let ko = 0;
const ok = (n: string, c: boolean) => { if (!c) ko++; console.log(c ? 'OK ' : 'KO ', n); };
ok('aucune balise <img> injectée', !/<img/i.test(html));
ok('une seule balise <script> (l’impression)', (html.match(/<script/gi) || []).length === 1);
ok('le nom piégé reste lisible, échappé', html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
ok('apostrophe et esperluette échappées', html.includes('O&#39;Neil &amp; fils'));
ok('avertissement affiché', html.includes('class="warn"'));
ok('totaux affichés quand il y a des lignes', html.includes('<tfoot>'));
ok('document vide : message, pas de totaux', vide.includes('No data for this period') && !vide.includes('<tfoot>'));
ok('langue du document', vide.includes('<html lang="en">'));
ok('pas d’avertissement quand il n’y a rien à dire', !vide.includes('class="warn"'));
ok('escapeHtml sur les cinq caractères', escapeHtml(`<>&"'`) === '&lt;&gt;&amp;&quot;&#39;');
process.exit(ko ? 1 : 0);
