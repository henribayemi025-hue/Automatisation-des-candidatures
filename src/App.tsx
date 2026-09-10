import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './lib/auth';
import Auth from './pages/Auth';
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
import Settings from './pages/Settings';

export default function App() {
  const { user, guest, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream dark:bg-ink-950">
        <div className="grid h-12 w-12 animate-pulse place-items-center rounded-2xl bg-gradient-to-br from-brass to-brand-500 font-display text-2xl font-bold text-ink-950">
          F
        </div>
      </div>
    );
  }

  if (!user && !guest) return <Auth />;

  return (
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
        <Route path="/parametres" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
