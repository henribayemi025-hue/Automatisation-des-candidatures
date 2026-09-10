import { useState } from 'react';
import { useStore } from '../lib/store';
import { CURRENCIES } from '../lib/money';
import type { Company } from '../lib/types';
import { Field, PageHeader } from '../components/UI';

const CHARTS: { value: Company['chart']; label: string; hint: string }[] = [
  { value: 'SYSCOHADA', label: 'SYSCOHADA', hint: 'Référentiel de la zone OHADA (Afrique de l’Ouest et centrale)' },
  { value: 'PCG', label: 'PCG', hint: 'Plan comptable général français' },
  { value: 'GENERIC', label: 'Générique', hint: 'Numérotation neutre par nature de compte' },
];

export default function Settings() {
  const { db, setCompany, resetAll } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);

  const c = db.company;

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Configuration de l'entreprise et du référentiel comptable" />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-bold">Entreprise</h2>
          <div className="space-y-4">
            <Field label="Nom de l'entreprise">
              <input value={c.name} onChange={(e) => setCompany({ name: e.target.value })} className="field" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pays">
                <input value={c.country} onChange={(e) => setCompany({ country: e.target.value })} className="field" />
              </Field>
              <Field label="Ville">
                <input value={c.city} onChange={(e) => setCompany({ city: e.target.value })} className="field" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Secteur d'activité">
                <input value={c.sector} onChange={(e) => setCompany({ sector: e.target.value })} className="field" />
              </Field>
              <Field label="Téléphone">
                <input value={c.phone} onChange={(e) => setCompany({ phone: e.target.value })} className="field" />
              </Field>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 font-bold">Devise et fiscalité</h2>
          <div className="space-y-4">
            <Field
              label="Devise"
              hint="Tous les montants déjà saisis restent stockés tels quels : changez de devise avant de commencer à saisir."
            >
              <select
                value={c.currency}
                onChange={(e) => setCompany({ currency: e.target.value })}
                className="field"
              >
                {CURRENCIES.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.code} — {x.symbol}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Début d'exercice (MM-JJ)">
              <input
                value={c.fiscalYearStart}
                onChange={(e) => setCompany({ fiscalYearStart: e.target.value })}
                placeholder="01-01"
                className="field num"
              />
            </Field>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-white/10">
              <input
                type="checkbox"
                checked={c.vatEnabled}
                onChange={(e) => setCompany({ vatEnabled: e.target.checked })}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="text-sm font-medium">Appliquer la TVA sur les ventes et achats</span>
            </label>

            {c.vatEnabled && (
              <Field label="Taux de TVA (%)">
                <input
                  value={(c.vatRateBp / 100).toString()}
                  onChange={(e) =>
                    setCompany({ vatRateBp: Math.round((parseFloat(e.target.value.replace(',', '.')) || 0) * 100) })
                  }
                  inputMode="decimal"
                  className="field num"
                />
              </Field>
            )}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-1 font-bold">Référentiel comptable</h2>
          <p className="mb-4 text-sm text-slate-500">
            Détermine la numérotation des comptes. Le changement remappe le plan comptable sans
            modifier les écritures déjà passées.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {CHARTS.map((x) => (
              <button
                key={x.value}
                onClick={() => setCompany({ chart: x.value })}
                className={`rounded-2xl border p-4 text-left transition ${
                  c.chart === x.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-slate-200 hover:border-slate-300 dark:border-white/10'
                }`}
              >
                <div className="font-bold">{x.label}</div>
                <div className="mt-1 text-xs text-slate-500">{x.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card lg:col-span-2 border-rose-200 dark:border-rose-500/30">
          <h2 className="mb-1 font-bold text-rose-700 dark:text-rose-300">Zone sensible</h2>
          <p className="mb-4 text-sm text-slate-500">
            Les données sont stockées dans votre navigateur. Cette action efface définitivement
            produits, ventes, écritures et piste d'audit.
          </p>
          {confirmReset ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                }}
                className="btn-danger"
              >
                Confirmer la suppression totale
              </button>
              <button onClick={() => setConfirmReset(false)} className="btn-ghost">
                Annuler
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="btn-danger">
              Réinitialiser toutes les données
            </button>
          )}
        </div>
      </div>
    </>
  );
}
