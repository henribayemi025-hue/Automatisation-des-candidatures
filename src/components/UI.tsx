import type { ReactNode } from 'react';
import { useDB } from '../lib/store';
import { formatMoney } from '../lib/money';
import type { Minor } from '../lib/types';
import { IconX } from './Icons';

export function Money({ value, className }: { value: Minor; className?: string }) {
  const { company } = useDB();
  return <span className={`num ${className ?? ''}`}>{formatMoney(value, company.currency)}</span>;
}

export function useMoney() {
  const { company } = useDB();
  return (value: Minor) => formatMoney(value, company.currency);
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: 'default' | 'positive' | 'negative' | 'dark';
}) {
  const toneClass =
    tone === 'dark'
      ? 'bg-ink-900 text-white border-ink-900 dark:bg-white dark:text-ink-900 dark:border-white'
      : 'card';
  const valueClass =
    tone === 'positive'
      ? 'text-teal-600 dark:text-teal-400'
      : tone === 'negative'
        ? 'text-rose-600 dark:text-rose-400'
        : '';
  return (
    <div className={`${toneClass} flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${
            tone === 'dark' ? 'text-white/60 dark:text-ink-900/60' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {label}
        </span>
        {icon && (
          <span
            className={`rounded-xl p-2 ${
              tone === 'dark' ? 'bg-white/10 dark:bg-ink-900/10' : 'bg-slate-100 dark:bg-white/5'
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className={`text-2xl font-extrabold tracking-tight num ${valueClass}`}>{value}</div>
      {hint && (
        <div
          className={`text-xs ${
            tone === 'dark' ? 'text-white/60 dark:text-ink-900/60' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export function Empty({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-slate-300 dark:text-slate-600">{icon}</div>}
      <p className="font-semibold text-slate-600 dark:text-slate-300">{title}</p>
      {hint && <p className="max-w-sm text-sm text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl scrollbar-thin dark:bg-ink-900 sm:rounded-3xl ${
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
        }`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
            <IconX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'info';
}) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
    success: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
    warn: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  };
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="bg-slate-50/80 dark:bg-white/5">
            {head.map((h) => (
              <th key={h} className="th">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function DateRange({
  from,
  to,
  onFrom,
  onTo,
  onApply,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onApply?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label="Du">
        <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className="field" />
      </Field>
      <Field label="Au">
        <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className="field" />
      </Field>
      {onApply && (
        <button onClick={onApply} className="btn-primary">
          Mettre à jour
        </button>
      )}
    </div>
  );
}
