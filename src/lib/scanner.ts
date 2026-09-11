import { useEffect, useRef } from 'react';

/**
 * Lecteur de codes-barres « clavier » (USB ou Bluetooth) : il tape le code très
 * vite puis Entrée. On reconnaît cette rafale — des touches espacées de moins
 * de 40 ms — et on la distingue d'une frappe humaine, même dans un champ.
 */
export function useBarcodeScanner(onScan: (code: string) => void, enabled = true) {
  const buffer = useRef('');
  const last = useRef(0);
  const handler = useRef(onScan);
  handler.current = onScan;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const now = performance.now();
      if (now - last.current > 40) buffer.current = '';
      last.current = now;
      if (e.key === 'Enter') {
        const code = buffer.current;
        buffer.current = '';
        if (code.length >= 4) {
          e.preventDefault();
          e.stopPropagation();
          handler.current(code);
        }
        return;
      }
      if (e.key.length === 1) buffer.current += e.key;
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [enabled]);
}

/** Retour sonore et tactile d'un scan : court, discret, désactivable par le navigateur. */
export function scanFeedback(ok: boolean) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = ok ? 1175 : 220;
      gain.gain.value = 0.04;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (ok ? 0.08 : 0.25));
      osc.onended = () => void ctx.close();
    }
  } catch {
    // Pas de son disponible : le retour visuel suffit.
  }
  try {
    navigator.vibrate?.(ok ? 30 : [60, 40, 60]);
  } catch {
    // Vibration indisponible.
  }
}
