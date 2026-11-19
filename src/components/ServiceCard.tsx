import { Link } from 'react-router-dom'
import type { Provider, Service } from '../sessions'

/** A one-on-one session in a list: what it is, who offers it, the price and where. */
export default function ServiceCard({ s, p, wide = true }: { s: Service; p?: Provider; wide?: boolean }) {
  const photo = s.photo_url || p?.photo_url || ''
  const kind = [s.category, s.kinds[0]].filter(Boolean).join(' · ')
  const meta = [s.duration, s.price_note].filter(Boolean).join(' · ')
  if (!wide) return (
    <Link to={`/service/${s.id}`} className="flex w-[200px] flex-none flex-col overflow-hidden rounded-[18px] bg-surface text-text no-underline">
      <div className="h-[110px] bg-portal">{photo && <img decoding="async" loading="lazy" src={photo} alt="" className="h-full w-full object-cover" />}</div>
      <div className="flex flex-col gap-0.5 p-3">
        <span className="truncate text-[11px] tracking-[0.06em] text-gold-soft uppercase">{s.category}</span>
        <span className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{s.title}</span>
        <span className="truncate text-xs text-subtle">{p?.name ?? ''}</span>
      </div>
    </Link>
  )
  return (
    <Link to={`/service/${s.id}`} className="flex items-center gap-3.5 rounded-[18px] bg-surface p-2.5 text-text no-underline">
      <div className="h-[76px] w-[76px] flex-none overflow-hidden rounded-[14px] bg-portal">
        {photo && <img decoding="async" loading="lazy" src={photo} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-xs text-gold-soft">{kind}</span>
        <span className="truncate text-[15px] font-semibold text-ink">{s.title}</span>
        <span className="truncate text-[13px] text-subtle">{[p?.name, s.town || p?.town].filter(Boolean).join(' · ')}</span>
        <span className="truncate text-[12px] text-faint"><span className="text-iri-teal">✦ Welcomed by Xanadu</span>{p?.reviews ? <span className="text-gold-soft">{` · ★ ${Number(p.rating).toFixed(1)} (${p.reviews})`}</span> : null}{meta ? ` · ${meta}` : ''}</span>
      </div>
    </Link>
  )
}
