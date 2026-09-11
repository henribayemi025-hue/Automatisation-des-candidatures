import { useState } from 'react';
import { useStore } from '../lib/store';
import { outstanding } from '../lib/metrics';
import { toMajor, toMinor } from '../lib/money';
import type { PaymentMethod } from '../lib/types';
import { Badge, Empty, Field, Modal, Money, PageHeader, StatCard, Table } from '../components/UI';
import { IconCard, IconCheck } from '../components/Icons';
import { t } from '../lib/i18n';
import { whatsappLink } from '../lib/chat';
import { formatMoney } from '../lib/money';

type Tab = 'CUSTOMER' | 'SUPPLIER';

export default function Debts() {
  const { db, payDebt } = useStore();
  const [tab, setTab] = useState<Tab>('CUSTOMER');
  const [payId, setPayId] = useState<string | null>(null);
  const [amountRaw, setAmountRaw] = useState('');
  const phoneOf = (partyId: string | null) => db.customers.find((c) => c.id === partyId)?.phone ?? '';
  const [method, setMethod] = useState<PaymentMethod>('CASH');

  const all = db.debts.filter((d) => d.party === tab);
  const open = all.filter((d) => outstanding(d) > 0);
  const total = open.reduce((s, d) => s + outstanding(d), 0);
  const oldest = open.slice().sort((a, b) => a.date.localeCompare(b.date))[0];

  const monthStart = new Date().toISOString().slice(0, 8) + '01';
  const recovered = all.reduce(
    (s, d) => s + d.payments.filter((p) => p.date >= monthStart).reduce((x, p) => x + p.amount, 0),
    0,
  );

  const target = db.debts.find((d) => d.id === payId);

  function submit() {
    if (!target) return;
    const amount = Math.min(toMinor(amountRaw || 0, db.company.currency), outstanding(target));
    if (amount <= 0) return;
    payDebt(target.id, amount, method);
    setPayId(null);
    setAmountRaw('');
  }

  const isCustomer = tab === 'CUSTOMER';

  return (
    <>
      <PageHeader
        title={isCustomer ? 'Créances clients' : 'Dettes fournisseurs'}
        subtitle={isCustomer ? 'Ventes à crédit non entièrement réglées' : 'Achats restant à payer'}
      />

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('CUSTOMER')} className={isCustomer ? 'btn-dark' : 'btn-ghost'}>
          {t('Clients débiteurs')}
        </button>
        <button onClick={() => setTab('SUPPLIER')} className={!isCustomer ? 'btn-dark' : 'btn-ghost'}>
          {t('Fournisseurs')}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={isCustomer ? 'Total des créances' : 'Total des dettes'}
          value={<Money value={total} />}
          hint={`${open.length} tiers concerné(s)`}
          tone="dark"
        />
        <StatCard
          label={t('La plus ancienne')}
          value={oldest ? oldest.date : '—'}
          hint={oldest ? oldest.partyName : 'Aucun encours'}
        />
        <StatCard
          label={t('Réglé ce mois')}
          value={<Money value={recovered} />}
          tone="positive"
          hint={t('Encaissements et décaissements')}
        />
      </div>

      <div className="card mt-6 p-0">
        {open.length ? (
          <Table head={['Tiers', 'Origine', 'Date', 'Montant initial', 'Déjà réglé', 'Reste dû', '']}>
            {open.map((d) => {
              const rest = outstanding(d);
              const paid = d.amount - rest;
              const age = Math.floor(
                (Date.now() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24),
              );
              return (
                <tr key={d.id} className="row">
                  <td className="td">
                    <div className="font-semibold">{d.partyName}</div>
                    {age > 30 && <Badge tone="danger">{age} jours</Badge>}
                  </td>
                  <td className="td text-slate-500">{d.origin}</td>
                  <td className="td text-slate-500">{d.date}</td>
                  <td className="td num">
                    <Money value={d.amount} />
                  </td>
                  <td className="td num text-teal-600">
                    <Money value={paid} />
                  </td>
                  <td className="td num font-bold">
                    <Money value={rest} />
                  </td>
                  <td className="td text-right">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {isCustomer && phoneOf(d.partyId) && (
                        <a
                          href={whatsappLink(
                            phoneOf(d.partyId),
                            t('Bonjour {name}, petit rappel de {shop} : il reste {amount} à régler pour {origin}. Merci !', {
                              name: d.partyName,
                              shop: db.company.name,
                              amount: formatMoney(rest, db.company.currency),
                              origin: d.origin,
                            }),
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[#1F6F65]"
                        >
                          {t('Relancer sur WhatsApp')}
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setPayId(d.id);
                          setAmountRaw('');
                        }}
                        className="text-sm font-semibold text-brand-600"
                      >
                        {t('Enregistrer un règlement')}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty
            title={isCustomer ? 'Aucune créance en cours' : 'Aucune dette en cours'}
            hint={t('Tous les comptes sont à jour.')}
            icon={<IconCheck className="h-10 w-10 text-teal-500" />}
          />
        )}
      </div>

      {all.some((d) => outstanding(d) === 0) && (
        <div className="card mt-6 p-0">
          <h2 className="px-5 pb-3 pt-5 font-bold">{t('Soldés')}</h2>
          <Table head={['Tiers', 'Origine', 'Date', 'Montant']}>
            {all
              .filter((d) => outstanding(d) === 0)
              .map((d) => (
                <tr key={d.id} className="row">
                  <td className="td">{d.partyName}</td>
                  <td className="td text-slate-500">{d.origin}</td>
                  <td className="td text-slate-500">{d.date}</td>
                  <td className="td num">
                    <Money value={d.amount} />
                  </td>
                </tr>
              ))}
          </Table>
        </div>
      )}

      <Modal open={!!target} onClose={() => setPayId(null)} title={t('Enregistrer un règlement')}>
        {target && (
          <>
            <div className="mb-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5">
              <div className="font-semibold">{target.partyName}</div>
              <div className="text-slate-500">{target.origin}</div>
              <div className="mt-2">
                {t('Reste dû :')} <Money value={outstanding(target)} className="font-bold" />
              </div>
            </div>
            <div className="space-y-4">
              <Field label={t('Montant du règlement')}>
                <input value={amountRaw} onChange={(e) => setAmountRaw(e.target.value)} inputMode="decimal" className="field num" />
              </Field>
              <Field label={t('Moyen de paiement')}>
                <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="field">
                  <option value="CASH">{t('Espèces')}</option>
                  <option value="MOBILE">{t('Mobile money')}</option>
                  <option value="CARD">{t('Carte')}</option>
                  <option value="BANK">{t('Virement')}</option>
                </select>
              </Field>
              <button
                onClick={() => setAmountRaw(String(toMajor(outstanding(target), db.company.currency)))}
                className="text-sm font-semibold text-brand-600"
              >
                {t('Solder entièrement')}
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setPayId(null)} className="btn-ghost">
                {t('Annuler')}
              </button>
              <button onClick={submit} className="btn-primary">
                <IconCard className="h-4 w-4" />
                {t('Enregistrer')}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
