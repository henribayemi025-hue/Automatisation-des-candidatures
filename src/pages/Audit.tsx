import { useMemo } from 'react';
import { useDB } from '../lib/store';
import { balanceSheet, isBalanced, runAuditChecks, trialBalance } from '../lib/ledger';
import { outstanding } from '../lib/metrics';
import { Badge, Money, PageHeader, StatCard, Table } from '../components/UI';
import { IconAlert, IconCheck, IconShield, IconX } from '../components/Icons';
import { t } from '../lib/i18n';

export default function Audit() {
  const db = useDB();

  const checks = useMemo(() => runAuditChecks(db.accounts, db.entries), [db.accounts, db.entries]);
  const errors = checks.filter((c) => c.severity === 'ERROR');
  const warnings = checks.filter((c) => c.severity === 'WARN');
  const sheet = useMemo(() => balanceSheet(db.accounts, db.entries), [db.accounts, db.entries]);
  const balances = useMemo(() => trialBalance(db.accounts, db.entries), [db.accounts, db.entries]);

  /** Rapprochement entre les soldes métier et les soldes comptables. */
  const reconciliations = useMemo(() => {
    const ledgerFor = (code: string) => balances.find((b) => b.account.code === code)?.balance ?? 0;
    const chartCode = (label: string) => db.accounts.find((a) => a.label.includes(label))?.code ?? '';

    const stockBusiness = db.products
      .filter((p) => !p.archived)
      .reduce((s, p) => s + Math.max(0, p.stock) * p.cost, 0);
    const receivablesBusiness = db.debts
      .filter((d) => d.party === 'CUSTOMER')
      .reduce((s, d) => s + outstanding(d), 0);
    const payablesBusiness = db.debts
      .filter((d) => d.party === 'SUPPLIER')
      .reduce((s, d) => s + outstanding(d), 0);

    return [
      {
        label: 'Stock',
        business: stockBusiness,
        ledger: ledgerFor(chartCode('Stock de marchandises')),
        hint: 'Valorisation des fiches produits vs compte de stock',
      },
      {
        label: 'Créances clients',
        business: receivablesBusiness,
        ledger: ledgerFor(chartCode('Clients')),
        hint: 'Encours des créances vs compte clients',
      },
      {
        label: 'Dettes fournisseurs',
        business: payablesBusiness,
        ledger: ledgerFor(chartCode('Fournisseurs')),
        hint: 'Encours des dettes vs compte fournisseurs',
      },
    ].map((r) => ({ ...r, gap: r.business - r.ledger }));
  }, [balances, db.accounts, db.products, db.debts]);

  const unbalanced = db.entries.filter((e) => !isBalanced(e));
  const score = Math.max(0, 100 - errors.length * 25 - warnings.length * 5);

  return (
    <>
      <PageHeader
        title={t('Audit')}
        subtitle={t('Contrôles de cohérence exécutés sur l\'intégralité des écritures')}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('Score de conformité')}
          value={`${score} / 100`}
          tone="dark"
          hint={errors.length ? t('Anomalies bloquantes détectées') : t('Aucune anomalie bloquante')}
        />
        <StatCard label={t('Contrôles exécutés')} value={checks.length} />
        <StatCard
          label={t('Erreurs')}
          value={errors.length}
          tone={errors.length ? 'negative' : 'positive'}
        />
        <StatCard label={t('Avertissements')} value={warnings.length} tone={warnings.length ? 'negative' : 'default'} />
      </div>

      <div className="card mt-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold">
          <IconShield className="h-[18px] w-[18px] text-brand-600" />
          {t('Contrôles automatiques')}
        </h2>
        <ul className="space-y-2">
          {checks.map((c) => (
            <li
              key={c.id}
              className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                c.severity === 'OK'
                  ? 'border-teal-200 bg-teal-50/60 dark:border-teal-500/20 dark:bg-teal-500/5'
                  : c.severity === 'WARN'
                    ? 'border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5'
                    : 'border-rose-200 bg-rose-50/60 dark:border-rose-500/20 dark:bg-rose-500/5'
              }`}
            >
              <span
                className={`mt-0.5 shrink-0 ${
                  c.severity === 'OK'
                    ? 'text-teal-600'
                    : c.severity === 'WARN'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                }`}
              >
                {c.severity === 'OK' ? (
                  <IconCheck className="h-4 w-4" />
                ) : c.severity === 'WARN' ? (
                  <IconAlert className="h-4 w-4" />
                ) : (
                  <IconX className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{t(c.label)}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{c.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card mt-6 p-0">
        <h2 className="px-5 pb-1 pt-5 font-bold">{t('Rapprochements métier / comptabilité')}</h2>
        <p className="px-5 pb-3 text-sm text-slate-500">
          {t('Un écart signale une donnée saisie hors du circuit comptable.')}
        </p>
        <Table head={['Poste', 'Solde métier', 'Solde comptable', 'Écart', 'Statut']}>
          {reconciliations.map((r) => (
            <tr key={r.label} className="row">
              <td className="td">
                <div className="font-semibold">{t(r.label)}</div>
                <div className="text-xs text-slate-400">{t(r.hint)}</div>
              </td>
              <td className="td num">
                <Money value={r.business} />
              </td>
              <td className="td num">
                <Money value={r.ledger} />
              </td>
              <td className="td num font-semibold">
                <Money value={r.gap} />
              </td>
              <td className="td">
                {r.gap === 0 ? <Badge tone="success">{t('Rapproché')}</Badge> : <Badge tone="danger">{t('Écart')}</Badge>}
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-bold">{t('Équation comptable')}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">{t('Total actif')}</dt>
              <dd>
                <Money value={sheet.totalAssets} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{t('Total dettes')}</dt>
              <dd>
                <Money value={sheet.totalLiabilities} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{t('Capitaux propres + résultat')}</dt>
              <dd>
                <Money value={sheet.totalEquity + sheet.netIncome} />
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold dark:border-white/10">
              <dt>{t('Écart')}</dt>
              <dd className={sheet.difference === 0 ? 'text-teal-600' : 'text-rose-600'}>
                <Money value={sheet.difference} />
              </dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="mb-3 font-bold">{t('Écritures à corriger')}</h2>
          {unbalanced.length ? (
            <ul className="space-y-2 text-sm">
              {unbalanced.map((e) => (
                <li key={e.id} className="rounded-lg bg-rose-50 px-3 py-2 dark:bg-rose-500/10">
                  <span className="font-semibold">{e.ref}</span> — {e.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-teal-600">
              <IconCheck className="h-4 w-4" />
              {t('Aucune écriture déséquilibrée.')}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
