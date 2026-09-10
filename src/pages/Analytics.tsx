import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDB } from '../lib/store';
import { dailySeries, monthStart, productPerformance, saleRevenue } from '../lib/metrics';
import { incomeStatement } from '../lib/ledger';
import { accountCode } from '../lib/chart';
import { factor, formatNumber, formatPercent } from '../lib/money';
import { Empty, Field, Money, PageHeader, StatCard, Table } from '../components/UI';
import { IconChart } from '../components/Icons';

const PALETTE = ['#C25E38', '#0ea5e9', '#8b5cf6', '#f59e0b', '#D14343', '#14b8a6'];

export default function Analytics() {
  const db = useDB();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const divisor = factor(db.company.currency);

  const sales = useMemo(
    () => db.sales.filter((s) => s.status === 'CONFIRMED' && s.date >= from && s.date <= to),
    [db.sales, from, to],
  );

  const income = useMemo(
    () => incomeStatement(db.accounts, db.entries, from, to),
    [db.accounts, db.entries, from, to],
  );
  const cogsCode = accountCode(db.company.chart, 'INVENTORY_CHANGE');
  const cogs = income.expenses.find((e) => e.account.code === cogsCode)?.balance ?? 0;
  const revenue = sales.reduce((s, x) => s + saleRevenue(x), 0);
  const grossMargin = revenue - cogs;
  const marginRate = revenue > 0 ? (grossMargin / revenue) * 100 : 0;

  const perf = useMemo(() => productPerformance(db, from, to), [db, from, to]);
  const series = useMemo(() => dailySeries(db, 14, divisor), [db, divisor]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const sale of sales) {
      for (const line of sale.lines) {
        const product = db.products.find((p) => p.id === line.productId);
        const cat = product?.category || 'Sans catégorie';
        map.set(cat, (map.get(cat) ?? 0) + (line.unitPrice * line.qty) / divisor);
      }
    }
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [sales, db.products, divisor]);

  const bestDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sales) map.set(s.date, (map.get(s.date) ?? 0) + saleRevenue(s));
    return [...map.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [sales]);

  const byMethod = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sales) map.set(s.method, (map.get(s.method) ?? 0) + s.total);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [sales]);

  return (
    <>
      <PageHeader title="Analyse" subtitle="Performance commerciale et rentabilité" />

      <div className="card mb-4 flex flex-wrap items-end gap-3">
        <button onClick={() => { setFrom(new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10)); setTo(new Date().toISOString().slice(0, 10)); }} className="btn-ghost">
          7 jours
        </button>
        <button onClick={() => { setFrom(new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10)); setTo(new Date().toISOString().slice(0, 10)); }} className="btn-ghost">
          30 jours
        </button>
        <button onClick={() => { setFrom(monthStart()); setTo(new Date().toISOString().slice(0, 10)); }} className="btn-ghost">
          Ce mois
        </button>
        <Field label="Du">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
        </Field>
        <Field label="Au">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Chiffre d'affaires" value={<Money value={revenue} />} tone="dark" hint={`${sales.length} vente(s)`} />
        <StatCard label="Marge brute" value={<Money value={grossMargin} />} tone="positive" />
        <StatCard label="Charges" value={<Money value={income.totalExpenses} />} tone="negative" />
        <StatCard label="Résultat net" value={<Money value={income.netIncome} />} tone={income.netIncome >= 0 ? 'positive' : 'negative'} />
        <StatCard label="Taux de marge" value={formatPercent(marginRate)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-4 font-bold">Tendance des revenus (14 jours)</h2>
          {series.some((p) => p.revenue > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={64} />
                  <Tooltip formatter={(v: number) => formatNumber(v, 0)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenus" fill="#C25E38" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty title="Aucune vente sur la période" icon={<IconChart className="h-10 w-10" />} />
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 font-bold">Ventes par catégorie</h2>
          {byCategory.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={2}>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatNumber(v, 0)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">Aucune donnée</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Meilleur jour</h2>
          <p className="text-xl font-extrabold">{bestDay ? bestDay[0] : '—'}</p>
          {bestDay && <Money value={bestDay[1]} className="text-sm text-slate-500" />}
        </div>
        <div className="card">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Produit le plus vendu</h2>
          <p className="truncate text-xl font-extrabold">{perf[0]?.name ?? '—'}</p>
          {perf[0] && <p className="text-sm text-slate-500">{perf[0].qty} unité(s)</p>}
        </div>
        <div className="card">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Moyens de paiement</h2>
          {byMethod.length ? (
            <ul className="space-y-1 text-sm">
              {byMethod.map(([m, v]) => (
                <li key={m} className="flex justify-between">
                  <span className="text-slate-500">{m}</span>
                  <Money value={v} className="font-semibold" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Aucune donnée</p>
          )}
        </div>
      </div>

      <div className="card mt-6 p-0">
        <h2 className="px-5 pb-3 pt-5 font-bold">Marges par produit</h2>
        {perf.length ? (
          <Table head={['Produit', 'Quantité', 'CA', 'Coût', 'Marge', 'Taux']}>
            {perf.map((p) => (
              <tr key={p.productId} className="row">
                <td className="td font-medium">{p.name}</td>
                <td className="td num">{p.qty}</td>
                <td className="td num">
                  <Money value={p.revenue} />
                </td>
                <td className="td num text-slate-500">
                  <Money value={p.cost} />
                </td>
                <td className="td num font-semibold text-teal-600">
                  <Money value={p.margin} />
                </td>
                <td className="td num">{formatPercent(p.revenue > 0 ? (p.margin / p.revenue) * 100 : 0)}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty title="Aucune vente sur la période" />
        )}
      </div>
    </>
  );
}
