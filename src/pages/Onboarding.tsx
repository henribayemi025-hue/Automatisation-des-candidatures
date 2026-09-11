import { useState } from 'react';
import { useStore } from '../lib/store';
import { useCollab } from '../lib/collab';
import { CURRENCIES, currencyLabel } from '../lib/money';
import { GOALS, SECTORS } from '../lib/guide';
import { COUNTRIES, countryProfile, profileToCompany } from '../lib/countries';
import { LanguageSwitch, t } from '../lib/i18n';
import { Field } from '../components/UI';
import { IconCheck, IconChevronRight } from '../components/Icons';
import AppSwitcher from '../components/AppSwitcher';

export default function Onboarding() {
  const { db, setCompany, loadDemo } = useStore();
  const { user, signOut } = useCollab();
  const [step, setStep] = useState(0);
  const [sector, setSector] = useState(db.company.sector);
  const [name, setName] = useState(db.company.name === 'Mon entreprise' ? '' : db.company.name);
  const [country, setCountry] = useState(db.company.country);
  const [city, setCity] = useState(db.company.city);
  const [currency, setCurrency] = useState(db.company.currency);
  const [goals, setGoals] = useState<string[]>(db.company.goals ?? []);

  const steps = ['Votre activité', 'Votre entreprise', 'Ce que vous voulez faire'];
  const profile = countryProfile(country);

  function toggleGoal(id: string) {
    setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  }

  function finish(withDemo = false) {
    const expert = goals.includes('accounting') || withDemo;
    setCompany({
      ...(profile ? profileToCompany(profile) : {}),
      sector,
      name: name.trim() || 'Mon entreprise',
      country,
      city: city.trim(),
      currency,
      goals,
      mode: expert ? 'EXPERT' : 'SIMPLE',
      onboarded: true,
    });
    // Découverte : trois mois d'activité déjà saisis, dans la devise choisie.
    if (withDemo) loadDemo();
  }

  const canNext = step === 0 ? !!sector : step === 1 ? name.trim().length > 0 && !!currency : goals.length > 0;

  return (
    <div className="min-h-screen bg-base px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start justify-between">
          <div className="leading-tight">
            <span className="block font-display text-[22px] font-bold text-teal">Finjaro</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6A3D]">Accounting</span>
          </div>
          <div className="flex items-center gap-2">
            <AppSwitcher align="end" />
            <LanguageSwitch />
            {!user && (
              <button type="button" onClick={() => void signOut()} className="btn-ghost py-1.5 text-caption">
                {t('J’ai un compte')}
              </button>
            )}
          </div>
        </div>

        {!user && (
          <p className="mt-3 text-caption text-muted">
            {t('Vous travaillez sans compte : vos données restent sur cet appareil. Créez un compte pour les retrouver partout et travailler à plusieurs.')}
          </p>
        )}

        <ol className="mt-8 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className={`grid h-6 w-6 place-items-center rounded-full ${i < step ? 'bg-[#2A9D8F] text-white' : i === step ? 'bg-teal text-white' : 'bg-hairline text-muted'}`}>
                {i < step ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={i === step ? 'text-ink' : 'text-muted'}>{t(s)}</span>
              {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-hairline" />}
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-card border border-hairline bg-white p-6 sm:p-8">
          {step === 0 && (
            <>
              <h1 className="font-display text-[28px] font-bold text-ink">{t('Quelle est votre activité ?')}</h1>
              <p className="mt-1 text-body text-muted">{t('On adapte les mots et les exemples à votre métier.')}</p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SECTORS.map((s) => (
                  <button key={s.id} type="button" onClick={() => setSector(s.id)} className={`tile ${sector === s.id ? 'tile-active' : ''}`}>
                    {s.image ? (
                      <img src={s.image} alt="" className="h-16 w-16 rounded-card object-cover" />
                    ) : (
                      <span className={`grid h-14 w-14 place-items-center rounded-card bg-gradient-to-br ${s.gradient} text-white`}>
                        <s.icon className="h-7 w-7" />
                      </span>
                    )}
                    <span className="text-caption font-semibold leading-tight text-ink">{t(s.label)}</span>
                    <span className="hidden text-[11px] leading-tight text-muted sm:block">{t(s.hint)}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-display text-[28px] font-bold text-ink">{t('Votre entreprise')}</h1>
              <p className="mt-1 text-body text-muted">{t('Ces informations apparaissent sur vos documents. Modifiables à tout moment.')}</p>
              <div className="mt-6 space-y-4">
                <Field label={t('Nom de l’entreprise')}>
                  <input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Ex. Boutique Chez Awa')} className="field" autoFocus />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('Pays')}>
                    <select
                      id="ob-country"
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        const p = countryProfile(e.target.value);
                        if (p?.currency && !currency) setCurrency(p.currency);
                      }}
                      className="field"
                    >
                      <option value="">{t('— Choisir —')}</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('Ville')}>
                    <input id="ob-city" value={city} onChange={(e) => setCity(e.target.value)} className="field" />
                  </Field>
                </div>
                <Field label={t('Devise de travail')} hint={t('Celle dans laquelle vous fixez vos prix. À confirmer même si elle est proposée.')}>
                  <select id="ob-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="field">
                    <option value="">{t('— Choisir —')}</option>
                    {profile?.currency && (
                      <optgroup label={t('Proposée pour ce pays')}>
                        <option value={profile.currency}>{currencyLabel(profile.currency)}</option>
                      </optgroup>
                    )}
                    <optgroup label={t('Toutes les devises')}>
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {currencyLabel(c.code)}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </Field>
                {profile && profile.name !== 'Autre' && (
                  <p className="rounded-input bg-[#FBF1DF] px-3.5 py-2.5 text-caption text-ink">
                    {t('Profil fiscal proposé pour ce pays : {tax} {rate} %, plan {chart}. À confirmer avec votre comptable.', {
                      tax: profile.taxLabel,
                      rate: (profile.vatRateBp / 100).toString(),
                      chart: profile.chart,
                    })}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-display text-[28px] font-bold text-ink">{t('Que voulez-vous faire ?')}</h1>
              <p className="mt-1 text-body text-muted">{t('Choisissez tout ce qui vous parle. L’écran s’adapte.')}</p>
              <p className="mt-3 text-caption text-muted">
                {t('Comptable ou curieux ? « Voir avec des données d’exemple » remplit l’espace avec trois mois d’activité complète, dans la devise choisie.')}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {GOALS.map((g) => {
                  const on = goals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGoal(g.id)}
                      className={`flex items-start gap-3 rounded-card border p-4 text-left transition ${on ? 'border-teal bg-teal-light' : 'border-hairline bg-white hover:border-teal/50'}`}
                    >
                      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${on ? 'border-teal bg-teal text-white' : 'border-hairline'}`}>
                        {on && <IconCheck className="h-3.5 w-3.5" />}
                      </span>
                      <span>
                        <span className="block text-body font-semibold text-ink">{t(g.label)}</span>
                        <span className="block text-caption text-muted">{t(g.hint)}</span>
                        {g.expert && <span className="mt-1 inline-block rounded-pill bg-[#FBF1DF] px-2 py-0.5 text-[10px] font-bold text-[#8C6A3D]">{t('Active le mode expert')}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-ghost">
              {t('Retour')}
            </button>
            {step < 2 ? (
              <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="btn-primary">
                {t('Continuer')}
                <IconChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button type="button" onClick={() => finish(true)} disabled={!canNext} className="btn-ghost">
                  {t('Voir avec des données d’exemple')}
                </button>
                <button type="button" onClick={() => finish(false)} disabled={!canNext} className="btn-primary">
                  {t('C’est parti')}
                  <IconChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
