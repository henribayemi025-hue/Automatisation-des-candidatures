import { Fragment, useMemo, useState } from 'react';
import { useDB } from '../lib/store';
import { trialBalance, trialBalance6 } from '../lib/ledger';
import { CLASS_LABELS } from '../lib/chart';
import { toMajor } from '../lib/money';
import { exportXlsx } from '../lib/xlsx';
import type { AccountClass } from '../lib/types';
import { Badge, Empty, Field, FigureStrip, Money, PageHeader } from '../components/UI';
import { IconScale } from '../components/Icons';
import { t } from '../lib/i18n';

/**
 * Balance générale. Deux présentations :
 * - six colonnes (ouverture, mouvements, clôture, chacun en débit et crédit) :
 *   c'est la balance qu'un comptable attend ;
 * - trois colonnes (débit, crédit, solde) : plus courte, façon compte en T.
 */

type View = 'SIX' | 'SOLDES';

export default function TrialBalance() {
  const db = useDB();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [view, setView] = useState<View>('SIX');

  const six = useMemo(() => trialBalance6(db.accounts, db.entries, from || undefined, to || undefined), [db.accounts, db.entries, from, to]);
  const soldes = useMemo(() => trialBalance(db.accounts, db.entries, from || undefined, to || undefined), [db.accounts, db.entries, from, to]);

  const sum = (key: keyof (typeof six)[number]) => six.reduce((s, b) => s + (b[key] as number), 0);
  const totals = {
    openDebit: sum('openDebit'),
    openCredit: sum('openCredit'),
    debit: sum('debit'),
    credit: sum('credit'),
    closeDebit: sum('closeDebit'),
    closeCredit: sum('closeCredit'),
  };
  const balanced = totals.debit === totals.credit && totals.openDebit === totals.openCredit && totals.closeDebit === totals.closeCredit;

  const grouped = useMemo(() => {
    const map = new Map<AccountClass, typeof six>();
    for (const b of six) {
      const arr = map.get(b.account.class) ?? [];
      arr.push(b);
      map.set(b.account.class, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [six]);

  const groupedSoldes = useMemo(() => {
    const map = new Map<AccountClass, typeof soldes>();
    for (const b of soldes) {
      const arr = map.get(b.account.class) ?? [];
      arr.push(b);
      map.set(b.account.class, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [soldes]);

  const cur = db.company.currency;

  function exportExcel() {
    if (view === 'SIX') {
      exportXlsx(
        'balance',
        'Balance',
        six.map((b) => ({
          Compte: b.account.code,
          Intitulé: b.account.label,
          Classe: b.account.class,
          'Solde ouverture débit': toMajor(b.openDebit, cur),
          'Solde ouverture crédit': toMajor(b.openCredit, cur),
          'Mouvements débit': toMajor(b.debit, cur),
          'Mouvements crédit': toMajor(b.credit, cur),
          'Solde clôture débit': toMajor(b.closeDebit, cur),
          'Solde clôture crédit': toMajor(b.closeCredit, cur),
        })),
      );
      return;
    }
    exportXlsx(
      'balance',
      'Balance',
      soldes.map((b) => ({
        Compte: b.account.code,
        Intitulé: b.account.label,
        Classe: b.account.class,
        'Total débit': toMajor(b.debit, cur),
        'Total crédit': toMajor(b.credit, cur),
        Solde: toMajor(b.balance, cur),
        Sens: b.account.normal === 'DEBIT' ? 'D' : 'C',
      })),
    );
  }

  const cols = view === 'SIX' ? 8 : 5;

  return (
    <>
      <PageHeader
        title={t('Balance générale')}
        subtitle={view === 'SIX' ? t('Soldes d’ouverture, mouvements de la période et soldes de clôture, en débit et en crédit') : t('Totaux et soldes de tous les comptes mouvementés')}
        actions={
          <button onClick={exportExcel} className="btn-ghost">
            {t('Excel')}
          </button>
        }
      />

      <div className="card mb-4 flex flex-wrap items-end gap-3">
        <Field label={t('Du')} hint={t('Ce qui précède cette date forme le solde d’ouverture')}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
        </Field>
        <Field label={t('Au')}>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
        </Field>
        <div className="ml-auto inline-flex rounded-[8px] border border-hairline bg-white p-0.5" role="tablist">
          {(
            [
              ['SIX', 'Six colonnes'],
              ['SOLDES', 'Débit, crédit, solde'],
            ] as [View, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={`rounded-[6px] px-3 py-1.5 text-[12px] font-bold transition ${view === key ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </div>

      <FigureStrip
        items={[
          { label: t('Mouvements débit'), value: <Money value={totals.debit} />, share: 1, hint: t('{n} compte(s) mouvementé(s)', { n: six.length }) },
          { label: t('Mouvements crédit'), value: <Money value={totals.credit} />, share: totals.debit > 0 ? totals.credit / totals.debit : 0, hint: t('Doit égaler le débit') },
          {
            label: t('Contrôle d’équilibre'),
            value: balanced ? t('Équilibrée') : t('Déséquilibrée'),
            tone: balanced ? 'positive' : 'negative',
            hint: balanced ? t('Ouverture, mouvements et clôture : débit = crédit') : t('Écart : consultez l’audit'),
          },
        ]}
      />

      <div className="card mt-6 p-0">
        {six.length ? (
          <div className="overflow-x-auto scrollbar-thin">
            <table className={`w-full border-collapse ${view === 'SIX' ? 'min-w-[1040px]' : 'min-w-[720px]'}`}>
              <thead>
                {view === 'SIX' ? (
                  <>
                    <tr className="bg-slate-50/80 dark:bg-white/5">
                      <th className="th" rowSpan={2}>{t('Compte')}</th>
                      <th className="th" rowSpan={2}>{t('Intitulé')}</th>
                      <th className="th text-center" colSpan={2}>{t('Solde d’ouverture')}</th>
                      <th className="th text-center" colSpan={2}>{t('Mouvements')}</th>
                      <th className="th text-center" colSpan={2}>{t('Solde de clôture')}</th>
                    </tr>
                    <tr className="bg-slate-50/80 dark:bg-white/5">
                      {['Débit', 'Crédit', 'Débit', 'Crédit', 'Débit', 'Crédit'].map((h, i) => (
                        <th key={i} className="th text-right">{t(h)}</th>
                      ))}
                    </tr>
                  </>
                ) : (
                  <tr className="bg-slate-50/80 dark:bg-white/5">
                    <th className="th">{t('Compte')}</th>
                    <th className="th">{t('Intitulé')}</th>
                    <th className="th text-right">{t('Total débit')}</th>
                    <th className="th text-right">{t('Total crédit')}</th>
                    <th className="th text-right">{t('Solde')}</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {view === 'SIX'
                  ? grouped.map(([cls, rows]) => (
                      <Fragment key={cls}>
                        <tr className="bg-slate-100/70 dark:bg-white/[0.07]">
                          <td colSpan={cols} className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                            {t('Classe')} {cls} — {t(CLASS_LABELS[cls])}
                          </td>
                        </tr>
                        {rows.map((b) => (
                          <tr key={b.account.code} className="row">
                            <td className="td num font-semibold">{b.account.code}</td>
                            <td className="td">{t(b.account.label)}</td>
                            {[b.openDebit, b.openCredit, b.debit, b.credit, b.closeDebit, b.closeCredit].map((v, i) => (
                              <td key={i} className={`td num text-right ${i >= 4 ? 'font-semibold' : ''} ${v === 0 ? 'text-slate-300 dark:text-slate-600' : ''}`}>
                                {v === 0 ? '·' : <Money value={v} />}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </Fragment>
                    ))
                  : groupedSoldes.map(([cls, rows]) => (
                      <Fragment key={cls}>
                        <tr className="bg-slate-100/70 dark:bg-white/[0.07]">
                          <td colSpan={cols} className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
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
                              <span className="ml-1 text-[10px] text-slate-400">{b.account.normal === 'DEBIT' ? 'D' : 'C'}</span>
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
                  {view === 'SIX' ? (
                    [totals.openDebit, totals.openCredit, totals.debit, totals.credit, totals.closeDebit, totals.closeCredit].map((v, i) => (
                      <td key={i} className="td num text-right">
                        <Money value={v} />
                      </td>
                    ))
                  ) : (
                    <>
                      <td className="td num text-right">
                        <Money value={totals.debit} />
                      </td>
                      <td className="td num text-right">
                        <Money value={totals.credit} />
                      </td>
                      <td className="td text-right">{balanced ? <Badge tone="success">{t('OK')}</Badge> : <Badge tone="danger">{t('Écart')}</Badge>}</td>
                    </>
                  )}
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
