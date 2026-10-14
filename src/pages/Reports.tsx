import { localISO } from '../lib/dates';
import { useState } from 'react';
import { useDB } from '../lib/store';
import { balanceSheet, incomeStatement, trialBalance } from '../lib/ledger';
import { monthStart, outstanding, productPerformance, saleRevenue } from '../lib/metrics';
import { formatMoney, currency as currencyOf } from '../lib/money';
import { buildFec, fecFileName, fecPartiesFrom } from '../lib/fec';
import { fiscalYearStart } from '../lib/kpi';
import { salesWithoutCost } from '../lib/liaison';
import { reportHtml } from '../lib/report-doc';
import type { Minor } from '../lib/types';
import { Field, PageHeader } from '../components/UI';
import { IconBook, IconBox, IconCard, IconDoc, IconReceipt, IconScale, IconTrend } from '../components/Icons';
import { locale, t, useLang } from '../lib/i18n';

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Espèces',
  MOBILE: 'Mobile money',
  CARD: 'Carte',
  BANK: 'Virement',
  CREDIT: 'Crédit',
};

function previousMonth(): { from: string; to: string } {
  const d = new Date();
  return { from: localISO(new Date(d.getFullYear(), d.getMonth() - 1, 1)), to: localISO(new Date(d.getFullYear(), d.getMonth(), 0)) };
}

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
  const [to, setTo] = useState(localISO());
  const [blocked, setBlocked] = useState(false);
  const { lang } = useLang();
  const today = localISO();
  const last = previousMonth();
  const yearFrom = fiscalYearStart(db.company.fiscalYearStart, today);
  const preset = from === monthStart() && to === today ? 'month' : from === last.from && to === last.to ? 'last' : from === yearFrom && to === today ? 'year' : '';

  const money = (v: Minor) => formatMoney(v, db.company.currency);

  function buildRows(id: ReportId): { head: string[]; rows: string[][]; totals?: string[] } {
    switch (id) {
      case 'SALES': {
        const sales = db.sales.filter((s) => s.status === 'CONFIRMED' && s.date >= from && s.date <= to);
        return {
          head: [t('Facture'), t('Date'), t('Client'), t('Paiement'), t('Total'), t('Payé')],
          rows: sales.map((s) => [s.number, s.date, s.customerName, t(METHOD_LABEL[s.method] ?? s.method), money(s.total), money(s.paid)]),
          totals: ['', '', '', t('Total'), money(sales.reduce((x, s) => x + s.total, 0)), money(sales.reduce((x, s) => x + s.paid, 0))],
        };
      }
      case 'INVENTORY': {
        const products = db.products.filter((p) => !p.archived);
        return {
          head: [t('Produit'), t('Référence'), t('Quantité'), t('Coût unitaire'), t('Valeur')],
          rows: products.map((p) => [p.name, p.sku || '—', String(p.stock), money(p.cost), money(Math.max(0, p.stock) * p.cost)]),
          totals: ['', '', '', t('Total'), money(products.reduce((s, p) => s + Math.max(0, p.stock) * p.cost, 0))],
        };
      }
      case 'EXPENSES': {
        const list = db.expenses.filter((e) => e.date >= from && e.date <= to);
        return {
          head: [t('Date'), t('Catégorie'), t('Compte'), t('Description'), t('Montant')],
          rows: list.map((e) => [e.date, e.category, e.account, e.description || '—', money(e.amount)]),
          totals: ['', '', '', t('Total'), money(list.reduce((s, e) => s + e.amount, 0))],
        };
      }
      case 'MARGINS': {
        const perf = productPerformance(db, from, to);
        return {
          head: [t('Produit'), t('Quantité'), t('CA'), t('Coût'), t('Marge')],
          rows: perf.map((p) => [p.name, String(p.qty), money(p.revenue), money(p.cost), money(p.margin)]),
          totals: ['', '', money(perf.reduce((s, p) => s + p.revenue, 0)), money(perf.reduce((s, p) => s + p.cost, 0)), money(perf.reduce((s, p) => s + p.margin, 0))],
        };
      }
      case 'INCOME': {
        const income = incomeStatement(db.accounts, db.entries, from, to);
        return {
          head: [t('Compte'), t('Intitulé'), t('Nature'), t('Montant')],
          rows: [
            ...income.revenue.map((b) => [b.account.code, t(b.account.label), t('Produit'), money(b.balance)]),
            ...income.expenses.map((b) => [b.account.code, t(b.account.label), t('Charge'), money(b.balance)]),
          ],
          totals: ['', '', t('Résultat net'), money(income.netIncome)],
        };
      }
      case 'BALANCE': {
        const balances = trialBalance(db.accounts, db.entries, from, to);
        return {
          head: [t('Compte'), t('Intitulé'), t('Débit'), t('Crédit'), t('Solde')],
          rows: balances.map((b) => [b.account.code, t(b.account.label), money(b.debit), money(b.credit), money(b.balance)]),
          totals: ['', t('Totaux'), money(balances.reduce((s, b) => s + b.debit, 0)), money(balances.reduce((s, b) => s + b.credit, 0)), ''],
        };
      }
      case 'RECEIVABLES': {
        const open = db.debts.filter((d) => outstanding(d) > 0);
        return {
          head: [t('Tiers'), t('Type'), t('Origine'), t('Date'), t('Montant'), t('Reste dû')],
          rows: open.map((d) => [
            d.partyName,
            d.party === 'CUSTOMER' ? t('Créance client') : t('Dette fournisseur'),
            d.origin,
            d.date,
            money(d.amount),
            money(outstanding(d)),
          ]),
          totals: ['', '', '', t('Total'), '', money(open.reduce((s, d) => s + outstanding(d), 0))],
        };
      }
    }
  }

  function generate(def: ReportDef) {
    const { head, rows, totals } = buildRows(def.id);
    const sheet = def.id === 'BALANCE' ? balanceSheet(db.accounts, db.entries, to) : null;
    const revenue = db.sales
      .filter((s) => s.status === 'CONFIRMED' && s.date >= from && s.date <= to)
      .reduce((s, x) => s + saleRevenue(x), 0);
    // Une vente de la place de marché sans coût d'achat pèse son prix entier
    // dans la marge et le résultat : le document le dit au lieu de l'afficher
    // comme un bénéfice acquis.
    const noCost = def.id === 'MARGINS' || def.id === 'INCOME' ? salesWithoutCost(db, from, to) : null;

    const html = reportHtml({
      lang,
      title: t(def.title),
      subtitle: t(def.subtitle),
      companyName: db.company.name,
      place: [db.company.city, db.company.country].filter(Boolean).join(', ') || '—',
      period: def.ranged ? t('Période du {from} au {to}', { from, to }) : t('Arrêté au {date}', { date: today }),
      meta: [
        [t('Devise'), db.company.currency],
        [t('Référentiel'), db.company.chart],
        ...(def.ranged ? [[t('CA de la période'), money(revenue)] as [string, string]] : []),
        ...(sheet ? [[t('Équilibre'), sheet.difference === 0 ? t('vérifié') : t('écart détecté')] as [string, string]] : []),
      ],
      warning: noCost?.sales.length
        ? t('{n} vente(s) de la place de marché sans coût d’achat sur la période : la marge et le résultat sont surestimés d’au plus {amount}. Complétez le coût dans Ventes.', { n: noCost.sales.length, amount: money(noCost.exposure) })
        : undefined,
      head,
      rows,
      totals,
      empty: t('Aucune donnée sur la période'),
      edited: t('Édité le {date}', { date: new Date().toLocaleString(locale()) }),
      lines: t('{n} ligne(s) — document généré par Finjaro Accounting', { n: rows.length }),
    });

    const w = window.open('', '_blank');
    setBlocked(!w);
    if (!w) return;
    w.document.write(html);
    w.document.close();
  }

  function exportFec() {
    const text = buildFec(db.accounts, db.entries, { from, to, decimals: currencyOf(db.company.currency).decimals, parties: fecPartiesFrom(db) });
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
        <div className="flex w-full flex-wrap gap-2" role="group" aria-label={t('Période')}>
          {(
            [
              ['month', 'Ce mois-ci', () => { setFrom(monthStart()); setTo(today); }],
              ['last', 'Mois dernier', () => { setFrom(last.from); setTo(last.to); }],
              ['year', 'Exercice en cours', () => { setFrom(yearFrom); setTo(today); }],
            ] as [string, string, () => void][]
          ).map(([key, lab, go]) => (
            <button key={key} type="button" aria-pressed={preset === key} onClick={go} className={preset === key ? 'btn-dark' : 'btn-ghost'}>
              {t(lab)}
            </button>
          ))}
        </div>
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

      {blocked && (
        <p role="alert" className="card mb-6 text-sm font-semibold text-brand-600">
          {t('Le navigateur a bloqué la fenêtre du document. Autorisez les fenêtres pour ce site, puis réessayez.')}
        </p>
      )}

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
