import { useMemo, useState } from 'react';
import { useDB } from '../lib/store';
import { Badge, Empty, Field, PageHeader, StatCard, Table } from '../components/UI';
import { IconHistory } from '../components/Icons';

const ACTION_TONE: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'neutral'> = {
  CREATE: 'success',
  UPDATE: 'info',
  CONFIRM: 'success',
  RECEIVE: 'success',
  PAYMENT: 'info',
  ADJUST: 'warn',
  REVERSE: 'danger',
  OPEN: 'info',
  CLOSE: 'warn',
  QUOTE: 'neutral',
};

export default function AuditTrail() {
  const db = useDB();
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');

  const entities = useMemo(() => [...new Set(db.audit.map((a) => a.entity))], [db.audit]);
  const actions = useMemo(() => [...new Set(db.audit.map((a) => a.action))], [db.audit]);

  const filtered = db.audit.filter(
    (a) => (entity ? a.entity === entity : true) && (action ? a.action === action : true),
  );

  const todayCount = db.audit.filter((a) => a.at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;

  return (
    <>
      <PageHeader
        title="Historique"
        subtitle="Qui a fait quoi, et quand — chaque action de chaque membre, impossible à effacer"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Opérations enregistrées" value={db.audit.length} tone="dark" />
        <StatCard label="Aujourd'hui" value={todayCount} />
        <StatCard label="Types d'entités suivies" value={entities.length} />
      </div>

      <div className="card mt-6 mb-4 flex flex-wrap items-end gap-3">
        <Field label="Entité">
          <select value={entity} onChange={(e) => setEntity(e.target.value)} className="field">
            <option value="">Toutes</option>
            {entities.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Action">
          <select value={action} onChange={(e) => setAction(e.target.value)} className="field">
            <option value="">Toutes</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="card p-0">
        {filtered.length ? (
          <Table head={['Horodatage', 'Qui', 'Action', 'Quoi', 'Détail']}>
            {filtered.map((a) => (
              <tr key={a.id} className="row">
                <td className="td num text-slate-500">
                  {new Date(a.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })}
                </td>
                <td className="td font-medium">{a.user}</td>
                <td className="td">
                  <Badge tone={ACTION_TONE[a.action] ?? 'neutral'}>{a.action}</Badge>
                </td>
                <td className="td text-slate-500">{a.entity}</td>
                <td className="td">{a.summary}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title="Aucune opération enregistrée"
            hint="Chaque action dans l'application est tracée ici, avec son auteur et son horodatage."
            icon={<IconHistory className="h-10 w-10" />}
          />
        )}
      </div>
    </>
  );
}
