import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import { projectSummary } from '../lib/metrics';
import type { ProjectOperation } from '../lib/metrics';
import { Badge, Empty, Field, Modal, Money, PageHeader, StatCard, Table } from '../components/UI';
import { IconCard, IconChart, IconChevronRight, IconFolder, IconTrend, IconWallet } from '../components/Icons';
import { ProjectForm, STATUS_LABEL, STATUS_TONE, kindLabel } from './Projects';
import { t } from '../lib/i18n';

const KIND_LABEL: Record<ProjectOperation['kind'], string> = { sale: 'Vente', purchase: 'Achat', expense: 'Dépense' };

/** Fiche d'un projet : budget, opérations rattachées, marge, et rattachement après coup. */
export default function ProjectDetail() {
  const { id = '' } = useParams();
  const { db, assignToProject } = useStore();
  const project = db.projects.find((p) => p.id === id);
  const summary = useMemo(() => projectSummary(db, id), [db, id]);
  const [edit, setEdit] = useState(false);
  const [attach, setAttach] = useState(false);
  const [pick, setPick] = useState('');

  // Opérations récentes non rattachées, proposées au rattachement.
  const candidates = useMemo(() => {
    const list: { key: string; kind: ProjectOperation['kind']; id: string; date: string; label: string; amount: number }[] = [];
    for (const s of db.sales) if (!s.projectId && s.status === 'CONFIRMED') list.push({ key: `sale:${s.id}`, kind: 'sale', id: s.id, date: s.date, label: `${s.number} — ${s.customerName}`, amount: s.total });
    for (const p of db.purchases) if (!p.projectId && p.status !== 'CANCELLED') list.push({ key: `purchase:${p.id}`, kind: 'purchase', id: p.id, date: p.date, label: `${p.number} — ${p.supplierName}`, amount: -p.total });
    for (const e of db.expenses) if (!e.projectId) list.push({ key: `expense:${e.id}`, kind: 'expense', id: e.id, date: e.date, label: e.description || e.category, amount: -e.amount });
    return list.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 60);
  }, [db]);

  if (!project) {
    return (
      <>
        <PageHeader title={t('Projet introuvable')} />
        <div className="card">
          <Empty title={t('Ce projet n’existe pas ou a été supprimé.')} icon={<IconFolder className="h-10 w-10" />} />
          <div className="mt-2 text-center">
            <Link to="/projets" className="btn-ghost">{t('Retour aux projets')}</Link>
          </div>
        </div>
      </>
    );
  }

  function doAttach() {
    const c = candidates.find((x) => x.key === pick);
    if (!c) return;
    assignToProject(c.kind, c.id, project!.id);
    setPick('');
    setAttach(false);
  }

  const budgetRatio = project.budget > 0 ? summary.spent / project.budget : 0;

  return (
    <>
      <PageHeader
        title={project.name}
        subtitle={`${t(kindLabel(project.kind))} · ${t('du')} ${project.startDate}${project.endDate ? ` ${t('au')} ${project.endDate}` : ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/projets" className="btn-ghost">{t('Tous les projets')}</Link>
            <Link to={`/discussion/${project.id}`} className="btn-ghost">{t('Discussion')}</Link>
            <button type="button" onClick={() => setAttach(true)} className="btn-ghost">{t('Rattacher une opération')}</button>
            <button type="button" onClick={() => setEdit(true)} className="btn-primary">{t('Modifier')}</button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge tone={STATUS_TONE[project.status]}>{t(STATUS_LABEL[project.status])}</Badge>
        {project.notes && <span className="text-caption text-muted">{project.notes}</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Budget prévu')} value={<Money value={project.budget} />} hint={project.budget > 0 ? t('{pct} % utilisé', { pct: Math.round(budgetRatio * 100) }) : t('Pas de budget fixé')} icon={<IconWallet className="h-[18px] w-[18px] text-teal" />} />
        <StatCard label={t('Dépensé')} value={<Money value={summary.spent} />} hint={t('Achats reçus + dépenses')} icon={<IconCard className="h-[18px] w-[18px] text-[#D14343]" />} tone={project.budget > 0 && summary.spent > project.budget ? 'negative' : 'default'} />
        <StatCard label={t('Recettes')} value={<Money value={summary.revenue} />} hint={t('Ventes rattachées au projet')} icon={<IconTrend className="h-[18px] w-[18px] text-[#1F6F65]" />} />
        <StatCard label={t('Marge du projet')} value={<Money value={summary.margin} />} hint={t('Recettes − achats − dépenses')} icon={<IconChart className="h-[18px] w-[18px] text-teal" />} tone={summary.margin >= 0 ? 'positive' : 'negative'} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="card p-0">
          <div className="px-5 pb-3 pt-5">
            <h2 className="text-section">{t('Opérations du projet')}</h2>
            <p className="text-caption text-muted">{t('Tout ce qui a été rattaché à ce projet, à la saisie ou après coup.')}</p>
          </div>
          {summary.operations.length === 0 ? (
            <div className="px-5 pb-6">
              <Empty
                title={t('Rien de rattaché pour l’instant')}
                hint={t('Choisissez ce projet dans le champ « Projet » au moment de vendre, d’acheter ou d’enregistrer une dépense — ou rattachez une opération déjà saisie.')}
                icon={<IconFolder className="h-10 w-10" />}
              />
            </div>
          ) : (
            <Table head={['Date', 'Type', 'Libellé', 'Montant', '']}>
              {summary.operations.map((op) => (
                <tr key={`${op.kind}:${op.id}`} className="row">
                  <td className="td text-caption text-muted">{op.date}</td>
                  <td className="td">
                    <Badge tone={op.kind === 'sale' ? 'success' : op.kind === 'purchase' ? 'info' : 'warn'}>{t(KIND_LABEL[op.kind])}</Badge>
                  </td>
                  <td className="td">{op.label}</td>
                  <td className={`td num font-semibold ${op.amount >= 0 ? 'text-[#1F6F65]' : 'text-[#A63030]'}`}>
                    <Money value={op.amount} />
                  </td>
                  <td className="td text-right">
                    <button type="button" onClick={() => assignToProject(op.kind, op.id, null)} className="text-caption font-medium text-muted hover:text-[#D14343]">
                      {t('Détacher')}
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="text-section">{t('Où va l’argent')}</h2>
            <ul className="mt-3 space-y-2 text-body">
              <li className="flex justify-between"><span className="text-muted">{t('Achats reçus')}</span><Money value={summary.purchases} className="font-semibold" /></li>
              <li className="flex justify-between"><span className="text-muted">{t('Dépenses')}</span><Money value={summary.expenses} className="font-semibold" /></li>
              <li className="flex justify-between border-t border-hairline pt-2"><span className="text-muted">{t('Total dépensé')}</span><Money value={summary.spent} className="font-semibold" /></li>
              {project.budget > 0 && (
                <li className="flex justify-between"><span className="text-muted">{summary.remaining >= 0 ? t('Reste sur le budget') : t('Dépassement')}</span><Money value={Math.abs(summary.remaining)} className={`font-semibold ${summary.remaining >= 0 ? 'text-[#1F6F65]' : 'text-[#A63030]'}`} /></li>
              )}
            </ul>
            <p className="mt-3 text-caption text-muted">{t('Les achats comptent à la réception. Le coût des marchandises vendues n’est pas compté une deuxième fois.')}</p>
          </div>
          <Link to="/assistant" className="card block transition hover:border-teal/60">
            <div className="flex items-center justify-between">
              <span className="text-body font-semibold">{t('Demander à l’assistant')}</span>
              <IconChevronRight className="h-4 w-4 text-teal" />
            </div>
            <p className="mt-1 text-caption text-muted">{t('« Où en est le projet {name} ? »', { name: project.name })}</p>
          </Link>
        </div>
      </div>

      {edit && <ProjectForm open={edit} onClose={() => setEdit(false)} initial={project} />}

      <Modal open={attach} onClose={() => setAttach(false)} title={t('Rattacher une opération')}>
        <div className="space-y-4">
          <p className="text-caption text-muted">{t('Une vente, un achat ou une dépense déjà enregistrés, pas encore rattachés à un projet.')}</p>
          <Field label={t('Opération')}>
            <select value={pick} onChange={(e) => setPick(e.target.value)} className="field" id="attach-pick">
              <option value="">{t('— Choisir —')}</option>
              {candidates.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.date} · {t(KIND_LABEL[c.kind])} · {c.label}
                </option>
              ))}
            </select>
          </Field>
          {candidates.length === 0 && <p className="text-caption text-muted">{t('Toutes les opérations récentes sont déjà rattachées, ou il n’y en a pas encore.')}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAttach(false)} className="btn-ghost">{t('Annuler')}</button>
            <button type="button" onClick={doAttach} disabled={!pick} className="btn-primary">{t('Rattacher')}</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
