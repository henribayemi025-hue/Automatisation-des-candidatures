import { normalizeDB } from './reducer';
import type { DB } from './types';

/**
 * Sauvegarde et restauration d'un espace, dans un fichier.
 *
 * Sans compte, tout ce qui est saisi ne vit que dans le navigateur de
 * l'appareil. Vider le cache, changer de téléphone ou désinstaller efface la
 * caisse, le stock, les factures et la paie — définitivement, parce qu'il n'y a
 * pas de journal côté serveur pour un invité. C'est le point 2 de
 * docs/SECURITE-2026-09-15.md, et c'est la perte la plus grave qu'on ait :
 * pour de l'argent, perdre vaut fuiter.
 *
 * Ce fichier donne de quoi emporter son travail : un fichier lisible, qu'on
 * met où l'on veut, et qu'on recharge sur un autre appareil.
 *
 * Avec un compte, la sauvegarde reste utile — une copie chez soi ne dépend de
 * personne — mais ce n'est plus le dernier rempart : le cloud reconstruit tout.
 */

/** Ce qu'on écrit dans le fichier, autour des données. */
export interface Backup {
  /** Reconnaître nos fichiers et refuser les autres. */
  format: 'finjaro-accounting-sauvegarde';
  /** Version du format, pour savoir un jour lire les anciennes. */
  version: 1;
  /** Quand la sauvegarde a été faite, en clair. */
  savedAt: string;
  /** Le nom de l'entreprise, pour reconnaître le fichier sans l'ouvrir. */
  company: string;
  /** De quoi montrer ce que contient le fichier avant de le charger. */
  summary: {
    sales: number;
    entries: number;
    products: number;
    customers: number;
    employees: number;
  };
  data: DB;
}

function summarize(db: DB) {
  return {
    sales: db.sales?.length ?? 0,
    entries: db.entries?.length ?? 0,
    products: db.products?.length ?? 0,
    customers: db.customers?.length ?? 0,
    employees: db.employees?.length ?? 0,
  };
}

export function buildBackup(db: DB): Backup {
  return {
    format: 'finjaro-accounting-sauvegarde',
    version: 1,
    savedAt: new Date().toISOString(),
    company: db.company?.name ?? '',
    summary: summarize(db),
    data: db,
  };
}

/** Nom de fichier lisible : l'entreprise et la date, sans caractère gênant. */
export function backupFilename(db: DB): string {
  const name = (db.company?.name ?? 'finjaro')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 40);
  return `${name || 'finjaro'}-${new Date().toISOString().slice(0, 10)}.finjaro.json`;
}

export function backupText(db: DB): string {
  return JSON.stringify(buildBackup(db), null, 1);
}

/**
 * Enregistre le fichier. Renvoie la façon dont ça s'est fait, pour que l'écran
 * dise la vérité : dans la fenêtre de l'application Finjaro, un téléchargement
 * ordinaire peut ne rien donner, et le partage du téléphone est plus sûr.
 */
export async function saveBackup(db: DB): Promise<'partage' | 'telechargement'> {
  const text = backupText(db);
  const filename = backupFilename(db);
  const file = new File([text], filename, { type: 'application/json' });

  // Sur téléphone, passer par le partage du système : la personne choisit où
  // ranger le fichier (Drive, WhatsApp, Fichiers), et ça marche aussi dans une
  // fenêtre d'application où le téléchargement est parfois bloqué.
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (typeof navigator.share === 'function' && nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return 'partage';
    } catch (e) {
      // Partage refusé par la personne : on ne retombe pas sur le téléchargement,
      // elle vient de dire non.
      if (e instanceof DOMException && e.name === 'AbortError') return 'partage';
      // Toute autre panne : on tente le téléchargement.
    }
  }

  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Laisser le temps au navigateur de lancer l'enregistrement.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return 'telechargement';
}

export class BackupError extends Error {}

/**
 * Relit un fichier de sauvegarde. Refuse tout ce qui n'est pas clairement un
 * des nôtres : mieux vaut un message clair qu'un espace à moitié écrasé.
 */
export function readBackup(raw: string): Backup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BackupError('Ce fichier n’est pas lisible. Choisissez un fichier de sauvegarde Finjaro.');
  }
  const b = parsed as Partial<Backup>;
  if (!b || b.format !== 'finjaro-accounting-sauvegarde') {
    throw new BackupError('Ce fichier n’est pas une sauvegarde Finjaro Accounting.');
  }
  if (typeof b.version !== 'number' || b.version > 1) {
    throw new BackupError('Cette sauvegarde vient d’une version plus récente de l’application. Mettez à jour, puis réessayez.');
  }
  if (!b.data || typeof b.data !== 'object') {
    throw new BackupError('Cette sauvegarde est vide ou abîmée.');
  }
  // normalizeDB complète ce qui manque : une sauvegarde plus ancienne que les
  // derniers comptes ajoutés se recharge quand même.
  const data = normalizeDB(b.data as Partial<DB>);
  return {
    format: 'finjaro-accounting-sauvegarde',
    version: 1,
    savedAt: typeof b.savedAt === 'string' ? b.savedAt : '',
    company: data.company?.name ?? '',
    summary: summarize(data),
    data,
  };
}
