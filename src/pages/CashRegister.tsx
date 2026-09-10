import { useState } from 'react';
import { useStore } from '../lib/store';
import { accountCode } from '../lib/chart';
import { toMinor } from '../lib/money';
import { Badge, Empty, Field, Money, PageHeader, Table } from '../components/UI';
import { IconWallet } from '../components/Icons';

export default function CashRegister() {
  const { db, openSession, closeSession } = useStore();
  const [opening, setOpening] = useState('');
  const [counted, setCounted] = useState('');
  const [error, setError] = useState('');

  const current = db.sessions.find((s) => !s.closedAt);
  const currency = db.company.currency;

  const cashCode = accountCode(db.company.chart, 'CASH');
  let expected = 0;
  if (current) {
    let movement = 0;
    for (const entry of db.entries) {
      if (entry.createdAt < current.openedAt) continue;
      for (const line of entry.lines) {
        if (line.account === cashCode) movement += line.debit - line.credit;
      }
    }
    expected = current.opening + movement;
  }

  function run(fn: () => void) {
    try {
      setError('');
      fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }

  return (
    <>
      <PageHeader title="Caisse" subtitle="Ouverture, contrôle et clôture de la session de caisse" />

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {current ? (
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <div className="card">
            <Badge tone="success">Session ouverte</Badge>
            <p className="mt-3 text-sm text-slate-500">
              Ouverte le{' '}
              {new Date(current.openedAt).toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}{' '}
              par {current.cashier}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Fond de départ</dt>
                <dd>
                  <Money value={current.opening} />
                </dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Solde théorique</dt>
                <dd>
                  <Money value={expected} />
                </dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10">
              <Field label="Montant compté en caisse">
                <input
                  value={counted}
                  onChange={(e) => setCounted(e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                  className="field num"
                />
              </Field>
              {counted !== '' && (
                <p className="mt-2 text-sm">
                  Écart :{' '}
                  <span
                    className={
                      toMinor(counted, currency) - expected === 0
                        ? 'font-semibold text-teal-600'
                        : 'font-semibold text-rose-600'
                    }
                  >
                    <Money value={toMinor(counted, currency) - expected} />
                  </span>
                </p>
              )}
              <button
                onClick={() => run(() => closeSession(toMinor(counted || 0, currency)))}
                className="btn-dark mt-4 w-full"
              >
                Clôturer la caisse
              </button>
              <p className="mt-2 text-xs text-slate-400">
                Un écart génère automatiquement une écriture d'ajustement au journal des opérations diverses.
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 font-bold">Mouvements de caisse de la session</h2>
            <Table head={['Date', 'Libellé', 'Entrée', 'Sortie']}>
              {db.entries
                .filter(
                  (e) =>
                    e.createdAt >= current.openedAt && e.lines.some((l) => l.account === cashCode),
                )
                .map((e) => {
                  const line = e.lines.find((l) => l.account === cashCode)!;
                  return (
                    <tr key={e.id} className="row">
                      <td className="td text-slate-500">{e.date}</td>
                      <td className="td">{e.label}</td>
                      <td className="td num text-teal-600">
                        {line.debit ? <Money value={line.debit} /> : '—'}
                      </td>
                      <td className="td num text-rose-600">
                        {line.credit ? <Money value={line.credit} /> : '—'}
                      </td>
                    </tr>
                  );
                })}
            </Table>
          </div>
        </div>
      ) : (
        <div className="card max-w-md">
          <h2 className="flex items-center gap-2 font-bold">
            <IconWallet className="h-[18px] w-[18px] text-slate-400" />
            Aucune session ouverte
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Déclarez le fond de caisse de départ pour ouvrir la session.
          </p>
          <div className="mt-4">
            <Field label={`Fond de caisse (${currency})`}>
              <input
                value={opening}
                onChange={(e) => setOpening(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className="field num"
              />
            </Field>
          </div>
          <button
            onClick={() => run(() => openSession(toMinor(opening || 0, currency)))}
            className="btn-primary mt-4 w-full"
          >
            Ouvrir la caisse
          </button>
        </div>
      )}

      <div className="card mt-6 p-0">
        <h2 className="px-5 pb-3 pt-5 font-bold">Historique des sessions</h2>
        {db.sessions.filter((s) => s.closedAt).length ? (
          <Table head={['Caissier', 'Ouverture', 'Clôture', 'Fond', 'Théorique', 'Compté', 'Écart']}>
            {db.sessions
              .filter((s) => s.closedAt)
              .map((s) => (
                <tr key={s.id} className="row">
                  <td className="td">{s.cashier}</td>
                  <td className="td text-slate-500">
                    {new Date(s.openedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="td text-slate-500">
                    {new Date(s.closedAt!).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="td num">
                    <Money value={s.opening} />
                  </td>
                  <td className="td num">
                    <Money value={s.expected ?? 0} />
                  </td>
                  <td className="td num">
                    <Money value={s.counted ?? 0} />
                  </td>
                  <td className="td num">
                    {s.variance === 0 ? (
                      <Badge tone="success">Conforme</Badge>
                    ) : (
                      <Badge tone={(s.variance ?? 0) < 0 ? 'danger' : 'warn'}>
                        <Money value={s.variance ?? 0} />
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
          </Table>
        ) : (
          <Empty title="Aucune session enregistrée" />
        )}
      </div>
    </>
  );
}
