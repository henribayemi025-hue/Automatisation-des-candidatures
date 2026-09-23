import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Hors réseau et mises à jour.
 *
 * Une boutique dont le réseau saute ne doit pas perdre sa caisse. Le service
 * worker garde l'application sur l'appareil : elle s'ouvre et fonctionne sans
 * connexion. Ce fichier tient les deux choses que l'interface doit savoir :
 * sommes-nous en ligne, et une nouvelle version attend-elle d'être installée.
 *
 * En développement, rien ne s'enregistre : un service worker qui garde en
 * cache pendant qu'on modifie le code fait perdre des heures.
 */

/** L'événement que Chrome et Edge déclenchent quand l'application est installable. */
interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface OfflineValue {
  /** Faux dès que le navigateur signale la perte du réseau. */
  online: boolean;
  /** Vrai quand une version plus récente est installée et attend le rechargement. */
  updateReady: boolean;
  /** Installe la version en attente et recharge. */
  applyUpdate: () => void;
  /** Vrai quand l'application est bien gardée sur l'appareil (ouvrable sans réseau). */
  installedOffline: boolean;
  /** Vrai quand le navigateur propose d'installer (Chrome, Edge, Android). */
  canInstall: boolean;
  /** Vrai quand l'application tourne déjà en fenêtre installée. */
  isInstalled: boolean;
  /** Ouvre la demande d'installation du navigateur. Retourne vrai si acceptée. */
  install: () => Promise<boolean>;
}

const Ctx = createContext<OfflineValue>({
  online: true,
  updateReady: false,
  applyUpdate: () => {},
  installedOffline: false,
  canInstall: false,
  isInstalled: false,
  install: async () => false,
});

/** L'application tourne-t-elle dans sa propre fenêtre plutôt que dans un onglet ? */
function standalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    // Safari iOS n'implémente pas display-mode : il expose navigator.standalone.
    (navigator as { standalone?: boolean }).standalone === true
  );
}

export function useOffline(): OfflineValue {
  return useContext(Ctx);
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [installedOffline, setInstalledOffline] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => standalone());

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  // Installation : le navigateur prévient quand c'est possible. On garde
  // l'événement pour ouvrir la demande au moment choisi par la personne,
  // depuis les réglages — pas par surprise au milieu d'une vente.
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallPrompt);
    };
    const onInstalled = () => {
      setInstallEvent(null);
      setIsInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const mq = window.matchMedia('(display-mode: standalone)');
    const onMode = () => setIsInstalled(standalone());
    mq.addEventListener('change', onMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      mq.removeEventListener('change', onMode);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installEvent) return false;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    // Un événement ne sert qu'une fois, accepté ou non.
    setInstallEvent(null);
    return outcome === 'accepted';
  }, [installEvent]);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;

    let cancelled = false;
    // Le tout premier onglet d'un appareil neuf n'a pas encore de contrôleur :
    // sw.js s'installe, s'active, et `self.clients.claim()` en prend le
    // contrôle — ce qui déclenche `controllerchange` MÊME sans mise à jour.
    // Recharger dans ce cas grille en silence tout ce que l'adresse portait
    // ce jour-là (trouvé le 23/09 : un code de relais à usage unique consommé
    // deux fois par ce rechargement fantôme, avant même qu'on ait pu le voir
    // depuis l'appli). On ne recharge que quand un contrôleur existait déjà
    // et vient d'être remplacé par une vraie mise à jour.
    const controleeAvant = !!navigator.serviceWorker.controller;

    const watch = (reg: ServiceWorkerRegistration) => {
      if (reg.active) setInstalledOffline(true);
      // Une version déjà installée et en attente : proposer tout de suite.
      if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const next = reg.installing;
        if (!next) return;
        next.addEventListener('statechange', () => {
          if (next.state === 'installed') {
            setInstalledOffline(true);
            // Sans contrôleur, c'est la première installation : rien à proposer,
            // l'application vient simplement de devenir utilisable hors réseau.
            if (navigator.serviceWorker.controller && !cancelled) setWaiting(next);
          }
        });
      });
    };

    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .then((reg) => {
        if (cancelled) return;
        watch(reg);
        // Une vérification à l'ouverture, puis une par heure : assez pour que
        // les corrections arrivent vite sans harceler un forfait de données.
        void reg.update().catch(() => undefined);
        const id = window.setInterval(() => void reg.update().catch(() => undefined), 60 * 60 * 1000);
        return () => window.clearInterval(id);
      })
      .catch(() => {
        /* navigation privée, réglages verrouillés : on continue sans. */
      });

    // Le remplacement du contrôleur signifie que la nouvelle version tourne.
    let reloading = false;
    const onControllerChange = () => {
      if (reloading || !controleeAvant) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waiting) {
      window.location.reload();
      return;
    }
    waiting.postMessage('SKIP_WAITING');
    setWaiting(null);
  }, [waiting]);

  const value = useMemo<OfflineValue>(
    () => ({
      online,
      updateReady: waiting !== null,
      applyUpdate,
      installedOffline,
      canInstall: installEvent !== null && !isInstalled,
      isInstalled,
      install,
    }),
    [online, waiting, applyUpdate, installedOffline, installEvent, isInstalled, install],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
