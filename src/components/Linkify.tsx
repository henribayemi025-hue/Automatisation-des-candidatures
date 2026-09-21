import { Fragment } from 'react';

/**
 * Rend les adresses web d'un texte en liens cliquables.
 *
 * Signalé par Alpha le 21/09 : son assistante donnait la bonne adresse et
 * l'adresse restait du texte mort, à recopier à la main. Le même défaut
 * existait ici. Une assistante qui dit « allez sur accounting.finjaro.net »
 * sans que ce soit cliquable n'a rien réglé du tout — Beau l'a dit en une
 * phrase : « je clique, j'entre ».
 *
 * Deux règles de sûreté, parce que le texte peut venir d'ailleurs que de nous :
 *
 * - seul `http` et `https` sont acceptés. Une adresse `javascript:` ou `data:`
 *   n'est pas reconnue comme un lien et reste du texte ;
 * - on construit un élément React, jamais de HTML brut. Rien de ce qui est
 *   dans le texte ne peut devenir une balise.
 */

// Une adresse s'arrête à un espace. La ponctuation finale d'une phrase
// (« … sur https://finjaro.net. ») est retirée après coup : elle appartient à
// la phrase, pas à l'adresse.
const URL_RE = /https?:\/\/[^\s<>"']+/g;
const PONCTUATION_FINALE = /[.,;:!?)»]+$/;

export function Linkify({ text }: { text: string }) {
  const morceaux: { texte: string; lien?: string }[] = [];
  let curseur = 0;

  for (const m of text.matchAll(URL_RE)) {
    const brut = m[0];
    const debut = m.index ?? 0;
    const queue = brut.match(PONCTUATION_FINALE)?.[0] ?? '';
    const url = queue ? brut.slice(0, brut.length - queue.length) : brut;

    if (debut > curseur) morceaux.push({ texte: text.slice(curseur, debut) });
    morceaux.push({ texte: url, lien: url });
    if (queue) morceaux.push({ texte: queue });
    curseur = debut + brut.length;
  }
  if (curseur < text.length) morceaux.push({ texte: text.slice(curseur) });

  return (
    <>
      {morceaux.map((p, i) =>
        p.lien ? (
          <a
            key={i}
            href={p.lien}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            {p.texte}
          </a>
        ) : (
          <Fragment key={i}>{p.texte}</Fragment>
        ),
      )}
    </>
  );
}
