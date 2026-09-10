import { useMemo, useState } from 'react';
import { useDB } from '../lib/store';
import { saleRevenue } from '../lib/metrics';
import { Badge, Empty, Modal, Money, PageHeader, StatCard, Table } from '../components/UI';
import { IconReceipt } from '../components/Icons';
import type { Sale } from '../lib/types';

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Espèces',
  MOBILE: 'Mobile money',
  CARD: 'Carte',
  BANK: 'Virement',
  CREDIT: 'Crédit',
};

export default function Sales() {
  const db = useDB();
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [detail, setDetail] = useState<Sale | null>(null);

  const sales = useMemo(
    () =>
      db.sales.filter((s) => {
        if (s.status === 'QUOTE') return false;
        if (status && s.status !== status) return false;
        if (from && s.date < from) return false;
        if (to && s.date > to) return false;
        return true;
      }),
    [db.sales, status, from, to],
  );

  const revenue = sales.reduce((s, x) => s + saleRevenue(x), 0);
  const collected = sales.reduce((s, x) => s + x.paid, 0);

  return (
    <>
      <PageHeader title="Historique des ventes" subtitle="Toutes les factures émises" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Ventes affichées" value={sales.length} />
        <StatCard label="Chiffre d'affaires" value={<Money value={revenue} />} tone="dark" />
        <StatCard label="Encaissé" value={<Money value={collected} />} tone="positive" />
      </div>

      <div className="card mt-6 mb-4 flex flex-wrap items-end gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field w-auto">
          <option value="">Tous les statuts</option>
          <option value="CONFIRMED">Confirmées</option>
          <option value="CANCELLED">Annulées</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field w-auto" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field w-auto" />
      </div>

      <div className="card p-0">
        {sales.length ? (
          <Table head={['Facture', 'Client', 'Caissier', 'Total', 'Paiement', 'Statut', 'Date', '']}>
            {sales.map((s) => {
              const unpaid = s.total - s.paid;
              return (
                <tr key={s.id} className="row">
                  <td className="td font-semibold">{s.number}</td>
                  <td className="td">{s.customerName}</td>
                  <td className="td text-slate-500">{s.cashier}</td>
                  <td className="td num font-semibold">
                    <Money value={s.total} />
                  </td>
                  <td className="td">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500">{METHOD_LABEL[s.method]}</span>
                      {unpaid > 0 ? (
                        <Badge tone="warn">Reste {<Money value={unpaid} />}</Badge>
                      ) : (
                        <Badge tone="success">Payé</Badge>
                      )}
                    </div>
                  </td>
                  <td className="td">
                    <Badge tone={s.status === 'CONFIRMED' ? 'success' : 'danger'}>
                      {s.status === 'CONFIRMED' ? 'Confirmée' : 'Annulée'}
                    </Badge>
                  </td>
                  <td className="td text-slate-500">{s.date}</td>
                  <td className="td text-right">
                    <button onClick={() => setDetail(s)} className="text-sm font-semibold text-brand-600">
                      Détail
                    </button>
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty title="Aucune vente trouvée" icon={<IconReceipt className="h-10 w-10" />} />
        )}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Facture ${detail?.number ?? ''}`} wide>
        {detail && (
          <>
            <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-slate-500">Client : </span>
                <span className="font-semibold">{detail.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500">Date : </span>
                <span className="font-semibold">{detail.date}</span>
              </div>
              <div>
                <span className="text-slate-500">Caissier : </span>
                <span className="font-semibold">{detail.cashier}</span>
              </div>
              <div>
                <span className="text-slate-500">Paiement : </span>
                <span className="font-semibold">{METHOD_LABEL[detail.method]}</span>
              </div>
            </div>

            <Table head={['Produit', 'Qté', 'PU', 'Total']}>
              {detail.lines.map((l) => (
                <tr key={l.productId} className="row">
                  <td className="td">{l.name}</td>
                  <td className="td num">{l.qty}</td>
                  <td className="td num">
                    <Money value={l.unitPrice} />
                  </td>
                  <td className="td num font-semibold">
                    <Money value={l.unitPrice * l.qty} />
                  </td>
                </tr>
              ))}
            </Table>

            <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm dark:border-white/10">
              {detail.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Remise</dt>
                  <dd>
                    − <Money value={detail.discount} />
                  </dd>
                </div>
              )}
              {detail.vat > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">TVA</dt>
                  <dd>
                    <Money value={detail.vat} />
                  </dd>
                </div>
              )}
              <div className="flex justify-between text-lg font-extrabold">
                <dt>Total</dt>
                <dd>
                  <Money value={detail.total} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Payé</dt>
                <dd>
                  <Money value={detail.paid} />
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <h3 className="mb-2 text-sm font-bold">Écritures comptables générées</h3>
              <ul className="space-y-1 text-xs text-slate-500">
                {db.entries
                  .filter((e) => e.sourceId === detail.id)
                  .map((e) => (
                    <li key={e.id} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/5">
                      <span className="font-semibold">{e.ref}</span> — {e.label} (journal {e.journal})
                    </li>
                  ))}
              </ul>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
