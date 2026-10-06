import { Link } from 'react-router-dom'
import type { Listing } from '../store'
import { dateRange } from './OfferingCard'

/** One live experience in a list: cover photo from its space, practice, title, host and dates. */
export default function ExperienceCard({ e }: { e: Listing }) {
  const cover = e.space?.photos[0]
  const kicker = [e.practices[0], e.format].filter(Boolean).join(' · ')
  const where = [e.space?.name, e.space?.town].filter(Boolean).join(', ')
  return (
    <Link to={`/experience/${e.id}`} className="flex items-center gap-3.5 rounded-[18px] bg-surface p-2.5 text-text no-underline">
      <div className="h-[76px] w-[76px] flex-none overflow-hidden rounded-[14px] bg-sage">
        {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-gold-soft">{kicker}</span>
        <span className="truncate text-[15px] font-semibold text-ink">{e.title || 'Untitled experience'}</span>
        <span className="truncate text-[13px] text-subtle">{[where, dateRange(e)].filter(Boolean).join(' · ')}</span>
        {e.price_usd != null && <span className="text-[13px] text-muted">{`from $${Number(e.price_usd).toLocaleString()}`}</span>}
      </div>
    </Link>
  )
}
