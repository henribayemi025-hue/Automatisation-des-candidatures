import { Link } from 'react-router-dom';
import { Empty } from '../components/UI';
import { t } from '../lib/i18n';

/**
 * Adresse inconnue (vieux lien, faute de frappe). Avant le 01/10, elle
 * affichait l'Accueil sans rien dire : on croyait être au bon endroit
 * (audit d'Alpha, A4).
 */
export default function NotFound() {
  return (
    <div className="card mt-6">
      <Empty
        title={t('Cette page n’existe pas')}
        hint={t('Le lien est peut-être ancien ou incomplet.')}
        action={
          <Link to="/" className="btn-primary">
            {t('Revenir à l’accueil')}
          </Link>
        }
      />
    </div>
  );
}
