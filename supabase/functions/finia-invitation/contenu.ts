// Le texte de l'invitation, à part pour pouvoir le relire et le contrôler
// sans serveur (scripts/invitation-check.ts).

export const APP_URL = 'https://accounting.finjaro.net';

const ROLES: Record<string, string> = {
  manager: 'gérant',
  cashier: 'caissier',
  accountant: 'comptable',
};

export const echapper = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/**
 * Aucun lien de connexion, aucun jeton : la personne ouvre l'application et
 * se connecte, ou crée son compte, avec l'adresse invitée. On ne touche ni à
 * l'authentification ni au Site URL.
 */
export function invitation(p: { inviteur: string; espace: string; role: string; email: string }): { sujet: string; html: string; texte: string } {
  const inviteur = p.inviteur.trim() || 'Une personne de votre équipe';
  const espace = p.espace.trim() || 'son espace';
  const role = ROLES[p.role] ?? 'membre';
  const sujet = `${inviteur} vous invite sur Finjaro Accounting`;
  const texte = [
    'Bonjour,',
    '',
    `${inviteur} vous invite à rejoindre l'espace « ${espace} » sur Finjaro Accounting, comme ${role}.`,
    '',
    `Pour accepter : ouvrez ${APP_URL} et connectez-vous, ou créez votre compte, avec cette adresse e-mail : ${p.email}.`,
    '',
    "Vous n'attendiez pas cette invitation ? Ignorez simplement cet e-mail : rien ne se passe sans vous.",
    '',
    "L'équipe Finjaro",
  ].join('\n');
  const html = `<p>Bonjour,</p>
<p><b>${echapper(inviteur)}</b> vous invite à rejoindre l'espace « ${echapper(espace)} » sur Finjaro Accounting, comme ${echapper(role)}.</p>
<p>Pour accepter : ouvrez Finjaro Accounting et connectez-vous, ou créez votre compte, avec cette adresse e-mail : <b>${echapper(p.email)}</b>.</p>
<p><a href="${APP_URL}/" style="display:inline-block;background:#C25E38;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:600">Ouvrir Finjaro Accounting</a></p>
<p style="color:#6B6B6B;font-size:13px">Vous n'attendiez pas cette invitation ? Ignorez simplement cet e-mail : rien ne se passe sans vous.</p>
<p style="margin-top:24px;color:#6B6B6B;font-size:13px">L'équipe Finjaro<br>Une question ? Répondez simplement à cet e-mail.</p>`;
  return { sujet, html, texte };
}
