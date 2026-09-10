import * as XLSX from 'xlsx';

/** Export Excel d'un tableau : une feuille, colonnes ajustées, prêt pour un cabinet. */
export function exportXlsx(name: string, sheetName: string, rows: Record<string, string | number>[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const widths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.min(48, Math.max(key.length, ...rows.map((r) => String(r[key] ?? '').length)) + 2),
  }));
  ws['!cols'] = widths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${name}.xlsx`);
}
