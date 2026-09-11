import { useMemo, useState } from 'react';
import { useStore, today } from '../lib/store';
import { EXPENSE_KEYS, accountCode } from '../lib/chart';
import type { AccountKey } from '../lib/chart';
import { toMinor } from '../lib/money';
import type { PaymentMethod } from '../lib/types';
import { Empty, Field, Modal, Money, PageHeader, StatCard, Table } from '../components/UI';
import { IconPlus, IconWallet } from '../components/Icons';
import { t } from '../lib/i18n';
import { EXPENSE_LABEL as CATEGORY_LABEL } from '../lib/expenses';
import ProjectSelect from '../components/ProjectSelect';


export default function Expenses() {
  const { db, addExpense } = useStore();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today());
  const [accountKey, setAccountKey] = useState<AccountKey>('UTILITIES');
  const [description, setDescription] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [projectId, setProjectId] = useState('');

  const filtered = useMemo(
    () =>
      db.expenses.filter((e) => {
        if (from && e.date < from) return false;
        if (to && e.date > to) return false;
        return true;
      }),
    [db.expenses, from, to],
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filtered) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  function submit() {
    const amount = toMinor(amountRaw || 0, db.company.currency);
    if (amount <= 0) return;
    addExpense({
      date,
      category: CATEGORY_LABEL[accountKey],
      accountKey,
      description,
      amount,
      method,
      projectId: projectId || null,
    });
    setAmountRaw('');
    setProjectId('');
    setDescription('');
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title={t('Dépenses')}
        subtitle={t('Chaque dépense est immédiatement passée en écriture comptable')}
        actions={
          <button onClick={() => setOpen(true)} className="btn-primary">
            <IconPlus className="h-4 w-4" />
            {t('Nouvelle dépense')}
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('Total affiché')} value={<Money value={total} />} tone="dark" />
        <StatCard label={t('Nombre de dépenses')} value={filtered.length} />
        <StatCard
          label={t('Poste principal')}
          value={byCategory[0] ? t(byCategory[0][0]) : '—'}
          hint={byCategory[0] ? undefined : 'Aucune dépense sur la période'}
        />
      </div>

      <div className="card mt-6 mb-4 flex flex-wrap items-end gap-3">
        <Field label={t('Du')}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
        </Field>
        <Field label={t('Au')}>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="card p-0">
          {filtered.length ? (
            <Table head={['Date', 'Catégorie', 'Compte', 'Description', 'Montant']}>
              {filtered.map((e) => (
                <tr key={e.id} className="row">
                  <td className="td text-slate-500">{e.date}</td>
                  <td className="td font-medium">{t(e.category)}</td>
                  <td className="td num text-slate-500">{e.account}</td>
                  <td className="td text-slate-500">{e.description || '—'}</td>
                  <td className="td num font-semibold text-rose-600">
                    <Money value={e.amount} />
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty
              title={t('Aucune dépense trouvée')}
              hint={t('Enregistrez vos charges pour obtenir un résultat net fiable.')}
              icon={<IconWallet className="h-10 w-10" />}
            />
          )}
        </div>

        <div className="card h-fit">
          <h2 className="mb-3 font-bold">{t('Répartition par poste')}</h2>
          {byCategory.length ? (
            <ul className="space-y-3">
              {byCategory.map(([cat, amount]) => (
                <li key={cat}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="truncate">{t(cat)}</span>
                    <Money value={amount} className="font-semibold" />
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${total ? (amount / total) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">{t('Aucune donnée')}</p>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('Nouvelle dépense')}>
        <div className="space-y-4">
          <Field label={t('Date')}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
          </Field>
          <Field
            label={t('Poste de charge')}
            hint={`Compte imputé : ${accountCode(db.company.chart, accountKey)}`}
          >
            <select
              value={accountKey}
              onChange={(e) => setAccountKey(e.target.value as AccountKey)}
              className="field"
            >
              {EXPENSE_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t(CATEGORY_LABEL[k])}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('Description')}>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="field" />
          </Field>
          <Field label={`Montant (${db.company.currency})`}>
            <input value={amountRaw} onChange={(e) => setAmountRaw(e.target.value)} inputMode="decimal" className="field num" />
          </Field>
          <Field label={t('Payé par')}>
            <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="field">
              <option value="CASH">{t('Espèces (caisse)')}</option>
              <option value="MOBILE">{t('Mobile money')}</option>
              <option value="BANK">{t('Banque')}</option>
              <option value="CARD">{t('Carte')}</option>
            </select>
          </Field>
          <ProjectSelect value={projectId} onChange={setProjectId} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="btn-ghost">
            {t('Annuler')}
          </button>
          <button onClick={submit} className="btn-primary">
            {t('Enregistrer la dépense')}
          </button>
        </div>
      </Modal>
    </>
  );
}
