import { useState } from 'react';
import { useStore } from '../lib/store';
import { outstanding } from '../lib/metrics';
import { Empty, Field, Modal, Money, PageHeader, Table } from '../components/UI';
import { IconPlus, IconUsers } from '../components/Icons';
import { t } from '../lib/i18n';

type Tab = 'CUSTOMERS' | 'SUPPLIERS';
const BLANK = { name: '', phone: '', email: '', address: '' };

export default function Parties() {
  const { db, saveCustomer, saveSupplier } = useStore();
  const [tab, setTab] = useState<Tab>('CUSTOMERS');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);

  const isCustomers = tab === 'CUSTOMERS';
  const list = isCustomers ? db.customers : db.suppliers;

  function balanceFor(partyId: string) {
    return db.debts
      .filter((d) => d.partyId === partyId && d.party === (isCustomers ? 'CUSTOMER' : 'SUPPLIER'))
      .reduce((s, d) => s + outstanding(d), 0);
  }

  function submit() {
    if (!form.name.trim()) return;
    const payload = { ...form, name: form.name.trim() };
    if (isCustomers) saveCustomer(payload);
    else saveSupplier(payload);
    setForm(BLANK);
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title={t('Clients & fournisseurs')}
        subtitle={t('Répertoire des tiers et soldes en cours')}
        actions={
          <button onClick={() => setOpen(true)} className="btn-primary">
            <IconPlus className="h-4 w-4" />
            {isCustomers ? 'Nouveau client' : 'Nouveau fournisseur'}
          </button>
        }
      />

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('CUSTOMERS')} className={isCustomers ? 'btn-dark' : 'btn-ghost'}>
          {t('Clients (')}{db.customers.length})
        </button>
        <button onClick={() => setTab('SUPPLIERS')} className={!isCustomers ? 'btn-dark' : 'btn-ghost'}>
          {t('Fournisseurs (')}{db.suppliers.length})
        </button>
      </div>

      <div className="card p-0">
        {list.length ? (
          <Table head={['Nom', 'Téléphone', 'Email', 'Adresse', isCustomers ? 'Créance' : 'Dette']}>
            {list.map((p) => (
              <tr key={p.id} className="row">
                <td className="td font-semibold">{p.name}</td>
                <td className="td text-slate-500">{p.phone || '—'}</td>
                <td className="td text-slate-500">{p.email || '—'}</td>
                <td className="td text-slate-500">{p.address || '—'}</td>
                <td className="td num font-semibold">
                  <Money value={balanceFor(p.id)} />
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title={isCustomers ? 'Aucun client enregistré' : 'Aucun fournisseur enregistré'}
            hint={t('Un tiers enregistré permet la vente à crédit et le suivi des soldes.')}
            icon={<IconUsers className="h-10 w-10" />}
          />
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isCustomers ? 'Nouveau client' : 'Nouveau fournisseur'}
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
    </>
  );
}
