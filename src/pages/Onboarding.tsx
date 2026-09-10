import { useState } from 'react';
import { useStore } from '../lib/store';
import { CURRENCIES } from '../lib/money';
import { GOALS, SECTORS } from '../lib/guide';
import { Field } from '../components/UI';
import { IconCheck, IconChevronRight } from '../components/Icons';

const COUNTRIES = [
  'Cameroun', 'Sénégal', 'Côte d’Ivoire', 'Gabon', 'Congo', 'RD Congo', 'Bénin', 'Togo', 'Mali', 'Burkina Faso', 'Niger', 'Tchad',
  'Guinée', 'Maroc', 'Algérie', 'Tunisie', 'Nigeria', 'Ghana', 'Kenya', 'Afrique du Sud', 'France', 'Belgique', 'Suisse',
  'Royaume-Uni', 'Allemagne', 'Espagne', 'Italie', 'Canada', 'États-Unis', 'Émirats arabes unis', 'Inde', 'Chine', 'Brésil', 'Autre',
];

/** Suggestion seulement : la personne confirme toujours sa devise. */
const SUGGESTED: Record<string, string> = {
  Cameroun: 'XAF', Gabon: 'XAF', Congo: 'XAF', Tchad: 'XAF', 'RD Congo': 'USD',
  Sénégal: 'XOF', 'Côte d’Ivoire': 'XOF', Bénin: 'XOF', Togo: 'XOF', Mali: 'XOF', 'Burkina Faso': 'XOF', Niger: 'XOF',
  Guinée: 'USD', Maroc: 'MAD', Algérie: 'USD', Tunisie: 'USD', Nigeria: 'NGN', Ghana: 'GHS', Kenya: 'KES', 'Afrique du Sud': 'ZAR',
  France: 'EUR', Belgique: 'EUR', Suisse: 'CHF', 'Royaume-Uni': 'GBP', Allemagne: 'EUR', Espagne: 'EUR', Italie: 'EUR',
  Canada: 'CAD', 'États-Unis': 'USD', 'Émirats arabes unis': 'AED', Inde: 'INR', Chine: 'CNY', Brésil: 'BRL',
};

export default function Onboarding() {
  const { db, setCompany } = useStore();
  const [step, setStep] = useState(0);
  const [sector, setSector] = useState(db.company.sector);
  const [name, setName] = useState(db.company.name === 'Mon entreprise' ? '' : db.company.name);
  const [country, setCountry] = useState(db.company.country);
  const [city, setCity] = useState(db.company.city);
  const [currency, setCurrency] = useState(db.company.currency);
  const [goals, setGoals] = useState<string[]>(db.company.goals ?? []);

  const steps = ['Votre activité', 'Votre entreprise', 'Ce que vous voulez faire'];

  function toggleGoal(id: string) {
    setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  }

  function finish() {
    const expert = goals.includes('accounting');
    setCompany({
      sector,
      name: name.trim() || 'Mon entreprise',
      country,
      city: city.trim(),
      currency,
      goals,
      mode: expert ? 'EXPERT' : 'SIMPLE',
      onboarded: true,
    });
  }

  const canNext = step === 0 ? !!sector : step === 1 ? name.trim().length > 0 && !!currency : goals.length > 0;

  return (
    <div className="min-h-screen bg-base px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="leading-tight">
          <span className="block font-display text-[22px] font-bold text-teal">Finjaro</span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6A3D]">Accounting</span>
        </div>

        <ol className="mt-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full ${
                  i < step ? 'bg-[#2A9D8F] text-white' : i === step ? 'bg-teal text-white' : 'bg-hairline text-muted'
                }`}
              >
                {i < step ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={i === step ? 'text-ink' : 'text-muted'}>{s}</span>
              {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-hairline" />}
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-card border border-hairline bg-white p-6 sm:p-8">
          {step === 0 && (
            <>
              <h1 className="font-display text-[28px] font-bold text-ink">Quelle est votre activité ?</h1>
              <p className="mt-1 text-body text-muted">On adapte les mots et les exemples à votre métier.</p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SECTORS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSector(s.id)}
                    className={`tile ${sector === s.id ? 'tile-active' : ''}`}
                  >
                    <span className={`grid h-14 w-14 place-items-center rounded-card bg-gradient-to-br ${s.gradient} font-display text-2xl font-bold text-white`}>
                      {s.label.charAt(0)}
                    </span>
                    <span className="text-caption font-semibold leading-tight text-ink">{s.label}</span>
                    <span className="hidden text-[11px] leading-tight text-muted sm:block">{s.hint}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-display text-[28px] font-bold text-ink">Votre entreprise</h1>
              <p className="mt-1 text-body text-muted">Ces informations apparaissent sur vos documents. Modifiables à tout moment.</p>
              <div className="mt-6 space-y-4">
                <Field label="Nom de l’entreprise">
                  <input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Boutique Chez Awa" className="field" autoFocus />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pays">
                    <select
                      id="ob-country"
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        if (!currency && SUGGESTED[e.target.value]) setCurrency(SUGGESTED[e.target.value]);
                      }}
                      className="field"
                    >
                      <option value="">— Choisir —</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Ville">
                    <input id="ob-city" value={city} onChange={(e) => setCity(e.target.value)} className="field" />
                  </Field>
                </div>
                <Field label="Devise de travail" hint="Celle dans laquelle vous fixez vos prix. À confirmer même si elle est proposée.">
                  <select id="ob-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="field">
                    <option value="">— Choisir —</option>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.symbol}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-display text-[28px] font-bold text-ink">Que voulez-vous faire ?</h1>
              <p className="mt-1 text-body text-muted">Choisissez tout ce qui vous parle. L’écran s’adapte.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {GOALS.map((g) => {
                  const on = goals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGoal(g.id)}
                      className={`flex items-start gap-3 rounded-card border p-4 text-left transition ${
                        on ? 'border-teal bg-teal-light' : 'border-hairline bg-white hover:border-teal/50'
                      }`}
                    >
                      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${on ? 'border-teal bg-teal text-white' : 'border-hairline'}`}>
                        {on && <IconCheck className="h-3.5 w-3.5" />}
                      </span>
                      <span>
                        <span className="block text-body font-semibold text-ink">{g.label}</span>
                        <span className="block text-caption text-muted">{g.hint}</span>
                        {g.expert && <span className="mt-1 inline-block rounded-pill bg-[#FBF1DF] px-2 py-0.5 text-[10px] font-bold text-[#8C6A3D]">Active le mode expert</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-ghost">
              Retour
            </button>
            {step < 2 ? (
              <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="btn-primary">
                Continuer
                <IconChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={finish} disabled={!canNext} className="btn-primary">
                C’est parti
                <IconChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
