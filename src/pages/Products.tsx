import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { looksLikeService } from '../lib/recipes';
import { useCollab } from '../lib/collab';
import { formatMoney, toMajor, toMinor } from '../lib/money';
import type { Product, RevenueKind } from '../lib/types';
import { Badge, Empty, Field, Modal, PageHeader, Table } from '../components/UI';
import { IconBox, IconDownload, IconPlus, IconSearch } from '../components/Icons';
import ImportProducts from '../components/ImportProducts';
import { fetchFinjaroProducts } from '../lib/importers';
import { exportXlsx } from '../lib/xlsx';
import { Link } from 'react-router-dom';
import { t } from '../lib/i18n';
import { sectorProfile, tracksStock } from '../lib/sector';

const BLANK = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  brand: '',
  kind: 'GOODS' as RevenueKind,
  price: '',
  cost: '',
  stock: '',
  reorderPoint: '',
  unit: 'pièce',
  components: [] as { productId: string; qty: string }[],
};

export default function Products() {
  const { db, saveProduct, archiveProduct } = useStore();
  const currency = db.company.currency;
  // Le vocabulaire suit le métier : une carte pour un restaurant, des pièces
  // pour un garage, des références pour une pharmacie.
  const trade = sectorProfile(db.company.sector);
  // Le formulaire vierge part de ce que vend le métier : un salon propose
  // « Prestation » d'emblée, une boutique « Marchandise ». Modifiable, parce
  // qu'un salon vend aussi des crèmes.
  const vierge = { ...BLANK, kind: trade.sells };
  // Un salon ou un artisan ne compte pas des quantités : les colonnes et les
  // champs de stock disparaissent au lieu de rester vides.
  const withStock = tracksStock(db.company);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(BLANK);
  const [kindTouched, setKindTouched] = useState(false);
  const [grid, setGrid] = useState(false);
  // Un article qu'on ne vend plus est retiré de la liste, jamais effacé : il
  // reste sur les ventes et les inventaires déjà faits.
  const [showArchived, setShowArchived] = useState(false);
  const archivedCount = db.products.filter((p) => p.archived).length;
  const viewingArchived = showArchived && archivedCount > 0;
  const [importOpen, setImportOpen] = useState(false);
  const [importAutoFinjaro, setImportAutoFinjaro] = useState(false);
  const { user } = useCollab();
  const isEmpty = db.products.length === 0;
  // Catalogue vide : on regarde une fois si la personne a déjà une boutique
  // Finjaro avec des articles, pour lui proposer de les reprendre en un clic
  // plutôt que de les retaper. Trouvé le 28/09 par Alpha : 3 des 8 inscrits
  // Accounting cette quinzaine sont aussi vendeuses sur la place de marché.
  const [finjaroCount, setFinjaroCount] = useState<number | null>(null);
  useEffect(() => {
    if (!isEmpty || !user) return;
    let cancelled = false;
    fetchFinjaroProducts(user.id, currency)
      .then(({ rows }) => {
        if (!cancelled) setFinjaroCount(rows.length);
      })
      .catch(() => {
        if (!cancelled) setFinjaroCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [isEmpty, user, currency]);

  function openImport(autoFinjaro = false) {
    setImportAutoFinjaro(autoFinjaro);
    setImportOpen(true);
  }

  function exportExcel() {
    exportXlsx(
      'produits',
      'Produits',
      filtered.map((p) => ({
        Nom: p.name,
        Référence: p.sku,
        'Code-barres': p.barcode,
        Catégorie: p.category,
        Marque: p.brand,
        [`Prix de vente (${currency})`]: toMajor(p.price, currency),
        [`Coût d'achat (${currency})`]: toMajor(p.cost, currency),
        Marge: toMajor(p.price - p.cost, currency),
        Stock: p.stock,
        "Seuil d'alerte": p.reorderPoint,
      })),
    );
  }
  const [sort, setSort] = useState<'name' | 'price' | 'margin' | 'stock'>('name');

  /** Saisie directe dans la cellule, enregistrée dès qu'on quitte la case. */
  function Cell({ product, field }: { product: Product; field: 'price' | 'cost' | 'reorderPoint' | 'category' }) {
    const money = field === 'price' || field === 'cost';
    const initial = money ? String(toMajor(product[field], currency)) : String(product[field]);
    return (
      <input
        defaultValue={initial}
        inputMode={field === 'category' ? 'text' : 'decimal'}
        aria-label={field}
        className="field w-full min-w-[96px] py-1.5 num"
        onBlur={(e) => {
          const raw = e.target.value;
          if (raw === initial) return;
          const patch =
            field === 'category'
              ? { category: raw }
              : field === 'reorderPoint'
                ? { reorderPoint: Number(raw) || 0 }
                : { [field]: toMinor(raw || 0, currency) };
          saveProduct({ ...product, ...patch });
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
      />
    );
  }

  const categories = useMemo(
    () => [...new Set(db.products.map((p) => p.category).filter(Boolean))],
    [db.products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = db.products.filter((p) => {
      if (!!p.archived !== viewingArchived) return false;
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
      );
    });
    const by: Record<typeof sort, (a: Product, b: Product) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      price: (a, b) => b.price - a.price,
      margin: (a, b) => b.price - b.cost - (a.price - a.cost),
      stock: (a, b) => a.stock - b.stock,
    };
    return list.sort(by[sort]);
  }, [db.products, query, category, sort, viewingArchived]);

  function openNew() {
    setEditing(null);
    setKindTouched(false);
    setForm(vierge);
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setKindTouched(true);
    setForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      brand: p.brand,
      kind: p.kind ?? trade.sells,
      price: String(toMajor(p.price, currency)),
      cost: String(toMajor(p.cost, currency)),
      stock: String(p.stock),
      reorderPoint: String(p.reorderPoint),
      unit: p.unit,
      components: (p.components ?? []).map((c) => ({ productId: c.productId, qty: String(c.qty) })),
    });
    setOpen(true);
  }

  function submit() {
    if (!form.name.trim()) return;
    saveProduct({
      id: editing?.id,
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      kind: form.kind,
      price: toMinor(form.price || 0, currency),
      cost: toMinor(form.cost || 0, currency),
      stock: editing ? editing.stock : Number(form.stock) || 0,
      reorderPoint: Number(form.reorderPoint) || 0,
      unit: form.unit || 'pièce',
      // Une recette vide n'est pas enregistrée : l'article reste ordinaire.
      components: form.components
        .filter((c) => c.productId && Number(c.qty) > 0)
        .map((c) => ({ productId: c.productId, qty: Number(c.qty) })),
    });
    setOpen(false);
  }

  function exportCsv() {
    const header = ['Nom', 'Référence', 'Code-barres', 'Catégorie', 'Prix', 'Coût', 'Stock', 'Seuil'];
    const rows = filtered.map((p) => [
      p.name,
      p.sku,
      p.barcode,
      p.category,
      toMajor(p.price, currency),
      toMajor(p.cost, currency),
      p.stock,
      p.reorderPoint,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'produits.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title={t(trade.itemsTitle)}
        subtitle={`${t(trade.itemsSubtitle)} · ${t('{n} référence(s)', { n: db.products.filter((p) => !p.archived).length })}`}
        actions={
          <>
            <button onClick={() => setGrid((g) => !g)} className={grid ? 'btn-dark' : 'btn-ghost'} title={t('Modifier les prix directement dans le tableau, comme dans un tableur')}>
              {grid ? t('Quitter le mode tableau') : t('Mode tableau')}
            </button>
            <button onClick={() => openImport(false)} className={isEmpty ? 'btn-primary' : 'btn-ghost'}>
              <IconDownload className="h-4 w-4" />
              {t('Importer')}
            </button>
            <button onClick={exportExcel} className="btn-ghost" title={t('Fichier Excel prêt pour un comptable')}>
              {t('Excel')}
            </button>
            <button onClick={exportCsv} className="btn-ghost">
              {t('CSV')}
            </button>
            <button onClick={openNew} className={isEmpty ? 'btn-ghost' : 'btn-primary'}>
              <IconPlus className="h-4 w-4" />
              {t('Nouveau {item}', { item: t(trade.item).toLowerCase() })}
            </button>
          </>
        }
      />

      <div className="card mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Rechercher (nom, référence, code-barres)…')}
            className="field pl-11"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="field w-auto">
          <option value="">{t('Toutes les catégories')}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="field w-auto" aria-label={t('Trier')}>
          <option value="name">{t('Trier : nom')}</option>
          <option value="price">{t('Trier : prix le plus élevé')}</option>
          <option value="margin">{t('Trier : meilleure marge')}</option>
          <option value="stock">{t('Trier : stock le plus bas')}</option>
        </select>
        {archivedCount > 0 && (
          <button onClick={() => setShowArchived(!showArchived)} className="btn-ghost ml-auto text-caption">
            {viewingArchived ? t('Revenir aux fiches actives') : t('Voir les archivés ({n})', { n: String(archivedCount) })}
          </button>
        )}
      </div>

      {grid && (
        <p className="mb-3 rounded-input bg-[#FBF1DF] px-4 py-2.5 text-caption text-ink">
          {t('Mode tableau : modifiez une case et quittez-la, c’est enregistré. Le stock se corrige depuis l’écran Stock (chaque mouvement est tracé).')}
        </p>
      )}

      <div className="card p-0">
        {filtered.length ? (
          <Table
            head={
              withStock
                ? [trade.item, 'Catégorie', 'Prix de vente', 'Coût', 'Marge', 'Stock', '']
                : [trade.item, 'Catégorie', 'Prix', 'Coût', 'Marge', '']
            }
            // Sur téléphone : nom, prix et stock, ce qu'on cherche au comptoir.
            // Catégorie, coût et marge restent sur ordinateur (mesuré : avec la
            // marge, le nom tombait à 65 px et le tableau débordait). En mode tableau,
            // on garde tout : c'est pour corriger ces cases-là.
            phoneHide={grid ? undefined : [2, 4, 5]}
          >
            {filtered.map((p) => {
              const margin = p.price - p.cost;
              const rate = p.price > 0 ? (margin / p.price) * 100 : 0;
              return (
                <tr key={p.id} className="row">
                  <td className="td">
                    <div className="font-semibold">{p.name}</div>
                    {p.sku && <div className="text-xs text-slate-400">{p.sku}</div>}
                  </td>
                  <td className="td text-slate-500">{grid ? <Cell product={p} field="category" /> : p.category || '—'}</td>
                  <td className="td font-semibold num">{grid ? <Cell product={p} field="price" /> : formatMoney(p.price, currency)}</td>
                  <td className="td num text-slate-500">{grid ? <Cell product={p} field="cost" /> : formatMoney(p.cost, currency)}</td>
                  <td className="td num">
                    <span className={margin >= 0 ? 'text-teal-600' : 'text-rose-600'}>
                      {formatMoney(margin, currency)}
                    </span>
                    <span className="ml-1 text-xs text-slate-400">({rate.toFixed(0)} %)</span>
                  </td>
                  {withStock && (
                    <td className="td">
                      <div className="flex items-center gap-2">
                        {p.stock <= 0 ? (
                          <Badge tone="danger">{t('Rupture')}</Badge>
                        ) : p.stock <= p.reorderPoint ? (
                          <Badge tone="warn">{p.stock} {t('— bas')}</Badge>
                        ) : (
                          <Badge tone="success">{p.stock}</Badge>
                        )}
                        {grid && (
                          <span className="flex items-center gap-1 text-[11px] text-muted">
                            {t('seuil')} <Cell product={p} field="reorderPoint" />
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="td text-right">
                    {p.archived ? (
                      <button onClick={() => saveProduct({ ...p, archived: false })} className="text-sm font-semibold text-brand-600">
                        {t('Réactiver')}
                      </button>
                    ) : (
                      <button onClick={() => openEdit(p)} className="text-sm font-semibold text-brand-600">
                        {t('Modifier')}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty
            title={isEmpty ? t('Rien dans « {items} » pour l’instant', { items: t(trade.itemsTitle) }) : t('Rien trouvé')}
            hint={
              isEmpty
                ? t('Par exemple : {examples}.', { examples: trade.examples.map((e) => e.name).join(', ') })
                : t('Essayez un autre mot, ou retirez le filtre de catégorie.')
            }
            icon={<IconBox className="h-10 w-10" />}
            action={
              isEmpty ? (
                <>
                  {!!finjaroCount && (
                    <button onClick={() => openImport(true)} className="btn-primary">
                      <IconDownload className="h-4 w-4" />
                      {t('Reprendre les {n} article(s) de ma boutique Finjaro', { n: finjaroCount })}
                    </button>
                  )}
                  <button onClick={() => openImport(false)} className={finjaroCount ? 'btn-ghost' : 'btn-primary'}>
                    <IconDownload className="h-4 w-4" />
                    {t('Importer (Excel, boutique Finjaro, photo…)')}
                  </button>
                  <button onClick={openNew} className="btn-ghost">
                    {t('Ou saisir {item} par {item}', { item: t(trade.item).toLowerCase() })}
                  </button>
                </>
              ) : undefined
            }
          />
        )}
      </div>

      <ImportProducts open={importOpen} onClose={() => setImportOpen(false)} autoFinjaro={importAutoFinjaro} />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('Modifier') : t('Nouveau {item}', { item: t(trade.item).toLowerCase() })} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label={t('Nom du produit')}>
              <input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  // Tant que la personne n'a pas choisi la nature elle-même, un
                  // nom de travail facturé propose « Prestation ».
                  const kind = kindTouched ? form.kind : looksLikeService(name) ? 'SERVICE' : vierge.kind;
                  setForm({ ...form, name, kind });
                }}
                className="field"
              />
            </Field>
          </div>
          <Field label={t('Référence (SKU)')}>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="field" />
          </Field>
          <Field label={t('Code-barres')}>
            <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="field" />
          </Field>
          <Field
            label={t('Nature')}
            hint={t('Décide du compte de produits : marchandise revendue, ou travail facturé.')}
          >
            <div className="flex gap-2">
              {(['GOODS', 'SERVICE'] as RevenueKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setKindTouched(true);
                    setForm({ ...form, kind: k });
                  }}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
                    form.kind === k ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line text-muted'
                  }`}
                >
                  {k === 'GOODS' ? t('Marchandise') : t('Prestation')}
                </button>
              ))}
            </div>
          </Field>
          <Field label={t('Catégorie')}>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="field" />
          </Field>
          <Field label={t('Marque')}>
            <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="field" />
          </Field>
          <Field label={t('Prix de vente ({c})', { c: currency })}>
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} inputMode="decimal" className="field num" />
          </Field>
          {withStock && (
            <div className="sm:col-span-2 rounded-card border border-hairline bg-white p-4">
              {/* Un plat, un cocktail, un menu : ce sont les ingrédients qui
                  sortent du stock, pas la fiche. Trouvé le 18/09 : une
                  restauratrice vendait quarante plats et voyait son riz
                  inchangé. */}
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-[17px] font-bold text-ink">{t('Préparé avec')}</h3>
                <span className="text-[11px] text-muted">{t('facultatif')}</span>
              </div>
              <p className="mt-0.5 text-caption text-muted">
                {t('Si cet article est préparé (un plat, un menu, un cocktail), dites avec quoi. Ce sont alors les ingrédients qui sortent du stock, et le coût de revient est le leur.')}
              </p>
              {form.components.map((c, i) => (
                <div key={i} className="mt-3 flex flex-wrap items-end gap-2">
                  <label className="min-w-[10rem] flex-[2]">
                    <span className="mb-1 block text-caption font-semibold text-muted">{t('Ingrédient')}</span>
                    <select
                      value={c.productId}
                      onChange={(e) => setForm({ ...form, components: form.components.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)) })}
                      className="field"
                    >
                      <option value="">{t('— Choisir —')}</option>
                      {db.products
                        .filter((p) => !p.archived && !p.components?.length && p.id !== editing?.id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.unit ? `(${p.unit})` : ''}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="w-24">
                    <span className="mb-1 block text-caption font-semibold text-muted">{t('Quantité')}</span>
                    <input
                      value={c.qty}
                      inputMode="decimal"
                      onChange={(e) => setForm({ ...form, components: form.components.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)) })}
                      className="field num text-right"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, components: form.components.filter((_, j) => j !== i) })}
                    className="btn-ghost py-2 text-caption text-[#A63030]"
                  >
                    {t('Retirer')}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm({ ...form, components: [...form.components, { productId: '', qty: '1' }] })}
                className="btn-ghost mt-3 py-1.5 text-caption"
              >
                {t('Ajouter un ingrédient')}
              </button>
              {form.components.some((c) => c.productId && Number(c.qty) > 0) && (
                <p className="mt-3 text-caption font-semibold text-[#1F6F65]">
                  {t('Coût de revient calculé :')}{' '}
                  {formatMoney(
                    form.components.reduce((somme, c) => {
                      const ing = db.products.find((p) => p.id === c.productId);
                      return somme + (ing ? ing.cost * (Number(c.qty) || 0) : 0);
                    }, 0),
                    currency,
                  )}
                </p>
              )}
            </div>
          )}
          <Field label={t("Coût d'achat ({c})", { c: currency })}>
            <input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} inputMode="decimal" className="field num" />
          </Field>
          {withStock &&
            (editing ? (
              <Field label={t('Stock actuel')} hint={t('Le stock se corrige depuis l’écran Stock pour garder la trace de chaque mouvement.')}>
                <div className="flex items-center gap-3">
                  <span className="field w-auto bg-base num">{editing.stock}</span>
                  <Link to="/stock" onClick={() => setOpen(false)} className="text-caption font-semibold text-teal">
                    {t('Ajuster le stock')}
                  </Link>
                </div>
              </Field>
            ) : (
              <Field label={t('Quantité en stock aujourd’hui')} hint={t('Ce que vous avez déjà en rayon. Vous pourrez l’ajuster ensuite.')}>
                <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} inputMode="numeric" className="field num" />
              </Field>
            ))}
          {withStock && (
            <Field label={t('M’alerter quand il en reste moins de')} hint={t('L’appli vous prévient qu’il faut recommander.')}>
              <input value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} inputMode="numeric" className="field num" />
            </Field>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          {editing && (
            <button
              onClick={() => {
                archiveProduct(editing.id);
                setOpen(false);
              }}
              className="btn-ghost mr-auto text-caption text-brand-600"
              title={t('Il reste sur les ventes déjà faites. Vous pourrez le réactiver.')}
            >
              {t('Je ne le vends plus')}
            </button>
          )}
          <button onClick={() => setOpen(false)} className="btn-ghost">
            {t('Annuler')}
          </button>
          <button onClick={submit} className="btn-primary">
            {editing ? t('Enregistrer') : t('Créer le produit')}
          </button>
        </div>
      </Modal>
    </>
  );
}
