import { useMemo, useState } from 'react';
import { useDB } from '../lib/store';
import { balanceSheet, incomeStatement } from '../lib/ledger';
import { monthStart } from '../lib/metrics';
import { formatPercent } from '../lib/money';
import { Badge, Field, FigureStrip, Money, PageHeader, ShareBar } from '../components/UI';
import { t } from '../lib/i18n';

function Section({
  title,
  rows,
  total,
  totalLabel,
  tone = 'accent',
}: {
  title: string;
  rows: { code: string; label: string; amount: number }[];
  total: number;
  totalLabel: string;
  tone?: 'accent' | 'danger' | 'ink';
}) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{title}</h3>
      <ul className="divide-y divide-hairline">
        {rows.length ? (
          rows.map((r) => (
            <li key={r.code} className="py-1.5">
              <div className="flex items-baseline justify-between gap-3 text-caption">
                <span className="min-w-0 truncate">
                  <span className="mr-2 font-mono text-[11px] text-muted">{r.code}</span>
                  {r.label}
                </span>
                <Money value={r.amount} className="shrink-0 font-semibold" />
              </div>
              <div className="mt-1 pl-1">
                <ShareBar value={r.amount} total={total} tone={tone} />
              </div>
            </li>
          ))
        ) : (
          <li className="py-2 text-caption text-muted">{t('Aucun mouvement')}</li>
        )}
      </ul>
      <div className="mt-2 flex items-baseline justify-between border-t border-hairline pt-2 text-body font-bold">
        <span>{totalLabel}</span>
        <Money value={total} />
      </div>
    </div>
  );
}

export default function Statements() {
  const db = useDB();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const income = useMemo(
    () => incomeStatement(db.accounts, db.entries, from || undefined, to || undefined),
    [db.accounts, db.entries, from, to],
  );
  const sheet = useMemo(
    () => balanceSheet(db.accounts, db.entries, to || undefined),
    [db.accounts, db.entries, to],
  );

  const marginRate = income.totalRevenue > 0 ? (income.netIncome / income.totalRevenue) * 100 : 0;

  const toRows = (list: typeof income.revenue) =>
    list.map((b) => ({ code: b.account.code, label: t(b.account.label), amount: b.balance }));

  return (
    <>
      <PageHeader title={t('Bilan & compte de résultat')} subtitle={t('États financiers calculés depuis les écritures')} />

      <div className="card mb-4 flex flex-wrap items-end gap-3">
        <Field label={t('Du')}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
        </Field>
        <Field label={t('Au')}>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
        </Field>
      </div>

      <FigureStrip
        items={[
          {
            label: t('Produits'),
            value: <Money value={income.totalRevenue} />,
            tone: 'positive',
            share: 1,
            hint: t('Ce que l’activité a rapporté'),
          },
          {
            label: t('Charges'),
            value: <Money value={income.totalExpenses} />,
            tone: 'negative',
            share: income.totalRevenue > 0 ? income.totalExpenses / income.totalRevenue : 0,
            hint: income.totalRevenue > 0 ? t('{p} des produits', { p: formatPercent((income.totalExpenses / income.totalRevenue) * 100) }) : t('Aucun produit sur la période'),
          },
          {
            label: t('Résultat net'),
            value: <Money value={income.netIncome} />,
            tone: income.netIncome >= 0 ? 'positive' : 'negative',
            share: income.totalRevenue > 0 ? Math.abs(income.netIncome) / income.totalRevenue : 0,
            hint: `${t('Marge nette')} ${formatPercent(marginRate)}`,
          },
          {
            label: t('Équilibre du bilan'),
            value: sheet.difference === 0 ? t('Vérifié') : t('Écart'),
            tone: sheet.difference === 0 ? 'positive' : 'negative',
            hint: t('Actif = Passif + Capitaux + Résultat'),
          },
        ]}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{t('Compte de résultat')}</h2>
            <Badge tone="info">
              {from} → {to}
            </Badge>
          </div>
          <Section
            title={t('Produits')}
            rows={toRows(income.revenue)}
            total={income.totalRevenue}
            totalLabel={t('Total des produits')}
          />
          <Section
            title={t('Charges')}
            rows={toRows(income.expenses)}
            total={income.totalExpenses}
            totalLabel={t('Total des charges')}
            tone="danger"
          />
          <div
            className={`flex items-baseline justify-between rounded-input px-4 py-3 text-body font-bold ${
              income.netIncome >= 0
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
            }`}
          >
            <span>{income.netIncome >= 0 ? t('Bénéfice net') : t('Perte nette')}</span>
            <Money value={income.netIncome} />
          </div>
        </div>

        <div className="card space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{t('Bilan')}</h2>
            <Badge tone="info">au {to}</Badge>
          </div>
          <Section
            title={t('Actif')}
            rows={toRows(sheet.assets)}
            total={sheet.totalAssets}
            totalLabel={t('Total actif')}
          />
          <Section
            title={t('Passif — dettes')}
            rows={toRows(sheet.liabilities)}
            total={sheet.totalLiabilities}
            totalLabel={t('Total dettes')}
            tone="danger"
          />
          <Section
            title={t('Capitaux propres')}
            rows={[
              ...toRows(sheet.equity),
              { code: '—', label: t("Résultat de l'exercice"), amount: sheet.netIncome },
            ]}
            total={sheet.totalEquity + sheet.netIncome}
            totalLabel={t('Total capitaux propres')}
            tone="ink"
          />
          <div className="flex items-baseline justify-between rounded-input bg-base px-4 py-3 text-body font-bold">
            <span>{t('Total passif')}</span>
            <Money value={sheet.totalLiabilities + sheet.totalEquity + sheet.netIncome} />
          </div>
          {sheet.difference !== 0 && (
            <p className="text-sm font-semibold text-rose-600">
              {t('Écart détecté de')} <Money value={sheet.difference} /> {t('— consultez le module Audit.')}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
