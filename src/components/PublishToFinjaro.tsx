import { useEffect, useState } from 'react';
import { Field, Modal } from './UI';
import { useCollab } from '../lib/collab';
import { useDB } from '../lib/store';
import { formatMoney, toMajor, toMinor } from '../lib/money';
import type { Product } from '../lib/types';
import { t } from '../lib/i18n';
import {
  activeShops,
  buyerPrice,
  catalogStock,
  photoUrl,
  publishArticle,
  PublishError,
  publishedArticles,
  uploadPhoto,
  type FinjaroShop,
  type PublishedArticle,
} from '../lib/finjaro-catalog';
import { notifyPublished } from './FinjaroStockSync';

/**
 * « Publier sur Finjaro » : l'article de la fiche part dans la boutique de la
 * propriétaire sur la place de marché, avec une photo (obligatoire : un
 * article sans photo ne se vend pas), une phrase de description et le prix
 * que la cliente paiera. Republier met à jour le nom, le prix et la
 * description ; le stock suit ensuite tout seul (FinjaroStockSync).
 */
export default function PublishToFinjaro({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const db = useDB();
  const { user, workspace } = useCollab();
  const currency = db.company.currency;
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [shops, setShops] = useState<FinjaroShop[]>([]);
  const [existing, setExisting] = useState<PublishedArticle | null>(null);
  const [shopId, setShopId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [priceRaw, setPriceRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  useEffect(() => {
    if (!product || !user) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    setError(null);
    setDoneId(null);
    setFile(null);
    setPriceRaw(String(toMajor(buyerPrice(db.company, product), currency)));
    Promise.all([activeShops(user.id), publishedArticles(user.id)])
      .then(([list, published]) => {
        if (cancelled) return;
        setShops(list);
        setShopId(list.length === 1 ? list[0].id : '');
        const mine = published.get(product.id) ?? null;
        setExisting(mine);
        setDescription(mine?.description ?? '');
        setPreview(mine?.image ? photoUrl(mine.image) : null);
      })
      .catch(() => { if (!cancelled) setLoadError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, user?.id]);

  // L'aperçu d'une photo choisie sur l'appareil, libéré quand on en change.
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!product) return null;
  const priceMinor = toMinor(priceRaw || 0, currency);
  const hasPhoto = !!file || !!existing?.image;
  const needShop = shops.length > 1 && !shopId;
  const ready = !loading && !busy && shops.length > 0 && hasPhoto && priceMinor > 0 && !needShop && !!workspace;
  const stock = catalogStock(product.stock);

  async function publish() {
    if (!product || !user || !workspace || !ready) return;
    setBusy(true);
    setError(null);
    try {
      const imagePath = file ? await uploadPhoto(user.id, file) : existing!.image!;
      const id = await publishArticle({
        workspaceId: workspace.id,
        product,
        priceMinor,
        currency,
        description,
        imagePath,
        shopId: shopId || null,
      });
      notifyPublished(product.id);
      setExisting({ id, ref: product.id, image: imagePath, description });
      setFile(null);
      setDoneId(id);
    } catch (e) {
      if (e instanceof PublishError && e.code === 'choisir_boutique') setError(t('Choisissez la boutique où publier cet article.'));
      else if (e instanceof PublishError && e.code === 'photo_obligatoire') setError(t('Ajoutez une photo de l’article.'));
      else if (e instanceof Error && /devise invalide/i.test(e.message)) setError(t('Finjaro ne reconnaît pas encore la devise {currency}. Rien n’a été publié.', { currency }));
      else setError(t('La publication n’a pas abouti. Vérifiez la connexion, puis réessayez.') + (e instanceof Error && e.message ? ` (${e.message})` : ''));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={existing ? t('Mettre à jour sur Finjaro') : t('Publier sur Finjaro')}>
      {loading ? (
        <p className="py-6 text-center text-sm text-muted">{t('Un instant…')}</p>
      ) : loadError ? (
        <p role="alert" className="py-4 text-sm font-semibold text-brand-600">{t('Impossible de joindre Finjaro. Vérifiez la connexion, puis rouvrez cette fenêtre.')}</p>
      ) : shops.length === 0 ? (
        <div className="space-y-3 text-sm">
          <p>{t('Pour publier un article, il faut d’abord une boutique active sur Finjaro, avec le même compte.')}</p>
          <a href="https://finjaro.net" target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex">
            {t('Ouvrir Finjaro')}
          </a>
        </div>
      ) : doneId ? (
        <div className="space-y-3 text-sm">
          <p role="status" className="font-semibold text-ink">{t('« {name} » est sur Finjaro.', { name: product.name })}</p>
          <p className="text-muted">{t('Le stock suivra tout seul vos ventes, vos achats et vos corrections.')}</p>
          <div className="flex flex-wrap gap-2">
            <a href={`https://finjaro.net/product/${doneId}`} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              {t('Voir l’article sur Finjaro')}
            </a>
            <button onClick={onClose} className="btn-primary">{t('Terminé')}</button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <p className="font-semibold text-ink">{product.name}</p>
            <Field label={t('Photo (obligatoire)')} hint={t('Votre propre photo de l’article, jamais une image prise sur internet.')}>
              <div className="flex items-center gap-3">
                {preview ? (
                  <img src={preview} alt="" className="h-20 w-20 shrink-0 rounded-input border border-hairline object-cover" />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-input border border-dashed border-hairline text-[11px] text-muted">{t('Aucune')}</div>
                )}
                <label className="btn-ghost cursor-pointer">
                  {preview ? t('Changer la photo') : t('Choisir une photo')}
                  <input
                    id="finjaro-photo"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ''; }}
                  />
                </label>
              </div>
            </Field>
            <Field label={t('Description')} hint={t('Une phrase suffit : matière, taille, ce qui le rend utile.')}>
              <textarea id="finjaro-description" value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))} rows={2} className="field" />
            </Field>
            <Field label={t('Prix sur Finjaro ({currency})', { currency })} hint={t('Ce que la cliente paiera. Prix de la fiche : {price}.', { price: formatMoney(buyerPrice(db.company, product), currency) })}>
              <input id="finjaro-price" value={priceRaw} onChange={(e) => setPriceRaw(e.target.value)} inputMode="decimal" className="field num" />
            </Field>
            {shops.length > 1 && (
              <Field label={t('Boutique')}>
                <select id="finjaro-shop" value={shopId} onChange={(e) => setShopId(e.target.value)} className="field">
                  <option value="">{t('Choisir…')}</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
            )}
            <p className="text-caption text-muted">
              {stock > 0
                ? t('Stock publié : {n}. Il suivra ensuite tout seul vos ventes, vos achats et vos corrections.', { n: stock })
                : t('Stock à 0 : l’article apparaîtra en rupture sur Finjaro jusqu’à votre prochain achat ou correction.')}
            </p>
          </div>
          {error && <p role="alert" className="mt-4 text-sm font-semibold text-brand-600">{error}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button onClick={onClose} className="btn-ghost">{t('Annuler')}</button>
            <button onClick={() => void publish()} disabled={!ready} className="btn-primary">
              {busy ? t('Un instant…') : existing ? t('Mettre à jour') : t('Publier')}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
