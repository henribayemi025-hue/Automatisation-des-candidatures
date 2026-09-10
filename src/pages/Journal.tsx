import { useMemo, useState } from 'react';
import { useStore, today } from '../lib/store';
import { entriesInRange } from '../lib/ledger';
import { toMajor, toMinor } from '../lib/money';
import { exportXlsx } from '../lib/xlsx';
import type { JournalCode, JournalLine } from '../lib/types';
import { Badge, Empty, Field, Modal, Money, PageHeader, StatCard } from '../components/UI';
import { IconPlus, IconReceipt, IconX } from '../components/Icons';

const JOURNALS: { code: JournalCode; label: string }[] = [
  { code: 'VT', label: 'Ventes' },
  { code: 'AC', label: 'Achats' },
  { code: 'CA', label: 'Caisse / banque' },
  { code: 'BQ', label: 'Banque' },
  { code: 'OD', label: 'Opérations diverses' },
];

export default function Journal() {
  const { db, addManualEntry, reverseEntry } = useStore();
  const [journal, setJournal] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const [date, setDate] = useState(today());
  const [code, setCode] = useState<JournalCode>('OD');
  const [label, setLabel] = useState('');
  const [lines, setLines] = useState<{ account: string; label: string; debit: string; credit: string }[]>([
    { account: '', label: '', debit: '', credit: '' },
    { account: '', label: '', debit: '', credit: '' },
  ]);

  const entries = useMemo(() => {
    return entriesInRange(db.entries, from || undefined, to || undefined)
      .filter((e) => (journal ? e.journal === journal : true))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [db.entries, journal, from, to]);

  const totalDebit = entries.reduce((s, e) => s + e.lines.reduce((x, l) => x + l.debit, 0), 0);

  const draftDebit = lines.reduce((s, l) => s + toMinor(l.debit || 0, db.company.currency), 0);
  const draftCredit = lines.reduce((s, l) => s + toMinor(l.credit || 0, db.company.currency), 0);
  const balanced = draftDebit === draftCredit && draftDebit > 0;

  function submit() {
    try {
      setError('');
      const payload: JournalLine[] = lines
        .filter((l) => l.account)
        .map((l) => ({
          account: l.account,
          label: l.label,
          debit: toMinor(l.debit || 0, db.company.currency),
          credit: toMinor(l.credit || 0, db.company.currency),
        }));
      addManualEntry({ date, journal: code, label, lines: payload });
      setOpen(false);
      setLabel('');
      setLines([
        { account: '', label: '', debit: '', credit: '' },
        { account: '', label: '', debit: '', credit: '' },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }

  function reverse(id: string) {
    try {
      setError('');
      reverseEntry(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }

  return (
    <>
      <PageHeader
        title="Journal des écritures"
        subtitle="Toutes les écritures en partie double, générées ou saisies"
        actions={
          <>
            <button
              onClick={() =>
                exportXlsx(
                  'journal',
                  'Journal',
                  entries.flatMap((e) =>
                    e.lines.map((l) => ({
                      Date: e.date,
                      Journal: e.journal,
                      Pièce: e.ref,
                      Libellé: e.label,
                      Compte: l.account,
                      Intitulé: db.accounts.find((a) => a.code === l.account)?.label ?? '',
                      Débit: toMajor(l.debit, db.company.currency),
                      Crédit: toMajor(l.credit, db.company.currency),
                    })),
                  ),
                )
              }
              className="btn-ghost"
              title="Export Excel pour le cabinet"
            >
              Excel
            </button>
            <button onClick={() => setOpen(true)} className="btn-primary">
              <IconPlus className="h-4 w-4" />
              Écriture manuelle
            </button>
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Écritures affichées" value={entries.length} />
        <StatCard label="Total mouvementé" value={<Money value={totalDebit} />} tone="dark" />
        <StatCard
          label="Contrôle"
          value="Équilibré"
          tone="positive"
          hint="Aucune écriture ne peut être enregistrée hors équilibre"
        />
      </div>

      <div className="card mt-6 mb-4 flex flex-wrap items-end gap-3">
        <select value={journal} onChange={(e) => setJournal(e.target.value)} className="field w-auto">
          <option value="">Tous les journaux</option>
          {JOURNALS.map((j) => (
            <option key={j.code} value={j.code}>
              {j.code} — {j.label}
            </option>
          ))}
        </select>
        <Field label="Du">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
        </Field>
        <Field label="Au">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
        </Field>
      </div>

      <div className="card p-0">
        {entries.length ? (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {entries.map((e) => (
              <div key={e.id} className="p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge tone="info">{e.journal}</Badge>
                  <span className="font-semibold">{e.ref}</span>
                  <span className="text-sm text-slate-500">{e.label}</span>
                  <span className="text-xs text-slate-400">{e.date}</span>
                  {e.reverses && <Badge tone="warn">Extourne</Badge>}
                  {e.reversedBy && <Badge tone="danger">Extournée</Badge>}
                  <div className="ml-auto">
                    {!e.reversedBy && !e.reverses && (
                      <button onClick={() => reverse(e.id)} className="text-xs font-semibold text-rose-600">
                        Extourner
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full min-w-[520px]">
                    <tbody>
                      {e.lines.map((l, i) => {
                        const account = db.accounts.find((a) => a.code === l.account);
                        return (
                          <tr key={i} className="text-sm">
                            <td className="py-1 pr-3 num text-slate-500">{l.account}</td>
                            <td className="py-1 pr-3">{account?.label ?? '—'}</td>
                            <td className="py-1 pr-3 text-slate-400">{l.label}</td>
                            <td className="py-1 pr-3 text-right num">
                              {l.debit ? <Money value={l.debit} /> : ''}
                            </td>
                            <td className="py-1 text-right num">
                              {l.credit ? <Money value={l.credit} /> : ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="Aucune écriture sur la période"
            hint="Les ventes, achats et dépenses génèrent automatiquement leurs écritures."
            icon={<IconReceipt className="h-10 w-10" />}
          />
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle écriture manuelle" wide>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
          </Field>
          <Field label="Journal">
            <select value={code} onChange={(e) => setCode(e.target.value as JournalCode)} className="field">
              {JOURNALS.map((j) => (
                <option key={j.code} value={j.code}>
                  {j.code} — {j.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Libellé">
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="field" />
          </Field>
        </div>

        <div className="mt-5 space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-white/5">
              <select
                value={l.account}
                onChange={(e) =>
                  setLines(lines.map((x, j) => (j === i ? { ...x, account: e.target.value } : x)))
                }
                className="field flex-1 py-1.5"
              >
                <option value="">— Compte —</option>
                {db.accounts.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} — {a.label}
                  </option>
                ))}
              </select>
              <input
                value={l.debit}
                onChange={(e) =>
                  setLines(lines.map((x, j) => (j === i ? { ...x, debit: e.target.value, credit: '' } : x)))
                }
                placeholder="Débit"
                inputMode="decimal"
                className="field num w-28 py-1.5"
              />
              <input
                value={l.credit}
                onChange={(e) =>
                  setLines(lines.map((x, j) => (j === i ? { ...x, credit: e.target.value, debit: '' } : x)))
                }
                placeholder="Crédit"
                inputMode="decimal"
                className="field num w-28 py-1.5"
              />
              {lines.length > 2 && (
                <button
                  onClick={() => setLines(lines.filter((_, j) => j !== i))}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <IconX className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setLines([...lines, { account: '', label: '', debit: '', credit: '' }])}
            className="text-sm font-semibold text-brand-600"
          >
            + Ajouter une ligne
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-white/5">
          <span>
            Débit <Money value={draftDebit} className="font-bold" /> · Crédit{' '}
            <Money value={draftCredit} className="font-bold" />
          </span>
          {balanced ? (
            <Badge tone="success">Équilibrée</Badge>
          ) : (
            <Badge tone="danger">Déséquilibre de {<Money value={Math.abs(draftDebit - draftCredit)} />}</Badge>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="btn-ghost">
            Annuler
          </button>
          <button onClick={submit} disabled={!balanced} className="btn-primary">
            Enregistrer l'écriture
          </button>
        </div>
      </Modal>
    </>
  );
}
