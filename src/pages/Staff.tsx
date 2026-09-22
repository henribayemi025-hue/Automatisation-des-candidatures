import { useMemo, useState } from 'react';
import { today, useStore } from '../lib/store';
import { toMajor, toMinor } from '../lib/money';
import {
  ATTENDANCE_LABEL,
  PAY_KIND_LABEL,
  attendanceIn,
  daysWorked,
  openAdvances,
  payrollPreview,
  periodBounds,
} from '../lib/payroll';
import type { Attendance, DB, Employee, PaymentMethod, PayKind, Payslip } from '../lib/types';
import { Badge, Empty, Field, FigureStrip, Modal, Money, PageHeader, Table } from '../components/UI';
import { IconPlus, IconUsers } from '../components/Icons';
import { t } from '../lib/i18n';
import { absencesEnMemeTemps, enAttente, nombreDeJours, pointagesAPoser } from '../lib/leaves';

/**
 * Personnel. Trois choses, dans l'ordre où elles arrivent vraiment : qui
 * travaille ici, qui était là cette semaine, et combien on leur doit.
 *
 * Ce n'est pas un logiciel de paie : pas de cotisations sociales ni de
 * bulletin réglementaire — ça dépend du pays et change chaque année. C'est le
 * suivi de ce qu'on doit et de ce qu'on a versé, avec les écritures qui vont
 * avec : la charge au brut, l'avance en créance, le net en sortie d'argent.
 */

type Tab = 'PEOPLE' | 'ATTENDANCE' | 'LEAVES' | 'PAYROLL';

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'CASH', label: 'Espèces' },
  { id: 'MOBILE', label: 'Mobile money' },
  { id: 'BANK', label: 'Banque' },
];

const STATUSES: Attendance['status'][] = ['PRESENT', 'HALF', 'ABSENT', 'LEAVE'];
const STATUS_TONE: Record<Attendance['status'], 'success' | 'warn' | 'danger' | 'info'> = {
  PRESENT: 'success',
  HALF: 'warn',
  ABSENT: 'danger',
  LEAVE: 'info',
};

/** Les jours de la période, du plus récent au plus ancien, sans dépasser aujourd'hui. */
function daysOf(period: string, todayISO: string): string[] {
  const { from, to } = periodBounds(period);
  const last = to > todayISO ? todayISO : to;
  const out: string[] = [];
  for (let d = new Date(`${from}T12:00:00.000Z`); d.toISOString().slice(0, 10) <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out.reverse();
}

export default function Staff() {
  const { db, saveEmployee, archiveEmployee, markAttendance, payAdvance, runPayroll, settlePayroll, requestLeave, decideLeave } = useStore();
  const [tab, setTab] = useState<Tab>('PEOPLE');
  const [period, setPeriod] = useState(today().slice(0, 7));
  // Les demandes en attente, pour la pastille de l'onglet : une demande de
  // congé qu'on ne voit pas est une personne qui attend une réponse.
  const attente = useMemo(() => enAttente(db.leaves), [db.leaves]);
  const [form, setForm] = useState<Employee | null>(null);
  const [open, setOpen] = useState(false);
  const [advanceFor, setAdvanceFor] = useState<Employee | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [note, setNote] = useState('');

  const archivedCount = db.employees.filter((e) => e.archived).length;
  const viewingArchived = showArchived && archivedCount > 0;
  const people = db.employees.filter((e) => (viewingArchived ? e.archived : !e.archived));
  const active = db.employees.filter((e) => !e.archived);

  const { to } = periodBounds(period);
  const preview = useMemo(() => payrollPreview(db, period), [db, period]);
  const totalAdvances = active.reduce((s, e) => s + openAdvances(db, e.id, today()), 0);
  const monthly = active.reduce((s, e) => s + (e.payKind === 'MONTHLY' ? e.rate : 0), 0);
  const unpaid = db.payrolls.filter((r) => !r.paid).reduce((s, r) => s + r.net, 0);

  return (
    <>
      <PageHeader
        title={t('Personnel')}
        subtitle={t('Qui travaille ici, qui était là, et ce qu’on leur doit')}
        actions={
          <button
            onClick={() => {
              setForm(null);
              setOpen(true);
            }}
            className="btn-primary"
          >
            <IconPlus className="h-4 w-4" />
            {t('Nouvelle personne')}
          </button>
        }
      />

      <div className="mb-5">
        <FigureStrip
          items={[
            { label: t('Personnes'), value: <span className="num">{active.length}</span> },
            { label: t('Salaires fixes du mois'), value: <Money value={monthly} /> },
            { label: t('Avances en cours'), value: <Money value={totalAdvances} />, tone: totalAdvances > 0 ? 'negative' : 'neutral' },
            { label: t('Salaires non versés'), value: <Money value={unpaid} />, tone: unpaid > 0 ? 'negative' : 'neutral' },
          ]}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setTab('PEOPLE')} className={tab === 'PEOPLE' ? 'btn-dark' : 'btn-ghost'}>
          {t('Les personnes')}
        </button>
        <button onClick={() => setTab('ATTENDANCE')} className={tab === 'ATTENDANCE' ? 'btn-dark' : 'btn-ghost'}>
          {t('Présences')}
        </button>
        <button onClick={() => setTab('LEAVES')} className={tab === 'LEAVES' ? 'btn-dark' : 'btn-ghost'}>
          {t('Congés')}
          {attente.length > 0 && <span className="ml-1.5 rounded-full bg-[#C25E38] px-1.5 text-[11px] font-bold text-white">{attente.length}</span>}
        </button>
        <button onClick={() => setTab('PAYROLL')} className={tab === 'PAYROLL' ? 'btn-dark' : 'btn-ghost'}>
          {t('Paie')}
        </button>
        {tab !== 'PEOPLE' && tab !== 'LEAVES' && (
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="field ml-auto w-auto" />
        )}
        {tab === 'PEOPLE' && archivedCount > 0 && (
          <button onClick={() => setShowArchived(!showArchived)} className="btn-ghost ml-auto text-caption">
            {viewingArchived ? t('Revenir au personnel actif') : t('Voir les archivés ({n})', { n: String(archivedCount) })}
          </button>
        )}
      </div>

      {tab === 'PEOPLE' && (
        <div className="card p-0">
          {people.length ? (
            <Table head={[t('Nom'), t('Poste'), t('Paiement'), t('Montant'), t('Avance en cours'), '']}>
              {people.map((e) => {
                const owed = openAdvances(db, e.id, today());
                return (
                  <tr key={e.id} className="row">
                    <td className="td">
                      <span className="font-semibold">{e.name}</span>
                      {e.phone && <span className="ml-2 text-[12px] text-muted">{e.phone}</span>}
                    </td>
                    <td className="td text-muted">{e.role || '—'}</td>
                    <td className="td text-muted">{t(PAY_KIND_LABEL[e.payKind])}</td>
                    <td className="td num">
                      <Money value={e.rate} />
                    </td>
                    <td className="td num">{owed > 0 ? <Money value={owed} /> : <span className="text-muted">—</span>}</td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        {e.archived ? (
                          <button onClick={() => archiveEmployee(e.id, false)} className="btn-ghost px-2 py-1 text-[12px]">
                            {t('Réintégrer')}
                          </button>
                        ) : (
                          <>
                            <button onClick={() => setAdvanceFor(e)} className="btn-ghost px-2 py-1 text-[12px]">
                              {t('Avance')}
                            </button>
                            <button
                              onClick={() => {
                                setForm(e);
                                setOpen(true);
                              }}
                              className="btn-ghost px-2 py-1 text-[12px]"
                            >
                              {t('Modifier')}
                            </button>
                            <button onClick={() => archiveEmployee(e.id, true)} className="btn-ghost px-2 py-1 text-[12px] text-brand-600">
                              {t('Retirer')}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
          ) : (
            <Empty
              title={viewingArchived ? t('Personne d’archivé') : t('Aucune personne enregistrée')}
              hint={t('Même à deux, noter qui travaille et ce qu’on lui doit évite les oublis et les disputes de fin de mois.')}
              icon={<IconUsers className="h-10 w-10" />}
            />
          )}
        </div>
      )}

      {tab === 'ATTENDANCE' && (
        <Attendances
          people={active}
          days={daysOf(period, today())}
          db={db}
          period={period}
          mark={markAttendance}
        />
      )}

      {tab === 'LEAVES' && (
        <Leaves
          db={db}
          people={db.employees.filter((e) => !e.archived)}
          onRequest={requestLeave}
          onDecide={decideLeave}
        />
      )}

      {tab === 'PAYROLL' && (
        <Payroll
          preview={preview}
          period={period}
          to={to}
          note={note}
          setNote={setNote}
          run={runPayroll}
          settle={settlePayroll}
          runs={db.payrolls.filter((r) => r.period === period)}
          history={db.payrolls}
        />
      )}

      <EmployeeForm
        key={form?.id ?? 'new'}
        open={open}
        onClose={() => setOpen(false)}
        initial={form}
        save={saveEmployee}
        currency={db.company.currency}
      />

      <AdvanceForm
        key={advanceFor?.id ?? 'none'}
        employee={advanceFor}
        onClose={() => setAdvanceFor(null)}
        pay={payAdvance}
        currency={db.company.currency}
        already={advanceFor ? openAdvances(db, advanceFor.id, today()) : 0}
      />
    </>
  );
}

/** Pointage : une grille personnes × jours, remplie en un clic. */
function Attendances({
  people,
  days,
  db,
  period,
  mark,
}: {
  people: Employee[];
  days: string[];
  db: ReturnType<typeof useStore>['db'];
  period: string;
  mark: ReturnType<typeof useStore>['markAttendance'];
}) {
  const [day, setDay] = useState(days[0] ?? today());

  if (!people.length) {
    return (
      <div className="card">
        <Empty title={t('Personne à pointer')} hint={t('Ajoutez d’abord une personne dans « Les personnes ».')} />
      </div>
    );
  }

  const statusOn = (employeeId: string, date: string) =>
    db.attendance.find((a) => a.employeeId === employeeId && a.date === date)?.status ?? null;

  return (
    <>
      <div className="card mb-5">
        <h2 className="mb-1 font-bold">{t('Pointer une journée')}</h2>
        <p className="mb-4 text-caption text-muted">
          {t('Un clic par personne. On peut repointer : la dernière réponse remplace la précédente.')}
        </p>
        <Field label={t('Jour')}>
          <select value={day} onChange={(e) => setDay(e.target.value)} className="field">
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <ul className="mt-4 space-y-2">
          {people.map((e) => {
            const current = statusOn(e.id, day);
            return (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-2">
                <span className="min-w-0 truncate font-semibold">{e.name}</span>
                <div className="flex flex-wrap gap-1">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => mark(e.id, day, s, s === 'PRESENT' ? 8 : s === 'HALF' ? 4 : 0)}
                      className={current === s ? 'btn-dark px-2 py-1 text-[12px]' : 'btn-ghost px-2 py-1 text-[12px]'}
                    >
                      {t(ATTENDANCE_LABEL[s])}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card p-0">
        <Table head={[t('Nom'), t('Jours travaillés'), t('Dernier pointage')]}>
          {people.map((e) => {
            const list = attendanceIn(db.attendance, e.id, period);
            const last = [...list].sort((a, b) => b.date.localeCompare(a.date))[0];
            return (
              <tr key={e.id} className="row">
                <td className="td font-semibold">{e.name}</td>
                <td className="td num">{daysWorked(list)}</td>
                <td className="td">
                  {last ? (
                    <>
                      <span className="num text-muted">{last.date}</span>
                      <span className="ml-2">
                        <Badge tone={STATUS_TONE[last.status]}>{t(ATTENDANCE_LABEL[last.status])}</Badge>
                      </span>
                    </>
                  ) : (
                    <span className="text-muted">{t('jamais pointé')}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      </div>
    </>
  );
}

/** Paie de la période : bulletins proposés, puis passage en comptabilité. */
function Payroll({
  preview,
  period,
  to,
  note,
  setNote,
  run,
  settle,
  runs,
  history,
}: {
  preview: Payslip[];
  period: string;
  to: string;
  note: string;
  setNote: (v: string) => void;
  run: ReturnType<typeof useStore>['runPayroll'];
  settle: ReturnType<typeof useStore>['settlePayroll'];
  runs: ReturnType<typeof useStore>['db']['payrolls'];
  history: ReturnType<typeof useStore>['db']['payrolls'];
}) {
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [paid, setPaid] = useState(true);
  const gross = preview.reduce((s, x) => s + x.gross, 0);
  const advances = preview.reduce((s, x) => s + x.advances, 0);
  const net = preview.reduce((s, x) => s + x.net, 0);

  return (
    <>
      <div className="card mb-5">
        <h2 className="mb-1 font-bold">{t('Paie de {p}', { p: period })}</h2>
        <p className="mb-4 text-caption text-muted">
          {t('Le brut est ce que le travail a coûté : c’est lui qui part en charge. Les avances déjà versées sont retenues, et le reste est le net à verser.')}
        </p>

        {preview.length ? (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <Table head={[t('Nom'), t('Base'), t('Brut'), t('Avances retenues'), t('Net à verser')]}>
                {preview.map((s) => (
                  <tr key={s.employeeId} className="row">
                    <td className="td font-semibold">{s.employeeName}</td>
                    <td className="td text-muted">{s.basis}</td>
                    <td className="td num">
                      <Money value={s.gross} />
                    </td>
                    <td className="td num text-muted">{s.advances ? <Money value={s.advances} /> : '—'}</td>
                    <td className="td num font-semibold">
                      <Money value={s.net} />
                    </td>
                  </tr>
                ))}
              </Table>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-hairline pt-4">
              <Field label={t('Payé avec')}>
                <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="field">
                  {METHODS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {t(m.label)}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-2 pb-2 text-caption text-ink">
                <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
                {t('Le net est versé aujourd’hui')}
              </label>
              <div className="min-w-0 flex-1">
                <p className="label">{t('Net à verser')}</p>
                <p className="figure text-[19px] font-bold text-ink">
                  <Money value={net} />
                </p>
              </div>
              <button
                onClick={() => {
                  const out = run(period, to, preview, method, paid);
                  setNote(out ? t('Paie enregistrée : brut {g}, net {n}.', { g: String(out.gross), n: String(out.net) }) : t('Rien à payer.'));
                }}
                className="btn-primary"
              >
                {t('Enregistrer la paie')}
              </button>
            </div>
            <p className="mt-3 text-caption text-muted">
              {t('Brut {g} = avances retenues {a} + net {n}', {
                g: String(gross),
                a: String(advances),
                n: String(net),
              })}
            </p>
          </>
        ) : (
          <p className="text-caption text-muted">
            {runs.length
              ? t('La paie de cette période est déjà passée.')
              : t('Rien à payer : aucune personne avec un montant dû sur cette période.')}
          </p>
        )}
        {note && <p className="mt-3 text-caption text-muted">{note}</p>}
      </div>

      <div className="card p-0">
        <div className="border-b border-hairline px-5 py-4">
          <h2 className="font-bold">{t('Paies déjà passées')}</h2>
        </div>
        {history.length ? (
          <Table head={[t('Période'), t('Date'), t('Personnes'), t('Brut'), t('Net'), t('État'), '']}>
            {history.map((r) => (
              <tr key={r.id} className="row">
                <td className="td font-semibold">{r.period}</td>
                <td className="td num text-muted">{r.date}</td>
                <td className="td num">{r.slips.length}</td>
                <td className="td num">
                  <Money value={r.gross} />
                </td>
                <td className="td num font-semibold">
                  <Money value={r.net} />
                </td>
                <td className="td">
                  <Badge tone={r.paid ? 'success' : 'warn'}>{r.paid ? t('Versée') : t('Reste due')}</Badge>
                </td>
                <td className="td">
                  <div className="flex justify-end">
                    {!r.paid && (
                      <button onClick={() => settle(r.id, r.method, today())} className="btn-dark px-2 py-1 text-[12px]">
                        {t('Verser')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty title={t('Aucune paie enregistrée')} hint={t('La première paie apparaîtra ici, avec son écriture au journal.')} />
        )}
      </div>
    </>
  );
}

function EmployeeForm({
  open,
  onClose,
  initial,
  save,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  initial: Employee | null;
  save: ReturnType<typeof useStore>['saveEmployee'];
  currency: string;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [payKind, setPayKind] = useState<PayKind>(initial?.payKind ?? 'MONTHLY');
  const [rate, setRate] = useState(initial ? String(toMajor(initial.rate, currency)) : '');
  const [startedOn, setStartedOn] = useState(initial?.startedOn ?? today());
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');

  const rateLabel =
    payKind === 'MONTHLY' ? t('Salaire mensuel') : payKind === 'DAILY' ? t('Montant par jour') : t('Montant par heure');

  function submit() {
    if (name.trim().length < 2) return setError(t('Donnez un nom.'));
    const value = toMinor(rate || 0, currency);
    if (value <= 0) return setError(t('Indiquez le montant payé.'));
    save({
      id: initial?.id,
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      payKind,
      rate: value,
      startedOn,
      archived: initial?.archived,
      notes: notes.trim(),
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? t('Modifier la fiche') : t('Nouvelle personne')}>
      <div className="space-y-4">
        <Field label={t('Nom')}>
          <input value={name} onChange={(e) => setName(e.target.value)} className="field" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Poste')} hint={t('Vendeuse, cuisinier, apprenti…')}>
            <input value={role} onChange={(e) => setRole(e.target.value)} className="field" />
          </Field>
          <Field label={t('Téléphone')}>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="field" />
          </Field>
          <Field label={t('Comment il ou elle est payé')}>
            <select value={payKind} onChange={(e) => setPayKind(e.target.value as PayKind)} className="field">
              {(Object.keys(PAY_KIND_LABEL) as PayKind[]).map((k) => (
                <option key={k} value={k}>
                  {t(PAY_KIND_LABEL[k])}
                </option>
              ))}
            </select>
          </Field>
          <Field label={rateLabel}>
            <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" className="field" />
          </Field>
        </div>
        <Field label={t('Depuis le')}>
          <input type="date" value={startedOn} onChange={(e) => setStartedOn(e.target.value)} className="field" />
        </Field>
        {payKind !== 'MONTHLY' && (
          <p className="rounded-lg bg-base px-3 py-2 text-caption text-muted">
            {t('Paiement à la journée ou à l’heure : la paie se calcule sur les présences pointées. Pensez à pointer.')}
          </p>
        )}
        <Field label={t('Notes')}>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="field" />
        </Field>
        {error && <p className="text-caption text-brand-600">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost">
          {t('Annuler')}
        </button>
        <button onClick={submit} className="btn-primary">
          {t('Enregistrer')}
        </button>
      </div>
    </Modal>
  );
}

function AdvanceForm({
  employee,
  onClose,
  pay,
  currency,
  already,
}: {
  employee: Employee | null;
  onClose: () => void;
  pay: ReturnType<typeof useStore>['payAdvance'];
  currency: string;
  already: number;
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');

  return (
    <Modal open={!!employee} onClose={onClose} title={t('Avance sur salaire')}>
      {employee && (
        <div className="space-y-4">
          <p className="text-body font-semibold text-ink">{employee.name}</p>
          <p className="text-caption text-muted">
            {t('Une avance n’est pas une dépense : c’est de l’argent que la personne doit encore. Il sera retenu sur sa prochaine paie.')}
          </p>
          {already > 0 && (
            <p className="rounded-lg bg-brand-500/10 px-3 py-2 text-caption text-ink">
              {t('Avance déjà en cours :')} <Money value={already} />
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Montant')}>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="field" />
            </Field>
            <Field label={t('Date')}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
            </Field>
          </div>
          <Field label={t('Payé avec')}>
            <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="field">
              {METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {t(m.label)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('Motif')}>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="field" />
          </Field>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost">
          {t('Annuler')}
        </button>
        <button
          onClick={() => {
            if (employee) pay(employee.id, toMinor(amount || 0, currency), method, date, note.trim());
            onClose();
          }}
          className="btn-primary"
        >
          {t('Verser l’avance')}
        </button>
      </div>
    </Modal>
  );
}

/**
 * Les congés : une file de demandes, et deux boutons pour répondre.
 *
 * Ce qu'on ne fait PAS, volontairement : compter des droits à congés, des
 * soldes annuels, des reports. Une boutique de trois personnes ne tient pas ce
 * genre de compte, et le lui imposer ferait abandonner l'écran. On note ce qui
 * a été demandé et ce qui a été répondu ; c'est le cahier, pas un logiciel de
 * ressources humaines.
 */
function Leaves({
  db,
  people,
  onRequest,
  onDecide,
}: {
  db: DB;
  people: Employee[];
  onRequest: (input: { employeeId: string; from: string; to: string; reason: string }) => unknown;
  onDecide: (leaveId: string, status: 'APPROVED' | 'REFUSED') => void;
}) {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const attente = enAttente(db.leaves);
  const repondues = db.leaves.filter((l) => l.status !== 'PENDING').slice(0, 20);

  function submit() {
    if (!employeeId) return setError(t('Choisissez la personne.'));
    if (to < from) return setError(t('La fin du congé est avant son début.'));
    onRequest({ employeeId, from, to, reason: reason.trim() });
    setOpen(false);
    setEmployeeId('');
    setReason('');
    setError('');
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setOpen(true)} className="btn-primary" disabled={!people.length}>
          <IconPlus className="h-4 w-4" />
          {t('Demander un congé')}
        </button>
      </div>

      {attente.length === 0 && repondues.length === 0 ? (
        <Empty
          title={t('Aucune demande de congé')}
          hint={t('Quand quelqu’un demande à s’absenter, notez-le ici : le pointage du mois suivra tout seul et la paie en tiendra compte.')}
        />
      ) : (
        <>
          {attente.length > 0 && (
            <div className="card mb-4">
              <h2 className="text-section">{t('En attente de votre réponse')}</h2>
              <ul className="mt-3 space-y-3">
                {attente.map((d) => {
                  const enMemeTemps = absencesEnMemeTemps(db.leaves, d);
                  const aPoser = pointagesAPoser(d, db.attendance).length;
                  const jours = nombreDeJours(d.from, d.to);
                  return (
                    <li key={d.id} className="rounded-card border border-hairline p-3.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-semibold text-ink">{d.employeeName}</span>
                        <span className="text-caption text-muted">
                          {t('{n} jour(s)', { n: jours })} · {d.from} → {d.to}
                        </span>
                      </div>
                      {d.reason && <p className="mt-1 text-caption text-muted">{d.reason}</p>}
                      {enMemeTemps.length > 0 && (
                        <p className="mt-2 rounded-input bg-[#FBF1DF] px-3 py-2 text-caption text-ink">
                          {t('Déjà absent(e) sur ces jours : {noms}.', { noms: enMemeTemps.map((x) => x.employeeName).join(', ') })}
                        </p>
                      )}
                      {aPoser < jours && (
                        <p className="mt-2 text-caption text-muted">
                          {t('{n} de ces jours sont déjà pointés : ils ne seront pas modifiés.', { n: jours - aPoser })}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => onDecide(d.id, 'APPROVED')} className="btn-primary px-3 py-1.5 text-caption">
                          {t('Accepter')}
                        </button>
                        <button onClick={() => onDecide(d.id, 'REFUSED')} className="btn-ghost px-3 py-1.5 text-caption">
                          {t('Refuser')}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {repondues.length > 0 && (
            <div className="card p-0">
              <Table head={[t('Personne'), t('Du'), t('Au'), t('Jours'), t('Réponse')]} phoneHide={[3]} phoneNowrapFirst>
                {repondues.map((d) => (
                  <tr key={d.id} className="row">
                    <td className="td font-semibold">{d.employeeName}</td>
                    <td className="td">{d.from}</td>
                    <td className="td">{d.to}</td>
                    <td className="td num">{nombreDeJours(d.from, d.to)}</td>
                    <td className="td">
                      <Badge tone={d.status === 'APPROVED' ? undefined : 'danger'}>
                        {d.status === 'APPROVED' ? t('Accepté') : t('Refusé')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setError(''); }} title={t('Demander un congé')}>
        <div className="space-y-4">
          <Field label={t('Qui')}>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="field">
              <option value="">{t('— choisir —')}</option>
              {people.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Du')}>
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); if (to < e.target.value) setTo(e.target.value); }} className="field" />
            </Field>
            <Field label={t('Au')}>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
            </Field>
          </div>
          <Field label={t('Motif')} hint={t('Facultatif, en vos mots : maladie, voyage, examen…')}>
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="field" />
          </Field>
          {error && <p className="text-caption font-semibold text-[#A63030]">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => { setOpen(false); setError(''); }} className="btn-ghost">{t('Annuler')}</button>
          <button onClick={submit} className="btn-primary">{t('Enregistrer la demande')}</button>
        </div>
      </Modal>
    </>
  );
}
