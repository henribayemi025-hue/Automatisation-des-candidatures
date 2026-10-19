import { useEffect, useRef, useState } from 'react';
import { useCollab } from '../lib/collab';
import { useDB } from '../lib/store';
import { isDemo } from '../lib/demo-state';
import { publishedArticles, stockChanges, syncStocks } from '../lib/finjaro-catalog';

/**
 * Le stock des articles publiés sur Finjaro suit celui d'Accounting.
 *
 * À l'ouverture, tout le stock publié part une fois ; ensuite, un envoi
 * groupé 2 s après le dernier mouvement (vente en caisse, achat, correction,
 * import, vente livrée sur Finjaro). Seule la propriétaire de l'espace peut
 * le faire (le serveur refuse les autres) ; sans réseau, l'envoi attend le
 * prochain mouvement ou la prochaine ouverture. Rien ne s'affiche : c'est un
 * travail de fond.
 */
const listeners = new Set<(ref: string) => void>();

/** À appeler après une publication : l'article entre dans la synchro sans attendre la prochaine ouverture. */
export function notifyPublished(ref: string) {
  for (const l of listeners) l(ref);
}

export default function FinjaroStockSync() {
  const { user, workspace } = useCollab();
  const db = useDB();
  const owner = !!user && !!workspace && workspace.role === 'owner' && workspace.ownerId === user.id && !isDemo();
  const [published, setPublished] = useState<Set<string> | null>(null);
  const sent = useRef(new Map<string, number>());

  useEffect(() => {
    setPublished(null);
    sent.current = new Map();
    if (!owner || !user) return;
    let cancelled = false;
    publishedArticles(user.id)
      .then((m) => { if (!cancelled) setPublished(new Set(m.keys())); })
      .catch(() => { if (!cancelled) setPublished(new Set()); });
    const onPublished = (ref: string) => {
      // La publication vient d'envoyer ce stock : inutile de le renvoyer.
      setPublished((s) => new Set(s ?? []).add(ref));
      const p = db.products.find((x) => x.id === ref);
      if (p) sent.current.set(ref, Math.max(0, Math.floor(p.stock)));
    };
    listeners.add(onPublished);
    return () => {
      cancelled = true;
      listeners.delete(onPublished);
    };
    // db.products volontairement absent : on ne relit le catalogue qu'au changement d'espace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, user?.id, workspace?.id]);

  useEffect(() => {
    if (!owner || !workspace || !published?.size) return;
    const changes = stockChanges(db.products, published, sent.current);
    if (!changes.length) return;
    const timer = window.setTimeout(() => {
      syncStocks(workspace.id, changes)
        .then(() => { for (const c of changes) sent.current.set(c.ref, c.stock); })
        .catch(() => { /* réseau ou serveur : réessayé au prochain mouvement */ });
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [owner, workspace, published, db.products]);

  return null;
}
