import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { formatMoney, toMajor, toMinor } from '../lib/money';
import { needsCost, suggestedCost } from '../lib/liaison';
import { saleRevenue } from '../lib/metrics';
import { Badge, Empty, Modal, Money, PageHeader, StatCard, Table } from '../components/UI';
import { IconReceipt } from '../components/Icons';
import type { Sale } from '../lib/types';
import { t } from '../lib/i18n';
import { monthStart } from '../lib/metrics';
import { localISO } from '../lib/dates';

// 276 ventes sur une seule page dans la démonstration (audit jour 10) : la
// liste s'ouvre sur le mois en cours, 50 lignes, puis « Voir plus ».
const PAGE = 50;

function previousMonth(): { from: string; to: string } {
  const d = new Date();
  return { from: localISO(new Date(d.getFullYear(), d.getMonth() - 1, 1)), to: localISO(new Date(d.getFullYear(), d.getMonth(), 0)) };
}

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Espèces',
  MOBILE: 'Mobile money',
  CARD: 'Carte',
  BANK: 'Virement',
  CREDIT: 'Crédit',
};

export default function Sales() {
  const { db, completeSaleCost } = useStore();
  const [status, setStatus] = useState('');
  const [from, setFromRaw] = useState(monthStart());
  const [to, setToRaw] = useState('');
  const [shown, setShown] = useState(PAGE);
  const setFrom = (v: string) => { setFromRaw(v); setShown(PAGE); };
  const setTo = (v: string) => { setToRaw(v); setShown(PAGE); };
  const last = previousMonth();
  const preset = !to && from === monthStart() ? 'month' : from === last.from && to === last.to ? 'last' : !from && !to ? 'all' : '';
  const [detail, setDetail] = useState<Sale | null>(null);
  const [q, setQ] = useState('');
  const [costRaw, setCostRaw] = useState<Record<number, string>>({});

  // L'accueil et la clôture envoient ici « compléter le coût » des ventes
  // venues de la place de marché. Elles restent visibles quelle que soit la
  // période affichée : une vente du mois dernier ne doit pas disparaître.
  const toCost = useMemo(() => db.sales.filter((s) => s.status === 'CONFIRMED' && needsCost(s)), [db.sales]);

  const sales = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const digits = needle.replace(/[^\d]/g, '');
    const list = db.sales.filter((s) => {
      if (s.status === 'QUOTE') return false;
      if (status && s.status !== status) return false;
      if (from && s.date < from) return false;
      if (to && s.date > to) return false;
      if (!needle) return true;
      // Un ticket se retrouve par son numéro, le client, le caissier, un article, ou un montant exact.
      if (s.number.toLowerCase().includes(needle)) return true;
      if (s.customerName.toLowerCase().includes(needle) || s.cashier.toLowerCase().includes(needle)) return true;
      if (s.lines.some((l) => l.name.toLowerCase().includes(needle))) return true;
      if (digits && (String(s.total).includes(digits) || String(s.paid).includes(digits))) return true;
      return false;
    });
    // Les plus récentes d'abord, même pour une vente rattrapée ou arrivée de la
    // place de marché avec une date passée.
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [db.sales, status, from, to, q]);

  // Les totaux comparent ce qui a été facturé (taxe comprise) à ce qui est
  // rentré. Avant le 01/10, « Chiffre d'affaires » était hors taxe et
  // « Encaissé » taxe comprise : l'encaissé dépassait les ventes, ce qui n'a
  // aucun sens pour une commerçante (audit jour 3). Les ventes annulées ne
  // comptent pas.
  const counted = sales.filter((x) => x.status !== 'CANCELLED');
  const billed = counted.reduce((s, x) => s + x.total, 0);
  const revenue = counted.reduce((s, x) => s + saleRevenue(x), 0);
  const collected = counted.reduce((s, x) => s + x.paid, 0);
  const hasTax = billed !== revenue;

  return (
    <>
      <PageHeader title={t('Historique des ventes')} subtitle={t('Toutes les factures émises')} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('Ventes sur la période')} value={sales.length} />
        <StatCard
          label={t('Total facturé')}
          value={<Money value={billed} />}
          hint={hasTax ? t('dont {amount} hors taxe', { amount: formatMoney(revenue, db.company.currency) }) : undefined}
          tone="dark"
        />
        <StatCard
          label={t('Encaissé')}
          value={<Money value={collected} />}
          hint={billed > collected ? t('Reste à encaisser : {amount}', { amount: formatMoney(billed - collected, db.company.currency) }) : t('Tout est encaissé')}
          tone="positive"
        />
      </div>

      {toCost.length > 0 && (
        <div className="card mt-6 border-amber-200 bg-amber-50/60">
          <p className="text-caption font-semibold text-ink">
            {t('{n} vente(s) venue(s) de Finjaro attendent leur coût d’achat.', { n: toCost.length })}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {toCost.slice(0, 6).map((s) => (
              <button key={s.id} onClick={() => setDetail(s)} className="btn-ghost text-caption">
                {s.number} · {s.date}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-6 mb-4 flex flex-wrap items-end gap-3">
        <div className="flex w-full flex-wrap gap-2" role="group" aria-label={t('Période')}>
          {(
            [
              ['month', 'Ce mois-ci', () => { setFrom(monthStart()); setTo(''); }],
              ['last', 'Mois dernier', () => { setFrom(last.from); setTo(last.to); }],
              ['all', 'Tout', () => { setFrom(''); setTo(''); }],
            ] as [string, string, () => void][]
          ).map(([key, lab, go]) => (
            <button key={key} type="button" aria-pressed={preset === key} onClick={go} className={preset === key ? 'btn-dark' : 'btn-ghost'}>
              {t(lab)}
            </button>
          ))}
        </div>
        <input
          id="sales-search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setShown(PAGE); }}
          placeholder={t('Numéro, client, article, montant…')}
          className="field min-w-[220px] flex-1"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field w-auto">
          <option value="">{t('Tous les statuts')}</option>
          <option value="CONFIRMED">{t('Confirmées')}</option>
          <option value="CANCELLED">{t('Annulées')}</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field w-auto" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field w-auto" />
      </div>

      <div className="card p-0">
        {sales.length ? (
          <Table head={['Facture', 'Client', 'Caissier', 'Total', 'Paiement', 'Statut', 'Date', '']} phoneHide={[1, 3, 5, 7]}>
            {sales.slice(0, shown).map((s) => {
              const unpaid = s.total - s.paid;
              return (
                <tr key={s.id} className="row">
                  <td className="td font-semibold">{s.number}</td>
                  <td className="td">{s.customerName}</td>
                  <td className="td text-slate-500">{s.cashier}</td>
                  <td className="td num font-semibold">
                    <Money value={s.total} />
                  </td>
                  <td className="td">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500">{t(METHOD_LABEL[s.method])}</span>
                      {unpaid > 0 ? (
                        <Badge tone="warn">{t('Reste')} {<Money value={unpaid} />}</Badge>
                      ) : (
                        <Badge tone="success">{t('Payé')}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="td">
                    <Badge tone={s.status === 'CONFIRMED' ? 'success' : 'danger'}>
                      {s.status === 'CONFIRMED' ? t('Confirmée') : t('Annulé')}
                    </Badge>
                  </td>
                  <td className="td text-slate-500">{s.date}</td>
                  <td className="td text-right">
                    <button onClick={() => setDetail(s)} className="text-sm font-semibold text-brand-600">
                      {t('Détail')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty
            title={t('Aucune vente trouvée')}
            hint={from || to ? t('La recherche porte sur la période choisie.') : undefined}
            icon={<IconReceipt className="h-10 w-10" />}
          />
        )}
        {sales.length > shown && (
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-hairline px-4 py-3 text-caption text-muted">
            {t('{n} ventes sur {total}', { n: shown, total: sales.length })}
            <button onClick={() => setShown((n) => n + PAGE * 2)} className="btn-ghost">
              {t('Voir plus')}
            </button>
          </div>
        )}
        {!sales.length && (from || to) && (
          <div className="flex justify-center pb-5">
            <button onClick={() => { setFrom(''); setTo(''); }} className="btn-ghost">
              {t('Chercher sur toute la période')}
            </button>
          </div>
        )}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Facture ${detail?.number ?? ''}`} wide>
        {detail && (
          <>
            <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-slate-500">{t('Client :')} </span>
                <span className="font-semibold">{detail.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500">{t('Date :')} </span>
                <span className="font-semibold">{detail.date}</span>
              </div>
              <div>
                <span className="text-slate-500">{t('Caissier :')} </span>
                <span className="font-semibold">{detail.cashier}</span>
              </div>
              <div>
                <span className="text-slate-500">{t('Paiement :')} </span>
                <span className="font-semibold">{t(METHOD_LABEL[detail.method])}</span>
              </div>
            </div>

            <Table head={['Produit', 'Qté', 'PU', 'Total']}>
              {detail.lines.map((l) => (
                <tr key={l.productId} className="row">
                  <td className="td">{l.name}</td>
                  <td className="td num">{l.qty}</td>
                  <td className="td num">
                    <Money value={l.unitPrice} />
                  </td>
                  <td className="td num font-semibold">
                    <Money value={l.unitPrice * l.qty} />
                  </td>
                </tr>
              ))}
            </Table>

            <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm dark:border-white/10">
              {detail.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t('Remise')}</dt>
                  <dd>
                    − <Money value={detail.discount} />
                  </dd>
                </div>
              )}
              {detail.vat > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t('TVA')}</dt>
                  <dd>
                    <Money value={detail.vat} />
                  </dd>
                </div>
              )}
              <div className="flex justify-between text-lg font-extrabold">
                <dt>{t('Total')}</dt>
                <dd>
                  <Money value={detail.total} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">{t('Payé')}</dt>
                <dd>
                  <Money value={detail.paid} />
                </dd>
              </div>
            </dl>

            {needsCost(detail) && (
              <div className="mt-5 rounded-input border border-[#D14343]/40 bg-[#FDEDED] p-3">
                <h3 className="text-sm font-bold text-[#A63030]">{t('Vente venue de Finjaro : coût d’achat inconnu')}</h3>
                <p className="mt-1 text-caption text-ink">
                  {t('La place de marché ne connaît pas ce que vous ont coûté ces articles. Sans le coût, votre résultat est surestimé de {amount}. Indiquez le coût d’achat de chaque ligne, ou dites que c’est une prestation.', { amount: formatMoney(detail.total - detail.vat, db.company.currency) })}
                </p>
                <div className="mt-3 grid gap-2">
                  {detail.lines.map((l, i) => (
                    <label key={i} className="flex items-center justify-between gap-3 text-caption">
                      <span className="min-w-0 truncate">{l.qty} × {l.name}</span>
                      <input
                        value={costRaw[i] ?? ''}
                        onChange={(e) => setCostRaw({ ...costRaw, [i]: e.target.value })}
                        inputMode="decimal"
                        placeholder={String(toMajor(suggestedCost(db, l.name), db.company.currency) || '')}
                        className="field num w-32"
                        aria-label={t('Coût unitaire de {name}', { name: l.name })}
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const costs = detail.lines.map((l, i) => toMinor(costRaw[i] || toMajor(suggestedCost(db, l.name), db.company.currency) || 0, db.company.currency));
                      completeSaleCost(detail.id, costs);
                      setCostRaw({});
                      setDetail(null);
                    }}
                    className="btn-primary py-1.5 text-caption"
                  >
                    {t('Enregistrer le coût')}
                  </button>
                  <button onClick={() => { completeSaleCost(detail.id, 'SERVICE'); setDetail(null); }} className="btn-ghost py-1.5 text-caption">
                    {t('C’est une prestation, pas de coût')}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5">
              <h3 className="mb-2 text-sm font-bold">{t('Écritures comptables générées')}</h3>
              <ul className="space-y-1 text-xs text-slate-500">
                {db.entries
                  .filter((e) => e.sourceId === detail.id)
                  .map((e) => (
                    <li key={e.id} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/5">
                      <span className="font-semibold">{e.ref}</span> — {e.label} {t('(journal')} {e.journal})
                    </li>
                  ))}
              </ul>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
