import { saleTotals } from '../src/lib/reducer';
import { emptyDB } from '../src/lib/reducer';
import type { Company, SaleLine } from '../src/lib/types';

const base = emptyDB().company;
const lines: SaleLine[] = [{ productId: 'p', name: 'Sac de riz 25 kg', qty: 1, unitPrice: 18000, unitCost: 14500 }];

const shop: Company = { ...base, currency: 'XAF', vatEnabled: true, vatRateBp: 1925, pricesIncludeTax: true };
const firm: Company = { ...shop, pricesIncludeTax: false };

for (const [name, c] of [['prix TTC (boutique)', shop], ['prix HT (entreprise)', firm]] as const) {
  const t = saleTotals(c, lines, 0);
  console.log(`${name.padEnd(22)} étiquette 18 000 → client paie ${t.total} · CA ${t.net} · TVA ${t.vat}`);
}
const withDiscount = saleTotals(shop, lines, 1000);
console.log('TTC avec remise 1 000  → client paie', withDiscount.total, '· CA', withDiscount.net, '· TVA', withDiscount.vat);
const noTax = saleTotals({ ...shop, vatEnabled: false }, lines, 0);
console.log('sans taxe              → client paie', noTax.total, '· CA', noTax.net, '· TVA', noTax.vat);
