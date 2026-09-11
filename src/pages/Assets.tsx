import { useMemo, useState } from 'react';
import { today, useStore } from '../lib/store';
import { toMajor, toMinor } from '../lib/money';
import { USEFUL_LIVES, accumulatedAt, depreciationPlan, netValue, periodOf, postedFor } from '../lib/assets';
import type { FixedAsset, PaymentMethod } from '../lib/types';
import { Badge, Empty, Field, FigureStrip, Modal, Money, PageHeader, Table } from '../components/UI';
import { IconBox, IconPlus } from '../components/Icons';
import { t } from '../lib/i18n';

/**
 * Immobilisations. Un bien qui sert plusieurs années n'est pas une dépense du
 * mois : on en passe un morceau en charge chaque mois, sur sa durée de vie.
 * L'écran fait les deux : tenir la liste des biens, et passer la dotation.
 */

const CATEGORIES = [
  'Matériel et outillage',
  'Matériel informatique',
  'Mobilier et agencement',
  'Véhicule',
  'Construction',
  'Autre',
];

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'CASH', label: 'Espèces' },
  { id: 'MOBILE', label: 'Mobile money' },
  { id: 'BANK', label: 'Banque' },
];

export default function Assets() {
  const { db, saveAsset, disposeAsset, runDepreciation } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FixedAsset | null>(null);
  const [disposing, setDisposing] = useState<FixedAsset | null>(null);
  const [period, setPeriod] = useState(periodOf(today()));
  const [note, setNote] = useState('');

  const active = db.assets.filter((a) => a.status === 'ACTIVE');
  const plan = useMemo(() => depreciationPlan(active, db.depreciations, period), [active, db.depreciations, period]);
  const toPost = plan.reduce((s, l) => s + l.amount, 0);

  const gross = db.assets.filter((a) => a.status === 'ACTIVE').reduce((s, a) => s + a.cost, 0);
  const cumulated = active.reduce((s, a) => s + postedFor(a, db.depreciations), 0);

  function post() {
    const count = runDepreciation(period, `${period}-28`);
    setNote(
      count
        ? t('Dotation enregistrée sur {n} bien(s).', { n: String(count) })
        : t('Rien à passer pour cette période : tout est déjà à jour.'),
    );
  }

  return (
    <>
      <PageHeader
        title={t('Immobilisations')}
        subtitle={t('Le matériel qui sert plusieurs années, et sa perte de valeur étalée dans le temps')}
        actions={
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="btn-primary"
          >
            <IconPlus className="h-4 w-4" />
            {t('Nouveau bien')}
          </button>
        }
      />

      <div className="mb-5">
        <FigureStrip
          items={[
            { label: t('Valeur d’achat'), value: <Money value={gross} /> },
            { label: t('Déjà amorti'), value: <Money value={cumulated} />, tone: 'negative' },
            { label: t('Valeur nette au bilan'), value: <Money value={gross - cumulated} /> },
            { label: t('Biens suivis'), value: <span className="num">{active.length}</span> },
          ]}
        />
      </div>

      <div className="card mb-5">
        <h2 className="mb-1 font-bold">{t('Passer la dotation du mois')}</h2>
        <p className="mb-4 text-caption text-muted">
          {t('Une fois par mois, chaque bien perd une part de sa valeur. Cette part devient une charge — sans sortie d’argent.')}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t('Période')}>
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="field" />
          </Field>
          <div className="min-w-0 flex-1">
            <p className="label">{t('À comptabiliser')}</p>
            <p className="figure text-[19px] font-bold text-ink">
              <Money value={toPost} />
            </p>
          </div>
          <button onClick={post} disabled={!toPost} className="btn-primary disabled:opacity-40">
            {t('Enregistrer la dotation')}
          </button>
        </div>
        {note && <p className="mt-3 text-caption text-muted">{note}</p>}
        {plan.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-hairline pt-3 text-caption text-muted">
            {plan.map((l) => (
              <li key={l.asset.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">{l.asset.name}</span>
                <span className="num shrink-0">
                  <Money value={l.amount} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-0">
        {db.assets.length ? (
          <Table head={[t('Bien'), t('Acquis le'), t('Durée'), t('Valeur d’achat'), t('Amorti'), t('Valeur nette'), '']}>
            {db.assets.map((a) => {
              const done = postedFor(a, db.depreciations);
              const late = a.status === 'ACTIVE' && accumulatedAt(a, periodOf(today())) > done;
              return (
                <tr key={a.id} className="row">
                  <td className="td">
                    <span className="font-semibold">{a.name}</span>
                    <span className="ml-2 text-[12px] text-muted">{a.category}</span>
                    {a.status === 'DISPOSED' && (
                      <span className="ml-2">
                        <Badge tone="neutral">{t('Sorti')}</Badge>
                      </span>
                    )}
                    {late && (
                      <span className="ml-2">
                        <Badge tone="warn">{t('Dotation en retard')}</Badge>
                      </span>
                    )}
                  </td>
                  <td className="td text-muted">{a.acquiredOn}</td>
                  <td className="td num text-muted">{t('{n} mois', { n: String(a.months) })}</td>
                  <td className="td num">
                    <Money value={a.cost} />
                  </td>
                  <td className="td num text-muted">
                    <Money value={done} />
                  </td>
                  <td className="td num font-semibold">
                    <Money value={netValue(a, db.depreciations)} />
                  </td>
                  <td className="td">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditing(a);
                          setOpen(true);
                        }}
                        className="btn-ghost px-2 py-1 text-[12px]"
                      >
                        {t('Modifier')}
                      </button>
                      {a.status === 'ACTIVE' && (
                        <button onClick={() => setDisposing(a)} className="btn-ghost px-2 py-1 text-[12px] text-brand-600">
                          {t('Sortir')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty
            title={t('Aucun bien enregistré')}
            hint={t('Un four, une moto, un ordinateur : tout ce qui sert plus d’un an se déclare ici plutôt qu’en dépense.')}
            icon={<IconBox className="h-10 w-10" />}
          />
        )}
      </div>

      <AssetForm key={editing?.id ?? 'new'} open={open} onClose={() => setOpen(false)} initial={editing} save={saveAsset} currency={db.company.currency} />
      <DisposeForm
        key={disposing?.id ?? 'none'}
        asset={disposing}
        onClose={() => setDisposing(null)}
        dispose={disposeAsset}
        currency={db.company.currency}
        book={disposing ? netValue(disposing, db.depreciations) : 0}
      />
    </>
  );
}

function AssetForm({
  open,
  onClose,
  initial,
  save,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  initial: FixedAsset | null;
  save: ReturnType<typeof useStore>['saveAsset'];
  currency: string;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [acquiredOn, setAcquiredOn] = useState(initial?.acquiredOn ?? today());
  const [cost, setCost] = useState(initial ? String(toMajor(initial.cost, currency)) : '');
  const [salvage, setSalvage] = useState(initial && initial.salvage ? String(toMajor(initial.salvage, currency)) : '');
  const [months, setMonths] = useState(String(initial?.months ?? 60));
  const [alreadyPaid, setAlreadyPaid] = useState(!!initial);
  const [paidWith, setPaidWith] = useState<PaymentMethod>('BANK');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');

  function submit() {
    const value = toMinor(cost || 0, currency);
    if (name.trim().length < 2) return setError(t('Donnez un nom au bien.'));
    if (value <= 0) return setError(t('Indiquez la valeur d’achat.'));
    if (Number(months) <= 0) return setError(t('Indiquez une durée en mois.'));
    save(
      {
        id: initial?.id,
        name: name.trim(),
        category,
        acquiredOn,
        cost: value,
        salvage: toMinor(salvage || 0, currency),
        months: Number(months),
        method: 'LINEAR',
        status: initial?.status ?? 'ACTIVE',
        disposedOn: initial?.disposedOn,
        notes: notes.trim(),
      },
      initial || alreadyPaid ? undefined : paidWith,
    );
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? t('Modifier le bien') : t('Nouveau bien')}>
      <div className="space-y-4">
        <Field label={t('Nom du bien')}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Four à pain, moto de livraison…')} className="field" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Catégorie')}>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="field">
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label={t('Date d’achat')}>
            <input type="date" value={acquiredOn} onChange={(e) => setAcquiredOn(e.target.value)} className="field" />
          </Field>
          <Field label={t('Valeur d’achat')}>
            <input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" className="field" />
          </Field>
          <Field label={t('Valeur à la fin')} hint={t('Ce qu’il vaudra encore au bout de la durée. Souvent zéro.')}>
            <input value={salvage} onChange={(e) => setSalvage(e.target.value)} inputMode="decimal" className="field" />
          </Field>
        </div>
        <Field label={t('Durée d’utilisation')}>
          <select value={months} onChange={(e) => setMonths(e.target.value)} className="field">
            {USEFUL_LIVES.map((l) => (
              <option key={l.months} value={l.months}>
                {t(l.label)}
              </option>
            ))}
            <option value={months}>{t('{n} mois', { n: months })}</option>
          </select>
        </Field>
        {!initial && (
          <>
            <label className="flex items-start gap-2 text-caption text-ink">
              <input type="checkbox" checked={alreadyPaid} onChange={(e) => setAlreadyPaid(e.target.checked)} className="mt-0.5" />
              <span>
                {t('Cet achat est déjà enregistré dans l’application')}
                <span className="block text-muted">{t('Cochez si vous l’avez déjà saisi en achat ou en dépense : on ne l’écrira pas deux fois.')}</span>
              </span>
            </label>
            {!alreadyPaid && (
              <Field label={t('Payé avec')}>
                <select value={paidWith} onChange={(e) => setPaidWith(e.target.value as PaymentMethod)} className="field">
                  {METHODS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {t(m.label)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </>
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

function DisposeForm({
  asset,
  onClose,
  dispose,
  currency,
  book,
}: {
  asset: FixedAsset | null;
  onClose: () => void;
  dispose: ReturnType<typeof useStore>['disposeAsset'];
  currency: string;
  book: number;
}) {
  const [date, setDate] = useState(today());
  const [proceeds, setProceeds] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const amount = toMinor(proceeds || 0, currency);

  return (
    <Modal open={!!asset} onClose={onClose} title={t('Sortir un bien')}>
      {asset && (
        <div className="space-y-4">
          <p className="text-body font-semibold text-ink">{asset.name}</p>
          <p className="text-caption text-muted">
            {t('Valeur nette restante au bilan :')} <Money value={book} />.{' '}
            {t('Si vous le vendez moins cher, la différence devient une perte ; plus cher, un gain.')}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Date de sortie')}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
            </Field>
            <Field label={t('Prix de vente')} hint={t('Zéro si le bien est jeté ou hors service.')}>
              <input value={proceeds} onChange={(e) => setProceeds(e.target.value)} inputMode="decimal" className="field" />
            </Field>
          </div>
          {amount > 0 && (
            <Field label={t('Encaissé sur')}>
              <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="field">
                {METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {t(m.label)}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <p className="rounded-lg bg-base px-3 py-2 text-caption text-ink">
            {amount >= book ? t('Gain sur la sortie :') : t('Perte sur la sortie :')} <Money value={Math.abs(amount - book)} />
          </p>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost">
          {t('Annuler')}
        </button>
        <button
          onClick={() => {
            if (asset) dispose(asset.id, date, amount, method);
            onClose();
          }}
          className="btn-primary"
        >
          {t('Confirmer la sortie')}
        </button>
      </div>
    </Modal>
  );
}
