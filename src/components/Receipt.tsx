import { useNavigate } from 'react-router-dom';
import type { Company, Sale } from '../lib/types';
import { formatMoney } from '../lib/money';
import { locale, t } from '../lib/i18n';
import { Modal, Money } from './UI';
import { tracksStock } from '../lib/sector';
import { IconCheck, IconDoc } from './Icons';

/**
 * Le ticket de caisse. Il s'affiche dès que la vente est validée — c'est
 * ce qu'un commerçant attend après avoir appuyé sur « Valider » : la preuve
 * que c'est passé, et quelque chose à donner au client.
 *
 * Trois sorties : imprimer (une fenêtre 80 mm qui lance l'impression),
 * envoyer par WhatsApp (texte prêt), ou fermer et enchaîner.
 */

/**
 * La mention légale que le régime impose sur le document remis au client.
 *
 * Une micro-entreprise française qui ne porte pas « TVA non applicable, art.
 * 293 B du CGI » remet une facture non conforme. Relevé le 21/09 avec le reste
 * du retour d'une comptable française.
 *
 * Rien pour les autres régimes tant qu'on n'a pas vérifié le texte exact du
 * pays : une mention fausse est pire qu'une mention absente.
 */
function legalMention(company: Company): string {
  if (company.taxRegime === 'MICRO') return t('TVA non applicable, art. 293 B du CGI');
  return '';
}

/**
 * L'identité de l'émetteur, ligne par ligne, sans inventer ce qui n'est pas
 * renseigné : une ligne absente vaut mieux qu'une ligne « SIRET : — ».
 */
function identityLines(company: Company): string[] {
  const out: string[] = [];
  if (company.address) out.push(company.address);
  if (company.phone) out.push(company.phone);
  if (company.registrationId) {
    const label = company.country === 'France' ? 'SIREN' : company.chart === 'SYSCOHADA' ? 'RCCM' : t('N°');
    out.push(`${label} ${company.registrationId}`);
  }
  if (company.vatEnabled && company.vatId) out.push(`${t('TVA')} ${company.vatId}`);
  return out;
}

/**
 * Ce qu'une facture française à un professionnel doit porter en plus du reste.
 * Ces deux phrases sont exigées par le Code de commerce (L441-10 et D441-5) ;
 * les montants ne sont pas de nous. On ne les imprime que lorsqu'une cliente
 * est identifiée : sur un ticket de comptoir, elles n'ont pas de sens.
 */
function proMentions(company: Company, sale: Sale): string[] {
  if (company.country !== 'France') return [];
  if (!sale.customerId || sale.status === 'QUOTE') return [];
  return [
    t('Pénalités de retard : trois fois le taux d’intérêt légal. Indemnité forfaitaire pour frais de recouvrement : 40 €.'),
    t('Pas d’escompte pour paiement anticipé.'),
  ];
}

/**
 * Les libellés d'une vente sans fiche client. « Client passager » est
 * l'ancien, gardé parce que les ventes déjà enregistrées le portent : le
 * journal ne se réécrit pas.
 */
const ANONYME = new Set(['Vente au comptoir', 'Client passager']);

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Espèces',
  MOBILE: 'Mobile money',
  CARD: 'Carte',
  BANK: 'Virement',
  CREDIT: 'Crédit (à terme)',
};

function receiptText(company: Company, sale: Sale): string {
  const cur = company.currency;
  const lines = [
    company.name,
    ...identityLines(company),
    `${sale.status === 'QUOTE' ? t('Devis') : sale.customerId ? t('Facture') : t('Ticket')} ${sale.number} — ${sale.date}`,
    '',
    ...sale.lines.map((l) => `${l.qty} × ${l.name} — ${formatMoney(l.unitPrice * l.qty, cur)}`),
    '',
  ];
  if (sale.discount > 0) lines.push(`${t('Remise')} : −${formatMoney(sale.discount, cur)}`);
  if (sale.vat > 0) lines.push(`${company.taxLabel || t('TVA')} : ${formatMoney(sale.vat, cur)}`);
  lines.push(`${t('Total')} : ${formatMoney(sale.total, cur)}`);
  if (sale.status !== 'QUOTE') {
    lines.push(`${t('Payé')} : ${formatMoney(sale.paid, cur)} (${t(METHOD_LABEL[sale.method] ?? sale.method)})`);
    if (sale.total - sale.paid > 0) lines.push(`${t('Reste à payer')} : ${formatMoney(sale.total - sale.paid, cur)}`);
  }
  const mention = legalMention(company);
  if (mention) lines.push('', mention);
  for (const m of proMentions(company, sale)) lines.push(m);
  lines.push('', t('Merci de votre confiance.'));
  return lines.join('\n');
}

function printReceipt(company: Company, sale: Sale): void {
  const cur = company.currency;
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(sale.number)}</title>
<style>
  @page { margin: 6mm; }
  body { font: 12px/1.4 "Courier New", monospace; color: #000; width: 72mm; margin: 0 auto; }
  h1 { font-size: 15px; margin: 0 0 2px; text-align: center; }
  .c { text-align: center; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td { padding: 2px 0; vertical-align: top; }
  td.n { text-align: right; white-space: nowrap; }
  .tot td { border-top: 1px dashed #000; padding-top: 6px; font-weight: bold; font-size: 13px; }
  .foot { margin-top: 12px; text-align: center; font-size: 11px; }
</style></head><body>
<h1>${esc(company.name)}</h1>
${identityLines(company).length ? `<div class="c" style="font-size:11px">${identityLines(company).map(esc).join('<br>')}</div>` : ''}
<div class="c">${sale.status === 'QUOTE' ? t('Devis') : sale.customerId ? t('Facture') : t('Ticket')} ${esc(sale.number)}<br>${esc(sale.date)}${sale.customerName && !ANONYME.has(sale.customerName) ? `<br>${esc(sale.customerName)}` : ''}</div>
<table>
${sale.lines.map((l) => `<tr><td>${l.qty} × ${esc(l.name)}</td><td class="n">${esc(formatMoney(l.unitPrice * l.qty, cur))}</td></tr>`).join('')}
${sale.discount > 0 ? `<tr><td>${t('Remise')}</td><td class="n">−${esc(formatMoney(sale.discount, cur))}</td></tr>` : ''}
${sale.vat > 0 ? `<tr><td>${esc(company.taxLabel || t('TVA'))}</td><td class="n">${esc(formatMoney(sale.vat, cur))}</td></tr>` : ''}
<tr class="tot"><td>${t('Total')}</td><td class="n">${esc(formatMoney(sale.total, cur))}</td></tr>
${sale.status !== 'QUOTE' ? `<tr><td>${t('Payé')} — ${esc(t(METHOD_LABEL[sale.method] ?? sale.method))}</td><td class="n">${esc(formatMoney(sale.paid, cur))}</td></tr>` : ''}
${sale.total - sale.paid > 0 && sale.status !== 'QUOTE' ? `<tr><td>${t('Reste à payer')}</td><td class="n">${esc(formatMoney(sale.total - sale.paid, cur))}</td></tr>` : ''}
</table>
${legalMention(company) ? `<div class="foot">${esc(legalMention(company))}</div>` : ''}
${proMentions(company, sale).map((m) => `<div class="foot" style="font-size:10px">${esc(m)}</div>`).join('')}
<div class="foot">${t('Merci de votre confiance.')}<br>${esc(new Date().toLocaleString(locale()))}</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

export default function Receipt({ sale, company, onClose }: { sale: Sale | null; company: Company; onClose: () => void }) {
  const navigate = useNavigate();
  if (!sale) return null;
  const isQuote = sale.status === 'QUOTE';
  // Annoncer un stock mis à jour après une prestation n'est pas une petite
  // imprécision : la personne cherche un mouvement de stock qui n'existe pas.
  // Relevé le 21/09 par une comptable qui testait une prothésiste ongulaire.
  const deStock = tracksStock(company) && sale.lines.some((l) => l.productId);
  const remaining = sale.total - sale.paid;
  const wa = `https://wa.me/?text=${encodeURIComponent(receiptText(company, sale))}`;

  return (
    <Modal open onClose={onClose} title={isQuote ? t('Devis {n} enregistré', { n: sale.number }) : t('Vente {n} enregistrée', { n: sale.number })}>
      <div className="flex items-center gap-2 rounded-input bg-teal/10 px-3 py-2 text-caption font-semibold text-teal">
        <IconCheck className="h-4 w-4" />
        {isQuote
          ? t('Rien n’est encaissé ni déstocké : le devis attend dans « Devis ».')
          : deStock
            ? t('Caisse, stock et comptabilité mis à jour.')
            : t('Caisse et comptabilité mises à jour.')}
      </div>

      <div className="mx-auto mt-4 max-w-[340px] rounded-card border border-hairline bg-base px-4 py-4 font-mono text-[12.5px] text-ink">
        <p className="text-center font-bold">{company.name}</p>
        {identityLines(company).map((l) => (
          <p key={l} className="text-center text-[11px] text-muted">{l}</p>
        ))}
        <p className="text-center text-muted">
          {isQuote ? t('Devis') : sale.customerId ? t('Facture') : t('Ticket')} {sale.number} · {sale.date}
        </p>
        {sale.customerName && !ANONYME.has(sale.customerName) && <p className="text-center text-muted">{sale.customerName}</p>}
        <table className="mt-3 w-full">
          <tbody>
            {sale.lines.map((l) => (
              <tr key={l.productId}>
                <td className="py-0.5 pr-2 align-top">
                  {l.qty} × {l.name}
                </td>
                <td className="py-0.5 text-right align-top num">
                  <Money value={l.unitPrice * l.qty} />
                </td>
              </tr>
            ))}
            {sale.discount > 0 && (
              <tr>
                <td className="py-0.5">{t('Remise')}</td>
                <td className="py-0.5 text-right num">
                  −<Money value={sale.discount} />
                </td>
              </tr>
            )}
            {sale.vat > 0 && (
              <tr>
                <td className="py-0.5">{company.taxLabel || t('TVA')}</td>
                <td className="py-0.5 text-right num">
                  <Money value={sale.vat} />
                </td>
              </tr>
            )}
            <tr className="border-t border-dashed border-ink/40 text-[14px] font-bold">
              <td className="pt-2">{t('Total')}</td>
              <td className="pt-2 text-right num">
                <Money value={sale.total} />
              </td>
            </tr>
            {!isQuote && (
              <tr>
                <td className="py-0.5">
                  {t('Payé')} · {t(METHOD_LABEL[sale.method] ?? sale.method)}
                </td>
                <td className="py-0.5 text-right num">
                  <Money value={sale.paid} />
                </td>
              </tr>
            )}
            {!isQuote && remaining > 0 && (
              <tr className="text-brand-500">
                <td className="py-0.5">{t('Reste à payer')}</td>
                <td className="py-0.5 text-right num">
                  <Money value={remaining} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {legalMention(company) && (
          <p className="mt-3 text-center text-[11px] text-muted">{legalMention(company)}</p>
        )}
        {proMentions(company, sale).map((m) => (
          <p key={m} className="mt-1 text-center text-[10px] text-muted">{m}</p>
        ))}
        <p className="mt-3 text-center text-muted">{t('Merci de votre confiance.')}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => printReceipt(company, sale)} className="btn-ghost">
          <IconDoc className="h-4 w-4" />
          {t('Imprimer')}
        </button>
        <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost">
          {t('Envoyer sur WhatsApp')}
        </a>
        {isQuote && (
          <button
            onClick={() => {
              onClose();
              navigate('/devis');
            }}
            className="btn-ghost"
          >
            {t('Voir les devis')}
          </button>
        )}
        <button onClick={onClose} className="btn-primary ml-auto">
          {isQuote ? t('Nouvelle vente') : t('Vente suivante')}
        </button>
      </div>
    </Modal>
  );
}
