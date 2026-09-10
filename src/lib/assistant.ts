import { accountCode } from './chart';
import { balanceSheet, incomeStatement, runAuditChecks } from './ledger';
import { monthStart, outstanding, productPerformance, saleRevenue, snapshot } from './metrics';
import { formatMoney, formatPercent } from './money';
import type { DB, Minor } from './types';

export interface Answer {
  text: string;
  facts?: { label: string; value: string }[];
}

interface Period {
  from: string;
  to: string;
  label: string;
}

function resolvePeriod(q: string): Period {
  const today = new Date().toISOString().slice(0, 10);
  if (/aujourd|ce jour|today/.test(q)) return { from: today, to: today, label: "aujourd'hui" };
  if (/hier/.test(q)) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.toISOString().slice(0, 10);
    return { from: y, to: y, label: 'hier' };
  }
  if (/semaine|7 jours|sept jours/.test(q)) {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().slice(0, 10), to: today, label: 'ces 7 derniers jours' };
  }
  if (/30 jours|trente jours/.test(q)) {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return { from: d.toISOString().slice(0, 10), to: today, label: 'ces 30 derniers jours' };
  }
  if (/an(n[ée]e)?|exercice/.test(q)) {
    return { from: `${new Date().getFullYear()}-01-01`, to: today, label: 'cette année' };
  }
  return { from: monthStart(), to: today, label: 'ce mois-ci' };
}

/**
 * Analyste local : interprète la question par mots-clés et répond avec des
 * chiffres calculés sur les données réelles. Aucun appel réseau.
 */
export function answer(db: DB, question: string): Answer {
  const q = question.toLowerCase().trim();
  const money = (v: Minor) => formatMoney(v, db.company.currency);
  const period = resolvePeriod(q);
  const s = snapshot(db);

  const sales = db.sales.filter(
    (x) => x.status === 'CONFIRMED' && x.date >= period.from && x.date <= period.to,
  );
  const revenue = sales.reduce((acc, x) => acc + saleRevenue(x), 0);
  const income = incomeStatement(db.accounts, db.entries, period.from, period.to);
  const cogsCode = accountCode(db.company.chart, 'INVENTORY_CHANGE');
  const cogs = income.expenses.find((e) => e.account.code === cogsCode)?.balance ?? 0;

  if (!q) {
    return { text: 'Posez une question sur vos chiffres : ventes, dépenses, marge, stock, créances…' };
  }

  if (/d[ée]pens|charge|co[uû]t/.test(q) && !/marge/.test(q)) {
    const list = db.expenses.filter((e) => e.date >= period.from && e.date <= period.to);
    const total = list.reduce((acc, e) => acc + e.amount, 0);
    const byCat = new Map<string, number>();
    for (const e of list) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
    const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      text: `Vous avez dépensé ${money(total)} ${period.label}, réparti sur ${list.length} dépense(s).${
        top ? ` Le premier poste est « ${top[0]} » avec ${money(top[1])}.` : ''
      }`,
      facts: [
        { label: 'Total dépenses', value: money(total) },
        { label: 'Nombre', value: String(list.length) },
        { label: 'Charges comptables totales', value: money(income.totalExpenses) },
      ],
    };
  }

  if (/marge|rentab|b[ée]n[ée]fice|r[ée]sultat|profit/.test(q)) {
    const gross = revenue - cogs;
    const rate = revenue > 0 ? (gross / revenue) * 100 : 0;
    return {
      text: `${period.label.charAt(0).toUpperCase() + period.label.slice(1)}, votre marge brute est de ${money(
        gross,
      )} pour ${money(revenue)} de chiffre d'affaires, soit un taux de ${formatPercent(rate)}. Après toutes les charges, le résultat net s'établit à ${money(income.netIncome)}.`,
      facts: [
        { label: "Chiffre d'affaires", value: money(revenue) },
        { label: 'Coût des ventes', value: money(cogs) },
        { label: 'Marge brute', value: money(gross) },
        { label: 'Résultat net', value: money(income.netIncome) },
      ],
    };
  }

  if (/cr[ée]ance|doit|dette client|impay|recouvr/.test(q)) {
    const debts = db.debts.filter((d) => d.party === 'CUSTOMER' && outstanding(d) > 0);
    const sorted = debts.sort((a, b) => outstanding(b) - outstanding(a));
    return {
      text: debts.length
        ? `${debts.length} client(s) vous doivent au total ${money(s.receivables)}. Le plus gros encours est ${
            sorted[0].partyName
          } avec ${money(outstanding(sorted[0]))}.`
        : 'Aucun client ne vous doit d\'argent : toutes les créances sont soldées.',
      facts: sorted.slice(0, 5).map((d) => ({ label: d.partyName, value: money(outstanding(d)) })),
    };
  }

  if (/fournisseur|je dois|dette/.test(q)) {
    const debts = db.debts.filter((d) => d.party === 'SUPPLIER' && outstanding(d) > 0);
    return {
      text: debts.length
        ? `Vous devez ${money(s.payables)} à ${debts.length} fournisseur(s).`
        : 'Vous n\'avez aucune dette fournisseur en cours.',
      facts: debts.slice(0, 5).map((d) => ({ label: d.partyName, value: money(outstanding(d)) })),
    };
  }

  if (/stock|rupture|inventaire|r[ée]appro/.test(q)) {
    const active = db.products.filter((p) => !p.archived);
    const out = active.filter((p) => p.stock <= 0);
    const low = active.filter((p) => p.stock > 0 && p.stock <= p.reorderPoint);
    return {
      text: `Votre stock est valorisé à ${money(s.stockValue)} sur ${active.length} référence(s). ${
        out.length ? `${out.length} produit(s) en rupture` : 'Aucune rupture'
      } et ${low.length} sous le seuil de réapprovisionnement.`,
      facts: [...out, ...low]
        .slice(0, 6)
        .map((p) => ({ label: p.name, value: `${p.stock} en stock (seuil ${p.reorderPoint})` })),
    };
  }

  if (/tr[ée]sorerie|caisse|banque|liquidit|cash/.test(q)) {
    return {
      text: `Votre trésorerie disponible s'élève à ${money(s.cashOnHand)}, tous comptes confondus (caisse, mobile money, banque).`,
      facts: [
        { label: 'Trésorerie totale', value: money(s.cashOnHand) },
        { label: 'Créances à encaisser', value: money(s.receivables) },
        { label: 'Dettes à régler', value: money(s.payables) },
      ],
    };
  }

  if (/produit|vend|meilleur|top|article/.test(q)) {
    const perf = productPerformance(db, period.from, period.to);
    if (!perf.length) return { text: `Aucune vente enregistrée ${period.label}.` };
    const best = perf[0];
    return {
      text: `${period.label.charAt(0).toUpperCase() + period.label.slice(1)}, votre meilleur produit est « ${
        best.name
      } » : ${best.qty} unité(s) vendues pour ${money(best.revenue)} de chiffre d'affaires et ${money(
        best.margin,
      )} de marge.`,
      facts: perf.slice(0, 5).map((p) => ({ label: p.name, value: `${p.qty} vendus · ${money(p.revenue)}` })),
    };
  }

  if (/audit|contr[oô]le|coh[ée]rence|anomalie|erreur/.test(q)) {
    const checks = runAuditChecks(db.accounts, db.entries);
    const errors = checks.filter((c) => c.severity === 'ERROR');
    const warns = checks.filter((c) => c.severity === 'WARN');
    return {
      text: errors.length
        ? `${errors.length} anomalie(s) bloquante(s) détectée(s) sur ${checks.length} contrôles. À corriger en priorité.`
        : `Les ${checks.length} contrôles passent${warns.length ? `, avec ${warns.length} avertissement(s)` : ' sans réserve'}.`,
      facts: [...errors, ...warns].map((c) => ({ label: c.label, value: c.detail })),
    };
  }

  if (/bilan|actif|passif|capitaux/.test(q)) {
    const sheet = balanceSheet(db.accounts, db.entries, period.to);
    return {
      text: `Au ${period.to}, votre actif total est de ${money(sheet.totalAssets)}, vos dettes de ${money(
        sheet.totalLiabilities,
      )} et vos capitaux propres (résultat inclus) de ${money(sheet.totalEquity + sheet.netIncome)}. ${
        sheet.difference === 0 ? "L'équation comptable est vérifiée." : 'Un écart est détecté, consultez le module Audit.'
      }`,
      facts: [
        { label: 'Total actif', value: money(sheet.totalAssets) },
        { label: 'Total dettes', value: money(sheet.totalLiabilities) },
        { label: 'Capitaux propres', value: money(sheet.totalEquity + sheet.netIncome) },
      ],
    };
  }

  if (/vente|chiffre|ca\b|revenu|recette/.test(q)) {
    const avg = sales.length ? Math.round(revenue / sales.length) : 0;
    return {
      text: `${period.label.charAt(0).toUpperCase() + period.label.slice(1)}, vous avez réalisé ${money(
        revenue,
      )} de chiffre d'affaires sur ${sales.length} vente(s), soit un panier moyen de ${money(avg)}.`,
      facts: [
        { label: "Chiffre d'affaires", value: money(revenue) },
        { label: 'Nombre de ventes', value: String(sales.length) },
        { label: 'Panier moyen', value: money(avg) },
      ],
    };
  }

  return {
    text: "Je n'ai pas reconnu cette question. Essayez par exemple : « quel est mon chiffre d'affaires ce mois ? », « combien j'ai dépensé cette semaine ? », « qui me doit de l'argent ? », « quel produit se vend le mieux ? » ou « y a-t-il des anomalies comptables ? ».",
  };
}

export function insights(db: DB): { tone: 'good' | 'warn' | 'bad'; text: string }[] {
  const s = snapshot(db);
  const money = (v: Minor) => formatMoney(v, db.company.currency);
  const list: { tone: 'good' | 'warn' | 'bad'; text: string }[] = [];

  if (s.netIncome < 0) {
    list.push({ tone: 'bad', text: `Le résultat du mois est négatif (${money(s.netIncome)}) : les charges dépassent les produits.` });
  } else if (s.revenueMonth > 0) {
    list.push({ tone: 'good', text: `Résultat positif ce mois : ${money(s.netIncome)} pour ${money(s.revenueMonth)} de ventes.` });
  }

  if (s.receivables > 0 && s.receivables > s.cashOnHand) {
    list.push({
      tone: 'warn',
      text: `Vos créances (${money(s.receivables)}) dépassent votre trésorerie (${money(s.cashOnHand)}) : relancez vos clients débiteurs.`,
    });
  }

  if (s.outOfStock > 0) {
    list.push({ tone: 'bad', text: `${s.outOfStock} produit(s) en rupture : chaque jour sans stock est une vente perdue.` });
  }
  if (s.lowStock > 0) {
    list.push({ tone: 'warn', text: `${s.lowStock} produit(s) sous le seuil de réappro : préparez une commande fournisseur.` });
  }

  const errors = runAuditChecks(db.accounts, db.entries).filter((c) => c.severity === 'ERROR');
  if (errors.length) {
    list.push({ tone: 'bad', text: `${errors.length} anomalie(s) comptable(s) bloquante(s) détectée(s) par l'audit automatique.` });
  }

  if (!db.products.length) {
    list.push({ tone: 'warn', text: 'Aucun produit au catalogue : commencez par créer vos références pour utiliser le point de vente.' });
  }

  return list;
}
