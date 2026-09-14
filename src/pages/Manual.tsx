import { useMemo, type ReactNode } from 'react';
import manual from '../../docs/MANUEL.md?raw';
import { PageHeader } from '../components/UI';
import { IconDoc } from '../components/Icons';
import { getLang, t } from '../lib/i18n';

/**
 * Le manuel d'utilisation, lu depuis docs/MANUEL.md : un seul texte, tenu à
 * jour avec l'application, affiché ici et imprimable. Le rendu est volontaire-
 * ment simple (titres, paragraphes, listes, tableaux, gras) : pas de
 * bibliothèque, pas de HTML venu d'ailleurs.
 */

interface Block {
  kind: 'h1' | 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'table';
  text?: string;
  items?: string[];
  rows?: string[][];
  id?: string;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parse(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const h = /^(#{1,3}) (.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      blocks.push({ kind: level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3', text: h[2], id: slug(h[2]) });
      i += 1;
      continue;
    }
    if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i].split('|').slice(1, -1).map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
        i += 1;
      }
      blocks.push({ kind: 'table', rows });
      continue;
    }
    if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\d+\. /.test(lines[i]) : /^[-*] /.test(lines[i]))) {
        items.push(lines[i].replace(/^([-*]|\d+\.) /, ''));
        i += 1;
      }
      blocks.push({ kind: ordered ? 'ol' : 'ul', items });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3} |[-*] |\d+\. |\|)/.test(lines[i])) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push({ kind: 'p', text: para.join(' ') });
  }
  return blocks;
}

/** Gras (**…**) et italique (*…*) en ligne, rien d'autre. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++}>{m[1]}</strong>);
    else out.push(<em key={k++}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Manual() {
  const blocks = useMemo(() => parse(manual), []);
  const toc = blocks.filter((b) => b.kind === 'h2');

  return (
    <>
      <PageHeader
        title={t('Manuel d’utilisation')}
        subtitle={t('Écran par écran : à quoi ça sert, comment faire, ce que ça écrit en comptabilité')}
        actions={
          <button onClick={() => window.print()} className="btn-ghost">
            <IconDoc className="h-4 w-4" />
            {t('Imprimer ou enregistrer en PDF')}
          </button>
        }
      />

      {getLang() === 'en' && (
        <p className="mb-4 rounded-input border border-brass/40 bg-[#FBF1DF] px-3 py-2 text-caption text-ink">The user guide is written in French for now.</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="print:hidden lg:sticky lg:top-20 lg:self-start" aria-label={t('Sommaire')}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{t('Sommaire')}</p>
          <ol className="space-y-1 text-caption">
            {toc.map((b) => (
              <li key={b.id}>
                <a href={`#/manuel#${b.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(b.id!)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="block rounded-input px-2 py-1 text-ink/80 hover:bg-base hover:text-ink">
                  {b.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="card max-w-[780px] leading-relaxed text-ink">
          {blocks.map((b, i) => {
            switch (b.kind) {
              case 'h1':
                return null; // le titre est déjà dans l'en-tête de page
              case 'h2':
                return (
                  <h2 key={i} id={b.id} className="mb-3 mt-8 scroll-mt-24 border-b border-hairline pb-2 font-display text-[22px] font-bold first:mt-0">
                    {b.text}
                  </h2>
                );
              case 'h3':
                return (
                  <h3 key={i} id={b.id} className="mb-2 mt-5 text-[15px] font-bold text-ink">
                    {b.text}
                  </h3>
                );
              case 'ul':
                return (
                  <ul key={i} className="mb-3 list-disc space-y-1 pl-5 text-body">
                    {b.items!.map((it, j) => (
                      <li key={j}>{inline(it)}</li>
                    ))}
                  </ul>
                );
              case 'ol':
                return (
                  <ol key={i} className="mb-3 list-decimal space-y-1 pl-5 text-body">
                    {b.items!.map((it, j) => (
                      <li key={j}>{inline(it)}</li>
                    ))}
                  </ol>
                );
              case 'table':
                return (
                  <div key={i} className="mb-3 overflow-x-auto">
                    <table className="w-full border-collapse text-body">
                      <thead>
                        <tr>
                          {b.rows![0].map((c, j) => (
                            <th key={j} className="border-b border-hairline px-2 py-1.5 text-left text-caption font-bold uppercase tracking-wide text-muted">
                              {inline(c)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {b.rows!.slice(1).map((r, j) => (
                          <tr key={j}>
                            {r.map((c, k) => (
                              <td key={k} className="border-b border-hairline/60 px-2 py-1.5 align-top">
                                {inline(c)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              default:
                return (
                  <p key={i} className="mb-3 text-body">
                    {inline(b.text!)}
                  </p>
                );
            }
          })}
        </article>
      </div>
    </>
  );
}
