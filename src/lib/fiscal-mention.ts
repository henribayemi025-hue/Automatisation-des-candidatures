/**
 * Mention « pas un conseil fiscal » sous les réponses de l'assistante qui
 * parlent d'impôts, de taxes ou de comptabilité (réunion de Beau du 10/10,
 * texte transmis par Alpha le 12/10 ; même mention dans les conditions de la
 * place de marché).
 *
 * Les réponses qui ne donnent qu'un chiffre de la caisse (« vous avez vendu
 * 45 000 aujourd'hui ») n'en ont pas besoin : la mention n'apparaît que si la
 * question ou la réponse touche à l'impôt, à la taxe ou au traitement
 * comptable.
 */
const FISCAL = /\b(impots?\b|taxes?\b|tax\b|tva\b|vat\b|igs\b|fisc|declar|dgid?\b|patente|precompte|regime|comptab|amorti|provision|bilan|liasse|syscohada|ohada|deductib|exoner|cotisation|cnps\b|accounting|depreciat|deduct|filing)/;

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function speaksFiscal(...texts: (string | undefined)[]): boolean {
  return texts.some((x) => !!x && FISCAL.test(plain(x)));
}

export const FISCAL_MENTION =
  'Ces informations aident à comprendre et à calculer ; ce n’est pas un conseil fiscal. Faites-les relire et confirmer par un expert-comptable avant toute décision ou déclaration.';
