import { Link } from 'react-router-dom'
import { whenLabel, type CommunityEvent } from '../events'

/** A community event in a list: clearly marked as shared by a member and not verified by Xanadu. */
export default function CommunityEventCard({ e, wide = true }: { e: CommunityEvent; wide?: boolean }) {
  const where = [e.venue, e.town].filter(Boolean).join(' · ')
  if (!wide) return (
    <Link to={`/event/${e.id}`} className="flex w-[200px] flex-none flex-col overflow-hidden rounded-[18px] border border-dashed border-line-2 bg-surface/60 text-text no-underline">
      <div className="h-[110px] bg-portal">{e.photo_url && <img decoding="async" loading="lazy" src={e.photo_url} alt="" className="h-full w-full object-cover" />}</div>
      <div className="flex flex-col gap-0.5 p-3">
        <span className="text-[11px] tracking-[0.06em] text-iri-teal uppercase">Community event</span>
        <span className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{e.title || 'Untitled event'}</span>
        <span className="truncate text-xs text-subtle">{whenLabel(e)}</span>
      </div>
    </Link>
  )
  return (
    <Link to={`/event/${e.id}`} className="flex items-center gap-3.5 rounded-[18px] border border-dashed border-line-2 bg-surface/60 p-2.5 text-text no-underline">
      <div className="h-[76px] w-[76px] flex-none overflow-hidden rounded-[14px] bg-portal">
        {e.photo_url && <img decoding="async" loading="lazy" src={e.photo_url} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-iri-teal">{['Community event', e.tags[0]].filter(Boolean).join(' · ')}</span>
        <span className="truncate text-[15px] font-semibold text-ink">{e.title || 'Untitled event'}</span>
        <span className="truncate text-[13px] text-subtle">{[where, whenLabel(e)].filter(Boolean).join(' · ')}</span>
        <span className="text-[12px] text-faint">Shared by a member · not verified</span>
      </div>
    </Link>
  )
}
