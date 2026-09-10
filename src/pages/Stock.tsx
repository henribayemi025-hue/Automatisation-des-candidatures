import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { Badge, Empty, Field, Modal, Money, PageHeader, StatCard, Table } from '../components/UI';
import { IconAlert, IconLayers, IconPlus } from '../components/Icons';

type Tab = 'MOVEMENTS' | 'ALERTS' | 'VALUATION';

export default function Stock() {
  const { db, adjustStock } = useStore();
  const [tab, setTab] = useState<Tab>('MOVEMENTS');
  const [type, setType] = useState('');
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');

  const active = db.products.filter((p) => !p.archived);
  const alerts = active.filter((p) => p.stock <= p.reorderPoint);
  const stockValue = active.reduce((s, p) => s + Math.max(0, p.stock) * p.cost, 0);
  const retailValue = active.reduce((s, p) => s + Math.max(0, p.stock) * p.price, 0);

  const movements = useMemo(
    () => db.movements.filter((m) => (type ? m.type === type : true)),
    [db.movements, type],
  );

  function submit() {
    if (!productId || !qty) return;
    adjustStock(productId, Number(qty), reason || 'Ajustement manuel');
    setOpen(false);
    setProductId('');
    setQty('');
    setReason('');
  }

  return (
    <>
      <PageHeader
        title="Stock & mouvements"
        subtitle="Traçabilité complète des entrées et sorties"
        actions={
          <button onClick={() => setOpen(true)} className="btn-primary">
            <IconPlus className="h-4 w-4" />
            Ajustement
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Références actives" value={active.length} />
        <StatCard label="Valeur au coût" value={<Money value={stockValue} />} tone="dark" />
        <StatCard label="Valeur au prix de vente" value={<Money value={retailValue} />} />
        <StatCard
          label="Alertes"
          value={alerts.length}
          tone={alerts.length ? 'negative' : 'default'}
          hint="Rupture ou stock bas"
        />
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
            {label}
          </button>
        ))}
        {tab === 'MOVEMENTS' && (
          <select value={type} onChange={(e) => setType(e.target.value)} className="field w-auto">
            <option value="">Tous les mouvements</option>
            <option value="IN">Entrées</option>
            <option value="OUT">Sorties</option>
          </select>
        )}
      </div>

      <div className="card mt-4 p-0">
        {tab === 'MOVEMENTS' &&
          (movements.length ? (
            <Table head={['Date', 'Type', 'Produit', 'Quantité', 'Stock résultant', 'Motif / réf', 'Par']}>
              {movements.map((m) => (
                <tr key={m.id} className="row">
                  <td className="td text-slate-500">{m.date}</td>
                  <td className="td">
                    <Badge tone={m.type === 'IN' ? 'success' : 'danger'}>
                      {m.type === 'IN' ? 'Entrée' : 'Sortie'}
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
          ) : (
            <Empty title="Aucun mouvement de stock" icon={<IconLayers className="h-10 w-10" />} />
          ))}

        {tab === 'ALERTS' &&
          (alerts.length ? (
            <Table head={['Produit', 'Stock actuel', 'Seuil', 'Manque', 'Statut']}>
              {alerts.map((p) => (
                <tr key={p.id} className="row">
                  <td className="td font-semibold">{p.name}</td>
                  <td className="td num">{p.stock}</td>
                  <td className="td num text-slate-500">{p.reorderPoint}</td>
                  <td className="td num font-semibold text-amber-600">
                    {Math.max(0, p.reorderPoint - p.stock + 1)}
                  </td>
                  <td className="td">
                    {p.stock <= 0 ? <Badge tone="danger">Rupture</Badge> : <Badge tone="warn">Stock bas</Badge>}
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty
              title="Aucune alerte"
              hint="Tous les produits sont au-dessus de leur seuil de réapprovisionnement."
              icon={<IconAlert className="h-10 w-10" />}
            />
          ))}

        {tab === 'VALUATION' &&
          (active.length ? (
            <Table head={['Produit', 'Quantité', 'Coût unitaire', 'Valeur au coût', 'Valeur au prix de vente']}>
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
            <Empty title="Aucun produit à valoriser" />
          ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Ajustement de stock">
        <div className="space-y-4">
          <Field label="Produit">
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="field">
              <option value="">— Choisir —</option>
              {active.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (stock : {p.stock})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantité" hint="Nombre négatif pour une sortie (casse, perte, vol)">
            <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" placeholder="-3" className="field num" />
          </Field>
          <Field label="Motif">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Inventaire, casse, perte…" className="field" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="btn-ghost">
            Annuler
          </button>
          <button onClick={submit} className="btn-primary">
            Enregistrer l'ajustement
          </button>
        </div>
      </Modal>
    </>
  );
}
