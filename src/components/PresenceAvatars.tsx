import { useCollab } from '../lib/collab';
import { t } from '../lib/i18n';

const COLORS = ['#C25E38', '#2F6D62', '#7C5295', '#B8860B', '#8C6A3D'];

export function Avatar({ name, src, size = 32, index = 0 }: { name: string; src?: string | null; size?: number; index?: number }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return src ? (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className="rounded-full object-cover ring-2 ring-white"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="grid place-items-center rounded-full text-[11px] font-bold text-white ring-2 ring-white"
      style={{ width: size, height: size, background: COLORS[index % COLORS.length] }}
      title={name}
    >
      {initials || '?'}
    </span>
  );
}

/** Les personnes connectées en ce moment sur cet espace — comme dans Google Sheets. */
export default function PresenceAvatars() {
  const { presence, user } = useCollab();
  if (!user || presence.length === 0) return null;
  const shown = presence.slice(0, 4);
  const extra = presence.length - shown.length;
  return (
    <div className="flex items-center" title={presence.map((p) => `${p.name} — ${p.page}`).join('\n')}>
      <div className="flex -space-x-2">
        {shown.map((p, i) => (
          <Avatar key={p.key} name={p.name} src={p.avatar} size={30} index={i} />
        ))}
      </div>
      {extra > 0 && <span className="ml-1.5 text-caption font-semibold text-muted">+{extra}</span>}
      <span className="ml-2 hidden text-caption text-muted md:inline">
        {presence.length === 1 ? t('Vous seul') : `${presence.length} ${t('en ligne')}`}
      </span>
    </div>
  );
}
