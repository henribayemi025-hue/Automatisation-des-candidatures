import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { useCollab } from '../lib/collab';
import { toMinor } from '../lib/money';
import type { PaymentMethod } from '../lib/types';
import { Empty, Field, Modal, Money, PageHeader, Table } from '../components/UI';
import { IconDoc, IconPlus } from '../components/Icons';
import Receipt from '../components/Receipt';
import { t } from '../lib/i18n';

export default function Quotes() {
  const { db, confirmQuote, cancelQuote } = useStore();
  const { workspace } = useCollab();
  const [openId, setOpenId] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [paidRaw, setPaidRaw] = useState('');

  const quotes = db.sales.filter((s) => s.status === 'QUOTE');
  const opened = quotes.find((q) => q.id === openId) ?? null;
  const target = quotes.find((q) => q.id === convertId);
  // La base refuse l'annulation à un caissier (finia_can_emit) : le bouton
  // ne s'affiche pas plutôt que d'échouer en silence.
  const canCancel = workspace?.role !== 'cashier';

  function submit() {
    if (!target) return;
    const paid = method === 'CREDIT' ? toMinor(paidRaw || 0, db.company.currency) : target.total;
    confirmQuote(target.id, method, Math.min(paid, target.total));
    setConvertId(null);
    setPaidRaw('');
    setMethod('CASH');
  }

  function cancel(id: string, number: string) {
    if (!window.confirm(t('Annuler le devis {n} ? Il quitte la liste ; rien n’avait été encaissé ni déstocké.', { n: number }))) return;
    cancelQuote(id);
    setOpenId(null);
  }

  return (
    <>
      <PageHeader
        title={t('Devis')}
        subtitle={t('{n} devis en attente de la réponse du client', { n: quotes.length })}
        actions={
          <Link to="/pos" className="btn-primary">
            <IconPlus className="h-4 w-4" />
            {t('Nouveau devis (au point de vente)')}
          </Link>
        }
      />

      <div className="card p-0">
        {quotes.length ? (
          <Table head={['N° devis', 'Date', 'Client', 'Créé par', 'Montant', '']} phoneHide={[2, 4]}>
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
                  <button onClick={() => setOpenId(q.id)} className="text-sm font-semibold text-brand-600">
                    {t('Ouvrir')}
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title={t('Aucun devis en attente')}
            hint={t('Créez un devis depuis le point de vente : il ne touche ni le stock ni la comptabilité tant qu\'il n\'est pas converti.')}
            icon={<IconDoc className="h-10 w-10" />}
          />
        )}
      </div>

      {opened && (
        <Receipt
          sale={opened}
          company={db.company}
          reopened
          onClose={() => setOpenId(null)}
          actions={
            <>
              {canCancel && (
                <button onClick={() => cancel(opened.id, opened.number)} className="btn-ghost text-brand-600">
                  {t('Annuler le devis')}
                </button>
              )}
              <button
                onClick={() => {
                  setOpenId(null);
                  setConvertId(opened.id);
                }}
                className="btn-primary ml-auto"
              >
                {t('Convertir en vente')}
              </button>
            </>
          }
        />
      )}

      <Modal open={!!target} onClose={() => setConvertId(null)} title={t('Convertir le devis en vente')}>
        {target && (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {target.number} — {target.customerName} — <Money value={target.total} />
            </p>
            <div className="space-y-4">
              <Field label={t('Moyen de paiement')}>
                <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="field">
                  <option value="CASH">{t('Espèces')}</option>
                  <option value="MOBILE">{t('Mobile money')}</option>
                  <option value="CARD">{t('Carte')}</option>
                  <option value="BANK">{t('Virement')}</option>
                  <option value="CREDIT">{t('Crédit')}</option>
                </select>
              </Field>
              {method === 'CREDIT' && (
                <Field label={t('Acompte versé')} hint={t('Le solde devient une créance client')}>
                  <input value={paidRaw} onChange={(e) => setPaidRaw(e.target.value)} inputMode="decimal" className="field num" />
                </Field>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setConvertId(null)} className="btn-ghost">
                {t('Annuler')}
              </button>
              <button onClick={submit} className="btn-primary">
                {t('Confirmer la vente')}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
