import { useState } from 'react';
import { useCollab } from '../lib/collab';
import type { MemberRole } from '../lib/types';
import { Badge, Empty, Field, PageHeader, Table } from '../components/UI';
import { Avatar } from '../components/PresenceAvatars';
import { IconUsers } from '../components/Icons';
import { t } from '../lib/i18n';

const ROLES: { value: MemberRole; label: string; hint: string }[] = [
  { value: 'manager', label: 'Gérant', hint: 'Tout, sauf supprimer l’espace' },
  { value: 'cashier', label: 'Caissier', hint: 'Vendre, caisse, stock, clients' },
  { value: 'accountant', label: 'Comptable', hint: 'Tout voir, comptabilité, sans l’équipe ni les paramètres' },
];

export default function Team() {
  const { user, workspace, members, presence, inviteMember, removeMember } = useCollab();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('cashier');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const isOwner = workspace?.role === 'owner';

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    const err = await inviteMember(email, role);
    setBusy(false);
    if (err) setError(err);
    else {
      setOk(t('{email} peut maintenant se connecter avec ce même email et rejoindre l’espace.', { email }));
      setEmail('');
    }
  }

  if (!user) {
    return (
      <>
        <PageHeader title={t('Équipe')} subtitle={t('Travailler à plusieurs sur le même espace')} />
        <div className="card">
          <Empty
            title={t('Créez un compte pour inviter votre équipe')}
            hint={t('En mode local, les données restent sur cet appareil. Avec un compte, votre caissier, votre gérant et votre comptable travaillent en direct sur les mêmes chiffres.')}
            icon={<IconUsers className="h-10 w-10" />}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t('Équipe')} subtitle={t('Espace « {name} » — {n} personne(s) en ligne', { name: workspace?.name ?? '', n: presence.length })} />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="card p-0">
          <h2 className="px-5 pb-3 pt-5 text-section">{t('Membres')}</h2>
          <Table head={['Personne', 'Rôle', 'Statut', '']}>
            <tr className="row">
              <td className="td">
                <div className="flex items-center gap-3">
                  <Avatar name={workspace?.name ?? 'Propriétaire'} size={32} />
                  <div>
                    <div className="font-semibold">{isOwner ? t('Vous') : t('Propriétaire')}</div>
                    <div className="text-caption text-muted">{isOwner ? user.email : '—'}</div>
                  </div>
                </div>
              </td>
              <td className="td">
                <Badge tone="info">{t('Propriétaire')}</Badge>
              </td>
              <td className="td">
                <Badge tone="success">{t('Actif')}</Badge>
              </td>
              <td className="td" />
            </tr>
            {members.map((m, i) => {
              const online = presence.some((p) => p.key === m.userId);
              return (
                <tr key={m.email} className="row">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.displayName ?? m.email} size={32} index={i + 1} />
                      <div>
                        <div className="font-semibold">{m.displayName ?? m.email.split('@')[0]}</div>
                        <div className="text-caption text-muted">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td">{t(ROLES.find((r) => r.value === m.role)?.label ?? m.role)}</td>
                  <td className="td">
                    {online ? <Badge tone="success">{t('En ligne')}</Badge> : m.userId ? <Badge>{t('Hors ligne')}</Badge> : <Badge tone="warn">{t('Pas encore connecté')}</Badge>}
                  </td>
                  <td className="td text-right">
                    {isOwner && (
                      <button onClick={() => void removeMember(m.email)} className="text-caption font-semibold text-[#D14343]">
                        {t('Retirer')}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
          {members.length === 0 && (
            <p className="px-5 pb-5 text-caption text-muted">{t('Vous êtes seul pour l’instant. Invitez quelqu’un à droite.')}</p>
          )}
        </div>

        <div className="card h-fit">
          <h2 className="text-section">{t('Inviter quelqu’un')}</h2>
          <p className="mt-1 text-caption text-muted">
            {t('La personne se connecte avec cet email (ou son compte Google) et retrouve l’espace immédiatement.')}
          </p>
          {!isOwner && <p className="mt-3 rounded-input bg-base px-3 py-2 text-caption text-muted">{t('Seul le propriétaire peut inviter.')}</p>}
          {error && <div className="mt-3 rounded-input bg-[#FDEDED] px-3 py-2 text-caption text-[#A63030]">{error}</div>}
          {ok && <div className="mt-3 rounded-input bg-[#EAF6EA] px-3 py-2 text-caption text-[#1F6F65]">{ok}</div>}
          <form onSubmit={invite} className="mt-4 space-y-4">
            <Field label={t('Email')}>
              <input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isOwner} className="field" placeholder={t('caissier@exemple.com')} />
            </Field>
            <Field label={t('Rôle')}>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <label key={r.value} className={`flex cursor-pointer items-start gap-3 rounded-input border p-3 ${role === r.value ? 'border-teal bg-teal-light' : 'border-hairline'}`}>
                    <input type="radio" name="role" checked={role === r.value} onChange={() => setRole(r.value)} className="mt-1 accent-teal" />
                    <span>
                      <span className="block text-body font-semibold">{t(r.label)}</span>
                      <span className="block text-caption text-muted">{t(r.hint)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Field>
            <button type="submit" disabled={!isOwner || busy} className="btn-primary w-full">
              {busy ? 'Un instant…' : 'Inviter'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
