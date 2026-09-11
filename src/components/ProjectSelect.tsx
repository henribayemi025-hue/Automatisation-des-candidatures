import { useStore } from '../lib/store';
import { Field } from './UI';
import { t } from '../lib/i18n';

/**
 * Champ « Projet » des formulaires de saisie. N'apparaît que si l'espace a au
 * moins un projet en cours : personne ne doit voir un champ vide sans raison.
 */
export default function ProjectSelect({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (projectId: string) => void;
  compact?: boolean;
}) {
  const { db } = useStore();
  const active = db.projects.filter((p) => p.status === 'ACTIVE');
  if (active.length === 0) return null;
  const select = (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`field ${compact ? 'py-1.5 text-caption' : ''}`} aria-label={t('Projet')}>
      <option value="">{compact ? t('— Projet —') : t('Aucun projet (activité courante)')}</option>
      {active.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
  if (compact) return select;
  return (
    <Field label={t('Projet')} hint={t('Facultatif : pour suivre à part un chantier, une ouverture, un événement.')}>
      {select}
    </Field>
  );
}
