import { parseAI } from '../src/lib/ai';
import { buildOpeningEntry } from '../src/lib/opening';
import { emptyDB } from '../src/lib/reducer';
import { countryProfile, profileToCompany } from '../src/lib/countries';
import { toMinor } from '../src/lib/money';

const reply = `J'ai lu le bilan au 31/12/2025. Total actif 3 450 000, total passif 3 450 000 : l'équilibre est vérifié.
\`\`\`opening
{"date":"2026-01-01","EQUIPMENT":450000,"INVENTORY":1200000,"CUSTOMERS":300000,"CASH":500000,"BANK":1000000,"SUPPLIERS":700000,"CAPITAL":2750000,"note":"La TVA à reverser n'apparaît pas."}
\`\`\``;

const parsed = parseAI(reply);
console.log('texte nettoyé :', parsed.text.slice(0, 70), '…');
console.log('bloc lu :', JSON.stringify(parsed.opening));

const profile = countryProfile('Cameroun')!;
const company = { ...emptyDB().company, ...profileToCompany(profile), currency: profile.currency };
const amounts = Object.fromEntries(
  Object.entries(parsed.opening!.amounts).filter(([k]) => k !== 'CAPITAL').map(([k, v]) => [k, toMinor(v, company.currency)]),
);
const entry = buildOpeningEntry(company, amounts, toMinor(parsed.opening!.amounts.CAPITAL, company.currency));
const debit = entry.lines.reduce((s, l) => s + l.debit, 0);
const credit = entry.lines.reduce((s, l) => s + l.credit, 0);
console.log('actif', entry.totalAssets, 'dettes', entry.totalLiabilities, 'capitaux', entry.equity);
console.log('écriture :', entry.lines.map((l) => `${l.account} D${l.debit} C${l.credit}`).join(' | '));
console.log('débit', debit, 'crédit', credit, debit === credit ? 'ÉQUILIBRÉE' : 'DÉSÉQUILIBRÉE');
