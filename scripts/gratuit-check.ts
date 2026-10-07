/**
 * Le secours finia-gratuit (fonction d'Alpha) refuse une consigne « system »
 * de plus de 6 000 signes et une conversation de plus de 12 000. Le 07/10,
 * la consigne de Finia (≈ 6 900) partait entière : refusée à chaque appel.
 * Ce test vérifie le pire cas (gros contexte, longue conversation).
 *
 *   npx tsx scripts/gratuit-check.ts
 */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/worker.js', import.meta.url), 'utf8');
const m = await import('data:text/javascript,' + encodeURIComponent(src + '\nexport { systemPrompt, gratuitMessages };'));
const full: string = m.systemPrompt({});
const base = full.slice(0, full.lastIndexOf('[Contexte]')).trim();
const ctx = { screen: '/produits', products: Array.from({ length: 300 }, (_, i) => ({ name: `Article ${i}`, price: 1000 + i })) };
const msgs = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', text: 'x'.repeat(2000) }));
const chat: { role: string; content: string }[] = m.gratuitMessages(base, ctx, msgs);
const sys = chat.filter((c) => c.role === 'system').reduce((n, c) => n + c.content.length, 0);
const tot = chat.reduce((n, c) => n + c.content.length, 0);
const fails: string[] = [];
if (sys > 6000) fails.push(`consigne ${sys} > 6000`);
if (tot > 12000) fails.push(`total ${tot} > 12000`);
if (!chat[0].content.startsWith("Tu es Finia")) fails.push('la présentation de Finia ne passe pas en premier');
if (!chat[1].content.includes('[Contexte]')) fails.push('le contexte manque');
if (fails.length) {
  console.error('KO :', fails.join(' ; '));
  process.exit(1);
}
console.log(`Tout est bon : consigne ${sys}/6000, total ${tot}/12000.`);
