import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { today, useDB } from '../lib/store';
import { dailySeries, productPerformance, snapshot } from '../lib/metrics';
import { factor, formatMoney, formatNumber } from '../lib/money';
import { Empty, Money, PageHeader, StatCard } from '../components/UI';
import StartGuide from '../components/StartGuide';
import { IconAlert, IconBox, IconCamera, IconCard, IconChart, IconChevronRight, IconTrend, IconWallet } from '../components/Icons';
import { t } from '../lib/i18n';

export default function Dashboard() {
  const db = useDB();
  const s = useMemo(() => snapshot(db), [db]);
  const divisor = factor(db.company.currency);
  const series = useMemo(() => dailySeries(db, 30, divisor), [db, divisor]);
  const top = useMemo(() => productPerformance(db).slice(0, 5), [db]);
  const hasData = series.some((p) => p.revenue > 0 || p.expenses > 0);

  // Dernière saisie : au-delà de deux jours, on propose le rattrapage plutôt
  // que de laisser croire que l'activité s'est arrêtée.
  const daysSinceEntry = useMemo(() => {
    const dates = [...db.sales.map((x) => x.date), ...db.expenses.map((x) => x.date), ...db.purchases.map((x) => x.date)];
    if (dates.length === 0) return 0;
    const last = dates.reduce((a, b) => (a > b ? a : b));
    const diff = (Date.parse(`${today()}T00:00:00Z`) - Date.parse(`${last}T00:00:00Z`)) / 86400000;
    return Math.max(0, Math.round(diff));
  }, [db.sales, db.expenses, db.purchases]);

  return (
    <>
      <PageHeader
        title={t('Bonjour, {name}', { name: db.company.name })}
        subtitle={t('Où en est votre activité aujourd\'hui')}
      />

      {daysSinceEntry >= 3 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-brass/40 bg-[#FBF1DF] px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-input bg-white text-[#8C6A3D]">
            <IconCamera className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-body font-semibold text-ink">{t('{n} jours sans rien enregistrer', { n: daysSinceEntry })}</div>
            <p className="text-caption text-muted">{t('Rattrapez la semaine d’un coup : à la main, depuis votre relevé mobile money, ou en photographiant vos factures.')}</p>
          </div>
          <Link to="/rattrapage" className="btn-brass">
            {t('Rattraper maintenant')}
            <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <StartGuide />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('CA du jour')}
          value={<Money value={s.revenueToday} />}
          hint={t("{n} vente(s) aujourd'hui", { n: s.salesToday })}
          icon={<IconTrend className="h-[18px] w-[18px] text-teal-600" />}
        />
        <StatCard
          label={t('CA du mois')}
          value={<Money value={s.revenueMonth} />}
          hint={t('{n} vente(s) ce mois', { n: s.salesMonth })}
          icon={<IconChart className="h-[18px] w-[18px] text-sky-600" />}
        />
        <StatCard
          label={t('Résultat net')}
          value={<Money value={s.netIncome} />}
          tone={s.netIncome >= 0 ? 'positive' : 'negative'}
          hint={t('Produits − charges du mois')}
          icon={<IconCard className="h-[18px] w-[18px] text-violet-600" />}
        />
        <StatCard
          label={t('Trésorerie')}
          value={<Money value={s.cashOnHand} />}
          hint={t('Caisse + mobile + banque')}
          tone="dark"
          icon={<IconWallet className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('Créances clients')}
          value={<Money value={s.receivables} />}
          hint={t('À encaisser')}
          icon={<IconCard className="h-[18px] w-[18px] text-amber-600" />}
        />
        <StatCard
          label={t('Dettes fournisseurs')}
          value={<Money value={s.payables} />}
          hint={t('À régler')}
          icon={<IconCard className="h-[18px] w-[18px] text-rose-600" />}
        />
        <StatCard
          label={t('Valeur du stock')}
          value={<Money value={s.stockValue} />}
          hint={t('{out} rupture(s) · {low} stock bas', { out: s.outOfStock, low: s.lowStock })}
          icon={<IconBox className="h-[18px] w-[18px] text-slate-600" />}
        />
        <StatCard
          label={t('Dépenses du mois')}
          value={<Money value={s.expensesMonth} />}
          hint={t('Hors coût des marchandises')}
          icon={<IconWallet className="h-[18px] w-[18px] text-rose-600" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <IconChart className="h-[18px] w-[18px] text-brand-600" />
            {t('Revenus et dépenses (30 derniers jours)')}
          </h2>
          {hasData ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C25E38" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#C25E38" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D14343" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#D14343" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} width={64} />
                  <Tooltip
                    formatter={(v: number) => formatNumber(v, 0)}
                    labelClassName="text-xs"
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Revenus" stroke="#C25E38" strokeWidth={2} fill="url(#rev)" />
                  <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="#D14343" strokeWidth={2} fill="url(#exp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty
              title={t('Aucune donnée sur la période')}
              hint={t('Enregistrez une première vente au point de vente pour voir la courbe se remplir.')}
              icon={<IconChart className="h-10 w-10" />}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <h2 className="mb-3 font-bold">{t('Top produits')}</h2>
            {top.length ? (
              <ul className="space-y-3">
                {top.map((p, i) => (
                  <li key={p.productId} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold dark:bg-white/10">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                    <span className="text-sm font-semibold num">
                      {formatMoney(p.revenue, db.company.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">{t('Aucune vente encore')}</p>
            )}
          </div>

          {(s.outOfStock > 0 || s.lowStock > 0) && (
            <div className="card border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10">
              <h2 className="mb-2 flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <IconAlert className="h-[18px] w-[18px]" />
                {t('Alertes de stock')}
              </h2>
              <p className="text-sm text-amber-800 dark:text-amber-200/80">
                {s.outOfStock} {t('produit(s) en rupture,')} {s.lowStock} {t('sous le seuil de réappro.')}
              </p>
              <Link to="/stock" className="btn-ghost mt-3 w-full">
                {t('Voir le stock')}
              </Link>
            </div>
          )}

          <div className="card">
            <h2 className="mb-3 font-bold">{t('Raccourcis')}</h2>
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
              <Link to="/etats" className="btn-ghost">
                {t('États')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
