import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { formatMoney, toMinor } from '../lib/money';
import type { PaymentMethod, Sale, SaleLine } from '../lib/types';
import Receipt from '../components/Receipt';
import { Badge, Empty, Field, Money, PageHeader } from '../components/UI';
import { IconBox, IconCart, IconCheck, IconDoc, IconSearch, IconX } from '../components/Icons';
import { scanFeedback, useBarcodeScanner } from '../lib/scanner';
import { t } from '../lib/i18n';
import { sectorProfile, tracksStock } from '../lib/sector';
import { availableQty, isComposed, missingFor } from '../lib/recipes';
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
  const { db, recordSale, saveCustomer } = useStore();
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<SaleLine[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [discountRaw, setDiscountRaw] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [paidRaw, setPaidRaw] = useState('');
  const [flash, setFlash] = useState('');
  // Le ticket affiché après « Valider » : la preuve que la vente est passée.
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [scanNote, setScanNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [held, setHeld] = useState<HeldTicket[]>(() => loadHeld());
  const [customerPanel, setCustomerPanel] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  // Les dix premières qui correspondent : au-delà, la liste cesse d'aider.
  const clientsTrouves = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    return db.customers
      .filter((c) => !c.archived)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 10);
  }, [db.customers, customerQuery]);
  // Vente rapide : un montant, rien d'autre. Voir le commentaire de addQuick.
  const [quickAmount, setQuickAmount] = useState('');
  const [quickLabel, setQuickLabel] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const currency = db.company.currency;
  // Un métier sans stock (salon, artisan) encaisse des prestations : rien à épuiser.
  const withStock = tracksStock(db.company);
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
    // Plancher de stock (ligne 3 du tableau docs/SIMULATION-DECISIONS.md) :
    // on ne vend pas en silence ce que l'appareil ne voit plus en rayon. La
    // caissière peut passer outre, en le sachant ; rien n'est refusé de force.
    if (withStock) {
      const inCart = cart.find((l) => l.productId === productId)?.qty ?? 0;
      // Un plat préparé n'a pas de stock à lui : ce qu'on peut encore servir
      // dépend de son ingrédient le plus rare.
      const dispo = availableQty(db, product);
      if (inCart + 1 > dispo) {
        const manque = missingFor(db, product, inCart + 1).map((m) => `${m.name} (−${m.manque})`).join(', ');
        const ok = window.confirm(
          isComposed(product)
            ? t('{name} : il manque {manque} pour en servir {qty}. Vendre quand même ? Le stock passera sous zéro.', { name: product.name, manque: manque || t('des ingrédients'), qty: inCart + 1 })
            : t('{name} : {stock} en stock d’après cet appareil, {qty} déjà dans le panier. Vendre quand même ? Le stock passera sous zéro.', { name: product.name, stock: product.stock, qty: inCart }),
        );
        if (!ok) return;
      }
    }
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

  /**
   * Vente rapide : un montant, et c'est encaissé.
   *
   * Compté le 18/09 dans le journal réel : sept espaces ouverts, AUCUNE vente
   * jamais enregistrée, et personne revenu un deuxième jour. Celui qui est allé
   * le plus loin avait créé un article et ouvert sa caisse — puis s'est arrêté.
   *
   * La raison tient au chemin qu'on imposait : pour encaisser 500 F de
   * beignets, il fallait d'abord créer une fiche article avec un nom, un prix
   * de vente, un prix d'achat et un stock. Personne ne fait ça debout derrière
   * un comptoir avec une cliente qui attend. Le cahier, lui, accepte « 500 »
   * tout de suite : c'est notre vrai concurrent.
   *
   * Ici la vente passe sans fiche article : ligne sans `productId`, donc aucun
   * mouvement de stock et aucun coût des marchandises — le moteur sait déjà
   * traiter ce cas, c'est ce qu'il fait pour une prestation. La comptabilité
   * reste juste : la recette est enregistrée, l'encaissement aussi. La marge de
   * cette ligne n'est pas connue, et c'est honnête : on ne l'invente pas.
   */
  function addQuick() {
    const amount = toMinor(quickAmount || 0, currency);
    if (amount <= 0) return;
    setCart((prev) => [
      ...prev,
      { productId: '', name: quickLabel.trim() || t('Vente'), qty: 1, unitPrice: amount, unitCost: 0 },
    ]);
    setQuickAmount('');
    setQuickLabel('');
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
      customerName: customer?.name ?? 'Vente au comptoir',
      paid: effectivePaid,
      asQuote,
      projectId: projectId || null,
    });
    reset();
    setReceipt(sale);
  }

  return (
    <>
      <Receipt sale={receipt} company={db.company} onClose={() => { setReceipt(null); searchRef.current?.focus(); }} />
      <PageHeader
        title={withStock ? t('Point de vente') : t(sectorProfile(db.company.sector).sell)}
        subtitle={
          withStock
            ? t('Scannez ou cherchez, validez : la vente, le stock et les écritures sont enregistrés d’un coup')
            : t('Choisissez la prestation, encaissez : la vente et les écritures sont enregistrées d’un coup')
        }
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

          {/* Vente rapide. Mise en avant tant qu'aucun article n'existe : c'est
              le seul chemin qui mène à une première vente sans passer par la
              création d'une fiche. Elle reste disponible ensuite, repliée. */}
          <div className={`mb-4 rounded-card border px-4 py-3 ${db.products.length === 0 ? 'border-teal bg-[#FBF1DF]' : 'border-hairline bg-white'}`}>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-display text-[17px] font-bold text-ink">{t('Vente rapide')}</h3>
              <span className="text-[11px] text-muted">{t('sans créer de fiche article')}</span>
            </div>
            {db.products.length === 0 && (
              <p className="mt-1 text-caption text-muted">
                {t('Tapez le montant encaissé, validez : la vente est enregistrée. Vous créerez vos articles plus tard, quand vous aurez le temps.')}
              </p>
            )}
            <form
              className="mt-3 flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addQuick();
              }}
            >
              <label className="min-w-[8rem] flex-1">
                <span className="mb-1 block text-caption font-semibold text-muted">{t('Montant')}</span>
                <input
                  id="pos-quick-amount"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                  className="field num text-right text-[20px] font-extrabold"
                  autoComplete="off"
                />
              </label>
              <label className="min-w-[8rem] flex-[2]">
                <span className="mb-1 block text-caption font-semibold text-muted">{t('C’était quoi ? (facultatif)')}</span>
                <input
                  id="pos-quick-label"
                  value={quickLabel}
                  onChange={(e) => setQuickLabel(e.target.value)}
                  placeholder={t('Beignets, coupe, réparation…')}
                  className="field"
                  autoComplete="off"
                />
              </label>
              <button type="submit" disabled={toMinor(quickAmount || 0, currency) <= 0} className="btn-primary">
                {t('Ajouter')}
              </button>
            </form>
          </div>

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
                  disabled={withStock && availableQty(db, p) <= 0}
                  className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:border-brand-400 hover:shadow-md disabled:opacity-40 dark:border-white/10"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="line-clamp-3 text-sm font-semibold leading-snug">{p.name}</span>
                    {/* Un salon ou un artisan ne compte pas de quantités : une
                        prestation n'est jamais « en rupture ». */}
                    {!withStock ? null : (() => {
                      // Pour un plat, le badge annonce ce qu'on peut encore
                      // servir, pas un stock qui vaudrait toujours zéro.
                      const dispo = availableQty(db, p);
                      if (dispo <= 0) return <Badge tone="danger">{t('Rupture')}</Badge>;
                      if (dispo <= p.reorderPoint) return <Badge tone="warn">{dispo}</Badge>;
                      return <Badge>{dispo}</Badge>;
                    })()}
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
              title={query ? 'Aucun produit ne correspond' : 'Pas encore d’articles'}
              hint={query ? undefined : 'Ce n’est pas bloquant : encaissez avec la vente rapide ci-dessus, et créez vos fiches quand vous aurez le temps.'}
              icon={<IconBox className="h-10 w-10" />}
            />
          )}
        </div>

        <div className="card flex h-fit flex-col gap-4 lg:sticky lg:top-24">
          <h2 className="flex items-center gap-2 font-bold">
            <IconCart className="h-[18px] w-[18px] text-brand-600" />
            {t('Panier')}
            {cart.length > 0 && <Badge tone="success">{cart.length}</Badge>}
            {cart.length > 0 && (
              <button type="button" onClick={reset} className="ml-auto text-caption font-semibold text-muted hover:text-[#A63030]">
                {t('Tout vider')}
              </button>
            )}
          </h2>

          {cart.length === 0 ? (
            <div className="rounded-input border border-dashed border-hairline px-4 py-6 text-center">
              <p className="text-caption font-semibold text-ink">{t('Panier vide')}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                {withStock
                  ? t('Scannez un code-barres, ou cliquez un article à gauche. Il apparaît ici avec les boutons − et + pour la quantité.')
                  : t('Cliquez une prestation à gauche. Elle apparaît ici avec les boutons − et + pour la quantité.')}
              </p>
            </div>
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
            {/*
              Chercher une cliente, ou la créer sans quitter la caisse.
              Relevé le 21/09 : on ne proposait qu'une liste déroulante, donc
              inutilisable passé trente clientes, et aucun moyen d'en créer une
              ici. Or c'est là que le besoin naît — au moment d'encaisser.
            */}
            {customerPanel || customerId || isCredit ? (
              <Field label={t('Client')} hint={t('Nécessaire pour une vente à crédit, un acompte, ou pour suivre les habitudes d’une cliente.')}>
                {customerId ? (
                  <div className="flex items-center justify-between rounded-input border border-hairline px-3 py-2">
                    <span className="font-semibold text-ink">{db.customers.find((c) => c.id === customerId)?.name}</span>
                    <button type="button" onClick={() => { setCustomerId(''); setCustomerQuery(''); }} className="text-caption font-semibold text-muted">
                      {t('Changer')}
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={customerQuery}
                      onChange={(e) => setCustomerQuery(e.target.value)}
                      placeholder={t('Chercher un nom ou un numéro, ou en saisir un nouveau')}
                      className="field"
                    />
                    <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                      {clientsTrouves.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCustomerId(c.id)}
                          className="flex w-full items-center justify-between rounded-input px-3 py-2 text-left text-sm hover:bg-base"
                        >
                          <span className="font-semibold text-ink">{c.name}</span>
                          {c.phone && <span className="text-caption text-muted">{c.phone}</span>}
                        </button>
                      ))}
                      {customerQuery.trim() && !clientsTrouves.some((c) => c.name.toLowerCase() === customerQuery.trim().toLowerCase()) && (
                        <button
                          type="button"
                          onClick={() => {
                            const cree = saveCustomer({ name: customerQuery.trim(), phone: '', email: '', address: '' });
                            setCustomerId(cree.id);
                            setCustomerQuery('');
                          }}
                          className="w-full rounded-input bg-base px-3 py-2 text-left text-sm font-semibold text-teal"
                        >
                          {t('Créer la fiche « {n} »', { n: customerQuery.trim() })}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </Field>
            ) : (
              <div className="flex items-center justify-between rounded-input bg-base px-3 py-2 text-caption">
                <span>
                  <span className="font-semibold text-ink">{t('Vente au comptoir')}</span>
                  <span className="text-muted"> — {t('aucune fiche à créer')}</span>
                </span>
                <button type="button" onClick={() => setCustomerPanel(true)} className="font-semibold text-teal">
                  {t('Identifier la cliente')}
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
              <span>{db.company.pricesIncludeTax !== false ? t('Total des articles') : t('Sous-total')}</span>
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
                <span>
                  {db.company.pricesIncludeTax !== false ? t('dont {tax}', { tax: db.company.taxLabel || t('TVA') }) : db.company.taxLabel || t('TVA')} ({(db.company.vatRateBp / 100).toFixed(2)} %)
                </span>
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
