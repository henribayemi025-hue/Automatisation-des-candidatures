import { supabase } from './supabase';

/**
 * Discussion façon Google Chat (Beau, 14/10 : « tout Google Chat »), sur la base posée le 14/10 (migration 0245 de la place de marché) :
 * discussions à deux, groupes, Espaces nommés ; fils ; réactions ; épingles ; @mentions ; appels par lien ; accusés de lecture.
 * Ces tables sont privées par personne (RLS) : contrairement au fil de l'espace (événements finia_events), seuls les membres
 * d'une discussion la lisent.
 */

export type Genre = 'dm' | 'group' | 'space';

export interface Conversation {
  space_id: string;
  kind: Genre;
  name: string | null;
  starred: boolean;
  muted: boolean;
  non_lus: number;
  dernier_at: string | null;
  dernier_apercu: string | null;
  membres: string[];
}

export interface Personne {
  user_id: string;
  nom: string;
  role: string;
}

export interface Msg {
  id: string;
  space_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  kind: 'text' | 'call' | 'task' | 'system';
  meta: { url?: string; video?: boolean; [k: string]: unknown };
  mentions: string[];
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

export interface Reaction {
  message_id: string;
  user_id: string;
  emoji: string;
}

export interface Lecture {
  user_id: string;
  last_read_at: string;
  role: string;
}

/** Les réactions proposées d'un clic (comme Google Chat). */
export const EMOJIS = ['👍', '❤️', '😂', '🎉', '👀', '✅'];

const err = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};

export async function listerConversations(workspaceId: string): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc('finia_chat_resume', { p_workspace: workspaceId });
  err(error);
  return ((data ?? []) as Conversation[]).map((c) => ({ ...c, membres: Array.isArray(c.membres) ? c.membres : [] }));
}

export async function annuaire(workspaceId: string): Promise<Personne[]> {
  const { data, error } = await supabase.rpc('finia_chat_annuaire', { p_workspace: workspaceId });
  err(error);
  return (data ?? []) as Personne[];
}

/** Crée (ou retrouve, pour une discussion à deux) une conversation ; renvoie son id. */
export async function creerConversation(workspaceId: string, kind: Genre, membres: string[], nom?: string): Promise<string> {
  const { data, error } = await supabase.rpc('finia_chat_creer', { p_workspace: workspaceId, p_kind: kind, p_membres: membres, p_nom: nom?.trim() || null });
  err(error);
  return data as string;
}

export async function ajouterMembres(spaceId: string, membres: string[]): Promise<number> {
  const { data, error } = await supabase.rpc('finia_chat_ajouter', { p_space: spaceId, p_membres: membres });
  err(error);
  return data as number;
}

/** Les 300 derniers messages d'une conversation (fils compris), du plus ancien au plus récent. */
export async function lireMessages(spaceId: string): Promise<Msg[]> {
  const { data, error } = await supabase
    .from('finia_chat_messages')
    .select('id, space_id, user_id, body, parent_id, kind, meta, mentions, created_at, edited_at, deleted_at')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false })
    .limit(300);
  err(error);
  return ((data ?? []) as Msg[]).reverse();
}

export async function envoyer(spaceId: string, userId: string, body: string, mentions: string[], parentId: string | null): Promise<void> {
  const { error } = await supabase
    .from('finia_chat_messages')
    .insert({ space_id: spaceId, user_id: userId, body: body.slice(0, 4000), mentions, parent_id: parentId, kind: 'text' });
  err(error);
}

export async function modifier(id: string, body: string): Promise<void> {
  const { error } = await supabase.from('finia_chat_messages').update({ body: body.slice(0, 4000), edited_at: new Date().toISOString() }).eq('id', id);
  err(error);
}

export async function supprimer(id: string): Promise<void> {
  const { error } = await supabase.from('finia_chat_messages').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  err(error);
}

export async function lireReactions(ids: string[]): Promise<Reaction[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('finia_chat_reactions').select('message_id, user_id, emoji').in('message_id', ids);
  err(error);
  return (data ?? []) as Reaction[];
}

export async function basculerReaction(messageId: string, userId: string, emoji: string, deja: boolean): Promise<void> {
  const q = deja
    ? supabase.from('finia_chat_reactions').delete().eq('message_id', messageId).eq('user_id', userId).eq('emoji', emoji)
    : supabase.from('finia_chat_reactions').insert({ message_id: messageId, user_id: userId, emoji });
  const { error } = await q;
  err(error);
}

export async function lireEpingles(spaceId: string): Promise<string[]> {
  const { data, error } = await supabase.from('finia_chat_pins').select('message_id').eq('space_id', spaceId);
  err(error);
  return (data ?? []).map((p) => p.message_id as string);
}

export async function basculerEpingle(spaceId: string, messageId: string, userId: string, deja: boolean): Promise<void> {
  const q = deja
    ? supabase.from('finia_chat_pins').delete().eq('space_id', spaceId).eq('message_id', messageId)
    : supabase.from('finia_chat_pins').insert({ space_id: spaceId, message_id: messageId, pinned_by: userId });
  const { error } = await q;
  err(error);
}

/** Qui a lu jusqu'où (accusés de lecture). */
export async function lireLectures(spaceId: string): Promise<Lecture[]> {
  const { data, error } = await supabase.from('finia_chat_members').select('user_id, last_read_at, role').eq('space_id', spaceId);
  err(error);
  return (data ?? []) as Lecture[];
}

export async function marquerLu(spaceId: string, userId: string): Promise<void> {
  await supabase.from('finia_chat_members').update({ last_read_at: new Date().toISOString() }).eq('space_id', spaceId).eq('user_id', userId);
}

export async function marquerFavori(spaceId: string, userId: string, starred: boolean): Promise<void> {
  const { error } = await supabase.from('finia_chat_members').update({ starred }).eq('space_id', spaceId).eq('user_id', userId);
  err(error);
}

/** Lance un appel : un message « Appel vidéo / vocal » avec un lien de salle (Jitsi, gratuit, sans compte). */
export async function appeler(spaceId: string, video: boolean): Promise<void> {
  const { error } = await supabase.rpc('finia_chat_appeler', { p_space: spaceId, p_video: video });
  err(error);
}

/** Mots du message découpés pour l'affichage : **gras**, _italique_, `code`, liens et @mentions, sans HTML injecté. */
export type Morceau = { t: 'txt' | 'gras' | 'ital' | 'code' | 'lien' | 'mention'; v: string };
export function decouper(texte: string, noms: string[]): Morceau[] {
  const ment = noms.filter(Boolean).sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const motif = new RegExp(
    '(`[^`\\n]+`)|(\\*\\*[^*\\n]+\\*\\*)|(_[^_\\n]+_)|(https?:\\/\\/[^\\s<]+)' + (ment.length ? `|(@(?:${ment.join('|')}|tous|all))` : '|(@(?:tous|all))'),
    'g',
  );
  const out: Morceau[] = [];
  let i = 0;
  for (const m of texte.matchAll(motif)) {
    if (m.index! > i) out.push({ t: 'txt', v: texte.slice(i, m.index) });
    const s = m[0];
    if (m[1]) out.push({ t: 'code', v: s.slice(1, -1) });
    else if (m[2]) out.push({ t: 'gras', v: s.slice(2, -2) });
    else if (m[3]) out.push({ t: 'ital', v: s.slice(1, -1) });
    else if (m[4]) out.push({ t: 'lien', v: s });
    else out.push({ t: 'mention', v: s });
    i = m.index! + s.length;
  }
  if (i < texte.length) out.push({ t: 'txt', v: texte.slice(i) });
  return out;
}
