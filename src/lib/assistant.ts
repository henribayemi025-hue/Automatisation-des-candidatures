import { accountCode } from './chart';
import { balanceSheet, incomeStatement, runAuditChecks } from './ledger';
import { monthStart, outstanding, productPerformance, saleRevenue, snapshot } from './metrics';
import { formatMoney, formatPercent } from './money';
import { t } from './i18n';
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

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function resolvePeriod(q: string): Period {
  const today = new Date().toISOString().slice(0, 10);
  if (/aujourd|ce jour|today/.test(q)) return { from: today, to: today, label: t("aujourd'hui") };
  if (/hier|yesterday/.test(q)) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.toISOString().slice(0, 10);
    return { from: y, to: y, label: t('hier') };
  }
  if (/semaine|7 jours|sept jours|week/.test(q)) {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().slice(0, 10), to: today, label: t('ces 7 derniers jours') };
  }
  if (/30 jours|trente jours|30 days/.test(q)) {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return { from: d.toISOString().slice(0, 10), to: today, label: t('ces 30 derniers jours') };
  }
  if (/an(n[ée]e)?|exercice|year/.test(q)) {
    return { from: `${new Date().getFullYear()}-01-01`, to: today, label: t('cette année') };
  }
  return { from: monthStart(), to: today, label: t('ce mois-ci') };
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

  const sales = db.sales.filter((x) => x.status === 'CONFIRMED' && x.date >= period.from && x.date <= period.to);
  const revenue = sales.reduce((acc, x) => acc + saleRevenue(x), 0);
  const income = incomeStatement(db.accounts, db.entries, period.from, period.to);
  const cogsCode = accountCode(db.company.chart, 'INVENTORY_CHANGE');
  const cogs = income.expenses.find((e) => e.account.code === cogsCode)?.balance ?? 0;

  if (!q) return { text: t('Posez une question sur vos chiffres : ventes, dépenses, marge, stock, créances…') };

  if (/d[ée]pens|charge|co[uû]t|spend|expense/.test(q) && !/marge|margin/.test(q)) {
    const list = db.expenses.filter((e) => e.date >= period.from && e.date <= period.to);
    const total = list.reduce((acc, e) => acc + e.amount, 0);
    const byCat = new Map<string, number>();
    for (const e of list) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
    const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      text:
        t('Vous avez dépensé {total} {period}, réparti sur {n} dépense(s).', { total: money(total), period: period.label, n: list.length }) +
        (top ? t(' Le premier poste est « {cat} » avec {amount}.', { cat: t(top[0]), amount: money(top[1]) }) : ''),
      facts: [
        { label: t('Total dépenses'), value: money(total) },
        { label: t('Nombre'), value: String(list.length) },
        { label: t('Charges comptables totales'), value: money(income.totalExpenses) },
      ],
    };
  }

  if (/marge|rentab|b[ée]n[ée]fice|r[ée]sultat|profit|margin/.test(q)) {
    const gross = revenue - cogs;
    const rate = revenue > 0 ? (gross / revenue) * 100 : 0;
    return {
      text: t("{period}, votre marge brute est de {gross} pour {revenue} de chiffre d'affaires, soit un taux de {rate}. Après toutes les charges, le résultat net s'établit à {net}.", {
        period: cap(period.label),
        gross: money(gross),
        revenue: money(revenue),
        rate: formatPercent(rate),
        net: money(income.netIncome),
      }),
      facts: [
        { label: t("Chiffre d'affaires"), value: money(revenue) },
        { label: t('Coût des ventes'), value: money(cogs) },
        { label: t('Marge brute'), value: money(gross) },
        { label: t('Résultat net'), value: money(income.netIncome) },
      ],
    };
  }

  if (/cr[ée]ance|doit|dette client|impay|recouvr|owe|receivable/.test(q) && !/fournisseur|supplier|je dois/.test(q)) {
    const debts = db.debts.filter((d) => d.party === 'CUSTOMER' && outstanding(d) > 0);
    const sorted = debts.sort((a, b) => outstanding(b) - outstanding(a));
    return {
      text: debts.length
        ? t('{n} client(s) vous doivent au total {total}. Le plus gros encours est {name} avec {amount}.', {
            n: debts.length,
            total: money(s.receivables),
            name: sorted[0].partyName,
            amount: money(outstanding(sorted[0])),
          })
        : t("Aucun client ne vous doit d'argent : toutes les créances sont soldées."),
      facts: sorted.slice(0, 5).map((d) => ({ label: d.partyName, value: money(outstanding(d)) })),
    };
  }

  if (/fournisseur|je dois|dette|supplier/.test(q)) {
    const debts = db.debts.filter((d) => d.party === 'SUPPLIER' && outstanding(d) > 0);
    return {
      text: debts.length
        ? t('Vous devez {total} à {n} fournisseur(s).', { total: money(s.payables), n: debts.length })
        : t("Vous n'avez aucune dette fournisseur en cours."),
      facts: debts.slice(0, 5).map((d) => ({ label: d.partyName, value: money(outstanding(d)) })),
    };
  }

  if (/stock|rupture|inventaire|r[ée]appro|inventory|out of stock/.test(q)) {
    const active = db.products.filter((p) => !p.archived);
    const out = active.filter((p) => p.stock <= 0);
    const low = active.filter((p) => p.stock > 0 && p.stock <= p.reorderPoint);
    return {
      text: t('Votre stock est valorisé à {value} sur {n} référence(s). {out} et {low} sous le seuil de réapprovisionnement.', {
        value: money(s.stockValue),
        n: active.length,
        out: out.length ? t('{n} produit(s) en rupture', { n: out.length }) : t('Aucune rupture'),
        low: low.length,
      }),
      facts: [...out, ...low].slice(0, 6).map((p) => ({ label: p.name, value: t('{n} en stock (seuil {r})', { n: p.stock, r: p.reorderPoint }) })),
    };
  }

  if (/tr[ée]sorerie|caisse|banque|liquidit|cash/.test(q)) {
    return {
      text: t("Votre trésorerie disponible s'élève à {cash}, tous comptes confondus (caisse, mobile money, banque).", { cash: money(s.cashOnHand) }),
      facts: [
        { label: t('Trésorerie totale'), value: money(s.cashOnHand) },
        { label: t('Créances à encaisser'), value: money(s.receivables) },
        { label: t('Dettes à régler'), value: money(s.payables) },
      ],
    };
  }

  if (/produit|vend|meilleur|top|article|product|best/.test(q)) {
    const perf = productPerformance(db, period.from, period.to);
    if (!perf.length) return { text: t('Aucune vente enregistrée {period}.', { period: period.label }) };
    const best = perf[0];
    return {
      text: t("{period}, votre meilleur produit est « {name} » : {qty} unité(s) vendues pour {revenue} de chiffre d'affaires et {margin} de marge.", {
        period: cap(period.label),
        name: best.name,
        qty: best.qty,
        revenue: money(best.revenue),
        margin: money(best.margin),
      }),
      facts: perf.slice(0, 5).map((p) => ({ label: p.name, value: t('{qty} vendus · {revenue}', { qty: p.qty, revenue: money(p.revenue) }) })),
    };
  }

  if (/audit|contr[oô]le|coh[ée]rence|anomalie|erreur|anomal|error/.test(q)) {
    const checks = runAuditChecks(db.accounts, db.entries);
    const errors = checks.filter((c) => c.severity === 'ERROR');
    const warns = checks.filter((c) => c.severity === 'WARN');
    return {
      text: errors.length
        ? t('{n} anomalie(s) bloquante(s) détectée(s) sur {total} contrôles. À corriger en priorité.', { n: errors.length, total: checks.length })
        : t('Les {n} contrôles passent{warn}.', { n: checks.length, warn: warns.length ? t(', avec {n} avertissement(s)', { n: warns.length }) : t(' sans réserve') }),
      facts: [...errors, ...warns].map((c) => ({ label: c.label, value: c.detail })),
    };
  }

  if (/bilan|actif|passif|capitaux|balance sheet|assets/.test(q)) {
    const sheet = balanceSheet(db.accounts, db.entries, period.to);
    return {
      text: t('Au {date}, votre actif total est de {assets}, vos dettes de {liabilities} et vos capitaux propres (résultat inclus) de {equity}. {check}', {
        date: period.to,
        assets: money(sheet.totalAssets),
        liabilities: money(sheet.totalLiabilities),
        equity: money(sheet.totalEquity + sheet.netIncome),
        check: sheet.difference === 0 ? t("L'équation comptable est vérifiée.") : t('Un écart est détecté, consultez le module Audit.'),
      }),
      facts: [
        { label: t('Total actif'), value: money(sheet.totalAssets) },
        { label: t('Total dettes'), value: money(sheet.totalLiabilities) },
        { label: t('Capitaux propres'), value: money(sheet.totalEquity + sheet.netIncome) },
      ],
    };
  }

  if (/vente|chiffre|ca\b|revenu|recette|sales|revenue/.test(q)) {
    const avg = sales.length ? Math.round(revenue / sales.length) : 0;
    return {
      text: t("{period}, vous avez réalisé {revenue} de chiffre d'affaires sur {n} vente(s), soit un panier moyen de {avg}.", {
        period: cap(period.label),
        revenue: money(revenue),
        n: sales.length,
        avg: money(avg),
      }),
      facts: [
        { label: t("Chiffre d'affaires"), value: money(revenue) },
        { label: t('Nombre de ventes'), value: String(sales.length) },
        { label: t('Panier moyen'), value: money(avg) },
      ],
    };
  }

  return {
    text: t("Je n'ai pas reconnu cette question. Essayez par exemple : « quel est mon chiffre d'affaires ce mois ? », « combien j'ai dépensé cette semaine ? », « qui me doit de l'argent ? », « quel produit se vend le mieux ? » ou « y a-t-il des anomalies comptables ? »."),
  };
}

export function insights(db: DB): { tone: 'good' | 'warn' | 'bad'; text: string }[] {
  const s = snapshot(db);
  const money = (v: Minor) => formatMoney(v, db.company.currency);
  const list: { tone: 'good' | 'warn' | 'bad'; text: string }[] = [];

  if (s.netIncome < 0) {
    list.push({ tone: 'bad', text: t('Le résultat du mois est négatif ({net}) : les charges dépassent les produits.', { net: money(s.netIncome) }) });
  } else if (s.revenueMonth > 0) {
    list.push({ tone: 'good', text: t('Résultat positif ce mois : {net} pour {revenue} de ventes.', { net: money(s.netIncome), revenue: money(s.revenueMonth) }) });
  }

  if (s.receivables > 0 && s.receivables > s.cashOnHand) {
    list.push({ tone: 'warn', text: t('Vos créances ({receivables}) dépassent votre trésorerie ({cash}) : relancez vos clients débiteurs.', { receivables: money(s.receivables), cash: money(s.cashOnHand) }) });
  }

  if (s.outOfStock > 0) list.push({ tone: 'bad', text: t('{n} produit(s) en rupture : chaque jour sans stock est une vente perdue.', { n: s.outOfStock }) });
  if (s.lowStock > 0) list.push({ tone: 'warn', text: t('{n} produit(s) sous le seuil de réappro : préparez une commande fournisseur.', { n: s.lowStock }) });

  const errors = runAuditChecks(db.accounts, db.entries).filter((c) => c.severity === 'ERROR');
  if (errors.length) list.push({ tone: 'bad', text: t("{n} anomalie(s) comptable(s) bloquante(s) détectée(s) par l'audit automatique.", { n: errors.length }) });

  if (!db.products.length) list.push({ tone: 'warn', text: t('Aucun produit au catalogue : commencez par créer vos références pour utiliser le point de vente.') });

  return list;
}
