import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { CURRENCIES, factor, formatMoney, toMajor, toMinor } from '../lib/money';
import { outstanding } from '../lib/metrics';
import type { LandedCostKind, Minor, PaymentMethod, PurchaseLine } from '../lib/types';

/** Les frais qui font qu'un conteneur coûte plus que la facture du fournisseur. */
const LANDED_KINDS: { id: LandedCostKind; label: string }[] = [
  { id: 'CUSTOMS', label: 'Droits de douane' },
  { id: 'FREIGHT', label: 'Fret / transport' },
  { id: 'FORWARDING', label: 'Transitaire' },
  { id: 'INSURANCE', label: 'Assurance' },
  { id: 'HANDLING', label: 'Manutention / port' },
  { id: 'OTHER', label: 'Autres frais' },
];
import { Badge, Empty, Field, Money, PageHeader, StatCard, Table, Modal } from '../components/UI';
import { IconCart, IconPlus, IconX } from '../components/Icons';
import { t } from '../lib/i18n';
import ProjectSelect from '../components/ProjectSelect';

type Filter = 'ALL' | 'PENDING' | 'RECEIVED';

export default function Purchases() {
  const { db, recordPurchase, receivePurchase } = useStore();
  const currency = db.company.currency;
  const [filter, setFilter] = useState<Filter>('ALL');
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [paidRaw, setPaidRaw] = useState('');
  const [error, setError] = useState('');

  // Achat à l'étranger : la facture est dans une autre devise, et la
  // marchandise coûte plus que la facture — douane, fret, transit. Ces frais
  // entrent dans le coût du stock, sinon la marge d'un conteneur ment.
  const [abroad, setAbroad] = useState(false);
  const [fxCurrency, setFxCurrency] = useState('USD');
  const [fxRateRaw, setFxRateRaw] = useState('');
  /** Coût unitaire saisi dans la devise étrangère, par produit (unités mineures de cette devise). */
  const [foreignUnit, setForeignUnit] = useState<Record<string, Minor>>({});
  const [landedRaw, setLandedRaw] = useState<Record<LandedCostKind, string>>({ CUSTOMS: '', FREIGHT: '', FORWARDING: '', INSURANCE: '', HANDLING: '', OTHER: '' });
  const [importVatRaw, setImportVatRaw] = useState('');
  const [landedPaidWith, setLandedPaidWith] = useState<PaymentMethod>('BANK');

  const fxRate = Number(fxRateRaw.replace(',', '.')) || 0;
  /** Convertit un montant en devise étrangère (mineures) vers la devise de l'entreprise (mineures). */
  const toLocal = (foreignMinor: Minor) => Math.round((foreignMinor * fxRate * factor(currency)) / factor(fxCurrency));
  const landedTotal = LANDED_KINDS.reduce((s, k) => s + toMinor(landedRaw[k.id] || 0, currency), 0);
  const importVat = toMinor(importVatRaw || 0, currency);

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

  // À l'étranger, les lignes gardent le coût converti ; la facture en devise
  // est reconstituée à partir des coûts saisis, pour l'affichage et l'audit.
  const effectiveLines: PurchaseLine[] = abroad
    ? lines.map((l) => ({ ...l, unitCost: toLocal(foreignUnit[l.productId] ?? 0) }))
    : lines;
  const total = effectiveLines.reduce((s, l) => s + l.unitCost * l.qty, 0);
  const foreignTotal = lines.reduce((s, l) => s + (foreignUnit[l.productId] ?? 0) * l.qty, 0);
  const landedCost = total + landedTotal;

  function addLine(productId: string) {
    const product = db.products.find((p) => p.id === productId);
    if (!product) return;
    if (lines.some((l) => l.productId === productId)) return;
    setLines([...lines, { productId, name: product.name, qty: 1, unitCost: product.cost }]);
  }

  function reset() {
    setLines([]);
    setProjectId('');
    setSupplierId('');
    setSupplierName('');
    setPaidRaw('');
    setError('');
    setAbroad(false);
    setFxRateRaw('');
    setForeignUnit({});
    setLandedRaw({ CUSTOMS: '', FREIGHT: '', FORWARDING: '', INSURANCE: '', HANDLING: '', OTHER: '' });
    setImportVatRaw('');
  }

  function submit() {
    if (!lines.length) {
      setError(t('Ajoutez au moins un produit.'));
      return;
    }
    if (abroad && fxRate <= 0) {
      setError(t('Indiquez le taux de change : combien vaut 1 {c} dans votre devise.', { c: fxCurrency }));
      return;
    }
    recordPurchase({
      lines: effectiveLines,
      supplierId: supplierId || null,
      supplierName: supplierName || db.suppliers.find((s) => s.id === supplierId)?.name || 'Fournisseur',
      paid: toMinor(paidRaw || 0, currency),
      projectId: projectId || null,
      foreign: abroad ? { currency: fxCurrency, total: foreignTotal, rate: fxRate } : null,
      landed: LANDED_KINDS.map((k) => ({ kind: k.id, label: t(k.label), amount: toMinor(landedRaw[k.id] || 0, currency) })).filter((c) => c.amount > 0),
      importVat,
      landedPaidWith,
    });
    reset();
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
                <td className="td">
                  {p.supplierName}
                  {p.foreign && (
                    <span className="ml-2">
                      <Badge tone="info">{p.foreign.currency}</Badge>
                    </span>
                  )}
                </td>
                <td className="td text-slate-500">{p.date}</td>
                <td className="td num font-semibold">
                  <Money value={p.total} />
                  {(p.landed?.length ?? 0) > 0 && (
                    <span className="block text-[11px] font-normal text-muted">
                      {t('+ frais')} <Money value={(p.landed ?? []).reduce((s, c) => s + c.amount, 0)} />
                    </span>
                  )}
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
              {db.suppliers.filter((s) => !s.archived).map((s) => (
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
          <ProjectSelect value={projectId} onChange={setProjectId} />
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
                {abroad ? (
                  <span className="flex items-center gap-1">
                    <input
                      value={foreignUnit[l.productId] === undefined ? '' : toMajor(foreignUnit[l.productId], fxCurrency)}
                      onChange={(e) => setForeignUnit({ ...foreignUnit, [l.productId]: toMinor(e.target.value || 0, fxCurrency) })}
                      inputMode="decimal"
                      placeholder={t('prix en {c}', { c: fxCurrency })}
                      className="field num w-28 py-1.5"
                    />
                    <span className="num w-24 text-right text-[11px] text-muted">= {formatMoney(toLocal(foreignUnit[l.productId] ?? 0), currency)}</span>
                  </span>
                ) : (
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
                )}
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

        {/* Achat à l'étranger : devise et taux d'abord, les prix des lignes
            se saisissent ensuite dans cette devise. */}
        <div className="mt-4 rounded-input border border-hairline bg-base/60 p-3">
          <label className="flex items-start gap-2 text-caption text-ink">
            <input id="pur-abroad" type="checkbox" checked={abroad} onChange={(e) => setAbroad(e.target.checked)} className="mt-0.5" />
            <span>
              {t('Achat à l’étranger (facture dans une autre devise)')}
              <span className="block text-muted">{t('Les prix se saisissent dans la devise de la facture ; la douane, le fret et le transit s’ajoutent au coût du stock.')}</span>
            </span>
          </label>
          {abroad && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={t('Devise de la facture')}>
                <select id="pur-fx" value={fxCurrency} onChange={(e) => setFxCurrency(e.target.value)} className="field">
                  {CURRENCIES.filter((c) => c.code !== currency).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('Taux : 1 {c} =', { c: fxCurrency })} hint={t('en {c}, au jour de la facture', { c: currency })}>
                <input id="pur-rate" value={fxRateRaw} onChange={(e) => setFxRateRaw(e.target.value)} inputMode="decimal" placeholder="600" className="field num" />
              </Field>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-input border border-hairline p-3">
          <p className="text-caption font-semibold text-ink">{t('Frais d’approche')}</p>
          <p className="mb-3 text-[12px] text-muted">
            {t('Ce que vous payez pour que la marchandise arrive : hors taxe, dans votre devise. Réglés à la réception, ajoutés au coût du stock.')}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {LANDED_KINDS.map((k) => (
              <Field key={k.id} label={t(k.label)}>
                <input
                  id={`pur-landed-${k.id}`}
                  value={landedRaw[k.id]}
                  onChange={(e) => setLandedRaw({ ...landedRaw, [k.id]: e.target.value })}
                  inputMode="decimal"
                  className="field num"
                />
              </Field>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label={t('{tax} payée en douane', { tax: db.company.taxLabel || 'TVA' })} hint={t('Déductible, comme sur un achat local.')}>
              <input id="pur-import-vat" value={importVatRaw} onChange={(e) => setImportVatRaw(e.target.value)} inputMode="decimal" className="field num" />
            </Field>
            <Field label={t('Frais et taxe payés avec')}>
              <select value={landedPaidWith} onChange={(e) => setLandedPaidWith(e.target.value as PaymentMethod)} className="field">
                <option value="BANK">{t('Banque')}</option>
                <option value="MOBILE">{t('Mobile money')}</option>
                <option value="CASH">{t('Espèces')}</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 dark:border-white/10">
          {abroad && (
            <div className="flex items-baseline justify-between text-caption text-muted">
              <span>{t('Facture fournisseur')}</span>
              <span className="num">
                {formatMoney(foreignTotal, fxCurrency)} → {formatMoney(total, currency)}
              </span>
            </div>
          )}
          <div className="flex items-baseline justify-between text-caption text-muted">
            <span>{t('Marchandise')}</span>
            <span className="num">{formatMoney(total, currency)}</span>
          </div>
          {landedTotal > 0 && (
            <div className="flex items-baseline justify-between text-caption text-muted">
              <span>{t('Frais d’approche')}</span>
              <span className="num">{formatMoney(landedTotal, currency)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between text-lg font-extrabold">
            <span>{landedTotal > 0 ? t('Coût rendu magasin') : t('Total commande')}</span>
            <span className="num">{formatMoney(landedCost, currency)}</span>
          </div>
        </div>

        <div className="mt-4">
          <Field label={t('Montant payé au fournisseur à la commande ({c})', { c: currency })} hint={t('Le solde devient une dette fournisseur. Les frais d’approche, eux, sont réglés à la réception.')}>
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
