/**
 * L'e-mail d'invitation (B2, branche, pas déployé) : ce qu'il dit et ce qu'il
 * ne doit jamais contenir.
 *
 *   npx vite-node scripts/invitation-check.ts
 */
import { invitation, APP_URL } from '../supabase/functions/finia-invitation/contenu.ts';

let ko = 0;
const ok = (n: string, c: boolean) => { if (!c) ko++; console.log(c ? 'OK ' : 'KO ', n); };

const a = invitation({ inviteur: 'Awa', espace: 'Awa Créations', role: 'cashier', email: 'paul@exemple.com' });
ok('sujet : « Awa vous invite sur Finjaro Accounting »', a.sujet === 'Awa vous invite sur Finjaro Accounting');
ok('le rôle est dit en clair (caissier)', a.texte.includes('comme caissier') && a.html.includes('comme caissier'));
ok('l’adresse à utiliser est rappelée', a.texte.includes('paul@exemple.com') && a.html.includes('paul@exemple.com'));
ok('un seul lien, vers l’application', (a.html.match(/href="/g) || []).length === 1 && a.html.includes(`href="${APP_URL}/"`));
ok('aucun jeton ni lien de connexion', !/token|access_token|confirm|magic|otp/i.test(a.html + a.texte));
ok('« rien ne se passe sans vous » pour qui n’attendait rien', a.texte.includes('rien ne se passe sans vous'));

const piege = invitation({ inviteur: '<img src=x onerror=alert(1)>', espace: '"><script>alert(2)</script>', role: 'manager', email: 'x@y.fr' });
ok('noms piégés échappés dans le HTML', !/<img|<script/i.test(piege.html) && piege.html.includes('&lt;img'));
ok('rôle gérant', piege.html.includes('comme gérant'));

const vide = invitation({ inviteur: '', espace: '', role: 'inconnu', email: 'x@y.fr' });
ok('sans nom : « Une personne de votre équipe », rôle « membre »', vide.sujet.startsWith('Une personne de votre équipe') && vide.texte.includes('comme membre'));
ok('aucun pays ni devise dans le texte', !/cameroun|fcfa|diaspora/i.test(a.html + a.texte));
process.exit(ko ? 1 : 0);
