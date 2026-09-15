/**
 * Où tourne l'application.
 *
 * Accounting n'est plus seulement un site : c'est aussi un écran DANS
 * l'application Finjaro installée (Capacitor affiche `accounting.finjaro.net`
 * dans sa propre fenêtre, parce que `allowNavigation` autorise
 * `*.finjaro.net`). Trois contextes, trois comportements :
 *
 * — onglet de navigateur ordinaire ;
 * — application installée depuis le navigateur (écran d'accueil, bureau) ;
 * — fenêtre de l'application Finjaro des magasins.
 *
 * Dans les deux derniers, `target="_blank"` est un piège : il envoie la
 * personne dans le navigateur du téléphone, hors de l'application, et elle ne
 * sait plus revenir. On navigue alors dans la même fenêtre.
 */

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

function capacitor(): CapacitorGlobal | undefined {
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

/** Vrai dans la fenêtre de l'application Finjaro installée depuis un magasin. */
export function inNativeApp(): boolean {
  const cap = capacitor();
  if (!cap) return false;
  try {
    return cap.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

/** Android ou iPhone, quand on est dans l'application native. */
export function nativePlatform(): 'android' | 'ios' | null {
  const cap = capacitor();
  if (!cap || !inNativeApp()) return null;
  try {
    const p = cap.getPlatform?.();
    return p === 'android' || p === 'ios' ? p : null;
  } catch {
    return null;
  }
}

/** Vrai quand l'application occupe sa propre fenêtre plutôt qu'un onglet. */
export function standaloneWindow(): boolean {
  if (typeof window === 'undefined') return false;
  if (inNativeApp()) return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

/**
 * Ouvrir une autre application Finjaro. Dans une fenêtre dédiée on remplace la
 * page en cours : la personne reste chez elle, et le bouton retour du
 * téléphone la ramène ici. Dans un onglet ordinaire, un nouvel onglet garde
 * son travail en cours à portée.
 */
export function openFinjaroApp(url: string): void {
  if (standaloneWindow()) {
    window.location.assign(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
