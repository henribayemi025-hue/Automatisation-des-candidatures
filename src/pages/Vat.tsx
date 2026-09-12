import { useMemo, useState } from 'react';
import { today, useStore } from '../lib/store';
import { entriesInRange } from '../lib/ledger';
import { periodBounds } from '../lib/payroll';
import { FigureStrip, Money, PageHeader, Table } from '../components/UI';
import { t } from '../lib/i18n';

/**
 * Déclaration de TVA. C'est la première chose qu'un fiscaliste demande :
 * combien de taxe a été collectée sur les ventes, combien a été payée sur les
 * achats (y compris à la douane), et ce qui reste à reverser — ou le crédit à
 * reporter. Tout vient du grand livre : rien n'est recalculé à côté.
 */

type Row = { date: string; ref: string; label: string; base: number; vat: number };

export default function Vat() {
  const { db, code } = useStore();
  const [period, setPeriod] = useState(today().slice(0, 7));
  const { from, to } = periodBounds(period);

  const collected = code('VAT_COLLECTED');
  const deductible = code('VAT_DEDUCTIBLE');
  const label = db.company.taxLabel || t('TVA');

  const { sales, purchases, sumSales, sumPurchases, baseSales, baseBuys } = useMemo(() => {
    const salesRows: Row[] = [];
    const buyRows: Row[] = [];
    // On ignore le journal de clôture : il solde les comptes, il ne déclare rien.
    for (const e of entriesInRange(db.entries, from, to).filter((x) => x.journal !== 'CL')) {
      const vatOut = e.lines.filter((l) => l.account === collected).reduce((s, l) => s + l.credit - l.debit, 0);
      const vatIn = e.lines.filter((l) => l.account === deductible).reduce((s, l) => s + l.debit - l.credit, 0);
      // La base, c'est ce que l'écriture porte en produits (ventes) ou en
      // stock / charges (achats) — hors trésorerie et hors tiers.
      const isTaxLine = (acc: string) => acc === collected || acc === deductible;
      if (vatOut !== 0) {
        const base = e.lines
          .filter((l) => !isTaxLine(l.account) && db.accounts.find((a) => a.code === l.account)?.kind === 'REVENUE')
          .reduce((s, l) => s + l.credit - l.debit, 0);
        salesRows.push({ date: e.date, ref: e.ref, label: e.label, base, vat: vatOut });
      }
      if (vatIn !== 0) {
        const base = e.lines
          .filter((l) => !isTaxLine(l.account))
          .filter((l) => {
            const kind = db.accounts.find((a) => a.code === l.account)?.kind;
            return kind === 'EXPENSE' || db.accounts.find((a) => a.code === l.account)?.class === 3;
          })
          .reduce((s, l) => s + l.debit - l.credit, 0);
        buyRows.push({ date: e.date, ref: e.ref, label: e.label, base, vat: vatIn });
      }
    }
    return {
      sales: salesRows,
      purchases: buyRows,
      sumSales: salesRows.reduce((s, r) => s + r.vat, 0),
      sumPurchases: buyRows.reduce((s, r) => s + r.vat, 0),
      baseSales: salesRows.reduce((s, r) => s + r.base, 0),
      baseBuys: buyRows.reduce((s, r) => s + r.base, 0),
    };
  }, [db.entries, db.accounts, from, to, collected, deductible]);

  const net = sumSales - sumPurchases;

  if (!db.company.vatEnabled) {
    return (
      <>
        <PageHeader title={t('Déclaration de {tax}', { tax: label })} subtitle={t('Ce que vous devez reverser, période par période')} />
        <div className="card text-caption text-muted">
          {t('La taxe est désactivée dans les paramètres de l’entreprise. Activez-la pour voir la déclaration.')}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t('Déclaration de {tax}', { tax: label })}
        subtitle={t('Ce que vous devez reverser, période par période')}
        actions={<input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="field w-auto" />}
      />

      <div className="mb-5">
        <FigureStrip
          items={[
            { label: t('{tax} collectée sur les ventes', { tax: label }), value: <Money value={sumSales} />, hint: t('base {b}', { b: String(baseSales) }) },
            { label: t('{tax} déductible sur les achats', { tax: label }), value: <Money value={sumPurchases} />, hint: t('achats, dépenses, douane') },
            {
              label: net >= 0 ? t('{tax} à reverser', { tax: label }) : t('Crédit de {tax} à reporter', { tax: label }),
              value: <Money value={Math.abs(net)} />,
              tone: net > 0 ? 'negative' : 'positive',
              hint: net >= 0 ? t('collectée − déductible') : t('vous avez payé plus que collecté'),
            },
            { label: t('Taux'), value: <span className="num">{(db.company.vatRateBp / 100).toFixed(2)} %</span>, hint: db.company.country || '' },
          ]}
        />
      </div>

      <p className="mb-5 text-caption text-muted">
        {t('Période du {from} au {to}. Les montants viennent directement du journal : chaque ligne ci-dessous est une écriture que votre comptable peut ouvrir.', { from, to })}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-0">
          <div className="border-b border-hairline px-5 py-4">
            <h2 className="font-bold">{t('Collectée — ventes')}</h2>
          </div>
          {sales.length ? (
            <Table head={[t('Date'), t('Pièce'), t('Base HT'), label]}>
              {sales.map((r, i) => (
                <tr key={`${r.ref}-${i}`} className="row">
                  <td className="td num text-muted">{r.date}</td>
                  <td className="td num">{r.ref}</td>
                  <td className="td num"><Money value={r.base} /></td>
                  <td className="td num font-semibold"><Money value={r.vat} /></td>
                </tr>
              ))}
            </Table>
          ) : (
            <p className="px-5 py-6 text-caption text-muted">{t('Aucune vente taxée sur la période.')}</p>
          )}
        </div>

        <div className="card p-0">
          <div className="border-b border-hairline px-5 py-4">
            <h2 className="font-bold">{t('Déductible — achats, dépenses, douane')}</h2>
          </div>
          {purchases.length ? (
            <Table head={[t('Date'), t('Pièce'), t('Base HT'), label]}>
              {purchases.map((r, i) => (
                <tr key={`${r.ref}-${i}`} className="row">
                  <td className="td num text-muted">{r.date}</td>
                  <td className="td num">{r.ref}</td>
                  <td className="td num"><Money value={r.base} /></td>
                  <td className="td num font-semibold"><Money value={r.vat} /></td>
                </tr>
              ))}
            </Table>
          ) : (
            <p className="px-5 py-6 text-caption text-muted">{t('Aucune taxe déductible sur la période.')}</p>
          )}
        </div>
      </div>

      <p className="mt-5 text-caption text-muted">
        {t('Ceci prépare la déclaration ; le formulaire officiel et son dépôt restent au comptable. Base achats sur la période : {b}.', { b: String(baseBuys) })}
      </p>
    </>
  );
}
