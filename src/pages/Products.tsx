import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { formatMoney, toMajor, toMinor } from '../lib/money';
import type { Product } from '../lib/types';
import { Badge, Empty, Field, Modal, PageHeader, Table } from '../components/UI';
import { IconBox, IconDownload, IconPlus, IconSearch } from '../components/Icons';
import ImportProducts from '../components/ImportProducts';
import { exportXlsx } from '../lib/xlsx';
import { Link } from 'react-router-dom';
import { t } from '../lib/i18n';

const BLANK = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  brand: '',
  price: '',
  cost: '',
  stock: '',
  reorderPoint: '',
  unit: 'pièce',
};

export default function Products() {
  const { db, saveProduct } = useStore();
  const currency = db.company.currency;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(BLANK);
  const [grid, setGrid] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

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
      if (p.archived) return false;
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
  }, [db.products, query, category, sort]);

  function openNew() {
    setEditing(null);
    setForm(BLANK);
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      brand: p.brand,
      price: String(toMajor(p.price, currency)),
      cost: String(toMajor(p.cost, currency)),
      stock: String(p.stock),
      reorderPoint: String(p.reorderPoint),
      unit: p.unit,
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
      price: toMinor(form.price || 0, currency),
      cost: toMinor(form.cost || 0, currency),
      stock: editing ? editing.stock : Number(form.stock) || 0,
      reorderPoint: Number(form.reorderPoint) || 0,
      unit: form.unit || 'pièce',
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
        title={t('Produits')}
        subtitle={t('{n} référence(s) au catalogue', { n: db.products.filter((p) => !p.archived).length })}
        actions={
          <>
            <button onClick={() => setGrid((g) => !g)} className={grid ? 'btn-dark' : 'btn-ghost'} title={t('Modifier les prix directement dans le tableau, comme dans un tableur')}>
              {grid ? t('Quitter le mode tableau') : t('Mode tableau')}
            </button>
            <button onClick={() => setImportOpen(true)} className="btn-ghost">
              <IconDownload className="h-4 w-4" />
              {t('Importer')}
            </button>
            <button onClick={exportExcel} className="btn-ghost" title={t('Fichier Excel prêt pour un comptable')}>
              {t('Excel')}
            </button>
            <button onClick={exportCsv} className="btn-ghost">
              {t('CSV')}
            </button>
            <button onClick={openNew} className="btn-primary">
              <IconPlus className="h-4 w-4" />
              {t('Nouveau produit')}
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
      </div>

      {grid && (
        <p className="mb-3 rounded-input bg-[#FBF1DF] px-4 py-2.5 text-caption text-ink">
          {t('Mode tableau : modifiez une case et quittez-la, c’est enregistré. Le stock se corrige depuis l’écran Stock (chaque mouvement est tracé).')}
        </p>
      )}

      <div className="card p-0">
        {filtered.length ? (
          <Table head={['Produit', 'Catégorie', 'Prix de vente', 'Coût', 'Marge', 'Stock', '']}>
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
                          seuil <Cell product={p} field="reorderPoint" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="td text-right">
                    <button onClick={() => openEdit(p)} className="text-sm font-semibold text-brand-600">
                      {t('Modifier')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty
            title={t('Aucun produit trouvé')}
            hint={t('Créez votre première référence pour alimenter le point de vente et le stock.')}
            icon={<IconBox className="h-10 w-10" />}
          />
        )}
      </div>

      <ImportProducts open={importOpen} onClose={() => setImportOpen(false)} />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('Modifier le produit') : t('Nouveau produit')} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label={t('Nom du produit')}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
            </Field>
          </div>
          <Field label={t('Référence (SKU)')}>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="field" />
          </Field>
          <Field label={t('Code-barres')}>
            <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="field" />
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
          <Field label={t("Coût d'achat ({c})", { c: currency })}>
            <input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} inputMode="decimal" className="field num" />
          </Field>
          {editing ? (
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
          )}
          <Field label={t('M’alerter quand il en reste moins de')} hint={t('L’appli vous prévient qu’il faut recommander.')}>
            <input value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} inputMode="numeric" className="field num" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
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
