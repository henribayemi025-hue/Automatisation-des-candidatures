/**
 * Sommes-nous dans la démonstration ?
 *
 * Le drapeau est posé par l'écran de démonstration. Il vit ici pour que
 * n'importe quel composant puisse le lire sans importer une page entière —
 * et surtout pour que l'avertissement « vos chiffres ne sont que sur cet
 * appareil » ne s'affiche pas sur des chiffres d'exemple.
 */
export const DEMO_FLAG_KEY = 'finia.demo';

export function isDemo(): boolean {
  try {
    return localStorage.getItem(DEMO_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}
