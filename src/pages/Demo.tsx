import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { hasContent, useStore } from '../lib/store';
import { useCollab } from '../lib/collab';
import { COUNTRIES, countryProfile, profileToCompany } from '../lib/countries';
import { currencyLabel } from '../lib/money';
import { LanguageSwitch, t } from '../lib/i18n';
import AppSwitcher from '../components/AppSwitcher';
import { IconBook, IconChevronRight, IconShield, IconSparkle } from '../components/Icons';

export const DEMO_KEY = 'finia.demo';

/** Raccourcis : un pays par grande zone comptable, pour choisir en un geste. */
const QUICK = ['Cameroun', 'Côte d’Ivoire', 'France', 'Royaume-Uni', 'Canada', 'Nigeria'];

const CONTENT = [
  'Achats reçus, payés, à crédit ou encore en attente',
  'Ventes au comptant, mobile money, carte et à crédit, avec encaissements partiels',
  'Devis converti en facture, créances clients et dettes fournisseurs',
  'Loyer, salaires, électricité, transport sur trois mois',
  'Trois journées de caisse, dont une avec un manquant',
  'Casse, écart d’inventaire, article en rupture et sous le seuil',
  'Dotation aux amortissements, et une écriture fausse puis extournée',
];

/** « Côte d’Ivoire » → « cote-d-ivoire » : pour écrire le pays dans le lien. */
export function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Page de démonstration : une seule question (le pays), puis l'espace se remplit
 * de trois mois d'activité. Aucun compte, aucune installation.
 */
export default function Demo() {
  const { db, setCompany, loadDemo } = useStore();
  const { continueAsGuest } = useCollab();
  const { country: fromUrl } = useParams();
  const [country, setCountry] = useState('');
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  function open(name: string) {
    const profile = countryProfile(name);
    if (!profile || busy) return;
    setBusy(true);
    // Revenir sur le lien de démonstration ne doit pas empiler un second jeu
    // de données : on rouvre simplement l'espace déjà rempli.
    if (localStorage.getItem(DEMO_KEY) === '1' && hasContent(db)) {
      window.location.hash = '#/';
      return;
    }
    continueAsGuest();
    setCompany({
      ...profileToCompany(profile),
      currency: profile.currency,
      name: t('Boutique de démonstration'),
      country: name,
      city: '',
      sector: 'retail',
      goals: ['sell', 'stock', 'debts', 'accounting'],
      mode: 'EXPERT',
      onboarded: true,
    });
    loadDemo();
    localStorage.setItem(DEMO_KEY, '1');
    window.location.hash = '#/';
  }

  // Lien direct « #/demo/cameroun » : la démonstration s'ouvre sans aucun clic.
  useEffect(() => {
    if (started.current || !fromUrl) return;
    const match = COUNTRIES.find((c) => slug(c.name) === slug(fromUrl));
    if (!match) return;
    started.current = true;
    open(match.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromUrl]);

  return (
    <div className="min-h-screen bg-base px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between">
          <div className="leading-tight">
            <span className="block font-display text-[24px] font-bold text-teal">{t('Finjaro')}</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6A3D]">{t('Accounting')}</span>
          </div>
          <div className="flex items-center gap-2">
            <AppSwitcher align="end" />
            <LanguageSwitch />
          </div>
        </div>

        <h1 className="mt-8 font-display text-[30px] font-bold leading-tight text-ink sm:text-[38px]">
          {t('Une boutique, trois mois d’activité, déjà saisie.')}
        </h1>
        <p className="mt-3 max-w-xl text-body leading-relaxed text-muted">
          {t('Choisissez votre pays : les chiffres s’affichent dans votre monnaie et votre plan comptable. Rien à créer, rien à installer.')}
        </p>

        <div className="mt-6 rounded-card border border-hairline bg-white p-5 sm:p-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{t('Ouvrir la démonstration pour')}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {QUICK.map((name) => {
              const p = countryProfile(name)!;
              return (
                <button key={name} type="button" disabled={busy} onClick={() => open(name)} className="rounded-card border border-hairline p-3 text-left transition hover:border-teal hover:bg-teal-light">
                  <span className="block text-body font-semibold text-ink">{name}</span>
                  <span className="block text-caption text-muted">
                    {currencyLabel(p.currency).split(' · ')[0]} · {p.chart}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="min-w-[220px] flex-1">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">{t('Ou choisissez un autre pays')}</span>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="field" id="demo-country">
                <option value="">{t('— Choisir —')}</option>
                {COUNTRIES.filter((c) => c.name !== 'Autre').map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" disabled={!country || busy} onClick={() => open(country)} className="btn-primary">
              {t('Ouvrir la démonstration')}
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-hairline bg-white p-5">
            <span className="grid h-10 w-10 place-items-center rounded-input bg-teal-light text-teal">
              <IconBook />
            </span>
            <h2 className="mt-3 text-section">{t('Ce que contient la démonstration')}</h2>
            <ul className="mt-2 space-y-1.5 text-caption text-muted">
              {CONTENT.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brass" />
                  {t(line)}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div className="rounded-card border border-hairline bg-white p-5">
              <span className="grid h-10 w-10 place-items-center rounded-input bg-teal-light text-teal">
                <IconShield />
              </span>
              <h2 className="mt-3 text-section">{t('Rien n’est partagé')}</h2>
              <p className="mt-1 text-caption text-muted">
                {t('Ces chiffres d’exemple restent sur votre appareil. Vous ne voyez les données de personne, personne ne voit les vôtres.')}
              </p>
            </div>
            <div className="rounded-card border border-hairline bg-white p-5">
              <span className="grid h-10 w-10 place-items-center rounded-input bg-teal-light text-teal">
                <IconSparkle />
              </span>
              <h2 className="mt-3 text-section">{t('Tout est modifiable')}</h2>
              <p className="mt-1 text-caption text-muted">
                {t('Saisissez une vente, extournez une écriture, exportez en Excel : c’est l’application complète, pas une image.')}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-caption text-muted">
          {t('Vous préférez partir d’un espace vide ?')}{' '}
          <a href="#/" onClick={() => localStorage.removeItem(DEMO_KEY)} className="font-semibold text-teal underline-offset-4 hover:underline">
            {t('Aller à la connexion')}
          </a>
        </p>
      </div>
    </div>
  );
}
