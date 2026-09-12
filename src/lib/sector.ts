import type { AccountKey } from './chart';

/**
 * Ce qui change vraiment d'un métier à l'autre : les mots, les exemples, les
 * postes de dépense qui reviennent, et les premiers articles à créer.
 * Un garagiste ne vend pas des « produits » mais des pièces et des heures ;
 * un restaurant vend des plats. Les écrans restent les mêmes, le vocabulaire
 * et les suggestions suivent le métier choisi à l'inscription.
 */

export interface SectorProfile {
  id: string;
  /** Mot pour un article vendu, au singulier et au pluriel. */
  item: string;
  items: string;
  /** Titre et sous-titre de l'écran des articles. */
  itemsTitle: string;
  itemsSubtitle: string;
  /** Mot pour la personne servie, au singulier et au pluriel. */
  customer: string;
  customers: string;
  /** Ce qu'on encaisse : une vente, une addition, une intervention… */
  sale: string;
  sales: string;
  /** Ce que dit le bouton d'encaissement dans le menu. */
  sell: string;
  /**
   * Faux pour un métier qui vend surtout du temps : coiffure, conseil,
   * services. Les écrans Stock et Achats sortent du menu, et la fiche d'un
   * article ne demande plus de quantité. Le réglage reste modifiable : un
   * salon qui revend des crèmes peut le remettre dans les paramètres.
   */
  tracksStock: boolean;
  /** Exemples d'articles proposés au démarrage. */
  examples: { name: string; category: string; unit: string }[];
  /** Postes de dépense les plus fréquents, mis en tête des listes. */
  expenses: AccountKey[];
  /** Conseil concret affiché sur l'accueil du métier. */
  tip: string;
}

const RETAIL: SectorProfile = {
  id: 'retail',
  item: 'Produit',
  items: 'Produits',
  itemsTitle: 'Produits',
  itemsSubtitle: 'Ce que vous vendez, avec le prix, le coût et le stock',
  customer: 'Client',
  customers: 'Clients',
  sale: 'Vente',
  sales: 'Ventes',
  sell: 'Vendre',
  tracksStock: true,
  examples: [
    { name: 'Sac de riz 25 kg', category: 'Épicerie', unit: 'sac' },
    { name: 'Huile végétale 5 L', category: 'Épicerie', unit: 'bidon' },
    { name: 'Savon de ménage', category: 'Entretien', unit: 'carton' },
  ],
  expenses: ['PURCHASES', 'RENT', 'UTILITIES', 'TRANSPORT', 'PAYROLL'],
  tip: 'Réglez un seuil de réapprovisionnement sur vos articles qui tournent vite : l’accueil vous prévient avant la rupture.',
};

export const SECTOR_PROFILES: Record<string, SectorProfile> = {
  retail: RETAIL,
  food: {
    id: 'food',
    item: 'Plat',
    items: 'Plats et boissons',
    itemsTitle: 'Carte',
    itemsSubtitle: 'Vos plats et boissons, avec le prix de vente et le coût des ingrédients',
    customer: 'Table',
    customers: 'Tables et clients',
    sale: 'Addition',
    sales: 'Additions',
    sell: 'Encaisser',
    tracksStock: true,
    examples: [
      { name: 'Poulet DG', category: 'Plats', unit: 'assiette' },
      { name: 'Riz sauté', category: 'Plats', unit: 'assiette' },
      { name: 'Jus de bissap', category: 'Boissons', unit: 'verre' },
    ],
    expenses: ['PURCHASES', 'UTILITIES', 'PAYROLL', 'RENT', 'TRANSPORT'],
    tip: 'Mettez le coût des ingrédients sur chaque plat : la marge par plat apparaît alors dans « Résultats ».',
  },
  beauty: {
    id: 'beauty',
    item: 'Prestation',
    items: 'Prestations et produits',
    itemsTitle: 'Prestations',
    itemsSubtitle: 'Vos services et les produits revendus, avec leur prix',
    customer: 'Cliente',
    customers: 'Clientes',
    sale: 'Prestation',
    sales: 'Prestations réalisées',
    sell: 'Encaisser',
    // Un salon vend d'abord du temps. Le stock de crèmes existe, mais il ne
    // doit pas être la colonne vertébrale de l'écran.
    tracksStock: false,
    examples: [
      { name: 'Coupe et brushing', category: 'Coiffure', unit: 'prestation' },
      { name: 'Pose d’ongles', category: 'Onglerie', unit: 'prestation' },
      { name: 'Crème hydratante', category: 'Produits', unit: 'pièce' },
    ],
    expenses: ['PURCHASES', 'RENT', 'UTILITIES', 'PAYROLL', 'SERVICES'],
    tip: 'Créez vos prestations comme des articles sans stock : le chiffre d’affaires par prestation se suit tout seul.',
  },
  garage: {
    id: 'garage',
    item: 'Pièce ou intervention',
    items: 'Pièces et interventions',
    itemsTitle: 'Pièces et interventions',
    itemsSubtitle: 'Les pièces en stock et les interventions facturées à l’heure ou au forfait',
    customer: 'Client',
    customers: 'Clients',
    sale: 'Intervention',
    sales: 'Interventions',
    sell: 'Facturer',
    tracksStock: true,
    examples: [
      { name: 'Vidange complète', category: 'Interventions', unit: 'forfait' },
      { name: 'Plaquettes de frein', category: 'Pièces', unit: 'jeu' },
      { name: 'Heure de main-d’œuvre', category: 'Interventions', unit: 'heure' },
    ],
    expenses: ['PURCHASES', 'RENT', 'UTILITIES', 'TRANSPORT', 'PAYROLL'],
    tip: 'Faites un devis avant l’intervention : il devient une facture en un clic, avec l’acompte déjà encaissé.',
  },
  services: {
    id: 'services',
    item: 'Prestation',
    items: 'Prestations',
    itemsTitle: 'Prestations et fournitures',
    itemsSubtitle: 'Ce que vous facturez : main-d’œuvre, forfaits, fournitures',
    customer: 'Client',
    customers: 'Clients',
    sale: 'Chantier',
    sales: 'Chantiers facturés',
    sell: 'Facturer',
    tracksStock: false,
    examples: [
      { name: 'Journée de main-d’œuvre', category: 'Main-d’œuvre', unit: 'jour' },
      { name: 'Déplacement', category: 'Forfaits', unit: 'forfait' },
      { name: 'Fournitures diverses', category: 'Fournitures', unit: 'lot' },
    ],
    expenses: ['PURCHASES', 'TRANSPORT', 'SERVICES', 'PAYROLL', 'TAXES'],
    tip: 'Ouvrez un projet par chantier : achats, main-d’œuvre et encaissements s’y rattachent, et la marge du chantier s’affiche.',
  },
  health: {
    id: 'health',
    item: 'Référence',
    items: 'Références',
    itemsTitle: 'Références',
    itemsSubtitle: 'Vos références, avec le prix, le coût et le stock',
    customer: 'Patient',
    customers: 'Patients',
    sale: 'Vente',
    sales: 'Ventes',
    sell: 'Vendre',
    tracksStock: true,
    examples: [
      { name: 'Paracétamol 500 mg', category: 'Médicaments', unit: 'boîte' },
      { name: 'Compresses stériles', category: 'Matériel', unit: 'sachet' },
      { name: 'Crème solaire', category: 'Parapharmacie', unit: 'tube' },
    ],
    expenses: ['PURCHASES', 'RENT', 'UTILITIES', 'PAYROLL', 'TAXES'],
    tip: 'Le seuil de réapprovisionnement évite les ruptures sur les références qui ne se remplacent pas en un jour.',
  },
  tech: {
    id: 'tech',
    item: 'Appareil',
    items: 'Appareils et accessoires',
    itemsTitle: 'Appareils et accessoires',
    itemsSubtitle: 'Ce que vous vendez et réparez, avec le prix et le stock',
    customer: 'Client',
    customers: 'Clients',
    sale: 'Vente',
    sales: 'Ventes',
    sell: 'Vendre',
    tracksStock: true,
    examples: [
      { name: 'Écran de remplacement', category: 'Pièces', unit: 'pièce' },
      { name: 'Chargeur rapide', category: 'Accessoires', unit: 'pièce' },
      { name: 'Réparation écran', category: 'Réparations', unit: 'forfait' },
    ],
    expenses: ['PURCHASES', 'RENT', 'TRANSPORT', 'SERVICES', 'PAYROLL'],
    tip: 'Les réparations se créent comme des articles sans stock : on suit le chiffre d’affaires de l’atelier à part.',
  },
  trade: {
    id: 'trade',
    item: 'Marchandise',
    items: 'Marchandises',
    itemsTitle: 'Marchandises',
    itemsSubtitle: 'Ce que vous importez et revendez, avec le coût rendu magasin et le stock',
    customer: 'Client',
    customers: 'Clients',
    sale: 'Vente',
    sales: 'Ventes',
    sell: 'Vendre',
    tracksStock: true,
    examples: [
      { name: 'Carton de tuiles 30×30', category: 'Matériaux', unit: 'carton' },
      { name: 'Groupe électrogène 5 kVA', category: 'Équipement', unit: 'pièce' },
      { name: 'Sac de riz parfumé 50 kg', category: 'Alimentaire', unit: 'sac' },
    ],
    expenses: ['PURCHASES', 'TRANSPORT', 'TAXES', 'SERVICES', 'FINANCIAL'],
    tip: 'Sur un achat à l’étranger, saisissez la douane, le fret et le transit dans « Frais d’approche » : ils entrent dans le coût du stock et la marge devient vraie.',
  },
  other: { ...RETAIL, id: 'other' },
};

export function sectorProfile(sector: string): SectorProfile {
  return SECTOR_PROFILES[sector] ?? RETAIL;
}

/**
 * Est-ce que cette entreprise suit un stock ? Le métier donne la réponse par
 * défaut, mais le réglage de l'entreprise gagne toujours : un salon qui
 * revend des produits coche la case, une boutique qui ne vend que des
 * services la décoche.
 */
export function tracksStock(company: { sector: string; tracksStock?: boolean }): boolean {
  return company.tracksStock ?? sectorProfile(company.sector).tracksStock;
}
