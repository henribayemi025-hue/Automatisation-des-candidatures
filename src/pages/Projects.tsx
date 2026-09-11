import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { today, useStore } from '../lib/store';
import { projectSummary } from '../lib/metrics';
import { toMajor, toMinor } from '../lib/money';
import type { Project, ProjectStatus } from '../lib/types';
import { Badge, Empty, Field, Modal, Money, PageHeader } from '../components/UI';
import { IconChevronRight, IconFolder, IconPlus } from '../components/Icons';
import { t } from '../lib/i18n';

/** Types proposés — un libellé parlant, pas une nomenclature. */
export const PROJECT_KINDS: { id: string; label: string; hint: string }[] = [
  { id: 'opening', label: 'Ouverture ou agrandissement', hint: 'Nouveau point de vente, nouveau rayon, déménagement' },
  { id: 'site', label: 'Chantier ou prestation', hint: 'Un chantier, une grosse réparation, une commande spéciale' },
  { id: 'event', label: 'Événement', hint: 'Mariage, cérémonie, salon, fête de fin d’année' },
  { id: 'equipment', label: 'Matériel ou véhicule', hint: 'Machine, pont élévateur, moto, frigo' },
  { id: 'stock', label: 'Grosse commande ou importation', hint: 'Un conteneur, un stock de saison' },
  { id: 'marketing', label: 'Publicité ou lancement', hint: 'Campagne, affiches, cadeaux clients' },
  { id: 'other', label: 'Autre projet', hint: 'Tout ce qui sort du quotidien' },
];

export function kindLabel(id: string): string {
  return PROJECT_KINDS.find((k) => k.id === id)?.label ?? 'Autre projet';
}

export const STATUS_LABEL: Record<ProjectStatus, string> = { ACTIVE: 'En cours', DONE: 'Terminé', CANCELLED: 'Abandonné' };
export const STATUS_TONE: Record<ProjectStatus, 'info' | 'success' | 'neutral'> = { ACTIVE: 'info', DONE: 'success', CANCELLED: 'neutral' };

/** Formulaire de création et de modification, partagé avec la fiche projet. */
export function ProjectForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Project }) {
  const { db, saveProject } = useStore();
  const [name, setName] = useState(initial?.name ?? '');
  const [kind, setKind] = useState(initial?.kind ?? 'opening');
  const [budgetRaw, setBudgetRaw] = useState(initial && initial.budget > 0 ? String(toMajor(initial.budget, db.company.currency)) : '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? today());
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? 'ACTIVE');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');

  function submit() {
    if (name.trim().length < 2) {
      setError(t('Donnez un nom au projet.'));
      return;
    }
    saveProject({
      id: initial?.id,
      name: name.trim(),
      kind,
      budget: toMinor(budgetRaw || 0, db.company.currency),
      startDate,
      endDate,
      status,
      notes: notes.trim(),
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? t('Modifier le projet') : t('Nouveau projet')}>
      <div className="space-y-4">
        <Field label={t('Nom du projet')}>
          <input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Ex. Ouverture du rayon papeterie')} className="field" autoFocus />
        </Field>
        <Field label={t('Type')}>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="field">
            {PROJECT_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {t(k.label)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-caption text-muted">{t(PROJECT_KINDS.find((k) => k.id === kind)?.hint ?? '')}</p>
        </Field>
        <Field label={`${t('Budget prévu')} (${db.company.currency})`} hint={t('Ce que vous comptez dépenser. Laissez vide si vous ne savez pas encore.')}>
          <input id="project-budget" value={budgetRaw} onChange={(e) => setBudgetRaw(e.target.value)} inputMode="decimal" placeholder="0" className="field num" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Début')}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="field" />
          </Field>
          <Field label={t('Fin prévue')}>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="field" />
          </Field>
        </div>
        {initial && (
          <Field label={t('État')}>
            <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className="field">
              {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => (
                <option key={s} value={s}>
                  {t(STATUS_LABEL[s])}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={t('Notes')}>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="field" placeholder={t('Ce qu’il faut retenir : fournisseur, contact, décision prise…')} />
        </Field>
        {error && <p className="text-caption text-[#A63030]">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            {t('Annuler')}
          </button>
          <button type="button" onClick={submit} className="btn-primary">
            {initial ? t('Enregistrer') : t('Créer le projet')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function BudgetBar({ budget, spent }: { budget: number; spent: number }) {
  if (budget <= 0) return null;
  const ratio = Math.min(1.2, spent / budget);
  const over = spent > budget;
  return (
    <div className="mt-3">
      <div className="h-2 overflow-hidden rounded-full bg-hairline">
        <div className={`h-full rounded-full ${over ? 'bg-[#D14343]' : ratio > 0.85 ? 'bg-brass' : 'bg-teal'}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        <span>{t('{pct} % du budget', { pct: Math.round((spent / budget) * 100) })}</span>
        <span>{over ? t('Dépassé') : t('Reste')} <Money value={Math.abs(budget - spent)} /></span>
      </div>
    </div>
  );
}

export default function Projects() {
  const { db } = useStore();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'ACTIVE' | 'ALL'>('ACTIVE');

  const rows = useMemo(
    () =>
      db.projects
        .filter((p) => filter === 'ALL' || p.status === 'ACTIVE')
        .map((p) => ({ project: p, summary: projectSummary(db, p.id) })),
    [db, filter],
  );

  const totals = rows.reduce(
    (acc, r) => ({ budget: acc.budget + r.project.budget, spent: acc.spent + r.summary.spent, revenue: acc.revenue + r.summary.revenue }),
    { budget: 0, spent: 0, revenue: 0 },
  );

  return (
    <>
      <PageHeader
        title={t('Projets')}
        subtitle={t('Ce qui sort du quotidien : combien ça coûte, combien ça rapporte')}
        actions={
          <button type="button" onClick={() => setOpen(true)} className="btn-primary">
            <IconPlus className="h-4 w-4" />
            {t('Nouveau projet')}
          </button>
        }
      />

      {db.projects.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {(['ACTIVE', 'ALL'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-pill border px-3 py-1.5 text-caption font-semibold ${filter === f ? 'border-teal bg-teal text-white' : 'border-hairline bg-white text-ink'}`}
              >
                {f === 'ACTIVE' ? t('En cours') : t('Tous')}
              </button>
            ))}
          </div>
          <span className="text-caption text-muted">
            {t('Budget')} <Money value={totals.budget} /> · {t('Dépensé')} <Money value={totals.spent} /> · {t('Recettes')} <Money value={totals.revenue} />
          </span>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card">
          <Empty
            title={db.projects.length ? t('Aucun projet en cours') : t('Aucun projet pour l’instant')}
            hint={t('Un projet, c’est une ouverture, un chantier, un événement, une machine : tout ce que vous voulez suivre à part, avec son budget et sa marge.')}
            icon={<IconFolder className="h-10 w-10" />}
          />
          <div className="mt-2 text-center">
            <button type="button" onClick={() => setOpen(true)} className="btn-primary">
              <IconPlus className="h-4 w-4" />
              {t('Créer mon premier projet')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map(({ project, summary }) => (
            <Link key={project.id} to={`/projets/${project.id}`} className="card block transition hover:border-teal/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-display text-[20px] font-bold text-ink">{project.name}</div>
                  <div className="text-caption text-muted">
                    {t(kindLabel(project.kind))} · {t('depuis le')} {project.startDate}
                  </div>
                </div>
                <Badge tone={STATUS_TONE[project.status]}>{t(STATUS_LABEL[project.status])}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t('Dépensé')}</div>
                  <div className="font-display text-[18px] font-bold text-ink"><Money value={summary.spent} /></div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t('Recettes')}</div>
                  <div className="font-display text-[18px] font-bold text-ink"><Money value={summary.revenue} /></div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t('Marge')}</div>
                  <div className={`font-display text-[18px] font-bold ${summary.margin >= 0 ? 'text-[#1F6F65]' : 'text-[#A63030]'}`}><Money value={summary.margin} /></div>
                </div>
              </div>
              <BudgetBar budget={project.budget} spent={summary.spent} />
              <div className="mt-3 flex items-center justify-end gap-1 text-caption font-semibold text-teal">
                {t('Voir le détail')} <IconChevronRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <ProjectForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
