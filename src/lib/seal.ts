import type { DB, WorkspaceEvent } from './types';

/**
 * Sceller l'instantané, pour que l'écran ne puisse pas mentir en silence.
 *
 * L'application ne rejoue pas tout le journal à chaque ouverture : elle part
 * d'un instantané (`finia_workspaces.data`) et n'ajoute que les événements
 * postérieurs à `snapshot_seq`. C'est ce qui la rend rapide — et c'est aussi
 * son point faible, relevé au point 3 de docs/SECURITE-2026-09-15.md : le
 * propriétaire peut réécrire ces deux colonnes, et l'application afficherait
 * alors des chiffres qui ne viennent plus du journal.
 *
 * Le journal, lui, est inviolable : `finia_events` n'a ni règle UPDATE ni règle
 * DELETE, personne ne peut y modifier ou effacer une ligne. On s'en sert donc
 * comme témoin : à chaque compactage, on écrit dans le journal une empreinte de
 * l'instantané qu'on vient d'enregistrer. Réécrire l'instantané devient
 * possible, mais plus invisible — l'empreinte ne correspondrait plus.
 *
 * Ce n'est pas un verrou, c'est un témoin. Un commerçant reste maître de ses
 * propres comptes ; ce qu'on garantit, c'est qu'un comptable, un fiscaliste ou
 * Beau puisse voir que l'écran et le registre divergent.
 */

export const SEAL_EVENT = 'snapshot.seal';

export interface SealPayload {
  /** Le `snapshot_seq` que cette empreinte atteste. */
  sealedSeq: number;
  /** Empreinte de l'instantané enregistré à ce moment-là. */
  hash: string;
  /** Combien d'écritures comptables l'instantané contenait : lisible sans outil. */
  entries: number;
}

/**
 * Sérialisation stable : deux états identiques doivent donner la même chaîne,
 * quel que soit l'ordre dans lequel les clés ont été créées.
 */
function stable(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stable(obj[k])}`).join(',')}}`;
}

/**
 * Empreinte de l'état comptable. On ne prend que ce qui engage les chiffres :
 * les écritures et les comptes. Le reste (réglages d'affichage, messages,
 * historique des actions) bouge pour des raisons qui ne changent pas un bilan,
 * et le faire entrer dans l'empreinte ferait crier au loup pour rien.
 */
export async function hashState(db: DB): Promise<string> {
  const material = stable({
    entries: db.entries.map((e) => ({
      id: e.id,
      date: e.date,
      journal: e.journal,
      ref: e.ref,
      posted: e.posted,
      lines: e.lines.map((l) => ({ account: l.account, debit: l.debit, credit: l.credit })),
    })),
    accounts: db.accounts.map((a) => ({ code: a.code, normal: a.normal })),
  });
  const bytes = new TextEncoder().encode(material);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

export type SealVerdict =
  | { state: 'AUCUN_INSTANTANE'; detail: string }
  | { state: 'CONFORME'; detail: string }
  | { state: 'NON_SCELLE'; detail: string }
  | { state: 'DIVERGENT'; detail: string };

/**
 * Compare l'instantané chargé aux empreintes inscrites au journal.
 *
 * On retient toujours la PREMIÈRE empreinte écrite pour un `sealedSeq` donné :
 * une ligne du journal ne peut pas être modifiée, donc la première est
 * l'originale. Quelqu'un qui réécrirait l'instantané pourrait ajouter une
 * nouvelle empreinte, jamais remplacer celle d'avant — et deux empreintes
 * différentes pour le même rang sont en elles-mêmes le signal.
 */
export function verifySeal(snapshotSeq: number, snapshotHash: string, events: WorkspaceEvent[]): SealVerdict {
  if (snapshotSeq <= 0) {
    return {
      state: 'AUCUN_INSTANTANE',
      detail: 'Aucun instantané en service : tout ce qui est affiché est reconstruit depuis le journal.',
    };
  }

  const seals = events
    .filter((e) => e.type === SEAL_EVENT)
    .map((e) => ({ seq: e.seq ?? 0, payload: e.payload as unknown as SealPayload }))
    .filter((s) => s.payload?.sealedSeq === snapshotSeq)
    .sort((a, b) => a.seq - b.seq);

  if (!seals.length) {
    return {
      state: 'NON_SCELLE',
      detail: `L'instantané en service (rang ${snapshotSeq}) ne porte aucune empreinte. C'est normal pour un espace créé avant la mise en place du scellé ; au prochain compactage il en portera une.`,
    };
  }

  const original = seals[0].payload;
  if (original.hash !== snapshotHash) {
    return {
      state: 'DIVERGENT',
      detail: `L'instantané en service ne correspond pas à l'empreinte inscrite au journal au rang ${snapshotSeq}. Les écritures du journal font foi : faites-les relire avant d'accorder du crédit à l'écran.`,
    };
  }

  const doubles = seals.filter((s) => s.payload.hash !== original.hash);
  if (doubles.length) {
    return {
      state: 'DIVERGENT',
      detail: `Deux empreintes différentes ont été inscrites pour le rang ${snapshotSeq}. L'instantané a été réécrit après coup.`,
    };
  }

  return {
    state: 'CONFORME',
    detail: `L'instantané en service porte l'empreinte inscrite au journal au rang ${snapshotSeq}, sur ${original.entries} écriture(s).`,
  };
}
