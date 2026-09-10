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
import { useDB } from '../lib/store';
import { dailySeries, productPerformance, snapshot } from '../lib/metrics';
import { factor, formatMoney, formatNumber } from '../lib/money';
import { Empty, Money, PageHeader, StatCard } from '../components/UI';
import { IconAlert, IconBox, IconCard, IconChart, IconTrend, IconWallet } from '../components/Icons';

export default function Dashboard() {
  const db = useDB();
  const s = useMemo(() => snapshot(db), [db]);
  const divisor = factor(db.company.currency);
  const series = useMemo(() => dailySeries(db, 30, divisor), [db, divisor]);
  const top = useMemo(() => productPerformance(db).slice(0, 5), [db]);
  const hasData = series.some((p) => p.revenue > 0 || p.expenses > 0);

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle={`${db.company.name} — vue temps réel de l'activité`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="CA du jour"
          value={<Money value={s.revenueToday} />}
          hint={`${s.salesToday} vente(s) aujourd'hui`}
          icon={<IconTrend className="h-[18px] w-[18px] text-teal-600" />}
        />
        <StatCard
          label="CA du mois"
          value={<Money value={s.revenueMonth} />}
          hint={`${s.salesMonth} vente(s) ce mois`}
          icon={<IconChart className="h-[18px] w-[18px] text-sky-600" />}
        />
        <StatCard
          label="Résultat net"
          value={<Money value={s.netIncome} />}
          tone={s.netIncome >= 0 ? 'positive' : 'negative'}
          hint="Produits − charges du mois"
          icon={<IconCard className="h-[18px] w-[18px] text-violet-600" />}
        />
        <StatCard
          label="Trésorerie"
          value={<Money value={s.cashOnHand} />}
          hint="Caisse + mobile + banque"
          tone="dark"
          icon={<IconWallet className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Créances clients"
          value={<Money value={s.receivables} />}
          hint="À encaisser"
          icon={<IconCard className="h-[18px] w-[18px] text-amber-600" />}
        />
        <StatCard
          label="Dettes fournisseurs"
          value={<Money value={s.payables} />}
          hint="À régler"
          icon={<IconCard className="h-[18px] w-[18px] text-rose-600" />}
        />
        <StatCard
          label="Valeur du stock"
          value={<Money value={s.stockValue} />}
          hint={`${s.outOfStock} rupture(s) · ${s.lowStock} stock bas`}
          icon={<IconBox className="h-[18px] w-[18px] text-slate-600" />}
        />
        <StatCard
          label="Dépenses du mois"
          value={<Money value={s.expensesMonth} />}
          hint="Hors coût des marchandises"
          icon={<IconWallet className="h-[18px] w-[18px] text-rose-600" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <IconChart className="h-[18px] w-[18px] text-brand-600" />
            Revenus et dépenses (30 derniers jours)
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
              title="Aucune donnée sur la période"
              hint="Enregistrez une première vente au point de vente pour voir la courbe se remplir."
              icon={<IconChart className="h-10 w-10" />}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <h2 className="mb-3 font-bold">Top produits</h2>
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
              <p className="py-6 text-center text-sm text-slate-400">Aucune vente encore</p>
            )}
          </div>

          {(s.outOfStock > 0 || s.lowStock > 0) && (
            <div className="card border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10">
              <h2 className="mb-2 flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <IconAlert className="h-[18px] w-[18px]" />
                Alertes de stock
              </h2>
              <p className="text-sm text-amber-800 dark:text-amber-200/80">
                {s.outOfStock} produit(s) en rupture, {s.lowStock} sous le seuil de réappro.
              </p>
              <Link to="/stock" className="btn-ghost mt-3 w-full">
                Voir le stock
              </Link>
            </div>
          )}

          <div className="card">
            <h2 className="mb-3 font-bold">Raccourcis</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/pos" className="btn-primary">
                Vendre
              </Link>
              <Link to="/depenses" className="btn-ghost">
                Dépense
              </Link>
              <Link to="/achats" className="btn-ghost">
                Achat
              </Link>
              <Link to="/etats" className="btn-ghost">
                États
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
