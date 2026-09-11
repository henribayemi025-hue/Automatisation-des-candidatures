import type { AccountKey } from './chart';

/** Libellé courant de chaque poste de dépense, partagé par les écrans de saisie. */
export const EXPENSE_LABEL: Record<AccountKey, string> = {
  PURCHASES: 'Achats de marchandises',
  UTILITIES: 'Eau, électricité, énergie',
  TRANSPORT: 'Transport et carburant',
  RENT: 'Loyer',
  SERVICES: 'Services extérieurs',
  PAYROLL: 'Salaires et charges',
  TAXES: 'Impôts et taxes',
  FINANCIAL: 'Frais bancaires et financiers',
  MISC_EXPENSE: 'Charges diverses',
  CAPITAL: '',
  RESULT: '',
  EQUIPMENT: '',
  INVENTORY: '',
  SUPPLIERS: '',
  CUSTOMERS: '',
  VAT_COLLECTED: '',
  VAT_DEDUCTIBLE: '',
  BANK: '',
  CASH: '',
  MOBILE_MONEY: '',
  INVENTORY_CHANGE: '',
  SALES: '',
  SERVICE_REVENUE: '',
  MISC_REVENUE: '',
};
