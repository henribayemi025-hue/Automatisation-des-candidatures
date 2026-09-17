import { useMemo, useState } from 'react';
import { today, useStore } from '../lib/store';
import { formatMoney, toMajor, toMinor } from '../lib/money';
import { addPeriod, daysLeft, durationLabel, stateOf, summarize } from '../lib/subscriptions';
import type { SubscriptionState } from '../lib/subscriptions';
import type { PaymentMethod, Sale, Subscription } from '../lib/types';
import { Badge, Empty, Field, Modal, Money, PageHeader, StatCard, Table } from '../components/UI';
import Receipt from '../components/Receipt';
import { IconHistory, IconPlus } from '../components/Icons';
import { whatsappLink } from '../lib/chat';
import { t } from '../lib/i18n';

/**
 * Abonnements : qui, à quoi, combien, jusqu'à quand.
 *
 * Demande d'un commerçant : suivre les abonnements avec un compte à rebours,
 * être prévenu à la fin ou à l'approche de la fin, faire la facture sur place
 * et l'envoyer par WhatsApp. Chaque encaissement est une vente normale : il
 * apparaît dans Ventes, la caisse et le journal, avec son ticket.
 */

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'MOBILE', label: 'Mobile money' },
  { value: 'CARD', label: 'Carte' },
  { value: 'BANK', label: 'Virement' },
];

const STATE_LABEL: Record<SubscriptionState, string> = {
  ACTIVE: 'En cours',
  SOON: 'Finit bientôt',
  EXPIRED: 'Expiré',
  CANCELLED: 'Arrêté',
};

type Filter = 'ALL' | SubscriptionState;

export default function Subscriptions() {
  const { db, saveSubscription, renewSubscription, cancelSubscription } = useStore();
  const currency = db.company.currency;
  const todayISO = today();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [renewing, setRenewing] = useState<Subscription | null>(null);
  const [receipt, setReceipt] = useState<Sale | null>(null);

  // Formulaire
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [label, setLabel] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [every, setEvery] = useState('1');
  const [unit, setUnit] = useState<'DAY' | 'MONTH'>('MONTH');
  const [startDate, setStartDate] = useState(todayISO);
  const [notes, setNotes] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [payNow, setPayNow] = useState(true);
  const [error, setError] = useState('');

  const summary = useMemo(() => summarize(db, todayISO), [db, todayISO]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.subscriptions
      .map((s) => ({ sub: s, state: stateOf(s, todayISO), left: daysLeft(s, todayISO) }))
      .filter((x) => filter === 'ALL' ? x.state !== 'CANCELLED' : x.state === filter)
      .filter((x) => !q || x.sub.customerName.toLowerCase().includes(q) || x.sub.label.toLowerCase().includes(q) || x.sub.phone.includes(q))
      .sort((a, b) => a.sub.endDate.localeCompare(b.sub.endDate));
  }, [db.subscriptions, filter, query, todayISO]);

  function reset() {
    setCustomerId('');
    setCustomerName('');
    setPhone('');
    setLabel('');
    setAmountRaw('');
    setEvery('1');
    setUnit('MONTH');
    setStartDate(todayISO);
    setNotes('');
    setMethod('CASH');
    setPayNow(true);
    setError('');
    setEditing(null);
  }

  function startEdit(sub: Subscription) {
    setEditing(sub);
    setCustomerId(sub.customerId ?? '');
    setCustomerName(sub.customerName);
    setPhone(sub.phone);
    setLabel(sub.label);
    setAmountRaw(String(toMajor(sub.amount, currency)));
    setEvery(String(sub.every));
    setUnit(sub.unit);
    setStartDate(sub.startDate);
    setNotes(sub.notes);
    setPayNow(false);
    setOpen(true);
  }

  function pickCustomer(id: string) {
    setCustomerId(id);
    const c = db.customers.find((x) => x.id === id);
    if (c) {
      setCustomerName(c.name);
      if (c.phone) setPhone(c.phone);
    }
  }

  function submit() {
    const amount = toMinor(amountRaw || 0, currency);
    const n = Math.max(1, Math.floor(Number(every) || 0));
    if (!customerName.trim()) return setError(t('Indiquez le nom du client.'));
    if (!label.trim()) return setError(t('Indiquez l’abonnement : « Salle — mensuel », « Wifi 10 Mo »…'));
    if (amount <= 0) return setError(t('Indiquez le prix d’une période.'));
    const sub = saveSubscription({
      id: editing?.id,
      customerId: customerId || null,
      customerName: customerName.trim(),
      phone: phone.trim(),
      label: label.trim(),
      amount,
      every: n,
      unit,
      startDate,
      notes: notes.trim(),
    });
    let sale: Sale | null = null;
    if (!editing && payNow) sale = renewSubscription(sub.id, method, amount, startDate);
    setOpen(false);
    reset();
    if (sale) setReceipt(sale);
  }

  function renew(sub: Subscription, m: PaymentMethod) {
    const sale = renewSubscription(sub.id, m);
    setRenewing(null);
    if (sale) setReceipt(sale);
  }

  const durationOf = (s: Subscription) => durationLabel(s.every, s.unit, t);
  const previewEnd = addPeriod(startDate, Math.max(1, Math.floor(Number(every) || 1)), unit);

  const reminderText = (s: Subscription, state: SubscriptionState) =>
    state === 'EXPIRED'
      ? t('Bonjour {name}, votre abonnement « {label} » chez {shop} est terminé depuis le {date}. Pour continuer : {amount} pour {duration}. Merci !', {
          name: s.customerName, label: s.label, shop: db.company.name, date: s.endDate, amount: formatMoney(s.amount, currency), duration: durationOf(s),
        })
      : t('Bonjour {name}, votre abonnement « {label} » chez {shop} se termine le {date}. Pour le renouveler : {amount} pour {duration}. Merci !', {
          name: s.customerName, label: s.label, shop: db.company.name, date: s.endDate, amount: formatMoney(s.amount, currency), duration: durationOf(s),
        });

  const invoiceText = (s: Subscription) => {
    const last = s.periods[s.periods.length - 1];
    const sale = last?.saleId ? db.sales.find((x) => x.id === last.saleId) : null;
    return t('{shop} — Facture {n}\n{label}\nPériode : du {from} au {to}\nMontant : {amount}\nPayé le {paid}. Merci {name} !', {
      shop: db.company.name, n: sale?.number ?? '—', label: s.label, from: last?.from ?? s.startDate, to: last?.to ?? s.endDate,
      amount: formatMoney(last?.amount ?? s.amount, currency), paid: last?.paidAt ?? '—', name: s.customerName,
    });
  };

  const tone = (state: SubscriptionState) => (state === 'ACTIVE' ? 'success' : state === 'SOON' ? 'warn' : state === 'EXPIRED' ? 'danger' : 'neutral');
  const leftLabel = (state: SubscriptionState, left: number) =>
    state === 'CANCELLED' ? t('Arrêté') : left < 0 ? t('dépassé de {n} j', { n: -left }) : left === 0 ? t('dernier jour') : t('{n} j', { n: left });
  const showInvoice = (sub: Subscription) => {
    const last = sub.periods[sub.periods.length - 1];
    const sale = last?.saleId ? db.sales.find((x) => x.id === last.saleId) : null;
    if (sale) setReceipt(sale);
  };
  const actions = (sub: Subscription, state: SubscriptionState) => (
    <>
      {sub.status !== 'CANCELLED' && (
        <button onClick={() => setRenewing(sub)} className="text-sm font-semibold text-brand-600">{t('Encaisser une période')}</button>
      )}
      {sub.phone && sub.periods.length > 0 && (
        <a href={whatsappLink(sub.phone, invoiceText(sub))} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#1F6F65]">{t('Facture WhatsApp')}</a>
      )}
      {sub.phone && (state === 'SOON' || state === 'EXPIRED') && (
        <a href={whatsappLink(sub.phone, reminderText(sub, state))} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#1F6F65]">{t('Rappel WhatsApp')}</a>
      )}
      {sub.periods.length > 0 && (
        <button onClick={() => showInvoice(sub)} className="text-sm font-semibold text-muted">{t('Voir la facture')}</button>
      )}
      <button onClick={() => startEdit(sub)} className="text-sm font-semibold text-muted">{t('Modifier')}</button>
      {sub.status !== 'CANCELLED' && (
        <button onClick={() => { if (window.confirm(t('Arrêter l’abonnement de {name} ? Les périodes déjà payées restent dans les comptes.', { name: sub.customerName }))) cancelSubscription(sub.id); }} className="text-sm font-semibold text-[#D14343]">{t('Arrêter')}</button>
      )}
    </>
  );

  return (
    <>
      <Receipt sale={receipt} company={db.company} onClose={() => setReceipt(null)} />
      <PageHeader
        title="Abonnements"
        subtitle="Qui est abonné, jusqu’à quand, et qui arrive au bout"
        actions={
          <button onClick={() => { reset(); setOpen(true); }} className="btn-primary">
            <IconPlus className="h-4 w-4" />
            {t('Nouvel abonnement')}
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label={t('En cours')} value={String(summary.active)} tone="dark" hint={t('couverts au-delà de la semaine')} />
        <StatCard label={t('Finissent bientôt')} value={String(summary.soon)} tone={summary.soon ? 'negative' : undefined} hint={t('moins de 7 jours')} />
        <StatCard label={t('Expirés')} value={String(summary.expired)} tone={summary.expired ? 'negative' : undefined} hint={t('à relancer')} />
        <StatCard label={t('Valeur par mois')} value={<Money value={summary.monthlyValue} />} tone="positive" hint={t('si tous renouvellent')} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(['ALL', 'SOON', 'EXPIRED', 'ACTIVE', 'CANCELLED'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'btn-dark py-1.5 text-caption' : 'btn-ghost py-1.5 text-caption'}>
            {f === 'ALL' ? t('Tous') : t(STATE_LABEL[f])}
          </button>
        ))}
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Chercher un client, une offre, un numéro')} className="field ml-auto max-w-xs" />
      </div>

      <div className="card mt-4 p-0">
        {list.length ? (
          <>
            {/* Téléphone : une carte par abonné, le compte à rebours bien en vue. */}
            <ul className="divide-y divide-hairline sm:hidden">
              {list.map(({ sub, state, left }) => (
                <li key={sub.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{sub.customerName}</div>
                      <div className="text-caption text-muted">{sub.label} · {durationOf(sub)}</div>
                      {sub.phone && <div className="text-caption text-muted">{sub.phone}</div>}
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge tone={tone(state)}>{leftLabel(state, left)}</Badge>
                      <div className="mt-1 text-caption text-muted">{sub.periods.length ? t('jusqu’au {d}', { d: sub.endDate }) : t('pas encore payé')}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="num font-semibold"><Money value={sub.amount} /></span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{actions(sub, state)}</div>
                </li>
              ))}
            </ul>
            <div className="hidden sm:block">
              <Table head={[t('Client'), t('Abonnement'), t('Prix'), t('Fin'), t('Reste'), '']}>
                {list.map(({ sub, state, left }) => (
                  <tr key={sub.id} className="row">
                    <td className="td">
                      <div className="font-semibold">{sub.customerName}</div>
                      {sub.phone && <div className="text-caption text-muted">{sub.phone}</div>}
                    </td>
                    <td className="td">
                      <div>{sub.label}</div>
                      <div className="text-caption text-muted">{durationOf(sub)} · {sub.periods.length} {t('période(s) payée(s)')}</div>
                    </td>
                    <td className="td num"><Money value={sub.amount} /></td>
                    <td className="td">{sub.periods.length ? sub.endDate : <span className="text-muted">{t('pas encore payé')}</span>}</td>
                    <td className="td"><Badge tone={tone(state)}>{leftLabel(state, left)}</Badge></td>
                    <td className="td text-right">
                      <div className="flex flex-wrap items-center justify-end gap-3">{actions(sub, state)}</div>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          </>
        ) : (
          <Empty
            icon={<IconHistory />}
            title={db.subscriptions.length ? t('Rien dans ce filtre') : t('Aucun abonnement pour l’instant')}
            hint={t('Salle de sport, wifi, cours, télé, parking : tout ce qui se paie pour une durée. Vous saurez qui arrive au bout avant qu’il ne le sache.')}
          />
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); reset(); }} title={editing ? t('Modifier l’abonnement') : t('Nouvel abonnement')}>
        <div className="grid gap-3 sm:grid-cols-2">
          {db.customers.length > 0 && (
            <Field label={t('Client enregistré')} hint={t('ou saisissez un nom ci-dessous')}>
              <select value={customerId} onChange={(e) => pickCustomer(e.target.value)} className="field">
                <option value="">{t('— choisir —')}</option>
                {db.customers.filter((c) => !c.archived).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}
          <Field label={t('Nom du client')}>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="field" />
          </Field>
          <Field label={t('Téléphone (WhatsApp)')} hint={t('avec l’indicatif, pour les rappels et la facture')}>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className="field" placeholder="+237 6 99 12 34 56" />
          </Field>
          <Field label={t('Abonnement')} hint={t('l’offre, telle que le client la connaît')}>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="field" placeholder={t('Salle — mensuel')} />
          </Field>
          <Field label={t('Prix d’une période ({c})', { c: currency })}>
            <input value={amountRaw} onChange={(e) => setAmountRaw(e.target.value)} inputMode="decimal" className="field num" />
          </Field>
          <Field label={t('Durée d’une période')}>
            <div className="flex gap-2">
              <input value={every} onChange={(e) => setEvery(e.target.value)} inputMode="numeric" className="field num w-24" />
              <select value={unit} onChange={(e) => setUnit(e.target.value as 'DAY' | 'MONTH')} className="field">
                <option value="MONTH">{t('mois')}</option>
                <option value="DAY">{t('jours')}</option>
              </select>
            </div>
          </Field>
          <Field label={t('Début')} hint={t('première période : jusqu’au {d}', { d: previewEnd })}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="field" />
          </Field>
          <Field label={t('Notes')}>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="field" />
          </Field>
        </div>
        {!editing && (
          <div className="mt-4 rounded-input border border-hairline p-3">
            <label className="flex items-center gap-2 text-body">
              <input type="checkbox" checked={payNow} onChange={(e) => setPayNow(e.target.checked)} />
              {t('Encaisser la première période maintenant (vente + facture)')}
            </label>
            {payNow && (
              <div className="mt-3 flex flex-wrap gap-2">
                {METHODS.map((m) => (
                  <button key={m.value} onClick={() => setMethod(m.value)} className={method === m.value ? 'btn-dark py-1.5 text-caption' : 'btn-ghost py-1.5 text-caption'}>{t(m.label)}</button>
                ))}
              </div>
            )}
          </div>
        )}
        {error && <p className="mt-3 text-caption font-semibold text-[#A63030]">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => { setOpen(false); reset(); }} className="btn-ghost">{t('Annuler')}</button>
          <button onClick={submit} className="btn-primary">{editing ? t('Enregistrer') : payNow ? t('Enregistrer et encaisser') : t('Enregistrer')}</button>
        </div>
      </Modal>

      <Modal open={!!renewing} onClose={() => setRenewing(null)} title={renewing ? t('Encaisser une période — {name}', { name: renewing.customerName }) : ''}>
        {renewing && (
          <>
            <p className="text-body">
              {t('{label} : {amount} pour {duration}.', { label: renewing.label, amount: formatMoney(renewing.amount, currency), duration: durationOf(renewing) })}{' '}
              {renewing.periods.length && daysLeft(renewing, todayISO) >= -1
                ? t('La nouvelle période commence le {d}, à la suite de l’actuelle.', { d: addPeriod(renewing.endDate, 2, 'DAY') })
                : t('La nouvelle période commence aujourd’hui.')}
            </p>
            <p className="mt-1 text-caption text-muted">{t('Une vente est enregistrée avec son ticket ; la facture s’envoie ensuite sur WhatsApp.')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {METHODS.map((m) => (
                <button key={m.value} onClick={() => renew(renewing, m.value)} className="btn-primary py-1.5 text-caption">{t(m.label)}</button>
              ))}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
