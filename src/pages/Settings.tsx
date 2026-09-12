import { useState } from 'react';
import { Link } from 'react-router-dom';
import { hasContent, useStore } from '../lib/store';
import { useCollab } from '../lib/collab';
import { CURRENCIES, currencyLabel } from '../lib/money';
import { SECTORS } from '../lib/guide';
import { sectorProfile, tracksStock } from '../lib/sector';
import { startTour } from '../components/Tour';
import { displayIdentity } from '../lib/identity';
import type { Company } from '../lib/types';
import { Field, PageHeader } from '../components/UI';
import { LanguageSwitch, getLang } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import type { ThemeChoice } from '../lib/theme';
import { COUNTRIES, countryProfile, profileToCompany } from '../lib/countries';
import { IconLogout, IconUsers } from '../components/Icons';
import { t } from '../lib/i18n';

const CHARTS: { value: Company['chart']; label: string; hint: string }[] = [
  { value: 'SYSCOHADA', label: 'SYSCOHADA', hint: 'Zone OHADA (Afrique de l’Ouest et centrale)' },
  { value: 'PCG', label: 'PCG', hint: 'Plan comptable général français' },
  { value: 'GENERIC', label: 'Générique', hint: 'Numérotation neutre par nature de compte' },
];

export default function Settings() {
  const { db, setCompany, resetAll, loadDemo } = useStore();
  const { workspace, user, signOut } = useCollab();
  const [confirmReset, setConfirmReset] = useState(false);
  const [applied, setApplied] = useState('');
  const { choice, setChoice } = useTheme();
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [demoDone, setDemoDone] = useState('');
  const c = db.company;
  const canEdit = !workspace || workspace.role === 'owner' || workspace.role === 'manager';

  return (
    <>
      <PageHeader title={t('Paramètres')} subtitle={t('Votre entreprise, votre devise, votre façon de travailler')} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* « Français · English » était un simple texte à côté d'un petit
            FR / EN : on cliquait sur le mot, rien ne bougeait. Les deux langues
            sont maintenant des boutons en toutes lettres, et la phrase dit
            laquelle est active. */}
        <div className="card lg:col-span-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-section">{t('Langue')}</h2>
            <p className="text-caption text-muted">
              {getLang() === 'en' ? 'The app is in English.' : 'L’application est en français.'}
            </p>
          </div>
          <LanguageSwitch full />
        </div>

        <div className="card flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-section">{t('Apparence')}</h2>
            <p className="text-caption text-muted">{t('Clair pour la boutique, sombre pour les longues séances de comptabilité.')}</p>
          </div>
          <div className="inline-flex rounded-[8px] border border-hairline bg-surface p-0.5">
            {(['light', 'dark', 'system'] as ThemeChoice[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChoice(c)}
                className={`rounded-[6px] px-3 py-1.5 text-caption font-semibold transition ${choice === c ? 'bg-ink text-surface' : 'text-muted hover:text-ink'}`}
              >
                {t(c === 'light' ? 'Clair' : c === 'dark' ? 'Sombre' : 'Système')}
              </button>
            ))}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="text-section">{t('Comment voulez-vous voir l’application ?')}</h2>
          <p className="mt-1 text-caption text-muted">{t('Le mode change les écrans visibles et le vocabulaire, jamais les données.')}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ['SIMPLE', t('Mode simple'), t('Vendre, caisse, stock, dettes, dépenses, résultats. La comptabilité travaille en coulisses.')],
                ['EXPERT', t('Mode expert'), t('Tout le mode simple, plus le journal, le grand livre, la balance, le bilan, le plan comptable et l’audit.')],
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
          <h2 className="text-section">{t('Entreprise')}</h2>
          <div className="mt-4 space-y-4">
            <Field label={t('Nom de l’entreprise')}>
              <input id="set-name" value={c.name} disabled={!canEdit} onChange={(e) => setCompany({ name: e.target.value })} className="field" />
            </Field>
            <Field label={t('Activité')}>
              <select id="set-sector" value={c.sector} disabled={!canEdit} onChange={(e) => setCompany({ sector: e.target.value })} className="field">
                <option value="">{t('— Choisir —')}</option>
                {SECTORS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {t(s.label)}
                  </option>
                ))}
              </select>
            </Field>
            {/* Changer d'activité change le menu tout de suite, mais rien ne le
                disait : on nomme les nouveaux mots, et on propose la visite. */}
            {c.sector && (
              <div className="rounded-input bg-base px-3 py-2.5 text-caption text-ink">
                <p>
                  <span className="font-semibold">{t('Avec ce métier, le menu dit :')}</span>{' '}
                  {t(sectorProfile(c.sector).sell)} · {t(sectorProfile(c.sector).itemsTitle)} · {t(sectorProfile(c.sector).customers)} · {t(sectorProfile(c.sector).sales)}
                  {tracksStock(c) ? '' : ` — ${t('sans les écrans Stock et Achats')}`}
                </p>
                <button type="button" onClick={startTour} className="mt-1.5 font-semibold text-teal">
                  {t('Voir la visite guidée avec ces mots')}
                </button>
              </div>
            )}
            {/* Le métier propose, la personne décide : un salon qui revend des
                crèmes coche la case, une boutique de services la décoche. */}
            <label className="flex items-start gap-2 text-caption text-ink">
              <input
                id="set-tracks-stock"
                type="checkbox"
                checked={tracksStock(c)}
                disabled={!canEdit}
                onChange={(e) => setCompany({ tracksStock: e.target.checked })}
                className="mt-0.5"
              />
              <span>
                {t('Je suis des quantités en stock')}
                <span className="block text-muted">
                  {t('Décoché, les écrans Stock et Achats sortent du menu et les fiches ne demandent plus de quantité — pour un métier qui vend surtout du temps.')}
                </span>
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('Pays')}>
                <select id="set-country" value={c.country} disabled={!canEdit} onChange={(e) => setCompany({ country: e.target.value })} className="field">
                  <option value="">{t('— Choisir —')}</option>
                  {COUNTRIES.map((x) => (
                    <option key={x.name} value={x.name}>
                      {t(x.name)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('Ville')}>
                <input id="set-city" value={c.city} disabled={!canEdit} onChange={(e) => setCompany({ city: e.target.value })} className="field" />
              </Field>
            </div>
            <Field label={t('Téléphone')}>
              <input id="set-phone" value={c.phone} disabled={!canEdit} onChange={(e) => setCompany({ phone: e.target.value })} className="field" />
            </Field>
          </div>
        </div>

        <div className="card">
          <h2 className="text-section">{t('Devise et taxes')}</h2>
          {countryProfile(c.country) && c.country !== 'Autre' && (
            <div className="mt-3 rounded-input bg-[#FBF1DF] px-3.5 py-3 text-caption text-ink">
              <div className="font-semibold">{t('Fiscalité du pays')}</div>
              <p className="mt-0.5 text-muted">{t('Choisir un pays applique ses réglages standard (taxe, taux, référentiel, exercice). Votre comptable garde le dernier mot.')}</p>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => {
                  const p = countryProfile(c.country)!;
                  // La devise ne suit le pays que si l'espace est encore vide : des montants saisis gardent leur monnaie.
                  setCompany({ ...profileToCompany(p), ...(hasContent(db) || !p.currency ? {} : { currency: p.currency }) });
                  setApplied(t('Profil du pays appliqué : {tax} {rate} %, plan {chart}, exercice du {fy}.', { tax: p.taxLabel, rate: (p.vatRateBp / 100).toString(), chart: p.chart, fy: p.fiscalYearStart }));
                }}
                className="btn-brass mt-2 py-1.5 text-caption"
              >
                {t('Appliquer le profil du pays')}
              </button>
              {applied && <p className="mt-2 text-[#1F6F65]">{applied}</p>}
            </div>
          )}
          <div className="mt-4 space-y-4">
            <Field label={t('Devise de travail')} hint={t('Les montants déjà saisis gardent leur valeur : changez de devise avant de commencer.')}>
              <select id="set-currency" value={c.currency} disabled={!canEdit} onChange={(e) => setCompany({ currency: e.target.value })} className="field">
                <option value="">{t('— Choisir —')}</option>
                {countryProfile(c.country)?.currency && (
                  <optgroup label={t('Proposée pour ce pays')}>
                    <option value={countryProfile(c.country)!.currency}>{currencyLabel(countryProfile(c.country)!.currency)}</option>
                  </optgroup>
                )}
                <optgroup label={t('Toutes les devises')}>
                  {CURRENCIES.map((x) => (
                    <option key={x.code} value={x.code}>
                      {currencyLabel(x.code)}
                    </option>
                  ))}
                </optgroup>
              </select>
            </Field>
            <Field label={t('Début d’exercice (MM-JJ)')}>
              <input id="set-fy" value={c.fiscalYearStart} disabled={!canEdit} onChange={(e) => setCompany({ fiscalYearStart: e.target.value })} placeholder="01-01" className="field num" />
            </Field>
            <label className="flex items-center gap-3 rounded-input border border-hairline p-3.5">
              <input type="checkbox" checked={c.vatEnabled} disabled={!canEdit} onChange={(e) => setCompany({ vatEnabled: e.target.checked })} className="h-4 w-4 accent-teal" />
              <span className="text-body">{t('Appliquer la taxe sur les ventes et achats')} ({c.taxLabel || 'TVA'})</span>
            </label>
            {c.vatEnabled && (
              <>
              <label className="flex items-start gap-3 rounded-input border border-hairline p-3.5">
                <input
                  type="checkbox"
                  checked={c.pricesIncludeTax !== false}
                  disabled={!canEdit}
                  onChange={(e) => setCompany({ pricesIncludeTax: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-[#C25E38]"
                  id="set-prices-ttc"
                />
                <span>
                  <span className="block text-body">{t('Mes prix affichés incluent déjà la taxe')}</span>
                  <span className="block text-caption text-muted">
                    {t('Coché : l’étiquette est ce que le client paie, la taxe est extraite du montant (cas d’une boutique). Décoché : la taxe s’ajoute au prix sur la facture.')}
                  </span>
                </span>
              </label>

              <Field label={t('Nom de la taxe')}>
                <input id="set-taxlabel" value={c.taxLabel} disabled={!canEdit} onChange={(e) => setCompany({ taxLabel: e.target.value })} placeholder="TVA, VAT, GST…" className="field" />
              </Field>
              </>
            )}
            {c.vatEnabled && (
              <Field label={t('Taux de la taxe (%)')}>
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
            <h2 className="text-section">{t('Référentiel comptable')}</h2>
            <p className="mt-1 text-caption text-muted">{t('Détermine la numérotation des comptes. Le changement remappe le plan sans modifier les écritures passées.')}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {CHARTS.map((x) => (
                <button
                  key={x.value}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setCompany({ chart: x.value })}
                  className={`rounded-card border p-4 text-left transition ${c.chart === x.value ? 'border-teal bg-teal-light' : 'border-hairline hover:border-teal/50'}`}
                >
                  <div className="text-body font-semibold">{t(x.label)}</div>
                  <div className="mt-1 text-caption text-muted">{t(x.hint)}</div>
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
            <h2 className="text-section">{t('Équipe')}</h2>
            <p className="text-caption text-muted">
              {user ? t('Invitez un caissier, un gérant ou votre comptable sur cet espace.') : t('Créez un compte pour travailler à plusieurs.')}
            </p>
          </div>
          <Link to="/equipe" className="btn-ghost">
            {t('Gérer l’équipe')}
          </Link>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="text-section">{t('Jeu d’essai pour votre comptable')}</h2>
          <p className="mt-1 text-caption text-muted">
            {t('Remplit cet espace avec trois mois d’activité complète : achats, ventes au comptant et à crédit, devis, dépenses, caisse, inventaire, écritures et une extourne. De quoi examiner chaque écran sans rien saisir.')}
          </p>
          <p className="mt-2 text-caption text-muted">
            {t('Les montants sont dans votre devise et votre référentiel. Ce sont des données d’exemple : « Réinitialiser toutes les données » les efface.')}
          </p>
          {confirmDemo ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn-brass"
                onClick={() => {
                  const n = loadDemo();
                  setConfirmDemo(false);
                  setDemoDone(t('{n} opérations d’exemple ajoutées. Ouvrez l’accueil, les rapports ou le journal.', { n }));
                }}
              >
                {t('Oui, ajouter les données d’exemple')}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setConfirmDemo(false)}>
                {t('Annuler')}
              </button>
              {hasContent(db) && <span className="text-caption text-[#A63030]">{t('Cet espace contient déjà des données : l’exemple s’ajoute par-dessus.')}</span>}
            </div>
          ) : (
            <button type="button" disabled={!canEdit} onClick={() => setConfirmDemo(true)} className="btn-brass mt-4">
              {t('Charger trois mois d’activité d’exemple')}
            </button>
          )}
          {demoDone && <p className="mt-3 text-caption text-[#1F6F65]">{demoDone}</p>}
        </div>

        {/* La déconnexion n'existait que derrière l'avatar, sans étiquette.
            On la remet là où les gens la cherchent : dans les réglages. */}
        <div className="card">
          <h2 className="text-section">{t('Mon compte')}</h2>
          <p className="mt-1 text-caption text-muted">
            {displayIdentity(user?.email) || t('Sans compte — les données restent sur cet appareil.')}
          </p>
          <p className="mt-3 text-caption text-muted">
            {t('Pour voir l’application avec le vocabulaire d’un autre métier, pas besoin de se déconnecter : changez « Activité » plus haut.')}
          </p>
          <button onClick={() => void signOut()} className="btn-ghost mt-4 text-[#A63030]">
            <IconLogout className="h-4 w-4" />
            {user ? t('Se déconnecter') : t('Quitter le mode local')}
          </button>
        </div>

        {(!workspace || workspace.role === 'owner') && (
          <div className="card lg:col-span-2 border-[#D14343]/30">
            <h2 className="text-section text-[#A63030]">{t('Zone sensible')}</h2>
            <p className="mt-1 text-caption text-muted">
              {t('Efface produits, ventes, écritures et historique de cet espace. L’action est elle-même tracée et visible par tous les membres.')}
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
                  {t('Confirmer la suppression totale')}
                </button>
                <button onClick={() => setConfirmReset(false)} className="btn-ghost">
                  {t('Annuler')}
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmReset(true)} className="btn-danger mt-4">
                {t('Réinitialiser toutes les données')}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
