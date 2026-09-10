import type { ReactNode } from 'react';
import { useDB } from '../lib/store';
import { formatMoney } from '../lib/money';
import type { Minor } from '../lib/types';
import { IconX } from './Icons';
import { t } from '../lib/i18n';

export function Money({ value, className }: { value: Minor; className?: string }) {
  const { company } = useDB();
  return <span className={`num ${className ?? ''}`}>{formatMoney(value, company.currency)}</span>;
}

export function useMoney() {
  const { company } = useDB();
  return (value: Minor) => formatMoney(value, company.currency);
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[34px]" style={{ textWrap: 'balance' }}>
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-body text-muted">{subtitle}</p>}
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
      ? 'rounded-card border border-teal bg-gradient-to-br from-teal to-brand-700 p-5 text-white shadow-[0_12px_28px_rgba(194,94,56,0.28)]'
      : 'card';
  const valueClass = tone === 'positive' ? 'text-[#2A9D8F]' : tone === 'negative' ? 'text-[#D14343]' : '';
  return (
    <div className={`${toneClass} flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`text-[11px] font-semibold uppercase tracking-wide ${tone === 'dark' ? 'text-white/75' : 'text-muted'}`}>{label}</span>
        {icon && <span className={`rounded-input p-2 ${tone === 'dark' ? 'bg-white/15 text-white' : 'bg-base'}`}>{icon}</span>}
      </div>
      <div className={`font-display text-[26px] font-bold tracking-tight num ${valueClass}`}>{value}</div>
      {hint && <div className={`text-caption ${tone === 'dark' ? 'text-white/75' : 'text-muted'}`}>{hint}</div>}
    </div>
  );
}

export function Empty({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-hairline">{icon}</div>}
      <p className="text-body font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-sm text-caption text-muted">{hint}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-card bg-white p-5 shadow-2xl scrollbar-thin sm:rounded-card sm:p-6 ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-display text-[22px] font-bold text-ink">{title}</h2>
          <button onClick={onClose} aria-label={t('Fermer')} className="rounded-full p-1.5 text-muted hover:bg-base">
            <IconX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'info' }) {
  const tones = {
    neutral: 'bg-base text-muted',
    success: 'bg-[#EAF6EA] text-[#1F6F65]',
    warn: 'bg-[#FDF6E3] text-[#8C6A0B]',
    danger: 'bg-[#FDEDED] text-[#A63030]',
    info: 'bg-teal-light text-teal',
  };
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="bg-base/70">
            {head.map((h, i) => (
              <th key={`${h}-${i}`} className="th">
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

export function DateRange({ from, to, onFrom, onTo, onApply }: { from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void; onApply?: () => void }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label={t('Du')}>
        <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className="field" />
      </Field>
      <Field label={t('Au')}>
        <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className="field" />
      </Field>
      {onApply && (
        <button onClick={onApply} className="btn-primary">
          {t('Mettre à jour')}
        </button>
      )}
    </div>
  );
}
