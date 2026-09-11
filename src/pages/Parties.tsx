import { useState } from 'react';
import { useStore } from '../lib/store';
import { outstanding } from '../lib/metrics';
import { partyUsage } from '../lib/reducer';
import { Empty, Field, Modal, Money, PageHeader, Table } from '../components/UI';
import { IconPlus, IconUsers } from '../components/Icons';
import { t } from '../lib/i18n';

type Tab = 'CUSTOMERS' | 'SUPPLIERS';
const BLANK = { id: '', name: '', phone: '', email: '', address: '' };

export default function Parties() {
  const { db, saveCustomer, saveSupplier, removeCustomer, removeSupplier, archiveCustomer, archiveSupplier } = useStore();
  const [tab, setTab] = useState<Tab>('CUSTOMERS');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [showArchived, setShowArchived] = useState(false);
  /** Fiche dont on est en train de demander la suppression. */
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);

  const isCustomers = tab === 'CUSTOMERS';
  const all = isCustomers ? db.customers : db.suppliers;
  const archivedCount = all.filter((p) => p.archived).length;
  // Quand la dernière fiche archivée est réactivée, on revient tout seul aux
  // fiches actives : sinon l'écran reste vide sans bouton pour en sortir.
  const viewingArchived = showArchived && archivedCount > 0;
  const list = all.filter((p) => (viewingArchived ? p.archived : !p.archived));
  const usage = target ? partyUsage(db, target.id) : null;

  function balanceFor(partyId: string) {
    return db.debts
      .filter((d) => d.partyId === partyId && d.party === (isCustomers ? 'CUSTOMER' : 'SUPPLIER'))
      .reduce((s, d) => s + outstanding(d), 0);
  }

  function submit() {
    if (!form.name.trim()) return;
    const payload = { ...form, id: form.id || undefined, name: form.name.trim() };
    if (isCustomers) saveCustomer(payload);
    else saveSupplier(payload);
    setForm(BLANK);
    setOpen(false);
  }

  function confirmRemove() {
    if (!target) return;
    if (isCustomers) removeCustomer(target.id);
    else removeSupplier(target.id);
    setTarget(null);
  }

  function restore(id: string) {
    if (isCustomers) archiveCustomer(id, false);
    else archiveSupplier(id, false);
  }

  return (
    <>
      <PageHeader
        title={t('Clients & fournisseurs')}
        subtitle={t('Répertoire des tiers et soldes en cours')}
        actions={
          <button
            onClick={() => {
              setForm(BLANK);
              setOpen(true);
            }}
            className="btn-primary"
          >
            <IconPlus className="h-4 w-4" />
            {isCustomers ? t('Nouveau client') : t('Nouveau fournisseur')}
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setTab('CUSTOMERS');
            setShowArchived(false);
          }}
          className={isCustomers ? 'btn-dark' : 'btn-ghost'}
        >
          {t('Clients (')}{db.customers.filter((c) => !c.archived).length})
        </button>
        <button
          onClick={() => {
            setTab('SUPPLIERS');
            setShowArchived(false);
          }}
          className={!isCustomers ? 'btn-dark' : 'btn-ghost'}
        >
          {t('Fournisseurs (')}{db.suppliers.filter((s) => !s.archived).length})
        </button>
        {archivedCount > 0 && (
          <button onClick={() => setShowArchived(!showArchived)} className="btn-ghost ml-auto text-caption">
            {viewingArchived ? t('Revenir aux fiches actives') : t('Voir les archivés ({n})', { n: String(archivedCount) })}
          </button>
        )}
      </div>

      <div className="card p-0">
        {list.length ? (
          <Table head={[t('Nom'), t('Téléphone'), t('Email'), t('Adresse'), isCustomers ? t('Créance') : t('Dette'), '']}>
            {list.map((p) => (
              <tr key={p.id} className="row">
                <td className="td font-semibold">{p.name}</td>
                <td className="td text-muted">{p.phone || '—'}</td>
                <td className="td text-muted">{p.email || '—'}</td>
                <td className="td text-muted">{p.address || '—'}</td>
                <td className="td num font-semibold">
                  <Money value={balanceFor(p.id)} />
                </td>
                <td className="td">
                  <div className="flex justify-end gap-1">
                    {p.archived ? (
                      <button onClick={() => restore(p.id)} className="btn-ghost px-2 py-1 text-[12px]">
                        {t('Réactiver')}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setForm({ id: p.id, name: p.name, phone: p.phone, email: p.email, address: p.address });
                            setOpen(true);
                          }}
                          className="btn-ghost px-2 py-1 text-[12px]"
                        >
                          {t('Modifier')}
                        </button>
                        <button
                          onClick={() => setTarget({ id: p.id, name: p.name })}
                          className="btn-ghost px-2 py-1 text-[12px] text-brand-600"
                        >
                          {t('Supprimer')}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title={
              viewingArchived
                ? t('Aucune fiche archivée')
                : isCustomers
                  ? t('Aucun client enregistré')
                  : t('Aucun fournisseur enregistré')
            }
            hint={t('Un tiers enregistré permet la vente à crédit et le suivi des soldes.')}
            icon={<IconUsers className="h-10 w-10" />}
          />
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? t('Modifier la fiche') : isCustomers ? t('Nouveau client') : t('Nouveau fournisseur')}
      >
        <div className="space-y-4">
          <Field label={t('Nom')}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
          </Field>
          <Field label={t('Téléphone')}>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field" />
          </Field>
          <Field label={t('Email')}>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" />
          </Field>
          <Field label={t('Adresse')}>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="field" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="btn-ghost">
            {t('Annuler')}
          </button>
          <button onClick={submit} className="btn-primary">
            {t('Enregistrer')}
          </button>
        </div>
      </Modal>

      {/* Effacer pour de bon n'est possible que sur une fiche qui n'a servi à
          rien. Dès qu'il y a une facture, on archive : le nom doit rester sur
          les documents déjà émis. */}
      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={usage && usage.total === 0 ? t('Supprimer cette fiche ?') : t('Archiver cette fiche ?')}
      >
        {usage && (
          <div className="space-y-3 text-body text-ink">
            <p className="font-semibold">{target?.name}</p>
            {usage.total === 0 ? (
              <p className="text-muted">{t('Cette fiche n’a aucune opération. Elle sera effacée définitivement.')}</p>
            ) : (
              <>
                <p className="text-muted">
                  {t('Cette fiche apparaît dans {n} opérations déjà enregistrées. On ne l’efface pas : elle est retirée des listes, et les documents gardent le nom.', {
                    n: String(usage.sales + usage.purchases + usage.debts),
                  })}
                </p>
                <ul className="space-y-1 text-caption text-muted">
                  {usage.sales > 0 && <li>{t('Ventes : {n}', { n: String(usage.sales) })}</li>}
                  {usage.purchases > 0 && <li>{t('Achats : {n}', { n: String(usage.purchases) })}</li>}
                  {usage.debts > 0 && <li>{t('Dettes et crédits : {n}', { n: String(usage.debts) })}</li>}
                </ul>
                {usage.open > 0 && (
                  <p className="rounded-lg bg-brand-500/10 px-3 py-2 text-caption text-ink">
                    {t('Attention : il reste un solde en cours de')} <Money value={usage.open} />.{' '}
                    {t('Il restera visible dans « Dettes & crédits ».')}
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setTarget(null)} className="btn-ghost">
            {t('Annuler')}
          </button>
          <button onClick={confirmRemove} className="btn-primary">
            {usage && usage.total === 0 ? t('Supprimer définitivement') : t('Archiver')}
          </button>
        </div>
      </Modal>
    </>
  );
}
