import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { today, useStore } from '../lib/store';
import { formatMoney, toMajor, toMinor } from '../lib/money';
import { dayOf, endTime, overlapping, summarize } from '../lib/appointments';
import type { Appointment } from '../lib/types';
import { Badge, Empty, Field, Modal, Money, PageHeader, StatCard } from '../components/UI';
import { IconHistory, IconPlus } from '../components/Icons';
import { whatsappLink } from '../lib/chat';
import { t } from '../lib/i18n';

/**
 * Rendez-vous : qui vient, quand, pour quoi.
 *
 * Le geste qu'une coiffeuse fait dix fois par jour, et que l'application ne
 * savait pas faire — relevé le 18/09 en cherchant, métier par métier,
 * l'opération quotidienne absente. Sans ça, elle tient son carnet à côté, donc
 * elle vit dans le carnet et rien n'en rejoint jamais ses comptes.
 *
 * Ce n'est pas un agenda. C'est la page du carnet : une journée, dans l'ordre
 * des heures, et un bouton pour encaisser quand la personne est passée.
 *
 * Un rendez-vous n'écrit AUCUNE écriture. La vente arrive au paiement, par la
 * caisse, comme n'importe quelle vente.
 */

const BLANK = { customerName: '', phone: '', label: '', date: '', time: '09:00', minutes: '60', amount: '', notes: '' };

const ETAT: Record<Appointment['status'], { mot: string; ton?: 'success' | 'warn' | 'danger' }> = {
  BOOKED: { mot: 'Prévu' },
  DONE: { mot: 'Venu', ton: 'success' },
  NOSHOW: { mot: 'Pas venu', ton: 'danger' },
  CANCELLED: { mot: 'Annulé' },
};

/** Le jour d'après, sans passer par une bibliothèque de dates. */
function plusJours(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function Appointments() {
  const { db, saveAppointment, setAppointmentStatus } = useStore();
  const navigate = useNavigate();
  const currency = db.company.currency;
  const [jour, setJour] = useState(today());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState(BLANK);

  const liste = useMemo(() => dayOf(db, jour), [db, jour]);
  const resume = useMemo(() => summarize(db, today()), [db]);

  // On prévient d'un chevauchement, on ne le refuse pas : un salon à deux
  // fauteuils a raison de doubler.
  const conflits = useMemo(() => {
    if (!form.date || !form.time) return [];
    return overlapping(db, { id: editing?.id ?? '', date: form.date, time: form.time, minutes: Number(form.minutes) || 0 });
  }, [db, editing, form.date, form.time, form.minutes]);

  function nouveau(date = jour) {
    setEditing(null);
    setForm({ ...BLANK, date });
    setOpen(true);
  }

  function modifier(a: Appointment) {
    setEditing(a);
    setForm({
      customerName: a.customerName, phone: a.phone, label: a.label, date: a.date,
      time: a.time, minutes: String(a.minutes), amount: a.amount ? String(toMajor(a.amount, currency)) : '',
      notes: a.notes,
    });
    setOpen(true);
  }

  function enregistrer() {
    if (!form.customerName.trim() || !form.date || !form.time) return;
    saveAppointment({
      id: editing?.id,
      customerId: null,
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      label: form.label.trim() || t('Rendez-vous'),
      date: form.date,
      time: form.time,
      minutes: Number(form.minutes) || 60,
      amount: toMinor(form.amount || 0, currency),
      notes: form.notes.trim(),
    });
    setOpen(false);
  }

  /** Encaisser : on va à la caisse, la vente s'y fait comme d'habitude. */
  function encaisser(a: Appointment) {
    setAppointmentStatus(a.id, 'DONE');
    navigate('/pos');
  }

  function rappel(a: Appointment) {
    const texte = t('Bonjour {name}, petit rappel : votre rendez-vous {label} est prévu le {date} à {time}. À bientôt.', {
      name: a.customerName, label: a.label, date: a.date, time: a.time,
    });
    window.open(whatsappLink(a.phone, texte), '_blank');
  }

  return (
    <>
      <PageHeader
        title="Rendez-vous"
        subtitle="Qui vient, à quelle heure, pour quoi"
        actions={
          <button onClick={() => nouveau()} className="btn-primary">
            <IconPlus className="h-4 w-4" />
            {t('Nouveau rendez-vous')}
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label={t('Aujourd’hui')} value={String(resume.jour.length)} tone="dark" hint={t('rendez-vous prévus')} />
        <StatCard label={t('Encore à venir')} value={String(resume.aVenir.length)} hint={t('après l’heure qu’il est')} />
        <StatCard label={t('Demain')} value={String(resume.demain.length)} hint={t('à préparer ce soir')} />
        <StatCard label={t('Attendu aujourd’hui')} value={<Money value={resume.attendu} />} tone="positive" hint={t('si tout le monde vient')} />
      </div>

      {resume.enRetard.length > 0 && (
        <div className="mt-4 rounded-card border border-[#E7C9A9] bg-[#FBF1DF] px-4 py-3">
          <p className="text-body font-semibold text-[#8C6A3D]">
            {t('{n} rendez-vous passés ne sont ni encaissés ni annulés', { n: resume.enRetard.length })}
          </p>
          <p className="mt-0.5 text-caption text-muted">
            {resume.enRetard.slice(0, 4).map((a) => `${a.date} · ${a.customerName}`).join(' — ')}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button onClick={() => setJour(plusJours(jour, -1))} className="btn-ghost py-1.5 text-caption">{t('Veille')}</button>
        <input id="rdv-jour" type="date" value={jour} onChange={(e) => setJour(e.target.value)} className="field w-auto" />
        <button onClick={() => setJour(plusJours(jour, 1))} className="btn-ghost py-1.5 text-caption">{t('Lendemain')}</button>
        <button onClick={() => setJour(today())} className="btn-ghost py-1.5 text-caption">{t('Aujourd’hui')}</button>
      </div>

      <div className="mt-4 space-y-3">
        {liste.length === 0 ? (
          <Empty
            title={t('Aucun rendez-vous ce jour-là')}
            hint={t('Notez-en un : le carnet et la caisse cessent d’être deux choses séparées.')}
            icon={<IconHistory className="h-10 w-10" />}
          />
        ) : (
          liste.map((a) => (
            <div key={a.id} className="rounded-card border border-hairline bg-white p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-[22px] font-bold text-ink num">{a.time}</span>
                <span className="text-caption text-muted">{t('→ {fin}', { fin: endTime(a.time, a.minutes) })}</span>
                <Badge tone={ETAT[a.status].ton}>{t(ETAT[a.status].mot)}</Badge>
                {a.amount > 0 && <span className="ml-auto text-body font-semibold num">{formatMoney(a.amount, currency)}</span>}
              </div>
              <p className="mt-1 text-body font-semibold text-ink">{a.customerName}</p>
              <p className="text-caption text-muted">{a.label}{a.notes ? ` · ${a.notes}` : ''}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {a.status === 'BOOKED' && (
                  <button onClick={() => encaisser(a)} className="text-sm font-semibold text-brand-600">{t('Elle est venue — encaisser')}</button>
                )}
                {a.status === 'BOOKED' && a.phone && (
                  <button onClick={() => rappel(a)} className="text-sm font-semibold text-muted">{t('Rappel WhatsApp')}</button>
                )}
                <button onClick={() => modifier(a)} className="text-sm font-semibold text-muted">{t('Modifier')}</button>
                {a.status === 'BOOKED' && (
                  <>
                    <button onClick={() => setAppointmentStatus(a.id, 'NOSHOW')} className="text-sm font-semibold text-muted">{t('Pas venue')}</button>
                    <button
                      onClick={() => { if (window.confirm(t('Annuler le rendez-vous de {name} ?', { name: a.customerName }))) setAppointmentStatus(a.id, 'CANCELLED'); }}
                      className="text-sm font-semibold text-[#D14343]"
                    >
                      {t('Annuler')}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('Modifier le rendez-vous') : t('Nouveau rendez-vous')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Nom de la cliente')}>
            <input id="rdv-nom" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="field" />
          </Field>
          <Field label={t('Téléphone (WhatsApp)')} hint={t('pour le rappel')}>
            <input id="rdv-tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" className="field" placeholder="+237 6 99 12 34 56" />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('Pour quoi')}>
              <input id="rdv-objet" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="field" placeholder={t('Tresses, coupe, vidange…')} />
            </Field>
          </div>
          <Field label={t('Jour')}>
            <input id="rdv-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="field" />
          </Field>
          <Field label={t('Heure')}>
            <input id="rdv-heure" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="field" />
          </Field>
          <Field label={t('Durée (minutes)')} hint={form.time ? t('finit vers {fin}', { fin: endTime(form.time, Number(form.minutes) || 0) }) : undefined}>
            <input id="rdv-duree" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} inputMode="numeric" className="field num" />
          </Field>
          <Field label={t('Prix prévu ({c})', { c: currency })} hint={t('facultatif')}>
            <input id="rdv-prix" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="decimal" className="field num" />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('Note')}>
              <input id="rdv-note" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="field" />
            </Field>
          </div>
          {conflits.length > 0 && (
            <div className="sm:col-span-2 rounded-input border border-[#E7C9A9] bg-[#FBF1DF] px-3 py-2">
              <p className="text-caption font-semibold text-[#8C6A3D]">
                {t('Ce créneau chevauche : {liste}', { liste: conflits.map((c) => `${c.time} ${c.customerName}`).join(', ') })}
              </p>
              <p className="text-[11px] text-muted">{t('Ce n’est pas bloquant : à deux fauteuils, c’est normal.')}</p>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="btn-ghost">{t('Annuler')}</button>
          <button onClick={enregistrer} className="btn-primary">{editing ? t('Enregistrer') : t('Noter le rendez-vous')}</button>
        </div>
      </Modal>
    </>
  );
}
