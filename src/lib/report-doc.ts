/**
 * Le document imprimable des rapports.
 *
 * Il s'ouvre dans une fenêtre vide, donc dans la même origine que
 * l'application : un nom de client écrit « <img onerror=…> » y exécuterait du
 * code avec la session de la personne qui imprime. Ces noms viennent aussi des
 * commandes de la place de marché (liaison), donc de quelqu'un d'extérieur.
 * Tout ce qui entre ici est échappé, sans exception (audit jour 11, 14/10).
 */

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export interface ReportDoc {
  lang: string;
  title: string;
  subtitle: string;
  companyName: string;
  place: string;
  period: string;
  meta: [string, string][];
  /** Un avertissement au-dessus du tableau (ventes sans coût, par exemple). */
  warning?: string;
  head: string[];
  rows: string[][];
  totals?: string[];
  empty: string;
  edited: string;
  lines: string;
}

export function reportHtml(d: ReportDoc): string {
  const e = escapeHtml;
  return `<!doctype html>
<html lang="${e(d.lang)}"><head><meta charset="utf-8"><title>${e(d.title)} — ${e(d.companyName)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Inter,system-ui,sans-serif;margin:0;padding:32px;color:#0f1420}
  header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:3px solid #C25E38;padding-bottom:16px;margin-bottom:24px}
  h1{margin:0;font-size:22px}
  .muted{color:#64748b;font-size:12px;margin-top:4px}
  .brand{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#AC4F2D}
  table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}
  th{text-align:left;background:#f1f5f9;padding:8px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#475569}
  td{padding:8px;border-bottom:1px solid #e2e8f0}
  tfoot td{font-weight:800;border-top:2px solid #0f1420;border-bottom:none}
  .meta{display:flex;flex-wrap:wrap;gap:8px 24px;font-size:12px;color:#475569;margin-bottom:16px}
  .warn{border:1px solid #C25E38;border-radius:6px;padding:8px 12px;font-size:12px;color:#8a3a1d;margin-bottom:16px}
  footer{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between;gap:16px}
  @media print{body{padding:16px}}
</style></head><body>
<header>
  <div>
    <div class="brand">Finjaro Accounting</div>
    <h1>${e(d.title)}</h1>
    <div class="muted">${e(d.subtitle)}</div>
  </div>
  <div style="text-align:right">
    <div style="font-weight:700">${e(d.companyName)}</div>
    <div class="muted">${e(d.place)}</div>
    <div class="muted">${e(d.period)}</div>
  </div>
</header>
<div class="meta">${d.meta.map(([k, v]) => `<span><strong>${e(k)} :</strong> ${e(v)}</span>`).join('')}</div>
${d.warning ? `<div class="warn">${e(d.warning)}</div>` : ''}
<table>
  <thead><tr>${d.head.map((h) => `<th>${e(h)}</th>`).join('')}</tr></thead>
  <tbody>${
    d.rows.length
      ? d.rows.map((r) => `<tr>${r.map((c) => `<td>${e(c)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${d.head.length}" style="text-align:center;color:#94a3b8;padding:32px">${e(d.empty)}</td></tr>`
  }</tbody>
  ${d.totals && d.rows.length ? `<tfoot><tr>${d.totals.map((c) => `<td>${e(c)}</td>`).join('')}</tr></tfoot>` : ''}
</table>
<footer>
  <span>${e(d.edited)}</span>
  <span>${e(d.lines)}</span>
</footer>
<script>window.onload=function(){window.print()}</script>
</body></html>`;
}
