import type { DB } from './types';
import { IconBox, IconCard, IconLayers, IconMonitor, IconSettings, IconShield, IconSparkle, IconUsers } from '../components/Icons';

type IconComponent = (p: { className?: string }) => JSX.Element;

export interface Sector {
  id: string;
  label: string;
  hint: string;
  gradient: string;
  icon: IconComponent;
  /** Photo du métier (chemin public), fournie par Beau ; sinon l'icône. */
  image?: string;
}

/** Métiers proposés à l'accueil — le vocabulaire et les exemples s'adaptent ensuite. */
export const SECTORS: Sector[] = [
  { id: 'retail', label: 'Boutique / commerce', hint: 'Vêtements, épicerie, quincaillerie…', gradient: 'from-[#C25E38] to-[#8C3D22]', icon: IconBox },
  { id: 'food', label: 'Restaurant / alimentation', hint: 'Restaurant, snack, traiteur, boulangerie', gradient: 'from-[#B8860B] to-[#7A5A08]', icon: IconLayers },
  { id: 'beauty', label: 'Beauté / coiffure', hint: 'Salon, barbier, onglerie, cosmétiques', gradient: 'from-[#7C5295] to-[#553C6B]', icon: IconSparkle },
  { id: 'garage', label: 'Garage / mécanique', hint: 'Réparation, pièces, entretien', gradient: 'from-[#4A5568] to-[#2D3748]', icon: IconSettings },
  { id: 'services', label: 'Services / artisan', hint: 'Plomberie, couture, photo, conseil…', gradient: 'from-[#2F6D62] to-[#1C4A42]', icon: IconUsers },
  { id: 'health', label: 'Pharmacie / santé', hint: 'Officine, cabinet, parapharmacie', gradient: 'from-[#8C6A3D] to-[#5C4426]', icon: IconShield },
  { id: 'tech', label: 'Électronique / téléphonie', hint: 'Téléphones, accessoires, réparation', gradient: 'from-[#2A3247] to-[#171B26]', icon: IconMonitor },
  { id: 'other', label: 'Autre activité', hint: 'On s’adapte à tout', gradient: 'from-[#D08363] to-[#AC4F2D]', icon: IconCard },
];

export interface Goal {
  id: string;
  label: string;
  hint: string;
  expert?: boolean;
}

export const GOALS: Goal[] = [
  { id: 'sell', label: 'Encaisser mes ventes', hint: 'Un point de vente simple, un reçu par vente' },
  { id: 'cash', label: 'Savoir combien il y a en caisse', hint: 'Ouverture, clôture, écart du jour' },
  { id: 'stock', label: 'Suivre mon stock', hint: 'Ce qu’il reste, ce qui manque, quand recommander' },
  { id: 'debts', label: 'Suivre qui me doit de l’argent', hint: 'Ventes à crédit, acomptes, relances' },
  { id: 'team', label: 'Travailler à plusieurs', hint: 'Caissier, gérant, comptable sur le même espace' },
  { id: 'accounting', label: 'Tenir une vraie comptabilité', hint: 'Journal, grand livre, bilan — comme un cabinet', expert: true },
];

export interface ModuleHelp {
  title: string;
  what: string;
  when: string;
  example: string;
  questions: string[];
}

/** Explication en langage courant de chaque écran. Clé = chemin de la route. */
export const MODULE_HELP: Record<string, ModuleHelp> = {
  '/': {
    title: 'Accueil',
    what: 'Une vue d’ensemble : ce que vous avez vendu, dépensé et gagné, et l’argent disponible.',
    when: 'Chaque matin, ou dès que vous voulez savoir « où j’en suis ».',
    example: 'Si « Résultat net » est en rouge, vous avez dépensé plus que vous n’avez gagné ce mois-ci.',
    questions: ['Quel est mon chiffre d’affaires ce mois ?', 'Où en est ma trésorerie ?', 'Quelle est ma marge ?'],
  },
  '/pos': {
    title: 'Vendre',
    what: 'Le comptoir : vous choisissez les articles, le client paie, la vente est enregistrée avec le stock et la caisse mis à jour automatiquement.',
    when: 'À chaque vente, même petite. C’est ce qui alimente tout le reste.',
    example: 'Un client prend 2 savons et paie en espèces : le stock passe de 20 à 18, la caisse augmente, la vente apparaît dans l’historique.',
    questions: ['Quel produit se vend le mieux ?', 'Combien de ventes aujourd’hui ?'],
  },
  '/caisse': {
    title: 'Caisse',
    what: 'Vous déclarez le fond de caisse le matin, vous comptez le soir : l’application vous dit s’il manque de l’argent ou s’il y en a trop.',
    when: 'Une fois à l’ouverture, une fois à la fermeture.',
    example: 'Fond de 10 000, ventes du jour 45 000 en espèces, dépense 5 000 : il doit y avoir 50 000 dans le tiroir.',
    questions: ['Où en est ma trésorerie ?', 'Combien j’ai dépensé aujourd’hui ?'],
  },
  '/produits': {
    title: 'Produits',
    what: 'La liste de ce que vous vendez, avec le prix de vente, le prix d’achat et la quantité en stock.',
    when: 'Au démarrage pour tout créer, puis quand un prix change ou qu’un nouvel article arrive.',
    example: 'Savon artisanal — acheté 1 500, vendu 2 500 : vous gagnez 1 000 par pièce.',
    questions: ['Quels produits sont en rupture ?', 'Quel produit a la meilleure marge ?'],
  },
  '/achats': {
    title: 'Achats',
    what: 'Ce que vous commandez à vos fournisseurs. À la réception, le stock augmente et la dette envers le fournisseur est suivie.',
    when: 'Quand vous passez commande, puis quand la marchandise arrive.',
    example: 'Commande de 50 savons à 1 400 : à réception, le stock monte de 50 et vous devez 70 000 au fournisseur.',
    questions: ['Combien je dois à mes fournisseurs ?', 'Quels produits sont en rupture ?'],
  },
  '/stock': {
    title: 'Stock',
    what: 'Ce qu’il vous reste à vendre, article par article, et l’historique de chaque entrée ou sortie.',
    when: 'Pour vérifier avant de recommander, ou corriger après un inventaire (casse, perte).',
    example: 'Un carton tombé : ajustement −3 sur « Jus d’ananas » avec le motif « casse ». La perte est comptée.',
    questions: ['Quels produits sont en rupture ?', 'Quelle est la valeur de mon stock ?'],
  },
  '/ventes': {
    title: 'Ventes',
    what: 'Toutes vos ventes passées, avec le client, le mode de paiement et ce qui reste à payer.',
    when: 'Pour retrouver une vente, vérifier un paiement ou voir le détail d’une facture.',
    example: 'Filtrez sur la semaine dernière pour voir combien vous avez encaissé.',
    questions: ['Quel est mon chiffre d’affaires cette semaine ?', 'Qui me doit de l’argent ?'],
  },
  '/devis': {
    title: 'Devis',
    what: 'Une proposition de prix pour un client, sans toucher au stock ni à la caisse tant qu’il n’a pas accepté.',
    when: 'Pour les commandes importantes ou les clients qui veulent réfléchir.',
    example: 'Devis de 120 000 pour une commande de mariage ; à l’acceptation, un clic le transforme en vente.',
    questions: ['Combien de devis en attente ?'],
  },
  '/tiers': {
    title: 'Clients & fournisseurs',
    what: 'Votre carnet d’adresses, avec pour chacun ce qu’il vous doit ou ce que vous lui devez.',
    when: 'Pour vendre à crédit à un client connu, ou suivre un fournisseur régulier.',
    example: 'Enregistrez « Maman Ngo » pour lui vendre à crédit et suivre ses paiements.',
    questions: ['Qui me doit de l’argent ?', 'Combien je dois à mes fournisseurs ?'],
  },
  '/dettes': {
    title: 'Dettes & crédits',
    what: 'D’un côté ce que les clients vous doivent, de l’autre ce que vous devez aux fournisseurs. Chaque règlement s’enregistre ici.',
    when: 'Quand un client vient payer une partie, ou quand vous réglez un fournisseur.',
    example: 'Un client devait 30 000, il donne 10 000 aujourd’hui : il reste 20 000 à suivre.',
    questions: ['Qui me doit de l’argent ?', 'Quelle est ma créance la plus ancienne ?'],
  },
  '/depenses': {
    title: 'Dépenses',
    what: 'Tout ce que vous payez pour faire tourner l’activité : loyer, électricité, transport, salaires…',
    when: 'À chaque sortie d’argent qui n’est pas un achat de marchandise.',
    example: 'Facture d’électricité 15 000 payée en espèces : la caisse baisse et la dépense est classée.',
    questions: ['Combien j’ai dépensé ce mois ?', 'Quel est mon plus gros poste de dépense ?'],
  },
  '/analyse': {
    title: 'Résultats',
    what: 'Vos chiffres expliqués : ce qui se vend, ce qui rapporte, les meilleurs jours, la tendance.',
    when: 'Chaque semaine pour décider quoi recommander, quoi mettre en avant, quoi arrêter.',
    example: 'Si un produit se vend beaucoup mais avec 5 % de marge, il vaut peut-être mieux augmenter son prix.',
    questions: ['Quelle est ma marge ?', 'Quel produit se vend le mieux ?'],
  },
  '/rapports': {
    title: 'Documents',
    what: 'Des documents propres à imprimer ou envoyer : ventes, inventaire, dépenses, résultat…',
    when: 'Pour votre banque, votre comptable, un associé, ou simplement pour archiver.',
    example: 'Le rapport « Inventaire » donne la valeur exacte de votre stock à ce jour.',
    questions: ['Y a-t-il des anomalies comptables ?'],
  },
  '/livre-caisse': {
    title: 'Livre de caisse',
    what: 'La liste de tout l’argent entré et sorti, jour par jour. C’est le document que demande un contrôleur ou un comptable.',
    when: 'Pour justifier vos mouvements d’argent sur une période.',
    example: 'Du 1er au 30 : 450 000 entrés, 380 000 sortis, solde 70 000.',
    questions: ['Où en est ma trésorerie ?'],
  },
  '/journal': {
    title: 'Journal des écritures',
    what: 'La comptabilité en partie double : chaque opération est enregistrée deux fois (d’où l’argent vient, où il va). L’application le fait pour vous.',
    when: 'Réservé aux comptables ou aux curieux. Vous n’avez rien à saisir ici au quotidien.',
    example: 'Une vente de 2 500 en espèces : Caisse +2 500 (débit) / Ventes +2 500 (crédit).',
    questions: ['Y a-t-il des anomalies comptables ?'],
  },
  '/grand-livre': {
    title: 'Grand livre',
    what: 'Le détail d’un compte comptable, mouvement par mouvement, avec le solde après chaque ligne.',
    when: 'Pour vérifier un compte précis (la caisse, un fournisseur, les ventes).',
    example: 'Le compte « Caisse » montre chaque entrée et sortie d’espèces.',
    questions: ['Où en est ma trésorerie ?'],
  },
  '/balance': {
    title: 'Balance générale',
    what: 'Tous les comptes avec leurs totaux. Si débit = crédit, la comptabilité est juste.',
    when: 'En fin de mois ou avant de produire le bilan.',
    example: 'Un écart entre débit et crédit signale une saisie manuelle erronée.',
    questions: ['Y a-t-il des anomalies comptables ?'],
  },
  '/etats': {
    title: 'Bilan & résultat',
    what: 'Les deux documents officiels : ce que vous possédez et devez (bilan), ce que vous avez gagné (résultat).',
    when: 'Pour la banque, les impôts, un investisseur — ou pour vous.',
    example: 'Résultat net positif = bénéfice ; négatif = perte.',
    questions: ['Quel est mon bilan ?', 'Quelle est ma marge ?'],
  },
  '/plan-comptable': {
    title: 'Plan comptable',
    what: 'La liste des comptes utilisés, numérotés selon le référentiel choisi (SYSCOHADA, PCG…).',
    when: 'Pour un comptable qui veut vérifier les imputations.',
    example: 'En SYSCOHADA, la caisse est le compte 571, les ventes le 701.',
    questions: [],
  },
  '/audit': {
    title: 'Audit',
    what: 'Des contrôles automatiques qui vérifient que tout est cohérent : écritures équilibrées, stock qui correspond, bilan qui tombe juste.',
    when: 'Avant de remettre vos documents à quelqu’un, ou si un chiffre vous paraît étrange.',
    example: 'Un score de 100 signifie qu’aucune anomalie n’a été détectée.',
    questions: ['Y a-t-il des anomalies comptables ?'],
  },
  '/historique': {
    title: 'Historique',
    what: 'Qui a fait quoi, et quand. Chaque action de chaque membre est tracée et ne peut pas être effacée.',
    when: 'Pour comprendre une modification, ou vérifier le travail d’un employé.',
    example: '« Awa a enregistré la vente FA-00012 à 14 h 32 ».',
    questions: [],
  },
  '/equipe': {
    title: 'Équipe',
    what: 'Les personnes qui travaillent sur cet espace avec vous, et ce que chacune a le droit de faire.',
    when: 'Pour ajouter un caissier, un gérant ou votre comptable.',
    example: 'Un caissier peut vendre et gérer le stock, mais ne voit ni la comptabilité ni les paramètres.',
    questions: [],
  },
  '/parametres': {
    title: 'Paramètres',
    what: 'Le nom de l’entreprise, la devise, le mode d’affichage (simple ou expert) et le référentiel comptable.',
    when: 'Au démarrage, puis rarement.',
    example: 'Passez en mode Expert pour faire apparaître le journal, la balance et le bilan.',
    questions: [],
  },
  '/assistant': {
    title: 'Assistant',
    what: 'Posez vos questions en français, l’assistant répond avec vos vrais chiffres.',
    when: 'Dès que vous vous demandez « combien », « qui » ou « lequel ».',
    example: '« Qui me doit de l’argent ? » → la liste des clients avec le montant.',
    questions: [],
  },
};

export interface ChecklistStep {
  id: string;
  label: string;
  hint: string;
  to: string;
  done: boolean;
}

/** Les premières étapes, cochées automatiquement à partir des vraies données. */
export function startChecklist(db: DB): ChecklistStep[] {
  return [
    { id: 'company', label: 'Nommer mon entreprise et choisir ma devise', hint: '30 secondes', to: '/parametres', done: db.company.onboarded },
    { id: 'products', label: 'Créer mes premiers produits', hint: 'Nom, prix de vente, prix d’achat, stock', to: '/produits', done: db.products.length > 0 },
    { id: 'cash', label: 'Ouvrir la caisse avec le fond du jour', hint: 'Pour savoir ce soir s’il manque de l’argent', to: '/caisse', done: db.sessions.length > 0 },
    { id: 'sale', label: 'Enregistrer ma première vente', hint: 'Depuis « Vendre »', to: '/pos', done: db.sales.some((s) => s.status === 'CONFIRMED') },
    { id: 'expense', label: 'Noter une dépense', hint: 'Loyer, électricité, transport…', to: '/depenses', done: db.expenses.length > 0 },
    { id: 'results', label: 'Regarder mes résultats', hint: 'Marge, meilleur produit, tendance', to: '/analyse', done: db.sales.filter((s) => s.status === 'CONFIRMED').length >= 3 },
  ];
}
