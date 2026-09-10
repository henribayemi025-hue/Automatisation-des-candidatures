import { useMemo } from 'react';
import { useDB } from '../lib/store';
import { CLASS_LABELS } from '../lib/chart';
import { balanceOf } from '../lib/ledger';
import type { AccountClass } from '../lib/types';
import { Badge, Money, PageHeader, Table } from '../components/UI';
import { t } from '../lib/i18n';

const KIND_LABEL: Record<string, string> = {
  ASSET: 'Actif',
  LIABILITY: 'Passif',
  EQUITY: 'Capitaux propres',
  REVENUE: 'Produit',
  EXPENSE: 'Charge',
};

export default function ChartOfAccounts() {
  const db = useDB();

  const grouped = useMemo(() => {
    const map = new Map<AccountClass, typeof db.accounts>();
    for (const a of db.accounts) {
      const arr = map.get(a.class) ?? [];
      arr.push(a);
      map.set(a.class, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [db.accounts]);

  return (
    <>
      <PageHeader
        title={t('Plan comptable')}
        subtitle={t('Référentiel {chart} — {n} comptes', { chart: db.company.chart, n: db.accounts.length })}
      />

      <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
        {t('Le référentiel se change dans les paramètres. Les numéros de compte sont alors remappés sans toucher aux écritures existantes.')}
      </div>

      <div className="space-y-4">
        {grouped.map(([cls, accounts]) => (
          <div key={cls} className="card p-0">
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-sm font-extrabold dark:bg-white/10">
                {cls}
              </span>
              <h2 className="font-bold">{t(CLASS_LABELS[cls])}</h2>
              <Badge>{accounts.length} {t('comptes')}</Badge>
            </div>
            <Table head={['Numéro', 'Intitulé', 'Nature', 'Sens', 'Solde actuel']}>
              {accounts.map((a) => (
                <tr key={a.code} className="row">
                  <td className="td num font-semibold">{a.code}</td>
                  <td className="td">{t(a.label)}</td>
                  <td className="td text-slate-500">{t(KIND_LABEL[a.kind])}</td>
                  <td className="td">
                    <Badge tone={a.normal === 'DEBIT' ? 'info' : 'warn'}>
                      {a.normal === 'DEBIT' ? t('Débiteur') : t('Créditeur')}
                    </Badge>
                  </td>
                  <td className="td num font-semibold">
                    <Money value={balanceOf(a.code, db.entries, a.normal)} />
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        ))}
      </div>
    </>
  );
}
