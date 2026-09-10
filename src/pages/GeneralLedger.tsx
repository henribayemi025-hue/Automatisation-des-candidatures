import { useMemo, useState } from 'react';
import { useDB } from '../lib/store';
import { accountLedger, trialBalance } from '../lib/ledger';
import { Empty, Field, Money, PageHeader, StatCard, Table } from '../components/UI';
import { IconBook } from '../components/Icons';
import { t } from '../lib/i18n';

export default function GeneralLedger() {
  const db = useDB();
  const [code, setCode] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const used = useMemo(
    () => trialBalance(db.accounts, db.entries).map((b) => b.account.code),
    [db.accounts, db.entries],
  );

  const account = db.accounts.find((a) => a.code === code);

  const rows = useMemo(
    () =>
      account
        ? accountLedger(account.code, db.entries, account.normal, from || undefined, to || undefined)
        : [],
    [account, db.entries, from, to],
  );

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const closing = rows.length ? rows[rows.length - 1].running : 0;

  return (
    <>
      <PageHeader title={t('Grand livre')} subtitle={t('Détail des mouvements compte par compte')} />

      <div className="card mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <Field label={t('Compte')}>
            <select value={code} onChange={(e) => setCode(e.target.value)} className="field">
              <option value="">{t('— Choisir un compte —')}</option>
              {db.accounts.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} — {t(a.label)}
                  {used.includes(a.code) ? '' : ` ${t('(sans mouvement)')}`}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={t('Du')}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
        </Field>
        <Field label={t('Au')}>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
        </Field>
      </div>

      {account ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label={t('Total débit')} value={<Money value={totalDebit} />} />
            <StatCard label={t('Total crédit')} value={<Money value={totalCredit} />} />
            <StatCard
              label={account.normal === 'DEBIT' ? t('Solde débiteur') : t('Solde créditeur')}
              value={<Money value={closing} />}
              tone="dark"
            />
          </div>

          <div className="card mt-6 p-0">
            {rows.length ? (
              <Table head={['Date', 'Journal', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Solde']}>
                {rows.map((r, i) => (
                  <tr key={`${r.entry.id}-${i}`} className="row">
                    <td className="td text-slate-500">{r.entry.date}</td>
                    <td className="td text-slate-500">{r.entry.journal}</td>
                    <td className="td font-medium">{r.entry.ref}</td>
                    <td className="td text-slate-500">{r.entry.label}</td>
                    <td className="td num">{r.debit ? <Money value={r.debit} /> : '—'}</td>
                    <td className="td num">{r.credit ? <Money value={r.credit} /> : '—'}</td>
                    <td className="td num font-semibold">
                      <Money value={r.running} />
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty title={t('Aucun mouvement sur ce compte pour la période')} />
            )}
          </div>
        </>
      ) : (
        <div className="card">
          <Empty
            title={t('Sélectionnez un compte')}
            hint={t('Le grand livre affiche chaque mouvement du compte choisi, avec le solde progressif.')}
            icon={<IconBook className="h-10 w-10" />}
          />
        </div>
      )}
    </>
  );
}
