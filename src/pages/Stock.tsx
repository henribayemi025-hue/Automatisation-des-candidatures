import { useMemo, useState } from 'react';
import { holdsStock } from '../lib/recipes';
import { useStore } from '../lib/store';
import { Badge, Empty, Field, Modal, Money, PageHeader, StatCard, Table } from '../components/UI';
import { IconAlert, IconLayers, IconPlus } from '../components/Icons';
import { t } from '../lib/i18n';

type Tab = 'MOVEMENTS' | 'ALERTS' | 'VALUATION';

// 577 mouvements sur une seule page dans la démonstration (audit jour 8) :
// on montre les plus récents, la suite à la demande.
const PAGE = 50;

/** « 3 », « 2,5 », « -3 » → nombre ; vide ou illisible → NaN. */
function parseQty(raw: string): number {
  const clean = raw.replace(/\s/g, '').replace(',', '.');
  return clean ? Number(clean) : NaN;
}

export default function Stock() {
  const { db, adjustStock } = useStore();
  const [tab, setTab] = useState<Tab>('MOVEMENTS');
  const [type, setType] = useState('');
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  // Le clavier chiffré de l'iPhone n'a pas de signe moins : une perte ne
  // pouvait pas se saisir. Le sens se choisit d'un geste, la quantité reste
  // positive (audit jour 8).
  const [direction, setDirection] = useState<'IN' | 'OUT'>('OUT');
  const [shown, setShown] = useState(PAGE);

  // Les prestations (main-d'œuvre, diagnostic…) ne se stockent pas.
  const active = db.products.filter((p) => !p.archived && holdsStock(db.company, p));
  const alerts = active.filter((p) => p.stock <= p.reorderPoint);
  const stockValue = active.reduce((s, p) => s + Math.max(0, p.stock) * p.cost, 0);
  const retailValue = active.reduce((s, p) => s + Math.max(0, p.stock) * p.price, 0);

  const movements = useMemo(
    () => db.movements.filter((m) => (type ? m.type === type : true)),
    [db.movements, type],
  );

  const parsed = parseQty(qty);
  const qtyOk = Number.isFinite(parsed) && parsed !== 0;
  // Un « -3 » tapé au clavier reste une sortie, comme avant.
  const signed = qtyOk ? (direction === 'OUT' || parsed < 0 ? -Math.abs(parsed) : Math.abs(parsed)) : 0;

  function submit() {
    if (!productId || !qtyOk) return;
    adjustStock(productId, signed, reason || 'Ajustement manuel');
    setOpen(false);
    setProductId('');
    setQty('');
    setReason('');
    setDirection('OUT');
  }

  return (
    <>
      <PageHeader
        title={t('Stock & mouvements')}
        subtitle={t('Traçabilité complète des entrées et sorties')}
        actions={
          <button onClick={() => setOpen(true)} className="btn-primary">
            <IconPlus className="h-4 w-4" />
            {t('Corriger le stock')}
          </button>
        }
      />

      {/* Sur téléphone, les deux compteurs se partagent une ligne : les quatre
          cartes empilées prenaient tout le premier écran. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label={t('Articles')} value={active.length} />
        <StatCard
          label={t('Alertes')}
          value={alerts.length}
          tone={alerts.length ? 'negative' : 'default'}
          hint={t('Rupture ou stock bas')}
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard label={t('Valeur au coût')} value={<Money value={stockValue} />} tone="dark" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <StatCard label={t('Valeur au prix de vente')} value={<Money value={retailValue} />} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ['MOVEMENTS', 'Mouvements'],
            ['ALERTS', 'Alertes'],
            ['VALUATION', 'Valorisation'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={tab === key ? 'btn-dark' : 'btn-ghost'}>
            {t(label)}
          </button>
        ))}
        {tab === 'MOVEMENTS' && (
          <select value={type} onChange={(e) => { setType(e.target.value); setShown(PAGE); }} className="field w-auto">
            <option value="">{t('Tous les mouvements')}</option>
            <option value="IN">{t('Entrées')}</option>
            <option value="OUT">{t('Sorties')}</option>
          </select>
        )}
      </div>

      <div className="card mt-4 p-0">
        {tab === 'MOVEMENTS' &&
          (movements.length ? (
            <>
            <Table head={['Date', 'Type', 'Produit', 'Quantité', 'Stock résultant', 'Motif / réf', 'Par']} phoneHide={[2, 6, 7]} phoneNowrapFirst>
              {movements.slice(0, shown).map((m) => (
                <tr key={m.id} className="row">
                  <td className="td text-slate-500">{m.date}</td>
                  <td className="td">
                    <Badge tone={m.type === 'IN' ? 'success' : 'danger'}>
                      {m.type === 'IN' ? t('Entrée') : t('Sortie')}
                    </Badge>
                  </td>
                  <td className="td font-medium">{m.productName}</td>
                  <td className="td num font-semibold">
                    {m.type === 'IN' ? '+' : '−'}
                    {m.qty}
                  </td>
                  <td className="td num text-slate-500">{m.resulting}</td>
                  <td className="td text-slate-500">
                    {m.reason} {m.ref && <span className="text-xs">({m.ref})</span>}
                  </td>
                  <td className="td text-slate-500">{m.by}</td>
                </tr>
              ))}
            </Table>
            {movements.length > shown && (
              <div className="flex flex-wrap items-center justify-center gap-3 border-t border-hairline px-4 py-3 text-caption text-muted">
                {t('{n} mouvements sur {total}', { n: shown, total: movements.length })}
                <button onClick={() => setShown((n) => n + PAGE * 2)} className="btn-ghost">
                  {t('Voir plus')}
                </button>
              </div>
            )}
            </>
          ) : (
            <Empty title={t('Aucun mouvement de stock')} icon={<IconLayers className="h-10 w-10" />} />
          ))}

        {tab === 'ALERTS' &&
          (alerts.length ? (
            <Table head={['Produit', 'Stock actuel', 'Seuil', 'Manque', 'Statut']} phoneHide={[3]}>
              {alerts.map((p) => (
                <tr key={p.id} className="row">
                  <td className="td font-semibold">{p.name}</td>
                  <td className="td num">{p.stock}</td>
                  <td className="td num text-slate-500">{p.reorderPoint}</td>
                  <td className="td num font-semibold text-amber-600">
                    {Math.max(0, p.reorderPoint - p.stock + 1)}
                  </td>
                  <td className="td">
                    {p.stock <= 0 ? <Badge tone="danger">{t('Rupture')}</Badge> : <Badge tone="warn">{t('Stock bas')}</Badge>}
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty
              title={t('Aucune alerte')}
              hint={t('Tous les produits sont au-dessus de leur seuil de réapprovisionnement.')}
              icon={<IconAlert className="h-10 w-10" />}
            />
          ))}

        {tab === 'VALUATION' &&
          (active.length ? (
            <Table head={['Produit', 'Quantité', 'Coût unitaire', 'Valeur au coût', 'Valeur au prix de vente']} phoneHide={[3, 5]}>
              {active.map((p) => (
                <tr key={p.id} className="row">
                  <td className="td font-semibold">{p.name}</td>
                  <td className="td num">{p.stock}</td>
                  <td className="td num text-slate-500">
                    <Money value={p.cost} />
                  </td>
                  <td className="td num font-semibold">
                    <Money value={Math.max(0, p.stock) * p.cost} />
                  </td>
                  <td className="td num text-slate-500">
                    <Money value={Math.max(0, p.stock) * p.price} />
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty title={t('Aucun produit à valoriser')} />
          ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('Corriger le stock')}>
        <div className="space-y-4">
          <Field label={t('Produit')}>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="field">
              <option value="">{t('— Choisir —')}</option>
              {active.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {t('(stock :')} {p.stock})
                </option>
              ))}
            </select>
          </Field>
          <div className="flex gap-2" role="group" aria-label={t('Sens')}>
            {(
              [
                ['OUT', 'J’en retire (casse, perte, vol)'],
                ['IN', 'J’en ajoute (inventaire, retour)'],
              ] as ['IN' | 'OUT', string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={direction === key}
                onClick={() => setDirection(key)}
                className={`flex-1 rounded-input border px-3 py-2 text-caption font-semibold ${direction === key ? 'border-teal bg-teal text-white' : 'border-hairline bg-white text-ink hover:border-teal'}`}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <Field
            label={t('Quantité')}
            hint={
              qty && !qtyOk
                ? t('Tapez une quantité, par exemple 3 ou 2,5.')
                : qtyOk && productId
                  ? t('Stock après correction : {n}', {
                      n: Math.round(((active.find((p) => p.id === productId)?.stock ?? 0) + signed) * 1000) / 1000,
                    })
                  : undefined
            }
          >
            <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" placeholder="3" className="field num" />
          </Field>
          <Field label={t('Motif')}>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('Inventaire, casse, perte…')} className="field" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="btn-ghost">
            {t('Annuler')}
          </button>
          <button onClick={submit} disabled={!productId || !qtyOk} className="btn-primary disabled:opacity-50">
            {t('Enregistrer')}
          </button>
        </div>
      </Modal>
    </>
  );
}
