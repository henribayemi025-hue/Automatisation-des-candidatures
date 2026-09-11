import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { cashLines, reconcileSummary, suggestMatches } from '../lib/reconcile';
import type { StatementRow } from '../lib/reconcile';
import { parseStatement } from '../lib/statement';
import { toMinor } from '../lib/money';
import { today } from '../lib/store';
import { Badge, Empty, Field, FigureStrip, Money, PageHeader, Table } from '../components/UI';
import { IconCheck } from '../components/Icons';
import { t } from '../lib/i18n';

/**
 * Rapprochement bancaire. Le relevé de la banque et les comptes ne disent
 * jamais la même chose au même jour : un virement met deux jours, un chèque une
 * semaine. Pointer, c'est cocher ce qui apparaît des deux côtés ; ce qui reste
 * décoché explique l'écart, et c'est exactement ce qu'un comptable vérifie.
 */
export default function Reconcile() {
  const { db, code, reconcileEntry } = useStore();
  const accounts = [
    { code: code('BANK'), label: t('Banque') },
    { code: code('MOBILE_MONEY'), label: t('Mobile money') },
    { code: code('CASH'), label: t('Caisse') },
  ];
  const [account, setAccount] = useState(accounts[0].code);
  const [from, setFrom] = useState(`${today().slice(0, 7)}-01`);
  const [to, setTo] = useState(today());
  const [statementBalance, setStatementBalance] = useState('');
  const [paste, setPaste] = useState('');
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [note, setNote] = useState('');

  const lines = useMemo(() => cashLines(db, account, from, to), [db, account, from, to]);
  const balance = statementBalance.trim() ? toMinor(statementBalance, db.company.currency) : null;
  const summary = reconcileSummary(lines, balance);

  function readStatement() {
    const parsed = parseStatement(paste, db.company.currency, today());
    const mapped: StatementRow[] = parsed.map((r) => ({
      date: r.date,
      label: r.label,
      amount: r.direction === 'OUT' ? -r.amount : r.amount,
    }));
    setRows(mapped);
    setNote(mapped.length ? t('{n} ligne(s) lues dans le relevé.', { n: String(mapped.length) }) : t('Rien de lisible dans ce texte.'));
  }

  function autoMatch() {
    const suggestions = suggestMatches(lines, rows);
    let done = 0;
    for (const s of suggestions) {
      if (!s.entryId) continue;
      reconcileEntry(s.entryId, account, true, s.row.date);
      done += 1;
    }
    setNote(
      done
        ? t('{n} ligne(s) pointées automatiquement. Les autres restent à vérifier à la main.', { n: String(done) })
        : t('Aucune correspondance certaine : à pointer à la main.'),
    );
  }

  return (
    <>
      <PageHeader title={t('Rapprochement bancaire')} subtitle={t('Pointer les comptes contre le relevé de la banque')} />

      <div className="card mb-5">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label={t('Compte')}>
            <select value={account} onChange={(e) => setAccount(e.target.value)} className="field">
              {accounts.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} — {a.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('Du')}>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
          </Field>
          <Field label={t('Au')}>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
          </Field>
          <Field label={t('Solde du relevé')} hint={t('Le solde imprimé en bas du relevé, à la date « Au ».')}>
            <input value={statementBalance} onChange={(e) => setStatementBalance(e.target.value)} inputMode="decimal" className="field" />
          </Field>
        </div>
      </div>

      <div className="mb-5">
        <FigureStrip
          items={[
            { label: t('Solde comptable'), value: <Money value={summary.book} /> },
            { label: t('Déjà pointé'), value: <Money value={summary.reconciled} /> },
            {
              label: t('En attente'),
              value: <Money value={summary.pending} />,
              hint: t('{n} ligne(s)', { n: String(summary.pendingCount) }),
            },
            {
              label: t('Écart avec le relevé'),
              value: balance === null ? <span className="text-muted">—</span> : <Money value={summary.gap} />,
              tone: balance !== null && summary.gap === 0 ? 'positive' : 'negative',
              hint: balance === null ? t('saisissez le solde') : summary.gap === 0 ? t('rapproché') : t('à expliquer'),
            },
          ]}
        />
      </div>

      <div className="card mb-5">
        <h2 className="mb-1 font-bold">{t('Coller le relevé')}</h2>
        <p className="mb-3 text-caption text-muted">
          {t('Collez les lignes du relevé (ou les SMS mobile money). L’application propose le pointage quand le montant et la date correspondent.')}
        </p>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={4}
          placeholder={t('12/03  Virement fournisseur  -150 000')}
          className="field font-figure text-[13px]"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={readStatement} disabled={!paste.trim()} className="btn-ghost disabled:opacity-40">
            {t('Lire le relevé')}
          </button>
          <button onClick={autoMatch} disabled={!rows.length} className="btn-primary disabled:opacity-40">
            <IconCheck className="h-4 w-4" />
            {t('Pointer ce qui correspond')}
          </button>
        </div>
        {note && <p className="mt-3 text-caption text-muted">{note}</p>}
      </div>

      <div className="card p-0">
        {lines.length ? (
          <Table head={[t('Date'), t('Pièce'), t('Libellé'), t('Montant'), t('Pointé')]}>
            {lines.map((l) => (
              <tr key={l.entry.id} className={`row ${l.reconciled ? 'opacity-60' : ''}`}>
                <td className="td num text-muted">{l.entry.date}</td>
                <td className="td num">{l.entry.ref}</td>
                <td className="td">
                  <span className="min-w-0">{l.entry.label}</span>
                  {l.reconciled && l.statementDate && (
                    <span className="ml-2">
                      <Badge tone="success">{t('relevé du {d}', { d: l.statementDate })}</Badge>
                    </span>
                  )}
                </td>
                <td className={`td num font-semibold ${l.amount < 0 ? 'text-brand-600' : ''}`}>
                  <Money value={l.amount} />
                </td>
                <td className="td">
                  <div className="flex justify-end">
                    <button
                      onClick={() => reconcileEntry(l.entry.id, account, !l.reconciled, to)}
                      className={l.reconciled ? 'btn-ghost px-2 py-1 text-[12px]' : 'btn-dark px-2 py-1 text-[12px]'}
                    >
                      {l.reconciled ? t('Dépointer') : t('Pointer')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty title={t('Aucun mouvement sur cette période')} hint={t('Changez le compte ou les dates.')} />
        )}
      </div>
    </>
  );
}
