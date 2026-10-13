import { localISO } from '../lib/dates';
import { useMemo, useState } from 'react';
import { useDB } from '../lib/store';
import { accountCode } from '../lib/chart';
import { entriesInRange } from '../lib/ledger';
import { monthStart } from '../lib/metrics';
import { Empty, Field, Money, PageHeader, StatCard, Table } from '../components/UI';
import { IconBook, IconDownload } from '../components/Icons';
import { t } from '../lib/i18n';
import { toMajor } from '../lib/money';
import { exportXlsx } from '../lib/xlsx';

export default function CashBook() {
  const db = useDB();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(localISO());

  const treasury = useMemo(
    () =>
      new Set([
        accountCode(db.company.chart, 'CASH'),
        accountCode(db.company.chart, 'BANK'),
        accountCode(db.company.chart, 'MOBILE_MONEY'),
      ]),
    [db.company.chart],
  );

  const rows = useMemo(() => {
    const list: {
      id: string;
      date: string;
      label: string;
      journal: string;
      account: string;
      inflow: number;
      outflow: number;
    }[] = [];
    for (const entry of entriesInRange(db.entries, from || undefined, to || undefined)) {
      for (const line of entry.lines) {
        if (!treasury.has(line.account)) continue;
        list.push({
          id: `${entry.id}-${line.account}-${line.debit}-${line.credit}`,
          date: entry.date,
          label: entry.label,
          journal: entry.journal,
          account: line.account,
          inflow: line.debit,
          outflow: line.credit,
        });
      }
    }
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [db.entries, treasury, from, to]);

  // Le solde d'un cahier de caisse : ce qu'il y avait avant la période, puis
  // ligne après ligne (audit jour 9).
  const opening = useMemo(() => {
    if (!from) return 0;
    let total = 0;
    for (const entry of db.entries) {
      if (!entry.posted || entry.date >= from) continue;
      for (const line of entry.lines) if (treasury.has(line.account)) total += line.debit - line.credit;
    }
    return total;
  }, [db.entries, treasury, from]);
  const running = useMemo(() => {
    let acc = opening;
    return rows.map((r) => (acc += r.inflow - r.outflow));
  }, [rows, opening]);

  const inflow = rows.reduce((s, r) => s + r.inflow, 0);
  const outflow = rows.reduce((s, r) => s + r.outflow, 0);

  const totalBalance = useMemo(() => {
    let total = 0;
    for (const entry of db.entries) {
      if (!entry.posted) continue;
      for (const line of entry.lines) {
        if (treasury.has(line.account)) total += line.debit - line.credit;
      }
    }
    return total;
  }, [db.entries, treasury]);

  // L'export sortait les montants en unités mineures : 12,34 € devenait
  // « 1234 » pour une boutique en euros (audit jour 9). Excel, en vraies
  // unités, comme le journal.
  function exportBook() {
    const cur = db.company.currency;
    exportXlsx(`livre-de-caisse-${from || 'debut'}-${to || localISO()}`, t('Livre de caisse'), [
      ...(from ? [{ Date: from, Journal: '', Compte: '', Libellé: t('Solde au début de la période'), Entrée: '', Sortie: '', Solde: toMajor(opening, cur) }] : []),
      ...rows.map((r, i) => ({
        Date: r.date,
        Journal: r.journal,
        Compte: r.account,
        Libellé: r.label,
        Entrée: r.inflow ? toMajor(r.inflow, cur) : '',
        Sortie: r.outflow ? toMajor(r.outflow, cur) : '',
        Solde: toMajor(running[i], cur),
      })),
    ]);
  }

  return (
    <>
      <PageHeader
        title={t('Livre de caisse')}
        subtitle={t('Suivi de tous les flux de trésorerie (entrées et sorties)')}
        actions={
          <button onClick={exportBook} className="btn-dark">
            <IconDownload className="h-4 w-4" />
            {t('Exporter')}
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
        <StatCard
          label={t('Entrées (période)')}
          value={<Money value={inflow} />}
          tone="positive"
          hint={t('Ventes et encaissements')}
        />
        <StatCard
          label={t('Sorties (période)')}
          value={<Money value={outflow} />}
          tone="negative"
          hint={t('Dépenses et achats')}
        />
        <StatCard
          label={t('Solde total en trésorerie')}
          value={<Money value={totalBalance} />}
          tone="dark"
          hint={t('Caisse + banque + mobile, toutes périodes')}
        />
      </div>

      <div className="card mt-6 p-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pb-3 pt-5">
          <h2 className="font-bold">
            {t('Mouvements du {from} au {to}', { from: from || t('début'), to: to || t('aujourd’hui') })}
          </h2>
          {from && (
            <span className="text-caption text-muted">
              {t('Solde au début de la période')} : <span className="num font-semibold text-ink"><Money value={opening} /></span>
            </span>
          )}
        </div>
        {rows.length ? (
          <Table head={['Date', 'Journal', 'Compte', 'Libellé', 'Entrée (+)', 'Sortie (−)', 'Solde']} phoneHide={[2, 3, 7]}>
            {rows.map((r, i) => (
              <tr key={r.id} className="row">
                <td className="td text-slate-500">{r.date}</td>
                <td className="td text-slate-500">{r.journal}</td>
                <td className="td num text-slate-500">{r.account}</td>
                <td className="td font-medium">{r.label}</td>
                <td className="td num font-semibold text-teal-600">
                  {r.inflow ? <Money value={r.inflow} /> : '—'}
                </td>
                <td className="td num font-semibold text-rose-600">
                  {r.outflow ? <Money value={r.outflow} /> : '—'}
                </td>
                <td className="td num text-slate-500">
                  <Money value={running[i]} />
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title={t('Aucune transaction financière sur cette période')}
            icon={<IconBook className="h-10 w-10" />}
          />
        )}
      </div>
    </>
  );
}
