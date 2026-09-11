import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { formatMoney, toMinor } from '../lib/money';
import type { PaymentMethod, SaleLine } from '../lib/types';
import { Badge, Empty, Field, Money, PageHeader } from '../components/UI';
import { IconBox, IconCart, IconCheck, IconDoc, IconSearch, IconX } from '../components/Icons';
import { scanFeedback, useBarcodeScanner } from '../lib/scanner';
import { t } from '../lib/i18n';
import ProjectSelect from '../components/ProjectSelect';

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'MOBILE', label: 'Mobile money' },
  { value: 'CARD', label: 'Carte' },
  { value: 'BANK', label: 'Virement' },
  { value: 'CREDIT', label: 'Crédit (à terme)' },
];

interface HeldTicket {
  id: string;
  at: string;
  lines: SaleLine[];
  customerId: string;
  note: string;
}

const HELD_KEY = 'finia.pos.held';

function loadHeld(): HeldTicket[] {
  try {
    return JSON.parse(localStorage.getItem(HELD_KEY) ?? '[]') as HeldTicket[];
  } catch {
    return [];
  }
}

export default function PointOfSale() {
  const { db, recordSale } = useStore();
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<SaleLine[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [discountRaw, setDiscountRaw] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [paidRaw, setPaidRaw] = useState('');
  const [flash, setFlash] = useState('');
  const [scanNote, setScanNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [held, setHeld] = useState<HeldTicket[]>(() => loadHeld());
  const [customerPanel, setCustomerPanel] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const currency = db.company.currency;
  const discount = toMinor(discountRaw || 0, currency);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = db.products.filter((p) => !p.archived);
    if (!q) return list.slice(0, 12);
    return list
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [db.products, query]);

  const totals = useMemo(() => {
    const gross = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    const net = Math.max(0, gross - discount);
    const vat = db.company.vatEnabled ? Math.round((net * db.company.vatRateBp) / 10000) : 0;
    return { gross, net, vat, total: net + vat };
  }, [cart, discount, db.company.vatEnabled, db.company.vatRateBp]);

  const paid = paidRaw === '' ? totals.total : toMinor(paidRaw, currency);
  const isCredit = method === 'CREDIT';
  const effectivePaid = isCredit ? Math.min(paid, totals.total) : totals.total;
  const remaining = totals.total - effectivePaid;

  function addToCart(productId: string) {
    const product = db.products.find((p) => p.id === productId);
    if (!product) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) => (l.productId === productId ? { ...l, qty: l.qty + 1 } : l));
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          qty: 1,
          unitPrice: product.price,
          unitCost: product.cost,
        },
      ];
    });
  }

  /** Un code scanné ou tapé puis Entrée : correspondance exacte sur le code-barres ou la référence. */
  function scan(code: string) {
    const clean = code.trim().toLowerCase();
    const product = db.products.find((p) => !p.archived && (p.barcode.toLowerCase() === clean || p.sku.toLowerCase() === clean));
    if (!product) {
      scanFeedback(false);
      setScanNote({ ok: false, text: t('Code « {code} » inconnu : ajoutez ce code-barres à la fiche du produit.', { code }) });
      return;
    }
    if (product.stock <= 0) {
      scanFeedback(false);
      setScanNote({ ok: false, text: t('{name} est en rupture.', { name: product.name }) });
      return;
    }
    addToCart(product.id);
    scanFeedback(true);
    setScanNote({ ok: true, text: t('{name} ajouté', { name: product.name }) });
    setQuery('');
  }
  useBarcodeScanner(scan);
  useEffect(() => {
    if (!scanNote) return;
    const id = setTimeout(() => setScanNote(null), 2500);
    return () => clearTimeout(id);
  }, [scanNote]);

  /** Mettre le panier de côté (client qui va chercher son argent) et servir le suivant. */
  function hold() {
    if (!cart.length) return;
    const ticket: HeldTicket = { id: Date.now().toString(36), at: new Date().toISOString(), lines: cart, customerId, note: '' };
    const next = [ticket, ...held].slice(0, 20);
    setHeld(next);
    localStorage.setItem(HELD_KEY, JSON.stringify(next));
    reset();
    setFlash(t('Ticket mis en attente. Reprenez-le quand le client revient.'));
    setTimeout(() => setFlash(''), 4000);
  }

  function resume(id: string) {
    const ticket = held.find((h) => h.id === id);
    if (!ticket) return;
    const next = held.filter((h) => h.id !== id);
    setHeld(next);
    localStorage.setItem(HELD_KEY, JSON.stringify(next));
    setCart(ticket.lines);
    setCustomerId(ticket.customerId);
  }

  function setQty(productId: string, qty: number) {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    );
  }

  function reset() {
    setCart([]);
    setDiscountRaw('');
    setPaidRaw('');
    setCustomerId('');
    setMethod('CASH');
  }

  function submit(asQuote: boolean) {
    if (!cart.length) return;
    if (isCredit && !customerId) {
      setFlash(t('Choisissez un client pour vendre à crédit.'));
      return;
    }
    const customer = db.customers.find((c) => c.id === customerId);
    const sale = recordSale({
      lines: cart,
      discount,
      method,
      customerId: customerId || null,
      customerName: customer?.name ?? 'Client passager',
      paid: effectivePaid,
      asQuote,
      projectId: projectId || null,
    });
    setFlash(asQuote ? t('Devis {n} enregistré.', { n: sale.number }) : t('Vente {n} enregistrée.', { n: sale.number }));
    reset();
    setTimeout(() => setFlash(''), 4000);
  }

  return (
    <>
      <PageHeader
        title={t('Point de vente')}
        subtitle={t('Scannez ou cherchez, validez : la vente, le stock et les écritures sont enregistrés d’un coup')}
        actions={
          held.length > 0 ? (
            <span className="rounded-pill border border-brass/50 bg-[#FBF1DF] px-3 py-1.5 text-caption font-semibold text-[#8C6A3D]">
              {t('{n} ticket(s) en attente', { n: held.length })}
            </span>
          ) : undefined
        }
      />

      {flash && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200">
          <IconCheck className="h-4 w-4" />
          {flash}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="card">
          <form
            className="relative mb-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) scan(query);
            }}
          >
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              id="pos-search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Scannez un code-barres, ou tapez un nom, une référence…')}
              className="field pl-11"
              autoComplete="off"
            />
          </form>
          <p className="mb-4 text-[11px] text-muted">
            {scanNote ? (
              <span className={scanNote.ok ? 'font-semibold text-[#1F6F65]' : 'font-semibold text-[#A63030]'}>{scanNote.text}</span>
            ) : (
              t('Un lecteur de codes-barres USB ou Bluetooth fonctionne sans réglage : scannez, l’article s’ajoute au panier.')
            )}
          </p>

          {held.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-input bg-[#FBF1DF] px-3 py-2 text-caption">
              <span className="font-semibold text-[#8C6A3D]">{t('En attente :')}</span>
              {held.map((h) => (
                <button key={h.id} type="button" onClick={() => resume(h.id)} className="rounded-pill border border-brass/50 bg-white px-2.5 py-1 font-medium hover:border-teal">
                  {new Date(h.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {h.lines.reduce((n, l) => n + l.qty, 0)} {t('art.')} · {formatMoney(h.lines.reduce((n, l) => n + l.unitPrice * l.qty, 0), currency)}
                </button>
              ))}
            </div>
          )}

          {results.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p.id)}
                  disabled={p.stock <= 0}
                  className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:border-brand-400 hover:shadow-md disabled:opacity-40 dark:border-white/10"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="line-clamp-3 text-sm font-semibold leading-snug">{p.name}</span>
                    {p.stock <= 0 ? (
                      <Badge tone="danger">{t('Rupture')}</Badge>
                    ) : p.stock <= p.reorderPoint ? (
                      <Badge tone="warn">{p.stock}</Badge>
                    ) : (
                      <Badge>{p.stock}</Badge>
                    )}
                  </div>
                  <div className="text-base font-extrabold text-brand-600 num">
                    {formatMoney(p.price, currency)}
                  </div>
                  {p.sku && <div className="mt-0.5 text-[11px] text-slate-400">{p.sku}</div>}
                </button>
              ))}
            </div>
          ) : (
            <Empty
              title={query ? 'Aucun produit ne correspond' : 'Aucun produit enregistré'}
              hint={query ? undefined : 'Créez vos produits pour commencer à vendre.'}
              icon={<IconBox className="h-10 w-10" />}
            />
          )}
        </div>

        <div className="card flex h-fit flex-col gap-4 lg:sticky lg:top-24">
          <h2 className="flex items-center gap-2 font-bold">
            <IconCart className="h-[18px] w-[18px] text-brand-600" />
            {t('Panier')}
            {cart.length > 0 && <Badge tone="success">{cart.length}</Badge>}
          </h2>

          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t('Panier vide')}</p>
          ) : (
            <ul className="space-y-2">
              {cart.map((l) => (
                <li key={l.productId} className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold">{l.name}</span>
                    <button
                      onClick={() => setQty(l.productId, 0)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <IconX className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQty(l.productId, l.qty - 1)}
                        className="h-7 w-7 rounded-lg border border-slate-200 font-bold dark:border-white/10"
                      >
                        −
                      </button>
                      <input
                        value={l.qty}
                        onChange={(e) => setQty(l.productId, Number(e.target.value) || 0)}
                        className="h-7 w-12 rounded-lg border border-slate-200 text-center text-sm num dark:border-white/10 dark:bg-transparent"
                      />
                      <button
                        onClick={() => setQty(l.productId, l.qty + 1)}
                        className="h-7 w-7 rounded-lg border border-slate-200 font-bold dark:border-white/10"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-bold num">
                      {formatMoney(l.unitPrice * l.qty, currency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-white/10">
            {customerPanel || customerId || isCredit ? (
              <Field label={t('Client')} hint={t('Nécessaire seulement pour une vente à crédit ou un suivi par client.')}>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="field">
                  <option value="">{t('Client passager (comptoir)')}</option>
                  {db.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <div className="flex items-center justify-between rounded-input bg-base px-3 py-2 text-caption">
                <span>
                  <span className="font-semibold text-ink">{t('Client passager')}</span>
                  <span className="text-muted"> — {t('aucune fiche à créer')}</span>
                </span>
                <button type="button" onClick={() => setCustomerPanel(true)} className="font-semibold text-teal">
                  {t('Identifier')}
                </button>
              </div>
            )}

            <ProjectSelect value={projectId} onChange={setProjectId} />

            <Field label={t('Remise')}>
              <input
                value={discountRaw}
                onChange={(e) => setDiscountRaw(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className="field num"
              />
            </Field>

            <Field label={t('Paiement')}>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="field"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {t(m.label)}
                  </option>
                ))}
              </select>
            </Field>

            {isCredit && (
              <Field label={t('Acompte versé')} hint={t('Le reste devient une créance client')}>
                <input
                  value={paidRaw}
                  onChange={(e) => setPaidRaw(e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                  className="field num"
                />
              </Field>
            )}
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-4 text-sm dark:border-white/10">
            <div className="flex justify-between text-slate-500">
              <span>{t('Sous-total')}</span>
              <Money value={totals.gross} />
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>{t('Remise')}</span>
                <span className="num">− {formatMoney(discount, currency)}</span>
              </div>
            )}
            {db.company.vatEnabled && (
              <div className="flex justify-between text-slate-500">
                <span>{db.company.taxLabel || t('TVA')} ({(db.company.vatRateBp / 100).toFixed(2)} %)</span>
                <Money value={totals.vat} />
              </div>
            )}
            <div className="flex items-baseline justify-between pt-1 text-lg font-extrabold">
              <span>{t('Total')}</span>
              <Money value={totals.total} className="text-brand-600" />
            </div>
            {isCredit && remaining > 0 && (
              <div className="flex justify-between font-semibold text-amber-600">
                <span>{t('Reste à payer')}</span>
                <Money value={remaining} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => submit(true)} disabled={!cart.length} className="btn-ghost px-2">
              <IconDoc className="h-4 w-4" />
              {t('Devis')}
            </button>
            <button onClick={hold} disabled={!cart.length} className="btn-ghost px-2" title={t('Mettre ce panier de côté et servir le client suivant')}>
              {t('Attente')}
            </button>
            <button onClick={() => submit(false)} disabled={!cart.length} className="btn-primary px-2">
              <IconCheck className="h-4 w-4" />
              {t('Valider')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
