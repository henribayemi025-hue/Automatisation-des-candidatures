import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { useCollab } from '../lib/collab';
import { CURRENCIES } from '../lib/money';
import { SECTORS } from '../lib/guide';
import type { Company } from '../lib/types';
import { Field, PageHeader } from '../components/UI';
import { IconUsers } from '../components/Icons';

const CHARTS: { value: Company['chart']; label: string; hint: string }[] = [
  { value: 'SYSCOHADA', label: 'SYSCOHADA', hint: 'Zone OHADA (Afrique de l’Ouest et centrale)' },
  { value: 'PCG', label: 'PCG', hint: 'Plan comptable général français' },
  { value: 'GENERIC', label: 'Générique', hint: 'Numérotation neutre par nature de compte' },
];

export default function Settings() {
  const { db, setCompany, resetAll } = useStore();
  const { workspace, user } = useCollab();
  const [confirmReset, setConfirmReset] = useState(false);
  const c = db.company;
  const canEdit = !workspace || workspace.role === 'owner' || workspace.role === 'manager';

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Votre entreprise, votre devise, votre façon de travailler" />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card lg:col-span-2">
          <h2 className="text-section">Comment voulez-vous voir l’application ?</h2>
          <p className="mt-1 text-caption text-muted">Le mode change les écrans visibles et le vocabulaire, jamais les données.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ['SIMPLE', 'Mode simple', 'Vendre, caisse, stock, dettes, dépenses, résultats. La comptabilité travaille en coulisses.'],
                ['EXPERT', 'Mode expert', 'Tout le mode simple, plus le journal, le grand livre, la balance, le bilan, le plan comptable et l’audit.'],
              ] as const
            ).map(([mode, label, hint]) => (
              <button
                key={mode}
                type="button"
                disabled={!canEdit}
                onClick={() => setCompany({ mode })}
                className={`rounded-card border p-4 text-left transition ${c.mode === mode ? 'border-teal bg-teal-light' : 'border-hairline hover:border-teal/50'}`}
              >
                <div className="text-body font-semibold text-ink">{label}</div>
                <div className="mt-1 text-caption text-muted">{hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-section">Entreprise</h2>
          <div className="mt-4 space-y-4">
            <Field label="Nom de l’entreprise">
              <input id="set-name" value={c.name} disabled={!canEdit} onChange={(e) => setCompany({ name: e.target.value })} className="field" />
            </Field>
            <Field label="Activité">
              <select id="set-sector" value={c.sector} disabled={!canEdit} onChange={(e) => setCompany({ sector: e.target.value })} className="field">
                <option value="">— Choisir —</option>
                {SECTORS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pays">
                <input id="set-country" value={c.country} disabled={!canEdit} onChange={(e) => setCompany({ country: e.target.value })} className="field" />
              </Field>
              <Field label="Ville">
                <input id="set-city" value={c.city} disabled={!canEdit} onChange={(e) => setCompany({ city: e.target.value })} className="field" />
              </Field>
            </div>
            <Field label="Téléphone">
              <input id="set-phone" value={c.phone} disabled={!canEdit} onChange={(e) => setCompany({ phone: e.target.value })} className="field" />
            </Field>
          </div>
        </div>

        <div className="card">
          <h2 className="text-section">Devise et taxes</h2>
          <div className="mt-4 space-y-4">
            <Field label="Devise de travail" hint="Les montants déjà saisis gardent leur valeur : changez de devise avant de commencer.">
              <select id="set-currency" value={c.currency} disabled={!canEdit} onChange={(e) => setCompany({ currency: e.target.value })} className="field">
                <option value="">— Choisir —</option>
                {CURRENCIES.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.code} — {x.symbol}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Début d’exercice (MM-JJ)">
              <input id="set-fy" value={c.fiscalYearStart} disabled={!canEdit} onChange={(e) => setCompany({ fiscalYearStart: e.target.value })} placeholder="01-01" className="field num" />
            </Field>
            <label className="flex items-center gap-3 rounded-input border border-hairline p-3.5">
              <input type="checkbox" checked={c.vatEnabled} disabled={!canEdit} onChange={(e) => setCompany({ vatEnabled: e.target.checked })} className="h-4 w-4 accent-teal" />
              <span className="text-body">Appliquer la TVA sur les ventes et achats</span>
            </label>
            {c.vatEnabled && (
              <Field label="Taux de TVA (%)">
                <input
                  id="set-vat"
                  value={(c.vatRateBp / 100).toString()}
                  disabled={!canEdit}
                  onChange={(e) => setCompany({ vatRateBp: Math.round((parseFloat(e.target.value.replace(',', '.')) || 0) * 100) })}
                  inputMode="decimal"
                  className="field num"
                />
              </Field>
            )}
          </div>
        </div>

        {c.mode === 'EXPERT' && (
          <div className="card lg:col-span-2">
            <h2 className="text-section">Référentiel comptable</h2>
            <p className="mt-1 text-caption text-muted">Détermine la numérotation des comptes. Le changement remappe le plan sans modifier les écritures passées.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {CHARTS.map((x) => (
                <button
                  key={x.value}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setCompany({ chart: x.value })}
                  className={`rounded-card border p-4 text-left transition ${c.chart === x.value ? 'border-teal bg-teal-light' : 'border-hairline hover:border-teal/50'}`}
                >
                  <div className="text-body font-semibold">{x.label}</div>
                  <div className="mt-1 text-caption text-muted">{x.hint}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card lg:col-span-2 flex flex-wrap items-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-input bg-teal-light text-teal">
            <IconUsers />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-section">Équipe</h2>
            <p className="text-caption text-muted">
              {user ? 'Invitez un caissier, un gérant ou votre comptable sur cet espace.' : 'Créez un compte pour travailler à plusieurs.'}
            </p>
          </div>
          <Link to="/equipe" className="btn-ghost">
            Gérer l’équipe
          </Link>
        </div>

        {(!workspace || workspace.role === 'owner') && (
          <div className="card lg:col-span-2 border-[#D14343]/30">
            <h2 className="text-section text-[#A63030]">Zone sensible</h2>
            <p className="mt-1 text-caption text-muted">
              Efface produits, ventes, écritures et historique de cet espace. L’action est elle-même tracée et visible par tous les membres.
            </p>
            {confirmReset ? (
              <div className="mt-4 flex flex-wrap gap-2">
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
              <button onClick={() => setConfirmReset(true)} className="btn-danger mt-4">
                Réinitialiser toutes les données
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
