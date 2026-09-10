import { Fragment, useMemo, useState } from 'react';
import { useDB } from '../lib/store';
import { trialBalance } from '../lib/ledger';
import { CLASS_LABELS } from '../lib/chart';
import { toMajor } from '../lib/money';
import { exportXlsx } from '../lib/xlsx';
import type { AccountClass } from '../lib/types';
import { Badge, Empty, Field, Money, PageHeader, StatCard } from '../components/UI';
import { IconScale } from '../components/Icons';
import { t } from '../lib/i18n';

export default function TrialBalance() {
  const db = useDB();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const balances = useMemo(
    () => trialBalance(db.accounts, db.entries, from || undefined, to || undefined),
    [db.accounts, db.entries, from, to],
  );

  const totalDebit = balances.reduce((s, b) => s + b.debit, 0);
  const totalCredit = balances.reduce((s, b) => s + b.credit, 0);
  const balanced = totalDebit === totalCredit;

  const grouped = useMemo(() => {
    const map = new Map<AccountClass, typeof balances>();
    for (const b of balances) {
      const arr = map.get(b.account.class) ?? [];
      arr.push(b);
      map.set(b.account.class, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [balances]);

  return (
    <>
      <PageHeader
        title={t('Balance générale')}
        subtitle={t('Totaux et soldes de tous les comptes mouvementés')}
        actions={
          <button
            onClick={() =>
              exportXlsx(
                'balance',
                'Balance',
                balances.map((b) => ({
                  Compte: b.account.code,
                  Intitulé: b.account.label,
                  Classe: b.account.class,
                  'Total débit': toMajor(b.debit, db.company.currency),
                  'Total crédit': toMajor(b.credit, db.company.currency),
                  Solde: toMajor(b.balance, db.company.currency),
                  Sens: b.account.normal === 'DEBIT' ? 'D' : 'C',
                })),
              )
            }
            className="btn-ghost"
          >
            {t('Excel')}
          </button>
        }
      />

      <div className="card mb-4 flex flex-wrap items-end gap-3">
        <Field label={t('Du')}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
        </Field>
        <Field label={t('Au')}>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('Total débit')} value={<Money value={totalDebit} />} />
        <StatCard label={t('Total crédit')} value={<Money value={totalCredit} />} />
        <StatCard
          label={t('Contrôle d\'équilibre')}
          value={balanced ? t('Équilibrée') : t('Déséquilibrée')}
          tone={balanced ? 'positive' : 'negative'}
          hint={balanced ? t('Débit = crédit') : `${t('Écart')} ${totalDebit - totalCredit}`}
        />
      </div>

      <div className="card mt-6 p-0">
        {balances.length ? (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-white/5">
                  <th className="th">{t('Compte')}</th>
                  <th className="th">{t('Intitulé')}</th>
                  <th className="th text-right">{t('Total débit')}</th>
                  <th className="th text-right">{t('Total crédit')}</th>
                  <th className="th text-right">{t('Solde')}</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(([cls, rows]) => (
                  <Fragment key={cls}>
                    <tr className="bg-slate-100/70 dark:bg-white/[0.07]">
                      <td colSpan={5} className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                        {t('Classe')} {cls} — {t(CLASS_LABELS[cls])}
                      </td>
                    </tr>
                    {rows.map((b) => (
                      <tr key={b.account.code} className="row">
                        <td className="td num font-semibold">{b.account.code}</td>
                        <td className="td">{t(b.account.label)}</td>
                        <td className="td num text-right">
                          <Money value={b.debit} />
                        </td>
                        <td className="td num text-right">
                          <Money value={b.credit} />
                        </td>
                        <td className="td num text-right font-semibold">
                          <Money value={b.balance} />
                          <span className="ml-1 text-[10px] text-slate-400">
                            {b.account.normal === 'DEBIT' ? 'D' : 'C'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-extrabold dark:border-white/20">
                  <td className="td" colSpan={2}>
                    {t('Totaux')}
                  </td>
                  <td className="td num text-right">
                    <Money value={totalDebit} />
                  </td>
                  <td className="td num text-right">
                    <Money value={totalCredit} />
                  </td>
                  <td className="td text-right">
                    {balanced ? <Badge tone="success">{t('OK')}</Badge> : <Badge tone="danger">{t('Écart')}</Badge>}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <Empty
            title={t('Aucun mouvement sur la période')}
            hint={t('La balance se remplit dès la première vente, dépense ou écriture manuelle.')}
            icon={<IconScale className="h-10 w-10" />}
          />
        )}
      </div>
    </>
  );
}
