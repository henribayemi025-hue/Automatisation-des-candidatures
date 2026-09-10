import { useMemo, useState } from 'react';
import { useDB } from '../lib/store';
import { balanceSheet, incomeStatement } from '../lib/ledger';
import { monthStart } from '../lib/metrics';
import { formatPercent } from '../lib/money';
import { Badge, Field, Money, PageHeader, StatCard } from '../components/UI';
import { t } from '../lib/i18n';

function Section({
  title,
  rows,
  total,
  totalLabel,
}: {
  title: string;
  rows: { code: string; label: string; amount: number }[];
  total: number;
  totalLabel: string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      <ul className="space-y-1.5">
        {rows.length ? (
          rows.map((r) => (
            <li key={r.code} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                <span className="mr-2 text-xs text-slate-400 num">{r.code}</span>
                {r.label}
              </span>
              <Money value={r.amount} className="shrink-0" />
            </li>
          ))
        ) : (
          <li className="text-sm text-slate-400">{t('Aucun mouvement')}</li>
        )}
      </ul>
      <div className="mt-3 flex items-baseline justify-between border-t border-slate-200 pt-2 font-bold dark:border-white/10">
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Produits')} value={<Money value={income.totalRevenue} />} tone="positive" />
        <StatCard label={t('Charges')} value={<Money value={income.totalExpenses} />} tone="negative" />
        <StatCard
          label={t('Résultat net')}
          value={<Money value={income.netIncome} />}
          tone="dark"
          hint={`${t('Marge nette')} ${formatPercent(marginRate)}`}
        />
        <StatCard
          label={t('Équilibre du bilan')}
          value={sheet.difference === 0 ? t('Vérifié') : t('Écart')}
          tone={sheet.difference === 0 ? 'positive' : 'negative'}
          hint={t('Actif = Passif + Capitaux + Résultat')}
        />
      </div>

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
          />
          <div
            className={`flex items-baseline justify-between rounded-xl px-4 py-3 text-lg font-extrabold ${
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
          />
          <Section
            title={t('Capitaux propres')}
            rows={[
              ...toRows(sheet.equity),
              { code: '—', label: t("Résultat de l'exercice"), amount: sheet.netIncome },
            ]}
            total={sheet.totalEquity + sheet.netIncome}
            totalLabel={t('Total capitaux propres')}
          />
          <div className="flex items-baseline justify-between rounded-xl bg-slate-100 px-4 py-3 font-extrabold dark:bg-white/10">
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
