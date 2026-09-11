import { useMemo, useRef, useState } from 'react';
import { today, useStore } from '../lib/store';
import { EXPENSE_KEYS } from '../lib/chart';
import type { AccountKey } from '../lib/chart';
import { EXPENSE_LABEL } from '../lib/expenses';
import { toMinor } from '../lib/money';
import { guessCategory, parseStatement } from '../lib/statement';
import { OPENING_FIELDS, balanceToLines, buildOpeningEntry, parseBalanceFile } from '../lib/opening';
import type { BalanceRow } from '../lib/opening';
import { formatMoney } from '../lib/money';
import type { Direction, StatementRow } from '../lib/statement';
import type { PaymentMethod, SaleLine } from '../lib/types';
import { Empty, Money, PageHeader, Table } from '../components/UI';
import AssistantChat from '../components/AssistantChat';
import ProjectSelect from '../components/ProjectSelect';
import { IconCamera, IconPlus, IconSparkle, IconTrash } from '../components/Icons';
import { t } from '../lib/i18n';

type Tab = 'days' | 'statement' | 'photo' | 'opening';

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'MOBILE', label: 'Mobile money' },
  { value: 'CARD', label: 'Carte' },
  { value: 'BANK', label: 'Virement' },
];

interface Row {
  id: number;
  date: string;
  kind: 'SALE' | 'EXPENSE';
  productId: string;
  label: string;
  qty: string;
  amountRaw: string;
  method: PaymentMethod;
  category: AccountKey;
  projectId: string;
}

let rowSeq = 0;
function blankRow(date: string): Row {
  return { id: ++rowSeq, date, kind: 'SALE', productId: '', label: '', qty: '1', amountRaw: '', method: 'CASH', category: 'PURCHASES', projectId: '' };
}

/** Les jours ouvrés récents, du plus proche au plus lointain. */
function recentDays(count: number): string[] {
  const out: string[] = [];
  const base = new Date(`${today()}T12:00:00.000Z`);
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Rattrapage : tout ce qu'il faut pour saisir plusieurs journées d'un coup,
 * pour qui n'a pas ouvert l'application depuis une semaine.
 */
export default function CatchUp() {
  const { db, recordSale, addExpense, addManualEntry } = useStore();
  const [tab, setTab] = useState<Tab>('days');
  const products = useMemo(() => db.products.filter((p) => !p.archived), [db.products]);
  const hasProjects = db.projects.some((p) => p.status === 'ACTIVE');

  // ---- Onglet « jour par jour » ----
  const [rows, setRows] = useState<Row[]>(() => [blankRow(today()), blankRow(today()), blankRow(today())]);
  const [saved, setSaved] = useState('');

  function patch(id: number, change: Partial<Row>) {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...change } : r)));
  }

  function amountOf(row: Row): number {
    const product = products.find((p) => p.id === row.productId);
    if (row.kind === 'SALE' && product) return product.price * (Number(row.qty) || 0);
    return toMinor(row.amountRaw || 0, db.company.currency);
  }

  const ready = rows.filter((r) => amountOf(r) > 0 && (r.kind === 'EXPENSE' || r.productId || r.label.trim()));
  const totalSales = ready.filter((r) => r.kind === 'SALE').reduce((s, r) => s + amountOf(r), 0);
  const totalExpenses = ready.filter((r) => r.kind === 'EXPENSE').reduce((s, r) => s + amountOf(r), 0);

  function saveRows() {
    let n = 0;
    for (const row of ready) {
      const amount = amountOf(row);
      if (row.kind === 'SALE') {
        const product = products.find((p) => p.id === row.productId);
        const qty = Number(row.qty) || 1;
        const lines: SaleLine[] = product
          ? [{ productId: product.id, name: product.name, qty, unitPrice: product.price, unitCost: product.cost }]
          : [{ productId: '', name: row.label.trim() || t('Vente'), qty: 1, unitPrice: amount, unitCost: 0 }];
        recordSale({
          date: row.date,
          lines,
          discount: 0,
          method: row.method,
          customerId: null,
          customerName: '',
          paid: product ? product.price * qty : amount,
          projectId: row.projectId || null,
        });
      } else {
        addExpense({
          date: row.date,
          category: t(EXPENSE_LABEL[row.category]),
          accountKey: row.category,
          description: row.label.trim(),
          amount,
          method: row.method,
          projectId: row.projectId || null,
        });
      }
      n += 1;
    }
    setRows([blankRow(today()), blankRow(today()), blankRow(today())]);
    setSaved(t('{n} opération(s) enregistrée(s), à leur date.', { n }));
  }

  // ---- Onglet « relevé » ----
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<(StatementRow & { keep: boolean; category: AccountKey; method: PaymentMethod })[]>([]);
  const [statementSaved, setStatementSaved] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function readStatement(source: string) {
    const found = parseStatement(source, db.company.currency, today());
    setParsed(
      found.map((r) => ({
        ...r,
        keep: r.direction !== 'UNKNOWN',
        category: guessCategory(r.label) as AccountKey,
        method: 'MOBILE' as PaymentMethod,
      })),
    );
    setStatementSaved('');
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const content = await file.text();
    setText(content);
    readStatement(content);
  }

  function setLine(index: number, change: Partial<(typeof parsed)[number]>) {
    setParsed((list) => list.map((r, i) => (i === index ? { ...r, ...change } : r)));
  }

  function saveStatement() {
    let n = 0;
    for (const row of parsed) {
      if (!row.keep || row.direction === 'UNKNOWN') continue;
      if (row.direction === 'IN') {
        recordSale({
          date: row.date,
          lines: [{ productId: '', name: row.label || t('Encaissement'), qty: 1, unitPrice: row.amount, unitCost: 0 }],
          discount: 0,
          method: row.method,
          customerId: null,
          customerName: '',
          paid: row.amount,
        });
      } else {
        addExpense({
          date: row.date,
          category: t(EXPENSE_LABEL[row.category]),
          accountKey: row.category,
          description: row.label,
          amount: row.amount,
          method: row.method,
        });
      }
      n += 1;
    }
    setParsed([]);
    setText('');
    setStatementSaved(t('{n} ligne(s) enregistrée(s) depuis le relevé.', { n }));
  }

  const kept = parsed.filter((r) => r.keep && r.direction !== 'UNKNOWN').length;

  // ---- Onglet « reprise d'un bilan » ----
  const [openingDate, setOpeningDate] = useState(() => {
    const [mm, dd] = (db.company.fiscalYearStart || '01-01').split('-');
    const y = today().slice(0, 4);
    const candidate = `${y}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    return candidate <= today() ? candidate : `${Number(y) - 1}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  });
  const [openingRaw, setOpeningRaw] = useState<Record<string, string>>({});
  const [capitalRaw, setCapitalRaw] = useState('');
  const [balanceRows, setBalanceRows] = useState<BalanceRow[]>([]);
  const [openingDone, setOpeningDone] = useState('');
  const balanceRef = useRef<HTMLInputElement>(null);
  const alreadyOpened = db.entries.some((e) => e.ref === 'AN');

  const openingAmounts = Object.fromEntries(OPENING_FIELDS.map((f) => [f.key, toMinor(openingRaw[f.key] || 0, db.company.currency)]));
  const openingPreview = buildOpeningEntry(db.company, openingAmounts, capitalRaw.trim() ? toMinor(capitalRaw, db.company.currency) : undefined);

  function saveOpening() {
    if (openingPreview.lines.length === 0) return;
    addManualEntry({ date: openingDate, journal: 'OD', ref: 'AN', label: t('À-nouveaux — reprise du bilan au {date}', { date: openingDate }), lines: openingPreview.lines });
    setOpeningRaw({});
    setCapitalRaw('');
    setOpeningDone(t('Bilan d’ouverture enregistré au {date}. Le bilan et la balance repartent de ces soldes.', { date: openingDate }));
  }

  async function onBalanceFile(file: File | undefined) {
    if (!file) return;
    setBalanceRows(await parseBalanceFile(file, db.company.currency, db.company.chart));
    setOpeningDone('');
  }

  function saveBalance() {
    const { lines } = balanceToLines(db.company, balanceRows);
    if (lines.length === 0) return;
    addManualEntry({ date: openingDate, journal: 'OD', ref: 'AN', label: t('À-nouveaux — balance importée au {date}', { date: openingDate }), lines });
    setBalanceRows([]);
    setOpeningDone(t('Balance reprise : {n} compte(s) repris au {date}.', { n: lines.length, date: openingDate }));
  }

  return (
    <>
      <PageHeader
        title={t('Rattrapage')}
        subtitle={t('Plusieurs jours d’un coup : à la main, depuis un relevé, ou en photographiant vos factures')}
      />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {([
          ['days', 'Jour par jour'],
          ['statement', 'Relevé mobile money ou banque'],
          ['photo', 'Photo d’une facture'],
          ['opening', 'Reprise d’un bilan existant'],
        ] as [Tab, string][]).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`shrink-0 rounded-pill border px-4 py-2 text-caption font-semibold transition ${
              tab === value ? 'border-teal bg-teal text-white' : 'border-hairline bg-white text-ink hover:border-teal'
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {tab === 'days' && (
        <div className="card p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
            <div>
              <h2 className="text-section">{t('Ce que vous avez vendu et dépensé')}</h2>
              <p className="text-caption text-muted">{t('Une ligne par opération. Choisissez la date de chaque ligne : rien n’est daté d’aujourd’hui par défaut.')}</p>
            </div>
            <div className="flex gap-2">
              {recentDays(4).map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setRows((list) => [...list, { ...blankRow(d) }])}
                  className="rounded-pill border border-hairline px-3 py-1.5 text-[12px] font-medium hover:border-teal hover:text-teal"
                >
                  {i === 0 ? t('Aujourd’hui') : i === 1 ? t('Hier') : d.slice(8) + '/' + d.slice(5, 7)}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table head={['Date', 'Type', 'Produit ou libellé', 'Qté', 'Montant', 'Paiement', hasProjects ? 'Projet' : '', '']}>
              {rows.map((row) => {
                const product = products.find((p) => p.id === row.productId);
                return (
                  <tr key={row.id} className="row">
                    <td className="td">
                      <input type="date" value={row.date} onChange={(e) => patch(row.id, { date: e.target.value })} className="field py-1.5 text-caption" />
                    </td>
                    <td className="td">
                      <select value={row.kind} onChange={(e) => patch(row.id, { kind: e.target.value as Row['kind'] })} className="field py-1.5 text-caption">
                        <option value="SALE">{t('Vente')}</option>
                        <option value="EXPENSE">{t('Dépense')}</option>
                      </select>
                    </td>
                    <td className="td min-w-[220px]">
                      {row.kind === 'SALE' ? (
                        <div className="space-y-1">
                          <select value={row.productId} onChange={(e) => patch(row.id, { productId: e.target.value })} className="field py-1.5 text-caption">
                            <option value="">{t('Vente sans détail (montant libre)')}</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          {!row.productId && (
                            <input value={row.label} onChange={(e) => patch(row.id, { label: e.target.value })} placeholder={t('Ex. Recette du samedi')} className="field py-1.5 text-caption" />
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <select value={row.category} onChange={(e) => patch(row.id, { category: e.target.value as AccountKey })} className="field py-1.5 text-caption">
                            {EXPENSE_KEYS.map((k) => (
                              <option key={k} value={k}>
                                {t(EXPENSE_LABEL[k])}
                              </option>
                            ))}
                          </select>
                          <input value={row.label} onChange={(e) => patch(row.id, { label: e.target.value })} placeholder={t('Ex. Facture ENEO')} className="field py-1.5 text-caption" />
                        </div>
                      )}
                    </td>
                    <td className="td w-[80px]">
                      {row.kind === 'SALE' && product ? (
                        <input type="number" min="1" value={row.qty} onChange={(e) => patch(row.id, { qty: e.target.value })} className="field num py-1.5 text-caption" />
                      ) : (
                        <span className="text-caption text-muted">—</span>
                      )}
                    </td>
                    <td className="td w-[140px]">
                      {row.kind === 'SALE' && product ? (
                        <Money value={amountOf(row)} />
                      ) : (
                        <input
                          inputMode="decimal"
                          value={row.amountRaw}
                          onChange={(e) => patch(row.id, { amountRaw: e.target.value })}
                          placeholder="0"
                          className="field num py-1.5 text-caption"
                        />
                      )}
                    </td>
                    <td className="td">
                      <select value={row.method} onChange={(e) => patch(row.id, { method: e.target.value as PaymentMethod })} className="field py-1.5 text-caption">
                        {METHODS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {t(m.label)}
                          </option>
                        ))}
                      </select>
                    </td>
                    {hasProjects && (
                      <td className="td">
                        <ProjectSelect compact value={row.projectId} onChange={(v) => patch(row.id, { projectId: v })} />
                      </td>
                    )}
                    <td className="td">
                      <button type="button" onClick={() => setRows((l) => l.filter((r) => r.id !== row.id))} aria-label={t('Supprimer la ligne')} className="text-muted hover:text-[#D14343]">
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-5 py-4">
            <button type="button" onClick={() => setRows((l) => [...l, blankRow(today())])} className="btn-ghost">
              <IconPlus className="h-4 w-4" />
              {t('Ajouter une ligne')}
            </button>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-caption text-muted">
                {t('Ventes')} <Money value={totalSales} /> · {t('Dépenses')} <Money value={totalExpenses} />
              </span>
              <button type="button" onClick={saveRows} disabled={ready.length === 0} className="btn-primary">
                {t('Enregistrer {n} opération(s)', { n: ready.length })}
              </button>
            </div>
          </div>
          {saved && <p className="px-5 pb-5 text-caption text-[#1F6F65]">{saved}</p>}
        </div>
      )}

      {tab === 'statement' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-section">{t('Collez votre relevé')}</h2>
            <p className="mt-1 text-caption text-muted">
              {t('Les messages de votre opérateur mobile money, un export de votre banque, ou une liste écrite à la main. Une ligne par opération.')}
            </p>
            <textarea
              id="statement-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={t('Ex. Vous avez reçu 25000 de MARIE NGO le 12/09/2026')}
              className="field mt-3 min-h-[120px] font-mono text-[12px]"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => readStatement(text)} disabled={text.trim().length < 4} className="btn-primary">
                <IconSparkle className="h-4 w-4" />
                {t('Lire le relevé')}
              </button>
              <input ref={fileRef} type="file" accept=".csv,.txt,.tsv,text/*" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost">
                {t('Importer un fichier (CSV, TXT)')}
              </button>
            </div>
            {statementSaved && <p className="mt-3 text-caption text-[#1F6F65]">{statementSaved}</p>}
          </div>

          {parsed.length > 0 && (
            <div className="card p-0">
              <div className="px-5 pb-3 pt-5">
                <h2 className="text-section">{t('{n} ligne(s) reconnue(s)', { n: parsed.length })}</h2>
                <p className="text-caption text-muted">{t('Vérifiez le sens de chaque ligne : l’argent est entré ou sorti. Décochez ce qui ne vous concerne pas.')}</p>
              </div>
              <div className="overflow-x-auto">
                <Table head={['', 'Date', 'Libellé', 'Montant', 'Sens', 'Poste de dépense']}>
                  {parsed.map((row, i) => (
                    <tr key={i} className="row">
                      <td className="td w-[40px]">
                        <input type="checkbox" checked={row.keep} onChange={(e) => setLine(i, { keep: e.target.checked })} className="h-4 w-4 accent-[#C25E38]" />
                      </td>
                      <td className="td">
                        <input type="date" value={row.date} onChange={(e) => setLine(i, { date: e.target.value })} className="field py-1.5 text-caption" />
                      </td>
                      <td className="td min-w-[200px]">
                        <input value={row.label} onChange={(e) => setLine(i, { label: e.target.value })} className="field py-1.5 text-caption" />
                      </td>
                      <td className="td num font-semibold">
                        <Money value={row.amount} />
                      </td>
                      <td className="td">
                        <select value={row.direction} onChange={(e) => setLine(i, { direction: e.target.value as Direction, keep: e.target.value !== 'UNKNOWN' })} className="field py-1.5 text-caption">
                          <option value="IN">{t('Argent entré')}</option>
                          <option value="OUT">{t('Argent sorti')}</option>
                          <option value="UNKNOWN">{t('À décider')}</option>
                        </select>
                      </td>
                      <td className="td">
                        {row.direction === 'OUT' ? (
                          <select value={row.category} onChange={(e) => setLine(i, { category: e.target.value as AccountKey })} className="field py-1.5 text-caption">
                            {EXPENSE_KEYS.map((k) => (
                              <option key={k} value={k}>
                                {t(EXPENSE_LABEL[k])}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-caption text-muted">{t('Recette')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-5 py-4">
                <span className="text-caption text-muted">{t('Les lignes cochées seront enregistrées à leur date.')}</span>
                <button type="button" onClick={saveStatement} disabled={kept === 0} className="btn-primary">
                  {t('Enregistrer {n} ligne(s)', { n: kept })}
                </button>
              </div>
            </div>
          )}

          {parsed.length === 0 && text.trim().length > 3 && statementSaved === '' && (
            <div className="card">
              <Empty
                title={t('Rien de reconnu pour l’instant')}
                hint={t('Appuyez sur « Lire le relevé ». Si rien ne sort, gardez une opération par ligne, avec sa date et son montant.')}
                icon={<IconSparkle className="h-10 w-10" />}
              />
            </div>
          )}
        </div>
      )}

      {tab === 'opening' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-section">{t('Votre entreprise existait déjà : partez de son dernier bilan')}</h2>
            <p className="mt-1 text-caption text-muted">
              {t('Pas besoin de ressaisir les années passées. Indiquez les soldes à la date d’ouverture — ce que vous possédez, ce que vous devez — et l’application écrit l’à-nouveau. Votre comptable peut ensuite tout vérifier dans le journal.')}
            </p>
            {alreadyOpened && (
              <p className="mt-3 rounded-input bg-[#FBF1DF] px-3 py-2 text-caption text-ink">
                {t('Un à-nouveau existe déjà dans cet espace. En ajouter un second cumule les soldes : extournez d’abord l’ancien dans le journal si c’est une correction.')}
              </p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr]">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">{t('Date d’ouverture')}</span>
                <input type="date" value={openingDate} onChange={(e) => setOpeningDate(e.target.value)} className="field" id="opening-date" />
                <span className="mt-1 block text-[11px] text-muted">{t('En général le premier jour de l’exercice en cours.')}</span>
              </label>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{t('Ce que vous possédez (actif)')}</div>
                <div className="space-y-2">
                  {OPENING_FIELDS.filter((f) => f.side === 'ASSET').map((f) => (
                    <label key={f.key} className="flex items-center gap-3">
                      <span className="min-w-0 flex-1 text-caption">
                        <span className="block font-medium text-ink">{t(f.label)}</span>
                        {f.hint && <span className="block text-[11px] text-muted">{t(f.hint)}</span>}
                      </span>
                      <input
                        inputMode="decimal"
                        value={openingRaw[f.key] ?? ''}
                        onChange={(e) => setOpeningRaw({ ...openingRaw, [f.key]: e.target.value })}
                        placeholder="0"
                        className="field num w-36 py-1.5 text-caption"
                        id={`opening-${f.key}`}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{t('Ce que vous devez (passif)')}</div>
                <div className="space-y-2">
                  {OPENING_FIELDS.filter((f) => f.side === 'LIABILITY').map((f) => (
                    <label key={f.key} className="flex items-center gap-3">
                      <span className="min-w-0 flex-1 text-caption">
                        <span className="block font-medium text-ink">{t(f.label)}</span>
                        {f.hint && <span className="block text-[11px] text-muted">{t(f.hint)}</span>}
                      </span>
                      <input
                        inputMode="decimal"
                        value={openingRaw[f.key] ?? ''}
                        onChange={(e) => setOpeningRaw({ ...openingRaw, [f.key]: e.target.value })}
                        placeholder="0"
                        className="field num w-36 py-1.5 text-caption"
                        id={`opening-${f.key}`}
                      />
                    </label>
                  ))}
                  <label className="flex items-center gap-3 border-t border-hairline pt-2">
                    <span className="min-w-0 flex-1 text-caption">
                      <span className="block font-medium text-ink">{t('Capital (facultatif)')}</span>
                      <span className="block text-[11px] text-muted">{t('Laissez vide : l’écart actif − dettes devient vos capitaux propres.')}</span>
                    </span>
                    <input inputMode="decimal" value={capitalRaw} onChange={(e) => setCapitalRaw(e.target.value)} placeholder="auto" className="field num w-36 py-1.5 text-caption" id="opening-capital" />
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-input bg-base px-4 py-3 text-caption">
              <span>
                {t('Actif')} <strong className="tabular-nums">{formatMoney(openingPreview.totalAssets, db.company.currency)}</strong> · {t('Dettes')}{' '}
                <strong className="tabular-nums">{formatMoney(openingPreview.totalLiabilities, db.company.currency)}</strong> · {t('Capitaux propres')}{' '}
                <strong className={`tabular-nums ${openingPreview.equity < 0 ? 'text-[#A63030]' : ''}`}>{formatMoney(openingPreview.equity, db.company.currency)}</strong>
              </span>
              <button type="button" onClick={saveOpening} disabled={openingPreview.lines.length === 0} className="btn-primary">
                {t('Enregistrer le bilan d’ouverture')}
              </button>
            </div>
            {openingDone && <p className="mt-3 text-caption text-[#1F6F65]">{openingDone}</p>}
          </div>

          <div className="card">
            <h2 className="text-section">{t('Ou importez la balance de votre ancien logiciel')}</h2>
            <p className="mt-1 text-caption text-muted">
              {t('Un fichier Excel ou CSV avec le numéro de compte, le libellé et les colonnes débit / crédit (ou un solde signé). Les comptes sont rattachés automatiquement au plan ; vous corrigez avant d’enregistrer.')}
            </p>
            <input ref={balanceRef} type="file" accept=".xlsx,.xls,.csv,.txt" className="hidden" onChange={(e) => void onBalanceFile(e.target.files?.[0])} />
            <button type="button" onClick={() => balanceRef.current?.click()} className="btn-ghost mt-3">
              {t('Choisir le fichier de balance')}
            </button>
            {balanceRows.length > 0 && (
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <Table head={['Compte', 'Libellé', 'Débit', 'Crédit', 'Rattaché à']}>
                    {balanceRows.map((r, i) => (
                      <tr key={i} className={`row ${r.key ? '' : 'opacity-60'}`}>
                        <td className="td font-mono text-caption">{r.code}</td>
                        <td className="td text-caption">{r.label}</td>
                        <td className="td num text-caption">{r.debit ? formatMoney(r.debit, db.company.currency) : ''}</td>
                        <td className="td num text-caption">{r.credit ? formatMoney(r.credit, db.company.currency) : ''}</td>
                        <td className="td">
                          <select
                            value={r.key}
                            onChange={(e) => setBalanceRows(balanceRows.map((x, j) => (j === i ? { ...x, key: e.target.value as BalanceRow['key'] } : x)))}
                            className="field py-1 text-caption"
                          >
                            <option value="">{t('— Ignorer —')}</option>
                            {(['CAPITAL', 'RESULT', 'EQUIPMENT', 'INVENTORY', 'CUSTOMERS', 'SUPPLIERS', 'VAT_COLLECTED', 'VAT_DEDUCTIBLE', 'BANK', 'MOBILE_MONEY', 'CASH', 'MISC_EXPENSE', 'MISC_REVENUE'] as const).map((k) => (
                              <option key={k} value={k}>
                                {k}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </Table>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-caption text-muted">
                    {t('{n} ligne(s), {skipped} ignorée(s)', { n: balanceRows.length, skipped: balanceRows.filter((r) => !r.key).length })}
                  </span>
                  <button type="button" onClick={saveBalance} className="btn-primary">
                    {t('Reprendre cette balance')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'photo' && (
        <div className="card flex h-[620px] flex-col p-0">
          <div className="border-b border-hairline px-5 py-4">
            <h2 className="flex items-center gap-2 text-section">
              <IconCamera className="h-5 w-5 text-teal" />
              {t('Photographiez la facture ou le reçu')}
            </h2>
            <p className="mt-1 text-caption text-muted">
              {t('Appuyez sur l’appareil photo, prenez le document : l’assistant lit le montant, la date et le fournisseur, et vous propose la dépense à valider.')}
            </p>
          </div>
          <div className="min-h-0 flex-1 px-5 py-4">
            <AssistantChat />
          </div>
        </div>
      )}
    </>
  );
}
