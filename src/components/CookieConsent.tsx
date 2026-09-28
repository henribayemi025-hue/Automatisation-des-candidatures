import { useEffect, useState } from 'react';
import { getConsent, loadPixel, requiresConsent, setConsent } from '../lib/pixel';
import { t } from '../lib/i18n';

/**
 * Bandeau RGPD pour le pixel Meta. Hors zone soumise à accord obligatoire,
 * le pixel se charge directement, sans bandeau (décision de Beau, 28/09).
 */
export default function CookieConsent({ country }: { country?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!requiresConsent(country)) {
      loadPixel();
      return;
    }
    const consent = getConsent();
    if (consent === 'accepted') loadPixel();
    else if (consent === null) setVisible(true);
  }, [country]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(23,27,38,0.08)]">
      <p className="max-w-2xl text-caption text-ink">
        {t('Nous mesurons l’effet de nos publicités (Meta). Ça ne change rien à votre utilisation de l’application.')}
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => {
            setConsent('declined');
            setVisible(false);
          }}
          className="btn-ghost py-1.5 text-caption"
        >
          {t('Refuser')}
        </button>
        <button
          type="button"
          onClick={() => {
            setConsent('accepted');
            loadPixel();
            setVisible(false);
          }}
          className="btn-primary py-1.5 text-caption"
        >
          {t('Accepter')}
        </button>
      </div>
    </div>
  );
}
