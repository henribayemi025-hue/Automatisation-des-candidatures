import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useCollab } from './lib/collab';
import { useDB } from './lib/store';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Assistant from './pages/Assistant';
import PointOfSale from './pages/PointOfSale';
import CashRegister from './pages/CashRegister';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import Stock from './pages/Stock';
import Sales from './pages/Sales';
import Quotes from './pages/Quotes';
import Parties from './pages/Parties';
import Debts from './pages/Debts';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import CashBook from './pages/CashBook';
import Journal from './pages/Journal';
import GeneralLedger from './pages/GeneralLedger';
import TrialBalance from './pages/TrialBalance';
import Statements from './pages/Statements';
import ChartOfAccounts from './pages/ChartOfAccounts';
import Audit from './pages/Audit';
import AuditTrail from './pages/AuditTrail';
import Team from './pages/Team';
import Settings from './pages/Settings';
import { t } from './lib/i18n';

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-base">
      <div className="animate-pulse text-center leading-tight">
        <span className="block font-display text-[28px] font-bold text-teal">{t('Finjaro')}</span>
        <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C6A3D]">{t('Accounting')}</span>
      </div>
    </div>
  );
}

function LocalConflict() {
  const { localConflict, resolveLocalConflict, workspace } = useCollab();
  if (!localConflict) return null;
  const l = localConflict.localDb;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6">
      <div className="w-full max-w-lg rounded-t-card bg-white p-6 sm:rounded-card">
        <h2 className="font-display text-[24px] font-bold">{t('Deux versions de vos données')}</h2>
        <p className="mt-2 text-body text-muted">
          {t('Cet appareil contient du travail fait sans compte (')}{l.products.length} {t('produit(s),')} {l.sales.length} {t('vente(s),')}{' '}
          {l.expenses.length} {t('dépense(s)), et votre espace en ligne contient déjà des données. Rien ne sera écrasé sans votre accord.')}
        </p>
        <div className="mt-5 space-y-2">
          <button onClick={() => void resolveLocalConflict('keep-cloud')} className="btn-primary w-full justify-start text-left">
            {t('Continuer avec l’espace en ligne')}
          </button>
          <p className="px-1 text-caption text-muted">{t('Recommandé. Le travail local de cet appareil est mis de côté.')}</p>
          {workspace?.role === 'owner' && (
            <>
              <button onClick={() => void resolveLocalConflict('import-local')} className="btn-ghost w-full justify-start text-left">
                {t('Remplacer l’espace en ligne par le travail de cet appareil')}
              </button>
              <p className="px-1 text-caption text-[#A63030]">{t('Les données en ligne actuelles seront perdues. Choisissez ceci seulement si vous êtes sûr.')}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, guest, loading, workspace, sync, sessionExpired } = useCollab();
  const db = useDB();

  if (loading) return <Splash />;
  // Une session expirée reprend la main sur le mode local : on propose la connexion plutôt que de basculer sans rien dire.
  if (!user && (!guest || sessionExpired)) return <Auth />;
  if (user && !workspace && sync !== 'error') return <Splash />;

  const needsOnboarding = !db.company.onboarded && (!workspace || workspace.role === 'owner');
  if (needsOnboarding) return <Onboarding />;

  return (
    <>
      <LocalConflict />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/pos" element={<PointOfSale />} />
          <Route path="/caisse" element={<CashRegister />} />
          <Route path="/produits" element={<Products />} />
          <Route path="/achats" element={<Purchases />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/ventes" element={<Sales />} />
          <Route path="/devis" element={<Quotes />} />
          <Route path="/tiers" element={<Parties />} />
          <Route path="/dettes" element={<Debts />} />
          <Route path="/depenses" element={<Expenses />} />
          <Route path="/analyse" element={<Analytics />} />
          <Route path="/rapports" element={<Reports />} />
          <Route path="/livre-caisse" element={<CashBook />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/grand-livre" element={<GeneralLedger />} />
          <Route path="/balance" element={<TrialBalance />} />
          <Route path="/etats" element={<Statements />} />
          <Route path="/plan-comptable" element={<ChartOfAccounts />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/historique" element={<AuditTrail />} />
          <Route path="/equipe" element={<Team />} />
          <Route path="/parametres" element={<Settings />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </>
  );
}
