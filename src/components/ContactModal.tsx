import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCollab } from '../lib/collab';
import { isDemo } from '../lib/demo-state';
import { Modal } from './UI';
import { IconSend } from './Icons';
import { t } from '../lib/i18n';

export type ContactGenre = 'contact' | 'suggestion';

const SUPPORT_EMAIL = 'fin.finjaro@gmail.com';

/**
 * « Nous contacter » et « Une suggestion » : la fonction edge commune
 * `leo-contact` enregistre la demande et envoie un e-mail à l'équipe, dont
 * « Répondre » écrit directement à la personne. Elle exige une session : sans
 * compte (mode local, démonstration), on propose l'adresse e-mail à la place.
 */
export default function ContactModal({ open, genre: initial, onClose }: { open: boolean; genre: ContactGenre; onClose: () => void }) {
  const { user } = useCollab();
  const [genre, setGenre] = useState<ContactGenre>(initial);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setGenre(initial);
    setMessage('');
    setError('');
    setSent(false);
  }, [open, initial]);

  const canSend = !!user && !isDemo();

  async function send() {
    if (message.trim().length < 3) {
      setError(t('Écrivez quelques mots.'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data, error: err } = await supabase.functions.invoke('leo-contact', {
        body: { genre, message: message.trim(), app: 'accounting' },
      });
      if (err) {
        let detail = '';
        try {
          detail = (await (err as { context?: Response }).context?.json())?.erreur ?? '';
        } catch {
          // réponse sans corps lisible : message générique ci-dessous
        }
        setError(detail || t('Envoi impossible pour le moment. Réessayez, ou écrivez-nous à {email}.', { email: SUPPORT_EMAIL }));
        return;
      }
      if (data?.ok) setSent(true);
      else setError(t('Envoi impossible pour le moment. Réessayez, ou écrivez-nous à {email}.', { email: SUPPORT_EMAIL }));
    } catch {
      setError(t('Pas de connexion. Réessayez, ou écrivez-nous à {email}.', { email: SUPPORT_EMAIL }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={genre === 'contact' ? t('Nous contacter') : t('Une suggestion')}>
      <div className="mb-4 inline-flex rounded-[8px] border border-hairline bg-surface p-0.5">
        {(['contact', 'suggestion'] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGenre(g)}
            className={`rounded-[6px] px-3 py-1.5 text-caption font-semibold transition ${genre === g ? 'bg-ink text-surface' : 'text-muted hover:text-ink'}`}
          >
            {g === 'contact' ? t('Nous contacter') : t('Une suggestion')}
          </button>
        ))}
      </div>

      {sent ? (
        <div className="rounded-input bg-[#EAF6EA] px-4 py-3 text-body text-[#1F6F65]">
          {genre === 'contact'
            ? t('Message envoyé. L’équipe Finjaro vous répond par e-mail.')
            : t('Merci ! Votre idée est arrivée chez l’équipe Finjaro.')}
        </div>
      ) : canSend ? (
        <>
          <p className="mb-2 text-caption text-muted">
            {genre === 'contact'
              ? t('Une question, un problème, un besoin ? L’équipe Finjaro lit chaque message et vous répond par e-mail.')
              : t('Une idée pour rendre l’application plus utile ? Dites-la avec vos mots.')}
          </p>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={4000}
            className="field min-h-[120px]"
            placeholder={genre === 'contact' ? t('Votre message…') : t('Votre idée…')}
            autoFocus
          />
          {error && <p className="mt-2 rounded-input bg-[#FDEDED] px-3 py-2 text-caption text-[#A63030]">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              {t('Annuler')}
            </button>
            <button type="button" onClick={() => void send()} disabled={busy} className="btn-primary">
              <IconSend className="h-4 w-4" />
              {busy ? t('Envoi…') : t('Envoyer')}
            </button>
          </div>
        </>
      ) : (
        <p className="text-body text-ink">
          {t('Pour nous écrire d’ici, il faut un compte Finjaro. Sinon, écrivez-nous directement :')}{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-teal underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      )}
    </Modal>
  );
}
