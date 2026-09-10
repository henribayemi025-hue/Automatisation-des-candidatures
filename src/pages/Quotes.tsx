import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { toMinor } from '../lib/money';
import type { PaymentMethod } from '../lib/types';
import { Empty, Field, Modal, Money, PageHeader, Table } from '../components/UI';
import { IconDoc, IconPlus } from '../components/Icons';

export default function Quotes() {
  const { db, confirmQuote } = useStore();
  const [convertId, setConvertId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [paidRaw, setPaidRaw] = useState('');

  const quotes = db.sales.filter((s) => s.status === 'QUOTE');
  const target = quotes.find((q) => q.id === convertId);

  function submit() {
    if (!target) return;
    const paid = method === 'CREDIT' ? toMinor(paidRaw || 0, db.company.currency) : target.total;
    confirmQuote(target.id, method, Math.min(paid, target.total));
    setConvertId(null);
    setPaidRaw('');
    setMethod('CASH');
  }

  return (
    <>
      <PageHeader
        title="Devis"
        subtitle={`${quotes.length} devis en attente de conversion`}
        actions={
          <Link to="/pos" className="btn-primary">
            <IconPlus className="h-4 w-4" />
            Nouveau devis (au point de vente)
          </Link>
        }
      />

      <div className="card p-0">
        {quotes.length ? (
          <Table head={['N° devis', 'Date', 'Client', 'Créé par', 'Montant', '']}>
            {quotes.map((q) => (
              <tr key={q.id} className="row">
                <td className="td font-semibold">{q.number}</td>
                <td className="td text-slate-500">{q.date}</td>
                <td className="td">{q.customerName}</td>
                <td className="td text-slate-500">{q.cashier}</td>
                <td className="td num font-semibold">
                  <Money value={q.total} />
                </td>
                <td className="td text-right">
                  <button onClick={() => setConvertId(q.id)} className="text-sm font-semibold text-brand-600">
                    Convertir en vente
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title="Aucun devis en attente"
            hint="Créez un devis depuis le point de vente : il ne touche ni le stock ni la comptabilité tant qu'il n'est pas converti."
            icon={<IconDoc className="h-10 w-10" />}
          />
        )}
      </div>

      <Modal open={!!target} onClose={() => setConvertId(null)} title="Convertir le devis en vente">
        {target && (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {target.number} — {target.customerName} — <Money value={target.total} />
            </p>
            <div className="space-y-4">
              <Field label="Moyen de paiement">
                <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="field">
                  <option value="CASH">Espèces</option>
                  <option value="MOBILE">Mobile money</option>
                  <option value="CARD">Carte</option>
                  <option value="BANK">Virement</option>
                  <option value="CREDIT">Crédit</option>
                </select>
              </Field>
              {method === 'CREDIT' && (
                <Field label="Acompte versé" hint="Le solde devient une créance client">
                  <input value={paidRaw} onChange={(e) => setPaidRaw(e.target.value)} inputMode="decimal" className="field num" />
                </Field>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setConvertId(null)} className="btn-ghost">
                Annuler
              </button>
              <button onClick={submit} className="btn-primary">
                Confirmer la vente
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
