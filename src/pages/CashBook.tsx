import { useMemo, useState } from 'react';
import { useDB } from '../lib/store';
import { accountCode } from '../lib/chart';
import { entriesInRange } from '../lib/ledger';
import { monthStart } from '../lib/metrics';
import { Empty, Field, Money, PageHeader, StatCard, Table } from '../components/UI';
import { IconBook, IconDownload } from '../components/Icons';

export default function CashBook() {
  const db = useDB();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

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

  function exportCsv() {
    const header = ['Date', 'Journal', 'Compte', 'Libellé', 'Entrée', 'Sortie'];
    const csv = [
      header,
      ...rows.map((r) => [r.date, r.journal, r.account, r.label, r.inflow, r.outflow]),
    ]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `livre-de-caisse-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Livre de caisse"
        subtitle="Suivi de tous les flux de trésorerie (entrées et sorties)"
        actions={
          <button onClick={exportCsv} className="btn-dark">
            <IconDownload className="h-4 w-4" />
            Exporter
          </button>
        }
      />

      <div className="card mb-4 flex flex-wrap items-end gap-3">
        <Field label="Du">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
        </Field>
        <Field label="Au">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Entrées (période)"
          value={<Money value={inflow} />}
          tone="positive"
          hint="Ventes et encaissements"
        />
        <StatCard
          label="Sorties (période)"
          value={<Money value={outflow} />}
          tone="negative"
          hint="Dépenses et achats"
        />
        <StatCard
          label="Solde total en trésorerie"
          value={<Money value={totalBalance} />}
          tone="dark"
          hint="Caisse + banque + mobile, toutes périodes"
        />
      </div>

      <div className="card mt-6 p-0">
        <h2 className="px-5 pb-3 pt-5 font-bold">
          Journal des transactions ({from} → {to})
        </h2>
        {rows.length ? (
          <Table head={['Date', 'Journal', 'Compte', 'Libellé', 'Entrée (+)', 'Sortie (−)']}>
            {rows.map((r) => (
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
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title="Aucune transaction financière sur cette période"
            icon={<IconBook className="h-10 w-10" />}
          />
        )}
      </div>
    </>
  );
}
