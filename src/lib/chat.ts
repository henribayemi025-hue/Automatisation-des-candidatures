import { supabase } from './supabase';
import { whatsappNumber } from './countries';

/**
 * Photos du fil de discussion : hébergées dans le bucket privé « finia-chat »,
 * sous ws/<espace>/<message>.jpg. L'état de l'espace ne garde que le chemin.
 */
const BUCKET = 'finia-chat';
const signed = new Map<string, { url: string; until: number }>();

function base64ToBlob(data: string, mime: string): Blob {
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function uploadChatImage(workspaceId: string, messageId: string, image: { mime: string; data: string }): Promise<string> {
  const path = `ws/${workspaceId}/${messageId}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, base64ToBlob(image.data, image.mime), { contentType: image.mime, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

/** URL temporaire d'une photo, mise en cache le temps de sa validité. */
export async function chatImageUrl(path: string): Promise<string | null> {
  const hit = signed.get(path);
  if (hit && hit.until > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) return null;
  signed.set(path, { url: data.signedUrl, until: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}

/**
 * Lien WhatsApp « clic pour écrire », avec le message déjà rédigé. wa.me
 * exige le format international ; `country` (celui de l'entreprise) sert à
 * compléter un numéro saisi localement, sans indicatif.
 */
export function whatsappLink(phone: string, text: string, country?: string): string {
  return `https://wa.me/${whatsappNumber(phone, country)}?text=${encodeURIComponent(text)}`;
}

/** Le message mentionne-t-il l'assistant ? (@assistant, @ia, @ai) */
export function mentionsAssistant(text: string): boolean {
  return /(^|\s)@(assistant|ia|ai)\b/i.test(text);
}
