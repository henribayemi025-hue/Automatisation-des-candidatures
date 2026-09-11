import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Area, Bar, CartesianGrid, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { today, useDB } from '../lib/store';
import { dashboard, delta } from '../lib/kpi';
import type { Period } from '../lib/kpi';
import { productPerformance } from '../lib/metrics';
import { factor, formatMoney, formatNumber } from '../lib/money';
import { Money, PageHeader } from '../components/UI';
import StartGuide from '../components/StartGuide';
import Sparkline, { Ticker } from '../components/Sparkline';
import { IconAlert, IconCamera, IconChevronRight } from '../components/Icons';
import { locale, t } from '../lib/i18n';

const PERIODS: { value: Period; label: string; hint: string }[] = [
  { value: 'MTD', label: 'MTD', hint: 'Depuis le 1er du mois' },
  { value: 'YTD', label: 'YTD', hint: 'Depuis le début de l’exercice' },
  { value: '30D', label: '30 j', hint: 'Trente derniers jours' },
];

const PERIOD_KEY = 'finia.dashboard.period';

function DeltaChip({ value, label, absolute }: { value: number | null; label: string; absolute?: string }) {
  // Une base nulle ou minuscule rend le pourcentage trompeur : on montre alors la variation en montant.
  const usePercent = value !== null && Math.abs(value) <= 5;
  if (!usePercent && !absolute) return <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>;
  const good = usePercent ? (value as number) >= 0 : !absolute?.startsWith('−');
  const text = usePercent ? `${(value as number) >= 0 ? '+' : '−'}${Math.abs((value as number) * 100).toFixed(1).replace('.', ',')} %` : absolute;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${good ? 'bg-[#E4F3EE] text-[#1F6F65]' : 'bg-[#FDEDED] text-[#A63030]'}`}>
      {text} <span className="font-medium opacity-80">{label}</span>
    </span>
  );
}

/** Carte d'indicateur : libellé, comparaison, valeur, pied avec courbe. Toute la carte mène au détail. */
function KpiCard({
  label,
  code,
  value,
  chip,
  foot,
  spark,
  sparkColor,
  to,
  tone,
}: {
  label: string;
  code?: string;
  value: React.ReactNode;
  chip?: React.ReactNode;
  foot: React.ReactNode;
  spark?: number[];
  sparkColor?: string;
  to: string;
  tone?: 'positive' | 'negative';
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="group flex min-w-0 flex-col justify-between rounded-[10px] border border-hairline bg-white px-4 py-3 text-left transition hover:border-teal/60 hover:shadow-[0_8px_24px_rgba(23,27,38,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
    >
      <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {code && <span className="mr-1.5 font-mono text-[10px] text-[#8C6A3D]">{code}</span>}
        {label}
      </span>
      <div className="mt-1.5 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
        <span className={`whitespace-nowrap font-display text-[22px] font-bold leading-none tracking-tight tabular-nums ${tone === 'positive' ? 'text-[#1F6F65]' : tone === 'negative' ? 'text-[#A63030]' : 'text-ink'}`}>
          {value}
        </span>
        {chip}
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-2 border-t border-hairline pt-2">
        <span className="min-w-0 text-[11px] leading-snug text-muted">{foot}</span>
        {spark && spark.length > 1 ? (
          <Sparkline data={spark} color={sparkColor ?? '#C25E38'} />
        ) : (
          <IconChevronRight className="h-3.5 w-3.5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-teal" />
        )}
      </div>
    </button>
  );
}

export default function Dashboard() {
  const db = useDB();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>(() => {
    try {
      const saved = localStorage.getItem(PERIOD_KEY);
      return saved === 'YTD' || saved === '30D' ? saved : 'MTD';
    } catch {
      return 'MTD';
    }
  });
  const currency = db.company.currency;
  const divisor = factor(currency);
  const todayISO = today();
  const k = useMemo(() => dashboard(db, period, todayISO, divisor), [db, period, todayISO, divisor]);
  const top = useMemo(() => productPerformance(db, k.series.dates[0], todayISO).slice(0, 6), [db, k.series.dates, todayISO]);
  const topMax = top[0]?.revenue ?? 1;
  const hasData = k.series.revenue.some((v) => v > 0) || k.series.expenses.some((v) => v > 0);
  const expert = db.company.mode === 'EXPERT';

  const chartData = k.series.dates.map((d, i) => ({
    date: d,
    label: new Date(`${d}T12:00:00.000Z`).toLocaleDateString(locale(), { day: '2-digit', month: '2-digit' }),
    recettes: k.series.revenue[i],
    depenses: k.series.expenses[i],
    tresorerie: k.series.cash[i],
  }));

  // Dernière saisie : au-delà de deux jours, on propose le rattrapage.
  const daysSinceEntry = useMemo(() => {
    const dates = [...db.sales.map((x) => x.date), ...db.expenses.map((x) => x.date), ...db.purchases.map((x) => x.date)];
    if (dates.length === 0) return 0;
    const last = dates.reduce((a, b) => (a > b ? a : b));
    return Math.max(0, Math.round((Date.parse(`${todayISO}T00:00:00Z`) - Date.parse(`${last}T00:00:00Z`)) / 86400000));
  }, [db.sales, db.expenses, db.purchases, todayISO]);

  const choosePeriod = (p: Period) => {
    setPeriod(p);
    try {
      localStorage.setItem(PERIOD_KEY, p);
    } catch {
      // stockage indisponible : le choix vaut pour la session
    }
  };

  const money = (v: number) => formatMoney(v, currency);
  const day = (d: string) => new Date(`${d}T12:00:00.000Z`).toLocaleDateString(locale(), { day: '2-digit', month: 'short' });
  const rangeLabel = `${day(k.series.dates[0])} → ${day(todayISO)}`;

  return (
    <>
      <PageHeader
        title={t('Bonjour, {name}', { name: db.company.name })}
        subtitle={t('Où en est votre activité — {range}', { range: rangeLabel })}
        actions={
          <div className="inline-flex rounded-[8px] border border-hairline bg-white p-0.5" role="tablist" aria-label={t('Période')}>
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                role="tab"
                aria-selected={period === p.value}
                title={t(p.hint)}
                onClick={() => choosePeriod(p.value)}
                className={`rounded-[6px] px-3 py-1.5 text-[12px] font-bold tabular-nums transition ${period === p.value ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {daysSinceEntry >= 3 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[10px] border border-brass/40 bg-[#FBF1DF] px-4 py-2.5">
          <IconCamera className="h-4 w-4 shrink-0 text-[#8C6A3D]" />
          <div className="min-w-0 flex-1 text-caption text-ink">
            <strong>{t('{n} jours sans rien enregistrer', { n: daysSinceEntry })}</strong> — {t('rattrapez la semaine d’un coup : à la main, depuis votre relevé mobile money, ou en photographiant vos factures.')}
          </div>
          <Link to="/rattrapage" className="btn-brass py-1.5 text-caption">
            {t('Rattraper maintenant')}
          </Link>
        </div>
      )}

      {/* Rangée d'indicateurs : dense, comparée, cliquable. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label={t('Chiffre d’affaires')}
          code={expert ? '70' : undefined}
          value={<Money value={k.current.revenue} />}
          chip={<DeltaChip value={delta(k.current.revenue, k.previous.revenue)} label={t(k.compareLabel)} absolute={`${k.current.revenue - k.previous.revenue >= 0 ? '+' : '−'}${money(Math.abs(k.current.revenue - k.previous.revenue))}`} />}
          foot={t('{n} vente(s) · panier {avg}', { n: k.current.sales, avg: money(k.current.averageTicket) })}
          spark={k.series.revenue}
          to="/ventes"
        />
        <KpiCard
          label={t('Marge brute')}
          code={expert ? 'SIG' : undefined}
          value={k.current.marginRate === null ? '—' : `${(k.current.marginRate * 100).toFixed(1).replace('.', ',')} %`}
          chip={<DeltaChip value={delta(k.current.grossMargin, k.previous.grossMargin)} label={t(k.compareLabel)} absolute={`${k.current.grossMargin - k.previous.grossMargin >= 0 ? '+' : '−'}${money(Math.abs(k.current.grossMargin - k.previous.grossMargin))}`} />}
          foot={t('{amount} après coût des marchandises', { amount: money(k.current.grossMargin) })}
          to="/analyse"
          tone={k.current.marginRate !== null && k.current.marginRate < 0 ? 'negative' : undefined}
        />
        <KpiCard
          label={t('Résultat')}
          code={expert ? '13' : undefined}
          value={<Money value={k.current.net} />}
          chip={<DeltaChip value={delta(k.current.net, k.previous.net)} label={t(k.compareLabel)} absolute={`${k.current.net - k.previous.net >= 0 ? '+' : '−'}${money(Math.abs(k.current.net - k.previous.net))}`} />}
          foot={t('Marge − charges {amount}', { amount: money(k.current.expenses) })}
          to="/etats"
          tone={k.current.net >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard
          label={t('Trésorerie')}
          code={expert ? '5' : undefined}
          value={<Money value={k.cashOnHand} />}
          chip={<DeltaChip value={delta(k.series.cash[k.series.cash.length - 1] ?? 0, k.series.cash[0] ?? 0)} label={t('sur la période')} absolute={`${(k.series.cash[k.series.cash.length - 1] ?? 0) - (k.series.cash[0] ?? 0) >= 0 ? '+' : '−'}${formatNumber(Math.abs((k.series.cash[k.series.cash.length - 1] ?? 0) - (k.series.cash[0] ?? 0)), 0)}`} />}
          foot={k.cashByAccount.map((c) => `${t(c.label)} ${formatNumber(c.value / divisor, 0)}`).join(' · ')}
          spark={k.series.cash}
          sparkColor="#1F6F65"
          to="/livre-caisse"
        />
        <KpiCard
          label={t('Créances clients')}
          code={expert ? '411' : undefined}
          value={<Money value={k.receivables} />}
          chip={
            k.receivablesOverdue > 0 ? (
              <span className="rounded-[4px] bg-[#FDEDED] px-1.5 py-0.5 text-[10px] font-bold text-[#A63030]">{t('{n} > 30 j', { n: k.receivablesOverdue })}</span>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t('{n} dossier(s)', { n: k.receivablesCount })}</span>
            )
          }
          foot={k.receivablesCount ? t('{n} client(s) à relancer', { n: k.receivablesCount }) : t('Rien à encaisser')}
          to="/dettes"
        />
        <KpiCard
          label={t('Dettes fournisseurs')}
          code={expert ? '401' : undefined}
          value={<Money value={k.payables} />}
          chip={<span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t('{n} facture(s)', { n: k.payablesCount })}</span>}
          foot={t('Stock {amount} · {out} rupture(s) · {low} bas', { amount: money(k.stockValue), out: k.outOfStock, low: k.lowStock })}
          to="/dettes"
        />
      </div>

      <StartGuide />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-section">{t('Recettes, dépenses et trésorerie')}</h2>
              <p className="text-caption text-muted">{t('Par jour, sur la période choisie. Cliquez un jour pour voir ses ventes.')}</p>
            </div>
            <div className="flex gap-4 text-caption tabular-nums">
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-[2px] bg-teal" />
                {t('Recettes')} <strong>{money(k.current.revenue)}</strong>
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-[2px] bg-[#A63030]" />
                {t('Dépenses')} <strong>{money(k.current.expenses)}</strong>
              </span>
            </div>
          </div>
          {hasData ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} onClick={(e) => e?.activeLabel && navigate('/ventes')}>
                  <defs>
                    <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1F6F65" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#1F6F65" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#E8DFD1" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B6660' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis yAxisId="flow" tick={{ fontSize: 11, fill: '#6B6660' }} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => formatNumber(v, 0)} />
                  <YAxis yAxisId="cash" orientation="right" tick={{ fontSize: 11, fill: '#1F6F65' }} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => formatNumber(v, 0)} />
                  <Tooltip
                    formatter={(v: number, name: string) => [formatNumber(v, 0), name]}
                    labelClassName="text-xs"
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E8DFD1', boxShadow: '0 8px 24px rgba(23,27,38,0.08)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="square" iconSize={8} />
                  <Area yAxisId="cash" type="monotone" dataKey="tresorerie" name={t('Trésorerie (fin de journée)')} stroke="#1F6F65" strokeWidth={1.5} fill="url(#cashFill)" />
                  <Bar yAxisId="flow" dataKey="recettes" name={t('Recettes')} fill="#C25E38" radius={[2, 2, 0, 0]} maxBarSize={18} />
                  <Bar yAxisId="flow" dataKey="depenses" name={t('Dépenses')} fill="#A63030" radius={[2, 2, 0, 0]} maxBarSize={18} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-caption text-muted">{t('Aucune opération sur la période. Enregistrez une vente ou une dépense pour voir la courbe.')}</p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-section">{t('Meilleures ventes')}</h2>
              <Link to="/analyse" className="text-caption font-semibold text-teal">
                {t('Tout voir')}
              </Link>
            </div>
            {top.length ? (
              <ul className="divide-y divide-hairline">
                {top.map((p, i) => (
                  <li key={p.productId || p.name} className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-4 shrink-0 text-[11px] font-bold tabular-nums text-muted">{i + 1}</span>
                      <Ticker text={p.name} className="min-w-0 flex-1 text-body font-medium text-ink" />
                      <span className="shrink-0 text-body font-semibold tabular-nums">{money(p.revenue)}</span>
                    </div>
                    <div className="ml-6 mt-1 flex items-center gap-2">
                      <span className="h-1 flex-1 rounded-full bg-base">
                        <span className="block h-1 rounded-full bg-teal" style={{ width: `${Math.max(4, (p.revenue / topMax) * 100)}%` }} />
                      </span>
                      <span className="w-28 shrink-0 text-right text-[11px] tabular-nums text-muted">
                        {p.qty} {t('vendu(s)')} · {p.revenue > 0 ? `${Math.round((p.margin / p.revenue) * 100)} %` : '—'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-caption text-muted">{t('Aucune vente sur la période')}</p>
            )}
          </div>

          {(k.outOfStock > 0 || k.lowStock > 0 || k.receivablesOverdue > 0 || k.openSession) && (
            <div className="card">
              <h2 className="mb-2 flex items-center gap-2 text-section">
                <IconAlert className="h-4 w-4 text-[#B8860B]" />
                {t('À traiter')}
              </h2>
              <ul className="space-y-1.5 text-caption">
                {k.outOfStock > 0 && (
                  <li>
                    <Link to="/stock" className="flex justify-between hover:text-teal">
                      <span>{t('{n} produit(s) en rupture', { n: k.outOfStock })}</span>
                      <IconChevronRight className="h-4 w-4" />
                    </Link>
                  </li>
                )}
                {k.lowStock > 0 && (
                  <li>
                    <Link to="/stock" className="flex justify-between hover:text-teal">
                      <span>{t('{n} produit(s) sous le seuil de réappro', { n: k.lowStock })}</span>
                      <IconChevronRight className="h-4 w-4" />
                    </Link>
                  </li>
                )}
                {k.receivablesOverdue > 0 && (
                  <li>
                    <Link to="/dettes" className="flex justify-between hover:text-teal">
                      <span>{t('{n} créance(s) de plus de 30 jours', { n: k.receivablesOverdue })}</span>
                      <IconChevronRight className="h-4 w-4" />
                    </Link>
                  </li>
                )}
                {k.openSession && (
                  <li>
                    <Link to="/caisse" className="flex justify-between hover:text-teal">
                      <span>{t('Caisse ouverte — à clôturer ce soir')}</span>
                      <IconChevronRight className="h-4 w-4" />
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Link to="/pos" className="btn-primary">
              {t('Vendre')}
            </Link>
            <Link to="/depenses" className="btn-ghost">
              {t('Dépense')}
            </Link>
            <Link to="/achats" className="btn-ghost">
              {t('Achat')}
            </Link>
            <Link to="/rattrapage" className="btn-ghost">
              {t('Rattrapage')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
