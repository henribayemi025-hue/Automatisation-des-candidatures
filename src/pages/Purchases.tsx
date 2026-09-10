import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { formatMoney, toMajor, toMinor } from '../lib/money';
import { outstanding } from '../lib/metrics';
import type { PurchaseLine } from '../lib/types';
import { Badge, Empty, Field, Money, PageHeader, StatCard, Table, Modal } from '../components/UI';
import { IconCart, IconPlus, IconX } from '../components/Icons';
import { t } from '../lib/i18n';

type Filter = 'ALL' | 'PENDING' | 'RECEIVED';

export default function Purchases() {
  const { db, recordPurchase, receivePurchase } = useStore();
  const currency = db.company.currency;
  const [filter, setFilter] = useState<Filter>('ALL');
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [paidRaw, setPaidRaw] = useState('');
  const [error, setError] = useState('');

  const stats = useMemo(() => {
    const received = db.purchases.filter((p) => p.status === 'RECEIVED');
    return {
      total: received.reduce((s, p) => s + p.total, 0),
      paid: received.reduce((s, p) => s + p.paid, 0),
      pending: db.purchases.filter((p) => p.status === 'PENDING').length,
      debt: db.debts
        .filter((d) => d.party === 'SUPPLIER')
        .reduce((s, d) => s + outstanding(d), 0),
    };
  }, [db.purchases, db.debts]);

  const filtered = db.purchases.filter((p) =>
    filter === 'ALL' ? true : filter === 'PENDING' ? p.status === 'PENDING' : p.status === 'RECEIVED',
  );

  const total = lines.reduce((s, l) => s + l.unitCost * l.qty, 0);

  function addLine(productId: string) {
    const product = db.products.find((p) => p.id === productId);
    if (!product) return;
    if (lines.some((l) => l.productId === productId)) return;
    setLines([...lines, { productId, name: product.name, qty: 1, unitCost: product.cost }]);
  }

  function submit() {
    if (!lines.length) {
      setError(t('Ajoutez au moins un produit.'));
      return;
    }
    recordPurchase({
      lines,
      supplierId: supplierId || null,
      supplierName: supplierName || db.suppliers.find((s) => s.id === supplierId)?.name || 'Fournisseur',
      paid: toMinor(paidRaw || 0, currency),
    });
    setLines([]);
    setSupplierId('');
    setSupplierName('');
    setPaidRaw('');
    setError('');
    setOpen(false);
  }

  function receive(id: string) {
    try {
      setError('');
      receivePurchase(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }

  return (
    <>
      <PageHeader
        title={t('Achats & approvisionnements')}
        subtitle={t('Commandes fournisseurs et réceptions de stock')}
        actions={
          <button onClick={() => setOpen(true)} className="btn-primary">
            <IconPlus className="h-4 w-4" />
            {t('Nouveau bon de commande')}
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Total achats')} value={<Money value={stats.total} />} hint={t('Commandes réceptionnées')} />
        <StatCard label={t('Total payé')} value={<Money value={stats.paid} />} tone="positive" />
        <StatCard label={t('Commandes en attente')} value={stats.pending} hint={t('À réceptionner')} />
        <StatCard label={t('Dette fournisseurs')} value={<Money value={stats.debt} />} tone="negative" />
      </div>

      <div className="mt-6 flex gap-2">
        {(['ALL', 'PENDING', 'RECEIVED'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'btn-dark' : 'btn-ghost'}
          >
            {f === 'ALL' ? t('Tous') : f === 'PENDING' ? t('En attente') : t('Reçus')}
          </button>
        ))}
      </div>

      <div className="card mt-4 p-0">
        {filtered.length ? (
          <Table head={['Référence', 'Fournisseur', 'Date', 'Montant', 'Payé', 'Statut', '']}>
            {filtered.map((p) => (
              <tr key={p.id} className="row">
                <td className="td font-semibold">{p.number}</td>
                <td className="td">{p.supplierName}</td>
                <td className="td text-slate-500">{p.date}</td>
                <td className="td num font-semibold">
                  <Money value={p.total} />
                </td>
                <td className="td num text-slate-500">
                  <Money value={p.paid} />
                </td>
                <td className="td">
                  {p.status === 'RECEIVED' ? (
                    <Badge tone="success">{t('Reçu')}</Badge>
                  ) : p.status === 'PENDING' ? (
                    <Badge tone="warn">{t('En attente')}</Badge>
                  ) : (
                    <Badge tone="danger">{t('Annulé')}</Badge>
                  )}
                </td>
                <td className="td text-right">
                  {p.status === 'PENDING' && (
                    <button onClick={() => receive(p.id)} className="text-sm font-semibold text-brand-600">
                      {t('Réceptionner')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title={t('Aucun achat trouvé')}
            hint={t('Créez un bon de commande, puis réceptionnez-le pour mettre à jour le stock et la comptabilité.')}
            icon={<IconCart className="h-10 w-10" />}
          />
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('Nouveau bon de commande')} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Fournisseur enregistré')}>
            <select
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                setSupplierName('');
              }}
              className="field"
            >
              <option value="">{t('— Saisie libre —')}</option>
              {db.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          {!supplierId && (
            <Field label={t('Nom du fournisseur')}>
              <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="field" />
            </Field>
          )}
        </div>

        <div className="mt-4">
          <Field label={t('Ajouter un produit')}>
            <select
              value=""
              onChange={(e) => e.target.value && addLine(e.target.value)}
              className="field"
            >
              <option value="">{t('— Choisir un produit —')}</option>
              {db.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {lines.length > 0 && (
          <ul className="mt-4 space-y-2">
            {lines.map((l) => (
              <li key={l.productId} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{l.name}</span>
                <input
                  value={l.qty}
                  onChange={(e) =>
                    setLines(
                      lines.map((x) =>
                        x.productId === l.productId ? { ...x, qty: Number(e.target.value) || 0 } : x,
                      ),
                    )
                  }
                  inputMode="numeric"
                  className="field num w-20 py-1.5"
                />
                <input
                  value={toMajor(l.unitCost, currency)}
                  onChange={(e) =>
                    setLines(
                      lines.map((x) =>
                        x.productId === l.productId
                          ? { ...x, unitCost: toMinor(e.target.value, currency) }
                          : x,
                      ),
                    )
                  }
                  inputMode="decimal"
                  className="field num w-28 py-1.5"
                />
                <button
                  onClick={() => setLines(lines.filter((x) => x.productId !== l.productId))}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <IconX className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4 text-lg font-extrabold dark:border-white/10">
          <span>{t('Total commande')}</span>
          <span className="num">{formatMoney(total, currency)}</span>
        </div>

        <div className="mt-4">
          <Field label={t('Montant payé à la commande ({c})', { c: currency })} hint={t('Le solde devient une dette fournisseur')}>
            <input value={paidRaw} onChange={(e) => setPaidRaw(e.target.value)} inputMode="decimal" className="field num" />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="btn-ghost">
            {t('Annuler')}
          </button>
          <button onClick={submit} className="btn-primary">
            {t('Créer le bon de commande')}
          </button>
        </div>
      </Modal>
    </>
  );
}
