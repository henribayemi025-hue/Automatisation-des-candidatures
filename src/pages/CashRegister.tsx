import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { accountCode } from '../lib/chart';
import { toMinor } from '../lib/money';
import { Badge, Empty, Field, Money, PageHeader, Table } from '../components/UI';
import { IconSearch } from '../components/Icons';
import { IconWallet } from '../components/Icons';
import { locale, t } from '../lib/i18n';

export default function CashRegister() {
  const { db, openSession, closeSession } = useStore();
  const [opening, setOpening] = useState('');
  const [counted, setCounted] = useState('');
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

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

  /** Les mouvements de la session, filtrés par la recherche (référence, libellé, montant). */
  const sessionMoves = useMemo(() => {
    if (!current) return [];
    const needle = q.trim().toLowerCase();
    const digits = needle.replace(/[^\d]/g, '');
    return db.entries.filter((e) => {
      if (e.createdAt < current.openedAt) return false;
      if (!e.lines.some((l) => l.account === cashCode)) return false;
      if (!needle) return true;
      if (e.label.toLowerCase().includes(needle) || e.ref.toLowerCase().includes(needle)) return true;
      if (digits) {
        const line = e.lines.find((l) => l.account === cashCode);
        if (line && (String(line.debit).includes(digits) || String(line.credit).includes(digits))) return true;
      }
      return false;
    });
  }, [db.entries, current, cashCode, q]);

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
      <PageHeader
        title={t('Caisse')}
        subtitle={t('Ouverture, contrôle et clôture de la session de caisse')}
        actions={
          <Link to="/ventes" className="btn-ghost">
            {t('Retrouver un ticket')}
          </Link>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {current ? (
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <div className="card">
            <Badge tone="success">{t('Session ouverte')}</Badge>
            <p className="mt-3 text-sm text-slate-500">
              {t('Ouverte le')}{' '}
              {new Date(current.openedAt).toLocaleString(locale(), {
                dateStyle: 'short',
                timeStyle: 'short',
              })}{' '}
              par {current.cashier}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('Fond de départ')}</dt>
                <dd>
                  <Money value={current.opening} />
                </dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>{t('Solde théorique')}</dt>
                <dd>
                  <Money value={expected} />
                </dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10">
              <Field label={t('Montant compté en caisse')}>
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
                  {t('Écart :')}{' '}
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
                {t('Clôturer la caisse')}
              </button>
              <p className="mt-2 text-xs text-slate-400">
                {t('Un écart génère automatiquement une écriture d\'ajustement au journal des opérations diverses.')}
              </p>
            </div>
          </div>

          <div className="card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold">{t('Mouvements de caisse de la session')}</h2>
              <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="caisse-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('Chercher un ticket, un libellé, un montant…')}
                  className="field py-1.5 pl-9 text-caption"
                />
              </div>
            </div>
            <Table head={['Date', 'Libellé', 'Entrée', 'Sortie']}>
              {sessionMoves.map((e) => {
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
            {sessionMoves.length === 0 && (
              <p className="py-6 text-center text-caption text-muted">
                {q ? t('Aucun mouvement ne correspond à « {q} ».', { q }) : t('Aucun mouvement depuis l’ouverture.')}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="card max-w-md">
          <h2 className="flex items-center gap-2 font-bold">
            <IconWallet className="h-[18px] w-[18px] text-slate-400" />
            {t('Aucune session ouverte')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('Déclarez le fond de caisse de départ pour ouvrir la session.')}
          </p>
          <div className="mt-4">
            <Field label={t('Fond de caisse ({c})', { c: currency })}>
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
            {t('Ouvrir la caisse')}
          </button>
        </div>
      )}

      <div className="card mt-6 p-0">
        <h2 className="px-5 pb-3 pt-5 font-bold">{t('Historique des sessions')}</h2>
        {db.sessions.filter((s) => s.closedAt).length ? (
          <Table head={['Caissier', 'Ouverture', 'Clôture', 'Fond', 'Théorique', 'Compté', 'Écart']}>
            {db.sessions
              .filter((s) => s.closedAt)
              .map((s) => (
                <tr key={s.id} className="row">
                  <td className="td">{s.cashier}</td>
                  <td className="td text-slate-500">
                    {new Date(s.openedAt).toLocaleString(locale(), { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="td text-slate-500">
                    {new Date(s.closedAt!).toLocaleString(locale(), { dateStyle: 'short', timeStyle: 'short' })}
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
                      <Badge tone="success">{t('Conforme')}</Badge>
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
          <Empty title={t('Aucune session enregistrée')} />
        )}
      </div>
    </>
  );
}
