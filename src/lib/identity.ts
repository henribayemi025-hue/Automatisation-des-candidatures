import { t } from './i18n';

/**
 * Se connecter avec un numéro de téléphone plutôt qu'avec un email.
 *
 * Beaucoup de gens n'utilisent pas leur boîte mail mais connaissent leur
 * numéro par cœur. On ne vérifie PAS le numéro pour l'instant : il n'y a pas
 * d'envoi de SMS, donc pas de preuve de possession. Le numéro sert d'identifiant
 * et de rien d'autre ; ce qui protège le compte, c'est le mot de passe.
 *
 * Techniquement, le numéro devient une adresse interne `237699…@tel.finjaro.net`
 * pour réutiliser exactement le même mécanisme d'authentification que l'email —
 * aucune deuxième façon de se connecter à maintenir. Cette adresse n'est jamais
 * montrée telle quelle et ne reçoit aucun courrier.
 */

export const PHONE_DOMAIN = 'tel.finjaro.net';

/** Reconnaît une saisie qui ressemble à un numéro plutôt qu'à un email. */
export function looksLikePhone(input: string): boolean {
  const v = input.trim();
  if (!v || v.includes('@')) return false;
  return /^[+\d][\d\s().-]{5,}$/.test(v);
}

/** Ne garde que les chiffres. Le « + » disparaît, l'indicatif reste. */
export function phoneDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Adresse interne d'un numéro. Deux personnes de pays différents peuvent avoir
 * le même numéro local : sans indicatif, on refuse plutôt que de les mélanger.
 */
export function phoneAddress(input: string): string {
  return `${phoneDigits(input)}@${PHONE_DOMAIN}`;
}

/** Vrai si l'adresse est un numéro déguisé, et non un vrai email. */
export function isPhoneAddress(address: string | null | undefined): boolean {
  return !!address && address.endsWith(`@${PHONE_DOMAIN}`);
}

/** Numéro lisible à partir de l'adresse interne : 237699123456 → +237 699 123 456. */
export function prettyPhone(address: string): string {
  const digits = address.split('@')[0];
  if (!digits) return address;
  const groups = digits.slice(3).replace(/(\d{3})(?=\d)/g, '$1 ');
  return `+${digits.slice(0, 3)} ${groups}`.trim();
}

/** Ce qu'on affiche à la place de l'email quand la personne s'est inscrite par téléphone. */
export function displayIdentity(email: string | null | undefined): string {
  if (!email) return '';
  return isPhoneAddress(email) ? prettyPhone(email) : email;
}

/**
 * Transforme la saisie en identifiant de connexion, ou renvoie l'erreur à
 * montrer. Un email passe tel quel ; un numéro doit porter son indicatif pays,
 * sinon deux numéros identiques dans deux pays deviendraient le même compte.
 */
export interface LoginId {
  /** Adresse à envoyer à l'authentification, ou null si la saisie est refusée. */
  address: string | null;
  /** Message à montrer quand l'adresse est null. */
  error: string | null;
}

export function toLogin(input: string): LoginId {
  const value = input.trim();
  const refuse = (error: string): LoginId => ({ address: null, error });
  if (!value) return refuse(t('Entrez votre email ou votre numéro de téléphone.'));
  if (value.includes('@')) return { address: value.toLowerCase(), error: null };
  if (!looksLikePhone(value)) return refuse(t('Entrez une adresse email valide, ou un numéro de téléphone.'));

  const digits = phoneDigits(value);
  if (digits.length < 8) return refuse(t('Numéro trop court.'));
  if (digits.length > 15) return refuse(t('Numéro trop long.'));
  if (!value.startsWith('+') && digits.startsWith('0')) {
    return refuse(t('Ajoutez l’indicatif du pays devant le numéro, par exemple +237 6 99 12 34 56.'));
  }
  return { address: phoneAddress(digits), error: null };
}
