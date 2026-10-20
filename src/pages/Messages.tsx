import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCollab } from '../lib/collab';
import { supabase } from '../lib/supabase';
import { locale, t } from '../lib/i18n';
import {
  EMOJIS, annuaire, appeler, basculerEpingle, basculerReaction, creerConversation, decouper, envoyer, lireEpingles, lireLectures,
  lireMessages, lireReactions, listerConversations, marquerFavori, marquerLu, supprimer,
} from '../lib/messages';
import type { Conversation, Genre, Lecture, Msg, Personne, Reaction } from '../lib/messages';
import { Empty, PageHeader } from '../components/UI';
import { IconChat, IconPlus, IconSearch, IconSend, IconUsers, IconX } from '../components/Icons';

/**
 * MESSAGES — la discussion façon Google Chat (Beau, 14/10 : « tout Google Chat : discussions à deux et de groupe, Espaces,
 * fils, réactions, @mentions, appels… »). Jalon 1 et une partie du jalon 2 du contrat du 14/10 (A-FAIRE-PARTAGE) :
 * à gauche les conversations (favoris, discussions, Espaces) avec les non-lus ; au centre le fil ; à droite un fil de réponses.
 * Hauteur fixe, défilement interne, saisie toujours en bas (règle de Beau du 07/10).
 * Le fil de l'espace (Discussion : canaux de projet, @assistant, photos de reçus) reste à sa place, inchangé.
 */

/** Le site vers lequel part un lien d'appel (affiché avant d'ouvrir) ; vide si l'adresse est illisible. */
function domaineDuLien(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function heure(iso: string) {
  const d = new Date(iso);
  const auj = new Date().toDateString() === d.toDateString();
  return auj
    ? d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(locale(), { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
}

function Initiale({ nom, petit }: { nom: string; petit?: boolean }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-teal-light font-semibold text-teal ${petit ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-caption'}`} aria-hidden="true">
      {(nom.trim()[0] ?? '?').toUpperCase()}
    </span>
  );
}

export default function Messages() {
  const { user, workspace } = useCollab();
  const moi = user?.id ?? '';
  const ws = workspace?.id ?? '';
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [gens, setGens] = useState<Personne[]>([]);
  const [ouverte, setOuverte] = useState<string>('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reacts, setReacts] = useState<Reaction[]>([]);
  const [pins, setPins] = useState<string[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [fil, setFil] = useState<string>(''); // message dont on lit les réponses
  const [nouveau, setNouveau] = useState(false);
  const [cherche, setCherche] = useState('');
  const [notice, setNotice] = useState('');
  const [charge, setCharge] = useState(true);

  const nomDe = useCallback((id: string) => (id === moi ? t('Vous') : gens.find((g) => g.user_id === id)?.nom || t('Membre')), [gens, moi]);
  const titreDe = useCallback((c: Conversation) => {
    if (c.name) return c.name;
    const autres = c.membres.filter((m) => m !== moi);
    return autres.length ? autres.map(nomDe).join(', ') : t('Vous seul');
  }, [moi, nomDe]);

  const rafraichirListe = useCallback(async () => {
    if (!ws) return;
    try { setConvs(await listerConversations(ws)); } catch (e) { setNotice((e as Error).message); }
    setCharge(false);
  }, [ws]);

  useEffect(() => {
    if (!ws) return;
    void rafraichirListe();
    annuaire(ws).then(setGens).catch(() => setGens([]));
  }, [ws, rafraichirListe]);

  const conv = convs.find((c) => c.space_id === ouverte) ?? null;

  const chargerFil = useCallback(async (space: string) => {
    try {
      const m = await lireMessages(space);
      setMsgs(m);
      const [r, p, l] = await Promise.all([lireReactions(m.map((x) => x.id)), lireEpingles(space), lireLectures(space)]);
      setReacts(r); setPins(p); setLectures(l);
    } catch (e) { setNotice((e as Error).message); }
  }, []);

  // Conversation ouverte : messages, temps réel, et « lu » quand on la regarde.
  useEffect(() => {
    if (!ouverte || !moi) return;
    setMsgs([]); setFil(''); void chargerFil(ouverte);
    void marquerLu(ouverte, moi).then(rafraichirListe);
    const ch = supabase
      .channel('messages:' + ouverte)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finia_chat_messages', filter: `space_id=eq.${ouverte}` }, () => {
        void chargerFil(ouverte);
        if (document.visibilityState === 'visible') void marquerLu(ouverte, moi);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finia_chat_reactions' }, () => void chargerFil(ouverte))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finia_chat_pins', filter: `space_id=eq.${ouverte}` }, () => void chargerFil(ouverte))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'finia_chat_members', filter: `space_id=eq.${ouverte}` }, () => void lireLectures(ouverte).then(setLectures))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [ouverte, moi, chargerFil, rafraichirListe]);

  // La liste suit les nouveaux messages des autres conversations (non-lus).
  useEffect(() => {
    if (!ws) return;
    const ch = supabase.channel('messages-liste:' + ws)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'finia_chat_messages' }, () => void rafraichirListe())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [ws, rafraichirListe]);

  if (!workspace || !user) return <Empty title={t('Connectez-vous pour écrire à votre équipe.')} icon={<IconChat className="h-10 w-10" />} />;

  const filtrees = convs.filter((c) => !cherche.trim() || titreDe(c).toLowerCase().includes(cherche.toLowerCase()));
  const sections: [string, Conversation[]][] = [
    [t('Favoris'), filtrees.filter((c) => c.starred)],
    [t('Discussions'), filtrees.filter((c) => !c.starred && c.kind !== 'space')],
    [t('Espaces'), filtrees.filter((c) => !c.starred && c.kind === 'space')],
  ];

  const liste = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 border-b border-hairline p-3">
        <button className="btn-primary w-full" onClick={() => setNouveau(true)}><IconPlus className="h-4 w-4" />{t('Nouvelle discussion')}</button>
        <label className="relative block">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="field pl-9" value={cherche} onChange={(e) => setCherche(e.target.value)} placeholder={t('Chercher une personne ou un Espace')} aria-label={t('Chercher une personne ou un Espace')} />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {charge && <p className="px-2 py-3 text-caption text-muted">…</p>}
        {!charge && convs.length === 0 && (
          <p className="px-2 py-3 text-caption text-muted">{t('Aucune discussion pour l’instant. Écrivez à quelqu’un de l’équipe, ou créez un Espace pour un projet.')}</p>
        )}
        {sections.map(([titre, cs]) => cs.length > 0 && (
          <div key={titre} className="mb-2">
            <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted">{titre}</p>
            {cs.map((c) => (
              <button key={c.space_id} onClick={() => setOuverte(c.space_id)} aria-current={c.space_id === ouverte ? 'true' : undefined}
                className={`flex w-full items-center gap-2.5 rounded-input px-2 py-2 text-left ${c.space_id === ouverte ? 'bg-teal-light' : 'hover:bg-base'}`}>
                {c.kind === 'space' ? <span className="grid h-9 w-9 shrink-0 place-items-center rounded-input bg-base text-body font-bold text-teal" aria-hidden="true">#</span>
                  : c.kind === 'group' ? <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-base text-teal" aria-hidden="true"><IconUsers className="h-4 w-4" /></span>
                  : <Initiale nom={titreDe(c)} />}
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-body ${c.non_lus ? 'font-bold text-ink' : 'text-ink'}`}>{titreDe(c)}</span>
                  <span className="block truncate text-[12px] text-muted">{c.dernier_apercu ?? t('Pas encore de message')}</span>
                </span>
                {c.non_lus > 0 && <span className="shrink-0 rounded-pill bg-teal px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">{c.non_lus}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title={t('Messages')} subtitle={t('À deux, en groupe ou par Espace, avec appels. Privé aux personnes de la discussion.')}
        actions={<Link to="/discussion" className="btn-ghost">{t('Fil de l’espace')}</Link>} />
      {notice && <p className="mb-3 rounded-input bg-[#FDF6E3] px-3 py-2 text-caption text-ink" role="alert">{notice} <button className="ml-2 underline" onClick={() => setNotice('')}>{t('Fermer')}</button></p>}
      <div className="card grid h-[calc(100dvh-340px)] min-h-[300px] overflow-hidden p-0 lg:grid-cols-[300px_minmax(0,1fr)] lg:h-[calc(100dvh-250px)]">
        <div className={`${ouverte ? 'hidden lg:block' : 'block'} min-h-0 border-hairline lg:border-r`}>{liste}</div>
        <div className={`${ouverte ? 'flex' : 'hidden lg:flex'} min-h-0 min-w-0`}>
          {conv ? (
            <Fil key={conv.space_id} conv={conv} titre={titreDe(conv)} moi={moi} gens={gens} nomDe={nomDe} msgs={msgs} reacts={reacts} pins={pins} lectures={lectures}
              fil={fil} setFil={setFil} onRetour={() => setOuverte('')} onErreur={setNotice} recharger={() => chargerFil(conv.space_id)}
              onFavori={async () => { await marquerFavori(conv.space_id, moi, !conv.starred); void rafraichirListe(); }} />
          ) : (
            <div className="grid w-full place-items-center"><Empty title={t('Choisissez une discussion')} hint={t('ou commencez-en une avec « Nouvelle discussion ».')} icon={<IconChat className="h-10 w-10" />} /></div>
          )}
        </div>
      </div>
      {nouveau && <Nouvelle ws={ws} moi={moi} gens={gens} onFermer={() => setNouveau(false)} onCree={async (id) => { setNouveau(false); await rafraichirListe(); setOuverte(id); }} />}
    </div>
  );
}

/** Le fil d'une conversation, avec le panneau des réponses à droite. */
function Fil({ conv, titre, moi, gens, nomDe, msgs, reacts, pins, lectures, fil, setFil, onRetour, onErreur, recharger, onFavori }: {
  conv: Conversation; titre: string; moi: string; gens: Personne[]; nomDe: (id: string) => string; msgs: Msg[]; reacts: Reaction[]; pins: string[];
  lectures: Lecture[]; fil: string; setFil: (id: string) => void; onRetour: () => void; onErreur: (m: string) => void; recharger: () => Promise<void>; onFavori: () => void;
}) {
  const boite = useRef<HTMLDivElement>(null);
  const enBas = useRef(true);
  const [voirEpingles, setVoirEpingles] = useState(false);
  const racine = msgs.filter((m) => !m.parent_id && !m.deleted_at);
  const reponses = (id: string) => msgs.filter((m) => m.parent_id === id && !m.deleted_at);
  const membres = gens.filter((g) => conv.membres.includes(g.user_id));
  const noms = membres.map((g) => g.nom);

  useEffect(() => { const el = boite.current; if (el && enBas.current) el.scrollTop = el.scrollHeight; }, [msgs.length]);

  const parent = fil ? msgs.find((m) => m.id === fil) ?? null : null;
  const dernierAMoi = [...racine].reverse().find((m) => m.user_id === moi);
  const autres = lectures.filter((l) => l.user_id !== moi);
  const vusPar = dernierAMoi ? autres.filter((l) => l.last_read_at >= dernierAMoi.created_at).length : 0;

  const aller = (id: string) => { setVoirEpingles(false); document.getElementById('msg-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  return (
    <div className="flex min-h-0 w-full">
      <div className={`${parent ? 'hidden xl:flex' : 'flex'} min-h-0 min-w-0 flex-1 flex-col`}>
        <div className="flex items-center gap-2 border-b border-hairline px-3 py-2.5 sm:px-4">
          <button className="btn-ghost px-2.5 py-2 lg:hidden" onClick={onRetour} aria-label={t('Retour aux discussions')}>←</button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-semibold text-ink">{conv.kind === 'space' ? '# ' : ''}{titre}</p>
            <p className="truncate text-[11px] text-muted">{conv.kind === 'dm' ? t('Discussion à deux') : `${conv.membres.length} ${t('membres')}`}</p>
          </div>
          <button className="btn-ghost px-2.5 py-2" onClick={onFavori} aria-pressed={conv.starred} aria-label={conv.starred ? t('Retirer des favoris') : t('Ajouter aux favoris')} title={t('Favori')}>{conv.starred ? '★' : '☆'}</button>
          {pins.length > 0 && <button className="btn-ghost px-2.5 py-2" onClick={() => setVoirEpingles(!voirEpingles)} aria-expanded={voirEpingles}>📌 {pins.length}</button>}
          <button className="btn-ghost px-2.5 py-2" onClick={() => appeler(conv.space_id, false).then(recharger).catch((e) => onErreur(e.message))} aria-label={t('Appel vocal')} title={t('Appel vocal')}>📞</button>
          <button className="btn-ghost px-2.5 py-2" onClick={() => appeler(conv.space_id, true).then(recharger).catch((e) => onErreur(e.message))} aria-label={t('Appel vidéo')} title={t('Appel vidéo')}>🎥</button>
        </div>
        {voirEpingles && (
          <div className="max-h-48 overflow-y-auto border-b border-hairline bg-base px-4 py-2">
            {pins.map((id) => { const m = msgs.find((x) => x.id === id); return m && (
              <button key={id} onClick={() => aller(id)} className="block w-full truncate py-1 text-left text-caption text-ink hover:underline">📌 {nomDe(m.user_id)} : {m.body}</button>
            ); })}
          </div>
        )}
        <div ref={boite} onScroll={(e) => { const el = e.currentTarget; enBas.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; }}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 scrollbar-thin sm:px-4" aria-live="polite">
          {racine.length === 0 && <p className="text-center text-caption text-muted">{t('Écrivez le premier message. @ pour mentionner quelqu’un.')}</p>}
          {racine.map((m, i) => (
            <Bulle key={m.id} m={m} moi={moi} nomDe={nomDe} noms={noms} suite={i > 0 && racine[i - 1].user_id === m.user_id && m.kind === 'text'}
              reacts={reacts.filter((r) => r.message_id === m.id)} epingle={pins.includes(m.id)} nbReponses={reponses(m.id).length}
              onRepondre={() => setFil(m.id)} onErreur={onErreur} recharger={recharger} spaceId={conv.space_id} />
          ))}
          {dernierAMoi && autres.length > 0 && (
            <p className="text-right text-[11px] text-muted">{vusPar === 0 ? t('Envoyé') : conv.kind === 'dm' || vusPar === autres.length ? t('Vu') : t('Vu par {n}', { n: vusPar })}</p>
          )}
        </div>
        <Saisie spaceId={conv.space_id} moi={moi} membres={membres} parentId={null} onErreur={onErreur} onEnvoye={recharger} />
      </div>
      {parent && (
        <div className="flex min-h-0 w-full flex-col border-hairline xl:w-[380px] xl:border-l">
          <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
            <p className="flex-1 text-body font-semibold text-ink">{t('Fil de réponses')}</p>
            <button className="btn-ghost px-2.5 py-2" onClick={() => setFil('')} aria-label={t('Fermer le fil')}><IconX className="h-4 w-4" /></button>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <Bulle m={parent} moi={moi} nomDe={nomDe} noms={noms} suite={false} reacts={reacts.filter((r) => r.message_id === parent.id)} epingle={pins.includes(parent.id)}
              nbReponses={0} onErreur={onErreur} recharger={recharger} spaceId={conv.space_id} />
            <div className="border-t border-hairline" />
            {reponses(parent.id).map((m) => (
              <Bulle key={m.id} m={m} moi={moi} nomDe={nomDe} noms={noms} suite={false} reacts={reacts.filter((r) => r.message_id === m.id)} epingle={false}
                nbReponses={0} onErreur={onErreur} recharger={recharger} spaceId={conv.space_id} />
            ))}
          </div>
          <Saisie spaceId={conv.space_id} moi={moi} membres={membres} parentId={parent.id} onErreur={onErreur} onEnvoye={recharger} />
        </div>
      )}
    </div>
  );
}

function Bulle({ m, moi, nomDe, noms, suite, reacts, epingle, nbReponses, onRepondre, onErreur, recharger, spaceId }: {
  m: Msg; moi: string; nomDe: (id: string) => string; noms: string[]; suite: boolean; reacts: Reaction[]; epingle: boolean; nbReponses: number;
  onRepondre?: () => void; onErreur: (s: string) => void; recharger: () => Promise<void>; spaceId: string;
}) {
  const [menu, setMenu] = useState(false);
  const mien = m.user_id === moi;
  const groupes = useMemo(() => {
    const g = new Map<string, string[]>();
    for (const r of reacts) g.set(r.emoji, [...(g.get(r.emoji) ?? []), r.user_id]);
    return [...g.entries()];
  }, [reacts]);
  const agir = (p: Promise<void>) => p.then(recharger).catch((e) => onErreur(e.message));

  if (m.kind === 'call') {
    return (
      <div id={'msg-' + m.id} className="mx-auto max-w-sm rounded-card border border-teal/30 bg-teal-light px-4 py-3 text-center">
        <p className="text-body font-semibold text-ink">{m.meta.video ? '🎥' : '📞'} {nomDe(m.user_id)} — {m.meta.video ? t('Appel vidéo') : t('Appel vocal')}</p>
        <p className="text-[11px] text-muted">{heure(m.created_at)}</p>
        {typeof m.meta.url === 'string' && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <a href={m.meta.url} target="_blank" rel="noreferrer" className="btn-primary inline-flex">{t('Rejoindre l’appel')}</a>
            {/* Le contrat 0245 demande de montrer vers quel site on part avant d'ouvrir le lien. */}
            <span className="text-caption text-muted">{domaineDuLien(m.meta.url)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id={'msg-' + m.id} className="group flex gap-2.5" onMouseLeave={() => setMenu(false)}>
      {suite ? <span className="w-9 shrink-0" /> : <Initiale nom={nomDe(m.user_id)} />}
      <div className="min-w-0 flex-1">
        {!suite && <p className="text-[12px]"><span className={`font-bold ${mien ? 'text-teal' : 'text-ink'}`}>{nomDe(m.user_id)}</span> <span className="text-muted">{heure(m.created_at)}</span>{epingle && <span className="ml-1">📌</span>}</p>}
        <div className="relative">
          <p className="whitespace-pre-wrap break-words text-body leading-relaxed text-ink">
            {decouper(m.body, noms).map((x, i) => x.t === 'gras' ? <strong key={i}>{x.v}</strong>
              : x.t === 'ital' ? <em key={i}>{x.v}</em>
              : x.t === 'code' ? <code key={i} className="rounded bg-base px-1 font-mono text-[0.92em]">{x.v}</code>
              : x.t === 'lien' ? <a key={i} href={x.v} target="_blank" rel="noreferrer" className="text-teal underline">{x.v}</a>
              : x.t === 'mention' ? <span key={i} className="rounded bg-teal-light px-1 font-semibold text-teal">{x.v}</span>
              : <span key={i}>{x.v}</span>)}
            {m.edited_at && <span className="ml-1 text-[11px] text-muted">({t('modifié')})</span>}
          </p>
          <div className={`absolute -top-4 right-0 ${menu ? 'flex' : 'hidden group-hover:flex group-focus-within:flex'} items-center gap-0.5 rounded-pill border border-hairline bg-surface px-1 py-0.5 shadow-sm`}>
            {EMOJIS.slice(0, 3).map((e) => <button key={e} className="rounded-full px-1.5 py-0.5 hover:bg-base" aria-label={t('Réagir {e}', { e })}
              onClick={() => agir(basculerReaction(m.id, moi, e, reacts.some((r) => r.emoji === e && r.user_id === moi)))}>{e}</button>)}
            <button className="rounded-full px-1.5 py-0.5 text-caption hover:bg-base" onClick={() => setMenu(!menu)} aria-label={t('Plus d’actions')}>⋯</button>
          </div>
          {menu && (
            <div className="absolute right-0 top-4 z-10 w-52 rounded-card border border-hairline bg-surface p-1 shadow-md">
              <div className="flex flex-wrap gap-0.5 border-b border-hairline p-1">{EMOJIS.map((e) => <button key={e} className="rounded px-1.5 py-1 hover:bg-base"
                onClick={() => { setMenu(false); void agir(basculerReaction(m.id, moi, e, reacts.some((r) => r.emoji === e && r.user_id === moi))); }}>{e}</button>)}</div>
              {onRepondre && <button className="block w-full rounded px-2 py-1.5 text-left text-caption hover:bg-base" onClick={() => { setMenu(false); onRepondre(); }}>↳ {t('Répondre dans le fil')}</button>}
              <button className="block w-full rounded px-2 py-1.5 text-left text-caption hover:bg-base" onClick={() => { setMenu(false); void agir(basculerEpingle(spaceId, m.id, moi, epingle)); }}>📌 {epingle ? t('Désépingler') : t('Épingler')}</button>
              <button className="block w-full rounded px-2 py-1.5 text-left text-caption hover:bg-base" onClick={() => { setMenu(false); void navigator.clipboard?.writeText(m.body); }}>⧉ {t('Copier le texte')}</button>
              {mien && <button className="block w-full rounded px-2 py-1.5 text-left text-caption text-[#B42318] hover:bg-base" onClick={() => { setMenu(false); void agir(supprimer(m.id)); }}>{t('Supprimer')}</button>}
            </div>
          )}
        </div>
        {(groupes.length > 0 || nbReponses > 0) && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {groupes.map(([e, qui]) => (
              <button key={e} title={qui.map(nomDe).join(', ')} onClick={() => agir(basculerReaction(m.id, moi, e, qui.includes(moi)))}
                className={`rounded-pill border px-2 py-0.5 text-[12px] tabular-nums ${qui.includes(moi) ? 'border-teal bg-teal-light' : 'border-hairline bg-surface'}`}>{e} {qui.length}</button>
            ))}
            {nbReponses > 0 && onRepondre && <button onClick={onRepondre} className="text-[12px] font-semibold text-teal hover:underline">↳ {nbReponses} {nbReponses > 1 ? t('réponses') : t('réponse')}</button>}
          </div>
        )}
      </div>
    </div>
  );
}

/** La zone d'écriture : Entrée envoie, Maj+Entrée va à la ligne ; @ propose les membres (et @tous). */
function Saisie({ spaceId, moi, membres, parentId, onErreur, onEnvoye }: {
  spaceId: string; moi: string; membres: Personne[]; parentId: string | null; onErreur: (s: string) => void; onEnvoye: () => Promise<void>;
}) {
  const [texte, setTexte] = useState('');
  const [busy, setBusy] = useState(false);
  const zone = useRef<HTMLTextAreaElement>(null);
  const requete = /(^|\s)@([^\s@]*)$/.exec(texte)?.[2];
  const proposes = requete === undefined ? [] : [
    ...membres.filter((g) => g.user_id !== moi && g.nom.toLowerCase().startsWith(requete.toLowerCase())).slice(0, 6).map((g) => ({ id: g.user_id, nom: g.nom })),
    ...(t('tous').startsWith(requete.toLowerCase()) ? [{ id: '*', nom: t('tous') }] : []),
  ];
  const choisir = (nom: string) => { setTexte(texte.replace(/@([^\s@]*)$/, '@' + nom + ' ')); zone.current?.focus(); };
  const partir = async () => {
    const q = texte.trim();
    if (!q || busy) return;
    const tous = new RegExp('@(' + t('tous') + '|all)\\b', 'i').test(q);
    const mentions = tous ? membres.map((g) => g.user_id).filter((id) => id !== moi) : membres.filter((g) => q.includes('@' + g.nom)).map((g) => g.user_id);
    setBusy(true);
    try { await envoyer(spaceId, moi, q, mentions, parentId); setTexte(''); await onEnvoye(); } catch (e) { onErreur((e as Error).message); }
    setBusy(false);
    zone.current?.focus();
  };
  return (
    <div className="relative border-t border-hairline p-3">
      {proposes.length > 0 && (
        <div className="absolute bottom-full left-3 mb-1 w-64 rounded-card border border-hairline bg-surface p-1 shadow-md" role="listbox">
          {proposes.map((p) => <button key={p.id} role="option" aria-selected="false" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-caption hover:bg-base" onClick={() => choisir(p.nom)}>
            <Initiale nom={p.nom} petit />{p.nom}</button>)}
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea ref={zone} rows={1} value={texte} maxLength={4000} placeholder={parentId ? t('Répondre dans le fil…') : t('Écrire un message… (@ pour mentionner)')}
          aria-label={t('Message')} onChange={(e) => { setTexte(e.target.value); const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (proposes.length) choisir(proposes[0].nom); else void partir(); } }}
          className="field max-h-36 min-h-11 flex-1 resize-none" />
        <button className="btn-primary h-11 px-3" disabled={!texte.trim() || busy} onClick={() => void partir()} aria-label={t('Envoyer')}><IconSend className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

/** Nouvelle discussion : une personne = à deux ; plusieurs = groupe ; ou un Espace nommé (projet, service). */
function Nouvelle({ ws, moi, gens, onFermer, onCree }: { ws: string; moi: string; gens: Personne[]; onFermer: () => void; onCree: (id: string) => void }) {
  const [choisis, setChoisis] = useState<string[]>([]);
  const [espace, setEspace] = useState(false);
  const [nom, setNom] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const autres = gens.filter((g) => g.user_id !== moi);
  const kind: Genre = espace ? 'space' : choisis.length === 1 ? 'dm' : 'group';
  const pret = espace ? nom.trim().length > 0 : kind === 'dm' ? choisis.length === 1 : choisis.length >= 2;
  const creer = async () => {
    setBusy(true); setErr('');
    try { onCree(await creerConversation(ws, kind, choisis, kind === 'dm' ? undefined : nom)); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onFermer(); }}>
      <div role="dialog" aria-label={t('Nouvelle discussion')} className="card w-full max-w-md space-y-3">
        <div className="flex items-center justify-between"><p className="text-body font-semibold text-ink">{t('Nouvelle discussion')}</p>
          <button className="btn-ghost px-2.5 py-2" onClick={onFermer} aria-label={t('Fermer')}><IconX className="h-4 w-4" /></button></div>
        <div className="flex rounded-pill border border-hairline p-0.5 text-caption" role="radiogroup">
          <button role="radio" aria-checked={!espace} onClick={() => setEspace(false)} className={`flex-1 rounded-pill px-3 py-1.5 font-semibold ${!espace ? 'bg-teal text-white' : 'text-ink'}`}>{t('Personnes')}</button>
          <button role="radio" aria-checked={espace} onClick={() => setEspace(true)} className={`flex-1 rounded-pill px-3 py-1.5 font-semibold ${espace ? 'bg-teal text-white' : 'text-ink'}`}>{t('Espace (projet, service)')}</button>
        </div>
        {(espace || choisis.length >= 2) && (
          <input className="field" value={nom} maxLength={80} onChange={(e) => setNom(e.target.value)} placeholder={espace ? t('Nom de l’Espace (ex. : Boutique Akwa)') : t('Nom du groupe (facultatif)')} aria-label={t('Nom')} />
        )}
        {autres.length === 0 ? (
          <p className="text-caption text-muted">{t('Personne d’autre n’a encore rejoint cet espace. Invitez quelqu’un depuis la page Équipe.')} <Link to="/equipe" className="text-teal underline">{t('Équipe')}</Link></p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {autres.map((g) => (
              <label key={g.user_id} className="flex cursor-pointer items-center gap-2.5 rounded-input px-2 py-2 hover:bg-base">
                <input type="checkbox" checked={choisis.includes(g.user_id)} onChange={(e) => setChoisis(e.target.checked ? [...choisis, g.user_id] : choisis.filter((x) => x !== g.user_id))} className="h-4 w-4 accent-[var(--color-teal)]" />
                <Initiale nom={g.nom} petit /><span className="flex-1 text-body text-ink">{g.nom}</span><span className="text-[11px] text-muted">{g.role}</span>
              </label>
            ))}
          </div>
        )}
        <p className="text-[12px] text-muted">{espace ? t('Un Espace a un nom et peut grandir : vous ajouterez des personnes plus tard.') : choisis.length <= 1 ? t('Une personne : discussion à deux.') : t('Plusieurs personnes : discussion de groupe.')}</p>
        {err && <p className="text-caption text-[#B42318]" role="alert">{err}</p>}
        <button className="btn-primary w-full" disabled={!pret || busy} onClick={() => void creer()}>{busy ? '…' : t('Commencer')}</button>
      </div>
    </div>
  );
}
