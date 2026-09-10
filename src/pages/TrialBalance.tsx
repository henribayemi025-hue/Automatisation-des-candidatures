import { Fragment, useMemo, useState } from 'react';
import { useDB } from '../lib/store';
import { trialBalance } from '../lib/ledger';
import { CLASS_LABELS } from '../lib/chart';
import type { AccountClass } from '../lib/types';
import { Badge, Empty, Field, Money, PageHeader, StatCard } from '../components/UI';
import { IconScale } from '../components/Icons';

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
      <PageHeader title="Balance générale" subtitle="Totaux et soldes de tous les comptes mouvementés" />

      <div className="card mb-4 flex flex-wrap items-end gap-3">
        <Field label="Du">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
        </Field>
        <Field label="Au">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total débit" value={<Money value={totalDebit} />} />
        <StatCard label="Total crédit" value={<Money value={totalCredit} />} />
        <StatCard
          label="Contrôle d'équilibre"
          value={balanced ? 'Équilibrée' : 'Déséquilibrée'}
          tone={balanced ? 'positive' : 'negative'}
          hint={balanced ? 'Débit = crédit' : `Écart de ${totalDebit - totalCredit}`}
        />
      </div>

      <div className="card mt-6 p-0">
        {balances.length ? (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-white/5">
                  <th className="th">Compte</th>
                  <th className="th">Intitulé</th>
                  <th className="th text-right">Total débit</th>
                  <th className="th text-right">Total crédit</th>
                  <th className="th text-right">Solde</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(([cls, rows]) => (
                  <Fragment key={cls}>
                    <tr className="bg-slate-100/70 dark:bg-white/[0.07]">
                      <td colSpan={5} className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                        Classe {cls} — {CLASS_LABELS[cls]}
                      </td>
                    </tr>
                    {rows.map((b) => (
                      <tr key={b.account.code} className="row">
                        <td className="td num font-semibold">{b.account.code}</td>
                        <td className="td">{b.account.label}</td>
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
                    Totaux
                  </td>
                  <td className="td num text-right">
                    <Money value={totalDebit} />
                  </td>
                  <td className="td num text-right">
                    <Money value={totalCredit} />
                  </td>
                  <td className="td text-right">
                    {balanced ? <Badge tone="success">OK</Badge> : <Badge tone="danger">Écart</Badge>}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <Empty
            title="Aucun mouvement sur la période"
            hint="La balance se remplit dès la première vente, dépense ou écriture manuelle."
            icon={<IconScale className="h-10 w-10" />}
          />
        )}
      </div>
    </>
  );
}
