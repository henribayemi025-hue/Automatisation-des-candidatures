import { parseStatement } from './statement';
import { toMinor } from './money';
import type { Minor } from './types';

/**
 * Décoder UN message mobile money.
 *
 * Demandé par Beau : que l'application lise les SMS MTN ou Orange et en fasse
 * des écritures. Alpha a vérifié le chemin technique : lire les SMS tout seul
 * demande une permission Android sous contrôle de Google Play, dont l'usage
 * « lire les messages mobile money » ne fait pas partie — le risque n'est pas
 * un refus technique mais le retrait du magasin. Sur iPhone, aucune interface
 * n'existe. La voie qui marche partout et sans aucune autorisation : la
 * personne PARTAGE le message vers l'application.
 *
 * Ce fichier ne s'occupe que de la lecture du texte. Le partage est un
 * raccordement d'écran ; la comptabilité est ici.
 *
 * On réutilise `parseStatement`, qui sait déjà trouver le sens, le montant et
 * la date — vérifié sur huit formes de messages, il les trouve toutes. Ce qui
 * manquait, et qui est ajouté ici :
 *
 * - LA CONTREPARTIE. « Reçu de qui » est ce que la commerçante lira dans son
 *   journal, et ce qui lui permettra de rapprocher plus tard.
 * - LES FRAIS. C'est un point comptable, pas un détail d'affichage : des frais
 *   de 100 FCFA sur un transfert sont une CHARGE, pas une diminution de la
 *   somme envoyée. Les fondre dans le montant fausse à la fois le compte de
 *   tiers et le résultat. Ils sortent d'ici comme un montant à part, et c'est
 *   à l'écran de proposer la deuxième ligne.
 * - LA RÉFÉRENCE de l'opérateur, qui évite d'enregistrer deux fois le même
 *   message partagé deux fois.
 */

export interface MomoSms {
  direction: 'IN' | 'OUT' | 'UNKNOWN';
  /** Montant de l'opération, hors frais. */
  amount: Minor;
  /** Frais retenus par l'opérateur. Zéro si le message n'en porte pas. */
  fee: Minor;
  /** Qui a envoyé ou reçu : un nom, un numéro, ou vide. */
  counterparty: string;
  /** Référence de l'opérateur, pour ne pas enregistrer deux fois. */
  reference: string;
  date: string;
  /** Solde annoncé par l'opérateur. Zéro si absent. Sert à comparer, jamais à écrire. */
  balance: Minor;
  /** Le texte d'origine, gardé tel quel : on ne jette pas la pièce. */
  raw: string;
}

/** « Frais : 100 FCFA », « Fee 0 XAF », « frais de 200 F ». */
const FRAIS = /\b(?:frais|fee|fees|commission)\b\s*(?:de\s*)?[:=]?\s*([\d\s.,]+)/i;

/** « Ref: 1234567890 », « TxId 998877 », « ID transaction : ABC123 ». */
const REFERENCE = /\b(?:r[eé]f(?:[eé]rence)?|ref|txid|tx|id(?:\s+de)?(?:\s+transaction)?|transaction\s*id)\b\s*[:=#]?\s*([A-Z0-9]{5,})/i;

/** « Nouveau solde : 47 350 FCFA », « New balance 47,350 XAF ». */
const SOLDE = /\b(?:nouveau\s+solde|new\s+balance|solde|balance)\b\s*[:=]?\s*([\d\s.,]+)/i;

/**
 * La contrepartie.
 *
 * Ordre volontaire : un NOM avant un numéro. Quelqu'un reconnaît « JEANNE
 * MBALLA » dans son journal ; personne ne reconnaît « 237699411208 ».
 */
const NOM_APRES = /\b(?:de|from|a|à|to|vers|chez|au\s+point\s+marchand)\s+((?:[A-ZÀ-Ý][\wÀ-ÿ'’-]*(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'’-]*){0,3}))/;
const NUMERO = /\b(\+?\d{8,15})\b/;

function montant(texte: string, source: string | undefined, devise: string): Minor {
  if (!source) return 0;
  const propre = source.replace(/\s/g, '').replace(/,(?=\d{3}\b)/g, '');
  const n = Number(propre.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return 0;
  return toMinor(n, devise);
}

export function parseMomoSms(texte: string, devise: string, todayISO: string): MomoSms | null {
  const brut = texte.trim();
  if (brut.length < 8) return null;

  // Une seule ligne : on donne le message entier à `parseStatement`, qui sait
  // écarter le solde avant de chercher le montant.
  const [ligne] = parseStatement(brut.replace(/\r?\n/g, ' '), devise, todayISO);
  if (!ligne) return null;

  const fee = montant(brut, brut.match(FRAIS)?.[1], devise);
  const balance = montant(brut, brut.match(SOLDE)?.[1], devise);
  const reference = (brut.match(REFERENCE)?.[1] ?? '').toUpperCase();

  // Le nom se cherche APRÈS avoir retiré ce qui n'est pas un nom : les mots de
  // l'opérateur en tête (« OM: »), les montants, les dates.
  const sansChiffres = brut
    .replace(/\b(?:fcfa|xaf|xof|f\b|usd|eur)\b/gi, ' ')
    .replace(/[\d\s.,]{3,}/g, ' ');
  const nom = sansChiffres.match(NOM_APRES)?.[1]?.trim() ?? '';
  const numero = brut.match(NUMERO)?.[1] ?? '';
  const counterparty = nom && !/^(?:frais|fee|solde|balance|ref)$/i.test(nom) ? nom : numero;

  return {
    direction: ligne.direction,
    amount: ligne.amount,
    fee,
    counterparty,
    reference,
    date: ligne.date,
    balance,
    raw: brut,
  };
}

/**
 * Le libellé qu'on écrira dans le journal.
 *
 * Court, et dans les mots de la personne : « Reçu de Jeanne Mballa », pas
 * « Vous avez recu de JEANNE MBALLA. Frais: 0 ».
 */
export function libelleMomo(sms: MomoSms): string {
  const qui = sms.counterparty;
  if (sms.direction === 'IN') return qui ? `Reçu de ${qui}` : 'Reçu mobile money';
  if (sms.direction === 'OUT') return qui ? `Envoyé à ${qui}` : 'Envoi mobile money';
  return qui ? `Mobile money — ${qui}` : 'Mobile money';
}

/**
 * Déjà enregistré ?
 *
 * Sur la référence de l'opérateur quand elle existe — c'est le seul identifiant
 * sûr, et quelqu'un partage volontiers deux fois le même message. Sans
 * référence, on ne devine pas : on laisse la personne décider.
 */
export function dejaVu(sms: MomoSms, referencesConnues: string[]): boolean {
  return !!sms.reference && referencesConnues.includes(sms.reference);
}
