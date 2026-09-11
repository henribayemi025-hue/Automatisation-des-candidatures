import { useMemo, useState } from 'react';
import { today, useStore } from '../lib/store';
import { closingPlan, currentFiscalYear, nextToClose } from '../lib/closing';
import { incomeStatement } from '../lib/ledger';
import { buildFec, fecFileName } from '../lib/fec';
import { currency as currencyOf } from '../lib/money';
import { Empty, Field, FigureStrip, Modal, Money, PageHeader, Table } from '../components/UI';
import { IconCheck, IconDownload } from '../components/Icons';
import { t } from '../lib/i18n';

/**
 * Clôture d'exercice. Une fois l'année terminée et vérifiée, les comptes de
 * charges et de produits repartent de zéro et le résultat rejoint les capitaux
 * propres. C'est ce que le comptable appelle « passer les à-nouveaux ».
 */
export default function Closing() {
  const { db, closeFiscalYear, reopenFiscalYear } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState('');
  const now = today();

  const proposed = useMemo(() => nextToClose(db, now), [db, now]);
  // La période proposée est la bonne dans 9 cas sur 10, mais elle reste
  // modifiable : première année écourtée, cessation d'activité, reprise en
  // cours d'année. C'est le comptable qui décide de l'arrêté.
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const range = { from: from || proposed.from, to: to || proposed.to, label: (to || proposed.to).slice(0, 4) };
  const plan = useMemo(() => closingPlan(db.accounts, db, range), [db, range.from, range.to]);
  const current = currentFiscalYear(db.company, now);
  const income = incomeStatement(db.accounts, db.entries, range.from, range.to);
  const openYear = range.to >= now;

  function exportFec() {
    const text = buildFec(db.accounts, db.entries, {
      from: range.from,
      to: range.to,
      decimals: currencyOf(db.company.currency).decimals,
    });
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fecFileName(db.company, range.to);
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title={t('Clôture de l’exercice')}
        subtitle={t('Solder l’année écoulée et reporter son résultat')}
        actions={
          <button onClick={exportFec} className="btn-ghost">
            <IconDownload className="h-4 w-4" />
            {t('Export FEC')}
          </button>
        }
      />

      <div className="card mb-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold">{t('Exercice à clôturer : {from} → {to}', { from: range.from, to: range.to })}</h2>
          <span className="text-caption text-muted">{t('Exercice en cours : {from} → {to}', { from: current.from, to: current.to })}</span>
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <Field label={t('Du')}>
            <input type="date" value={range.from} onChange={(e) => setFrom(e.target.value)} className="field" />
          </Field>
          <Field label={t('Au')} hint={t('Date d’arrêté des comptes. La veille du premier jour du nouvel exercice.')}>
            <input type="date" value={range.to} onChange={(e) => setTo(e.target.value)} className="field" />
          </Field>
        </div>

        <FigureStrip
          items={[
            { label: t('Produits'), value: <Money value={income.totalRevenue} /> },
            { label: t('Charges'), value: <Money value={income.totalExpenses} />, tone: 'negative' },
            {
              label: t('Résultat'),
              value: <Money value={plan.result} />,
              tone: plan.result >= 0 ? 'positive' : 'negative',
              hint: plan.result >= 0 ? t('bénéfice') : t('perte'),
            },
            { label: t('Comptes à solder'), value: <span className="num">{plan.lines.length}</span> },
          ]}
        />

        {openYear && (
          <p className="mt-4 rounded-lg bg-brand-500/10 px-3 py-2 text-caption text-ink">
            {t('Cet exercice n’est pas terminé. On ne clôture qu’une année révolue — sinon les mois restants n’auraient plus où s’écrire.')}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setConfirm(true)} disabled={plan.empty || openYear} className="btn-primary disabled:opacity-40">
            <IconCheck className="h-4 w-4" />
            {t('Clôturer cet exercice')}
          </button>
          {plan.empty && <span className="self-center text-caption text-muted">{t('Aucune écriture de charge ou de produit sur cette période.')}</span>}
        </div>
        {done && <p className="mt-3 text-caption text-muted">{done}</p>}
      </div>

      <div className="card mb-5">
        <h2 className="mb-1 font-bold">{t('Ce que la clôture va écrire')}</h2>
        <p className="mb-3 text-caption text-muted">
          {t('Chaque compte de charge et de produit est ramené à zéro, et l’écart — le résultat — part au compte « Résultat », puis en « Report à nouveau » le premier jour de l’exercice suivant.')}
        </p>
        {plan.lines.length ? (
          <div className="overflow-x-auto scrollbar-thin">
            <Table head={[t('Compte'), t('Libellé'), t('Débit'), t('Crédit')]}>
              {plan.lines.map((l, i) => (
                <tr key={`${l.account}-${i}`} className="row">
                  <td className="td num">{l.account}</td>
                  <td className="td text-muted">{l.label}</td>
                  <td className="td num">{l.debit ? <Money value={l.debit} /> : '—'}</td>
                  <td className="td num">{l.credit ? <Money value={l.credit} /> : '—'}</td>
                </tr>
              ))}
            </Table>
          </div>
        ) : (
          <p className="text-caption text-muted">{t('Rien à solder.')}</p>
        )}
      </div>

      <div className="card p-0">
        <div className="border-b border-hairline px-5 py-4">
          <h2 className="font-bold">{t('Exercices déjà clos')}</h2>
        </div>
        {db.closings.length ? (
          <Table head={[t('Exercice'), t('Produits'), t('Charges'), t('Résultat'), '']}>
            {[...db.closings].reverse().map((c) => (
              <tr key={c.id} className="row">
                <td className="td font-semibold">
                  {c.from} → {c.to}
                </td>
                <td className="td num">
                  <Money value={c.revenue} />
                </td>
                <td className="td num text-muted">
                  <Money value={c.expenses} />
                </td>
                <td className="td num font-semibold">
                  <Money value={c.result} />
                </td>
                <td className="td">
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        reopenFiscalYear(c.id);
                        setDone(t('Exercice rouvert : les écritures de clôture ont été extournées, rien n’a été effacé.'));
                      }}
                      className="btn-ghost px-2 py-1 text-[12px]"
                    >
                      {t('Rouvrir')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty title={t('Aucun exercice clos')} hint={t('La clôture se fait une fois l’année terminée et vérifiée par le comptable.')} />
        )}
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={t('Clôturer l’exercice ?')}>
        <div className="space-y-3 text-body text-ink">
          <p>{t('Exercice {from} → {to}', { from: range.from, to: range.to })}</p>
          <p className="text-muted">
            {t('Après la clôture, les charges et les produits de cette période repartent de zéro et le résultat de')}{' '}
            <Money value={plan.result} /> {t('rejoint les capitaux propres. Le bilan, lui, ne bouge pas.')}
          </p>
          <p className="text-caption text-muted">
            {t('Rien n’est effacé : une clôture se rouvre, et les écritures sont alors extournées.')}
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setConfirm(false)} className="btn-ghost">
            {t('Annuler')}
          </button>
          <button
            onClick={() => {
              const out = closeFiscalYear(range);
              setConfirm(false);
              setDone(out ? t('Exercice clôturé. Résultat reporté.') : t('Rien à clôturer.'));
            }}
            className="btn-primary"
          >
            {t('Clôturer')}
          </button>
        </div>
      </Modal>
    </>
  );
}
