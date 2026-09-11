/**
 * Supprimer un client ou un fournisseur : effacé s'il n'a servi à rien,
 * archivé dès qu'une opération porte son nom (la facture doit rester lisible).
 */
import { applyEvent, emptyDB, partyUsage } from '../src/lib/reducer';
import type { DB, WorkspaceEvent } from '../src/lib/types';

let seq = 0;
function ev(type: string, payload: Record<string, unknown>): WorkspaceEvent {
  seq += 1;
  return { id: `e${seq}`, at: '2026-09-11T10:00:00.000Z', type, payload, actorId: 'u1', actorName: 'Beau' } as WorkspaceEvent;
}

let db: DB = emptyDB();
const feed = (type: string, payload: Record<string, unknown>) => {
  db = applyEvent(db, ev(type, payload));
};

const neuf = { id: 'c-neuf', name: 'Client saisi par erreur', phone: '', email: '', address: '', createdAt: '2026-09-01' };
const actif = { id: 'c-actif', name: 'Boutique Awa', phone: '690000000', email: '', address: '', createdAt: '2026-09-01' };
const fournisseur = { id: 'f1', name: 'Grossiste Douala', phone: '', email: '', address: '', createdAt: '2026-09-01' };

feed('customer.save', { customer: neuf });
feed('customer.save', { customer: actif });
feed('supplier.save', { supplier: fournisseur });

feed('sale.record', {
  sale: {
    id: 's1', number: 'FA-0001', date: '2026-09-05', customerId: actif.id, customerName: actif.name,
    lines: [{ productId: 'p1', name: 'Sac de riz', qty: 1, unitPrice: 20000, unitCost: 15000 }],
    discount: 0, gross: 20000, net: 16771, vat: 3229, total: 20000, cost: 15000,
    method: 'CREDIT', status: 'CONFIRMED', paid: 0, createdAt: '2026-09-05T09:00:00.000Z',
  },
  ids: { entryId: 'j1', debtId: 'd1', movementIds: ['m1'] },
});

console.log('usage client neuf   :', partyUsage(db, neuf.id));
console.log('usage client actif  :', partyUsage(db, actif.id));

feed('customer.remove', { customerId: neuf.id });
feed('customer.remove', { customerId: actif.id });
feed('supplier.remove', { supplierId: fournisseur.id });

const still = db.customers.map((c) => `${c.name}${c.archived ? ' (archivé)' : ''}`);
console.log('clients restants    :', still.length ? still.join(' · ') : '(aucun)');
console.log('fournisseurs        :', db.suppliers.length ? db.suppliers.map((s) => s.name).join(' · ') : '(aucun)');

const sale = db.sales[0];
console.log('facture FA-0001     :', sale.number, '→', sale.customerName, '(nom conservé)');

feed('customer.archive', { customerId: actif.id, archived: false });
console.log('après réactivation  :', db.customers.map((c) => `${c.name}${c.archived ? ' (archivé)' : ''}`).join(' · '));

const trace = db.audit.filter((a) => a.entity === 'customer' || a.entity === 'supplier').map((a) => `${a.action} ${a.summary}`);
console.log('journal             :\n  ' + trace.join('\n  '));

const ok =
  !db.customers.some((c) => c.id === neuf.id) &&
  db.customers.some((c) => c.id === actif.id && !c.archived) &&
  db.suppliers.length === 0 &&
  sale.customerName === actif.name;
console.log(ok ? '\nOK : effacé si vide, archivé si utilisé, historique intact.' : '\nÉCHEC');
process.exit(ok ? 0 : 1);
