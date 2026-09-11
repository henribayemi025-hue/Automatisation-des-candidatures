import { useState } from 'react';
import { useDB } from '../lib/store';
import { balanceSheet, incomeStatement, trialBalance } from '../lib/ledger';
import { monthStart, outstanding, productPerformance, saleRevenue } from '../lib/metrics';
import { formatMoney, currency as currencyOf } from '../lib/money';
import { buildFec, fecFileName } from '../lib/fec';
import type { Minor } from '../lib/types';
import { Field, PageHeader } from '../components/UI';
import { IconBook, IconBox, IconCard, IconDoc, IconReceipt, IconScale, IconTrend } from '../components/Icons';
import { locale, t } from '../lib/i18n';

type ReportId = 'SALES' | 'INVENTORY' | 'EXPENSES' | 'MARGINS' | 'INCOME' | 'BALANCE' | 'RECEIVABLES';

interface ReportDef {
  id: ReportId;
  title: string;
  subtitle: string;
  icon: JSX.Element;
  ranged: boolean;
}

const REPORTS: ReportDef[] = [
  { id: 'SALES', title: 'Ventes', subtitle: 'Historique et chiffre d’affaires', icon: <IconReceipt />, ranged: true },
  { id: 'INVENTORY', title: 'Inventaire', subtitle: 'Stock actuel et valorisation', icon: <IconBox />, ranged: false },
  { id: 'EXPENSES', title: 'Dépenses', subtitle: 'Sorties par catégorie', icon: <IconCard />, ranged: true },
  { id: 'MARGINS', title: 'Marges', subtitle: 'Profits par produit', icon: <IconTrend />, ranged: true },
  { id: 'INCOME', title: 'Compte de résultat', subtitle: 'Produits, charges et résultat', icon: <IconBook />, ranged: true },
  { id: 'BALANCE', title: 'Balance générale', subtitle: 'Soldes de tous les comptes', icon: <IconScale />, ranged: true },
  { id: 'RECEIVABLES', title: 'Créances & dettes', subtitle: 'Encours par tiers', icon: <IconDoc />, ranged: false },
];

export default function Reports() {
  const db = useDB();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const money = (v: Minor) => formatMoney(v, db.company.currency);

  function buildRows(id: ReportId): { head: string[]; rows: string[][]; totals?: string[] } {
    switch (id) {
      case 'SALES': {
        const sales = db.sales.filter((s) => s.status === 'CONFIRMED' && s.date >= from && s.date <= to);
        return {
          head: ['Facture', 'Date', 'Client', 'Paiement', 'Total', 'Payé'],
          rows: sales.map((s) => [s.number, s.date, s.customerName, s.method, money(s.total), money(s.paid)]),
          totals: ['', '', '', 'Total', money(sales.reduce((x, s) => x + s.total, 0)), money(sales.reduce((x, s) => x + s.paid, 0))],
        };
      }
      case 'INVENTORY': {
        const products = db.products.filter((p) => !p.archived);
        return {
          head: ['Produit', 'Référence', 'Quantité', 'Coût unitaire', 'Valeur'],
          rows: products.map((p) => [p.name, p.sku || '—', String(p.stock), money(p.cost), money(Math.max(0, p.stock) * p.cost)]),
          totals: ['', '', '', 'Total', money(products.reduce((s, p) => s + Math.max(0, p.stock) * p.cost, 0))],
        };
      }
      case 'EXPENSES': {
        const list = db.expenses.filter((e) => e.date >= from && e.date <= to);
        return {
          head: ['Date', 'Catégorie', 'Compte', 'Description', 'Montant'],
          rows: list.map((e) => [e.date, e.category, e.account, e.description || '—', money(e.amount)]),
          totals: ['', '', '', 'Total', money(list.reduce((s, e) => s + e.amount, 0))],
        };
      }
      case 'MARGINS': {
        const perf = productPerformance(db, from, to);
        return {
          head: ['Produit', 'Quantité', 'CA', 'Coût', 'Marge'],
          rows: perf.map((p) => [p.name, String(p.qty), money(p.revenue), money(p.cost), money(p.margin)]),
          totals: ['', '', money(perf.reduce((s, p) => s + p.revenue, 0)), money(perf.reduce((s, p) => s + p.cost, 0)), money(perf.reduce((s, p) => s + p.margin, 0))],
        };
      }
      case 'INCOME': {
        const income = incomeStatement(db.accounts, db.entries, from, to);
        return {
          head: ['Compte', 'Intitulé', 'Nature', 'Montant'],
          rows: [
            ...income.revenue.map((b) => [b.account.code, b.account.label, 'Produit', money(b.balance)]),
            ...income.expenses.map((b) => [b.account.code, b.account.label, 'Charge', money(b.balance)]),
          ],
          totals: ['', '', 'Résultat net', money(income.netIncome)],
        };
      }
      case 'BALANCE': {
        const balances = trialBalance(db.accounts, db.entries, from, to);
        return {
          head: ['Compte', 'Intitulé', 'Débit', 'Crédit', 'Solde'],
          rows: balances.map((b) => [b.account.code, b.account.label, money(b.debit), money(b.credit), money(b.balance)]),
          totals: ['', 'Totaux', money(balances.reduce((s, b) => s + b.debit, 0)), money(balances.reduce((s, b) => s + b.credit, 0)), ''],
        };
      }
      case 'RECEIVABLES': {
        const open = db.debts.filter((d) => outstanding(d) > 0);
        return {
          head: ['Tiers', 'Type', 'Origine', 'Date', 'Montant', 'Reste dû'],
          rows: open.map((d) => [
            d.partyName,
            d.party === 'CUSTOMER' ? 'Créance client' : 'Dette fournisseur',
            d.origin,
            d.date,
            money(d.amount),
            money(outstanding(d)),
          ]),
          totals: ['', '', '', 'Total', '', money(open.reduce((s, d) => s + outstanding(d), 0))],
        };
      }
    }
  }

  function generate(def: ReportDef) {
    const { head, rows, totals } = buildRows(def.id);
    const sheet = def.id === 'BALANCE' ? balanceSheet(db.accounts, db.entries, to) : null;
    const period = def.ranged ? `Période du ${from} au ${to}` : `Arrêté au ${new Date().toISOString().slice(0, 10)}`;
    const revenue = db.sales
      .filter((s) => s.status === 'CONFIRMED' && s.date >= from && s.date <= to)
      .reduce((s, x) => s + saleRevenue(x), 0);

    const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${def.title} — ${db.company.name}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Inter,system-ui,sans-serif;margin:0;padding:32px;color:#0f1420}
  header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #C25E38;padding-bottom:16px;margin-bottom:24px}
  h1{margin:0;font-size:22px}
  .muted{color:#64748b;font-size:12px;margin-top:4px}
  .brand{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#AC4F2D}
  table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}
  th{text-align:left;background:#f1f5f9;padding:8px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#475569}
  td{padding:8px;border-bottom:1px solid #e2e8f0}
  tfoot td{font-weight:800;border-top:2px solid #0f1420;border-bottom:none}
  .meta{display:flex;gap:24px;font-size:12px;color:#475569;margin-bottom:16px}
  footer{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between}
  @media print{body{padding:16px}}
</style></head><body>
<header>
  <div>
    <div class="brand">Finjaro Accounting</div>
    <h1>${def.title}</h1>
    <div class="muted">${def.subtitle}</div>
  </div>
  <div style="text-align:right">
    <div style="font-weight:700">${db.company.name}</div>
    <div class="muted">${[db.company.city, db.company.country].filter(Boolean).join(', ') || '—'}</div>
    <div class="muted">${period}</div>
  </div>
</header>
<div class="meta">
  <span><strong>Devise :</strong> ${db.company.currency}</span>
  <span><strong>Référentiel :</strong> ${db.company.chart}</span>
  ${def.ranged ? `<span><strong>CA de la période :</strong> ${money(revenue)}</span>` : ''}
  ${sheet ? `<span><strong>Équilibre :</strong> ${sheet.difference === 0 ? 'vérifié' : 'écart détecté'}</span>` : ''}
</div>
<table>
  <thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${
    rows.length
      ? rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${head.length}" style="text-align:center;color:#94a3b8;padding:32px">Aucune donnée sur la période</td></tr>`
  }</tbody>
  ${totals && rows.length ? `<tfoot><tr>${totals.map((c) => `<td>${c}</td>`).join('')}</tr></tfoot>` : ''}
</table>
<footer>
  <span>Édité le ${new Date().toLocaleString(locale())}</span>
  <span>${rows.length} ligne(s) — document généré par Finjaro Accounting</span>
</footer>
<script>window.onload=function(){window.print()}</script>
</body></html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
  }

  function exportFec() {
    const text = buildFec(db.accounts, db.entries, { from, to, decimals: currencyOf(db.company.currency).decimals });
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fecFileName(db.company, to);
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title={t('Rapports & exports')}
        subtitle={t('Documents imprimables ou enregistrables en PDF depuis le navigateur')}
      />

      <div className="card mb-6 flex flex-wrap items-end gap-3">
        <Field label={t('Du')}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
        </Field>
        <Field label={t('Au')}>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
        </Field>
        <p className="text-xs text-slate-400">
          {t('La période s\'applique aux rapports datés. L\'inventaire et les encours sont toujours arrêtés au jour même.')}
        </p>
      </div>

      {/* Le FEC est le seul export que l'administration fiscale française sait
          lire telle quelle : journal complet, une ligne par ligne d'écriture. */}
      <div className="card mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold">{t('Fichier des écritures comptables (FEC)')}</h2>
          <p className="text-caption text-muted">
            {t('Le journal complet de la période, au format exigé en cas de contrôle fiscal. À transmettre tel quel au comptable.')}
          </p>
        </div>
        <button onClick={exportFec} className="btn-dark shrink-0">
          <IconDoc className="h-4 w-4" />
          {t('Exporter le FEC')}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => (
          <div key={r.id} className="card flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-500/15">{r.icon}</span>
              {!r.ranged && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{t('Instantané')}</span>
              )}
            </div>
            <div>
              <h2 className="font-bold">{t(r.title)}</h2>
              <p className="text-sm text-slate-500">{t(r.subtitle)}</p>
            </div>
            <button onClick={() => generate(r)} className="btn-dark mt-auto w-full">
              <IconDoc className="h-4 w-4" />
              {t('Générer le document')}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
