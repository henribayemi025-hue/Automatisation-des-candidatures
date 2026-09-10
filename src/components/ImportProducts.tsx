import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { useCollab } from '../lib/collab';
import { dedupe, fetchFinjaroProducts, parseSpreadsheet } from '../lib/importers';
import type { ImportRow } from '../lib/importers';
import { formatMoney } from '../lib/money';
import { Modal } from './UI';
import { IconDownload } from './Icons';

/** Trois façons de ne pas tout retaper : boutique Finjaro, fichier Excel/CSV, ou l'assistant (photo/dictée). */
export default function ImportProducts({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, saveProduct } = useStore();
  const { user } = useCollab();
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const currency = db.company.currency;

  function reset() {
    setRows(null);
    setSkipped(0);
    setNote('');
    setError('');
    setDone(0);
  }

  async function fromFinjaro() {
    if (!user) {
      setError('Connectez-vous avec votre compte Finjaro pour retrouver votre boutique.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { rows: all, converted, shops } = await fetchFinjaroProducts(user.id, currency);
      if (!shops.length) {
        setError('Aucune boutique Finjaro trouvée sur ce compte.');
        return;
      }
      const { fresh, skipped: sk } = dedupe(all, db);
      setRows(fresh);
      setSkipped(sk);
      setNote(
        `${all.length} article(s) dans ${shops.join(', ')}.` +
          (converted ? ` Prix convertis depuis le FCFA à titre indicatif : vérifiez-les.` : '') +
          ` Le prix d’achat n’existe pas sur Finjaro : à compléter pour connaître vos marges.`,
      );
    } catch {
      setError('Impossible de lire la boutique pour le moment.');
    } finally {
      setBusy(false);
    }
  }

  async function fromFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const { rows: all, missing } = await parseSpreadsheet(file, currency);
      if (missing.length) {
        setError(`Colonnes introuvables : ${missing.join(', ')}. La première ligne doit contenir les titres (ex. Nom, Prix, Coût, Stock, Catégorie).`);
        return;
      }
      const { fresh, skipped: sk } = dedupe(all, db);
      setRows(fresh);
      setSkipped(sk);
      setNote(`${all.length} ligne(s) lue(s) dans ${file.name}.`);
    } catch {
      setError('Fichier illisible. Formats acceptés : .xlsx, .xls, .csv.');
    } finally {
      setBusy(false);
    }
  }

  function confirm() {
    if (!rows?.length) return;
    for (const r of rows) {
      saveProduct({
        name: r.name,
        sku: r.sku,
        barcode: '',
        category: r.category,
        brand: '',
        price: r.price,
        cost: r.cost,
        stock: r.stock,
        reorderPoint: 0,
        unit: 'pièce',
      });
    }
    setDone(rows.length);
    setRows(null);
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Importer des produits"
      wide
    >
      {done > 0 && (
        <div className="mb-4 rounded-input bg-[#EAF6EA] px-4 py-3 text-caption text-[#1F6F65]">
          {done} produit(s) ajouté(s) au catalogue. Pensez à compléter les prix d’achat pour vos marges.
        </div>
      )}
      {error && <div className="mb-4 rounded-input bg-[#FDEDED] px-4 py-3 text-caption text-[#A63030]">{error}</div>}

      {!rows && (
        <div className="grid gap-3 sm:grid-cols-3">
          <button onClick={() => void fromFinjaro()} disabled={busy} className="tile items-start text-left">
            <span className="text-2xl">🛍️</span>
            <span className="text-body font-semibold">Depuis ma boutique Finjaro</span>
            <span className="text-caption text-muted">Vos articles déjà en ligne, en un clic.</span>
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="tile items-start text-left">
            <span className="text-2xl">📊</span>
            <span className="text-body font-semibold">Depuis Excel ou CSV</span>
            <span className="text-caption text-muted">Colonnes : Nom, Prix, Coût, Stock, Catégorie — dans n’importe quel ordre.</span>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => void fromFile(e.target.files?.[0])} />
          </button>
          <div className="tile items-start text-left">
            <span className="text-2xl">📷</span>
            <span className="text-body font-semibold">Photo ou dictée</span>
            <span className="text-caption text-muted">Ouvrez l’assistant (bouton en bas à droite), photographiez votre cahier ou dictez la liste.</span>
          </div>
        </div>
      )}

      {rows && (
        <>
          <p className="text-caption text-muted">{note}</p>
          {skipped > 0 && <p className="mt-1 text-caption text-muted">{skipped} déjà présent(s) ou en double, ignoré(s).</p>}
          <div className="mt-3 max-h-72 overflow-auto rounded-input border border-hairline scrollbar-thin">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="bg-base/70">
                  <th className="th">Produit</th>
                  <th className="th">Catégorie</th>
                  <th className="th text-right">Prix</th>
                  <th className="th text-right">Coût</th>
                  <th className="th text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="row">
                    <td className="td">{r.name}</td>
                    <td className="td text-muted">{r.category || '—'}</td>
                    <td className="td num text-right">{formatMoney(r.price, currency)}</td>
                    <td className="td num text-right text-muted">{r.cost ? formatMoney(r.cost, currency) : '—'}</td>
                    <td className="td num text-right">{r.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={reset} className="btn-ghost">
              Retour
            </button>
            <button onClick={confirm} disabled={!rows.length} className="btn-primary">
              <IconDownload className="h-4 w-4" />
              Importer {rows.length} produit(s)
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
