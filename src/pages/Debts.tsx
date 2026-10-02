import { useState } from 'react';
import { useStore, today } from '../lib/store';
import { methodAccount } from '../lib/reducer';
import { balanceOf } from '../lib/ledger';
import { outstanding } from '../lib/metrics';
import { toMajor, toMinor } from '../lib/money';
import type { PaymentMethod } from '../lib/types';
import { Badge, Empty, Field, Modal, Money, PageHeader, StatCard, Table, useMoney } from '../components/UI';
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
  const money = useMoney();
  // Payer un fournisseur fait sortir de l'argent : comme pour une dépense, on
  // prévient avant de rendre une caisse négative.
  const [shortfall, setShortfall] = useState<{ available: number; amount: number } | null>(null);

  const all = db.debts.filter((d) => d.party === tab);
  const open = all.filter((d) => outstanding(d) > 0);
  const total = open.reduce((s, d) => s + outstanding(d), 0);
  const oldest = open.slice().sort((a, b) => a.date.localeCompare(b.date))[0];

  const monthStart = today().slice(0, 8) + '01';
  const recovered = all.reduce(
    (s, d) => s + d.payments.filter((p) => p.date >= monthStart).reduce((x, p) => x + p.amount, 0),
    0,
  );

  const target = db.debts.find((d) => d.id === payId);

  function submit(force = false) {
    if (!target) return;
    const amount = Math.min(toMinor(amountRaw || 0, db.company.currency), outstanding(target));
    if (amount <= 0) return;
    if (!force && target.party === 'SUPPLIER') {
      const available = balanceOf(methodAccount(db.company.chart, method), db.entries, 'DEBIT', undefined, today());
      if (available < amount) {
        setShortfall({ available, amount });
        return;
      }
    }
    setShortfall(null);
    payDebt(target.id, amount, method);
    setPayId(null);
    setAmountRaw('');
  }

  const isCustomer = tab === 'CUSTOMER';

  return (
    <>
      <PageHeader
        title={isCustomer ? t('Créances clients') : t('Dettes fournisseurs')}
        subtitle={isCustomer ? t('Ventes à crédit non entièrement réglées') : t('Achats restant à payer')}
      />

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('CUSTOMER')} aria-pressed={isCustomer} className={isCustomer ? 'btn-dark' : 'btn-ghost'}>
          {t('Clients débiteurs')}
        </button>
        <button onClick={() => setTab('SUPPLIER')} aria-pressed={!isCustomer} className={!isCustomer ? 'btn-dark' : 'btn-ghost'}>
          {t('Fournisseurs')}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={isCustomer ? t('Total des créances') : t('Total des dettes')}
          value={<Money value={total} />}
          hint={`${open.length} ${t('tiers concerné(s)')}`}
          tone="dark"
        />
        <StatCard
          label={t('La plus ancienne')}
          value={oldest ? oldest.date : '—'}
          hint={oldest ? oldest.partyName : t('Aucun encours')}
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
          <Table head={['Tiers', 'Origine', 'Date', 'Montant initial', 'Déjà réglé', 'Reste dû', '']} phoneHide={[2, 3, 4, 5]} phoneNowrapFirst>
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
                    {age > 30 && <Badge tone="danger">{t('{n} jours', { n: age })}</Badge>}
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
                            db.company.country,
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
                          setShortfall(null);
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
            title={isCustomer ? t('Aucune créance en cours') : t('Aucune dette en cours')}
            hint={t('Tous les comptes sont à jour.')}
            icon={<IconCheck className="h-10 w-10 text-teal-500" />}
          />
        )}
      </div>

      {all.some((d) => outstanding(d) === 0) && (
        <div className="card mt-6 p-0">
          <h2 className="px-5 pb-3 pt-5 font-bold">{t('Soldés')}</h2>
          <Table head={['Tiers', 'Origine', 'Date', 'Montant']} phoneHide={[2, 3]}>
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
                <input value={amountRaw} onChange={(e) => { setAmountRaw(e.target.value); setShortfall(null); }} inputMode="decimal" className="field num" />
              </Field>
              <Field label={t('Moyen de paiement')}>
                <select value={method} onChange={(e) => { setMethod(e.target.value as PaymentMethod); setShortfall(null); }} className="field">
                  <option value="CASH">{t('Espèces')}</option>
                  <option value="MOBILE">{t('Mobile money')}</option>
                  <option value="CARD">{t('Carte')}</option>
                  <option value="BANK">{t('Virement')}</option>
                </select>
              </Field>
              <button
                onClick={() => { setAmountRaw(String(toMajor(outstanding(target), db.company.currency))); setShortfall(null); }}
                className="text-sm font-semibold text-brand-600"
              >
                {t('Solder entièrement')}
              </button>
            </div>
            {shortfall && (
              <div className="mt-4 rounded-input border border-[#B8860B]/50 bg-[#FBF1DF] px-3 py-2.5 text-caption text-ink">
                <p className="font-semibold">{t('Ce compte n’a pas assez d’argent à cette date.')}</p>
                <p className="mt-0.5">
                  {t('Disponible : {available} · règlement : {amount}. Enregistrez d’abord l’argent entré, ou choisissez un autre moyen de paiement.', { available: money(shortfall.available), amount: money(shortfall.amount) })}
                </p>
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button onClick={() => setPayId(null)} className="btn-ghost">
                {t('Annuler')}
              </button>
              {shortfall ? (
                <button onClick={() => submit(true)} className="btn-ghost">
                  {t('Enregistrer quand même')}
                </button>
              ) : null}
              <button onClick={() => submit()} className="btn-primary">
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
