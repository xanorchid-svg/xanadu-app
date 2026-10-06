import { Link } from 'react-router-dom'
import type { Offering } from '../store'

const STATUS: Record<Offering['status'], [string, string]> = {
  in_review: ['In review', 'border-gold/60 text-gold-pale'],
  live: ['Live', 'border-calm/60 text-calm-text'],
  draft: ['Draft', 'border-line-2 text-subtle'],
  declined: ['Needs changes', 'border-line-2 text-subtle'],
}

export const fmtDate = (d: string | null) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '')
export const dateRange = (o: Pick<Offering, 'start_date' | 'end_date'>) =>
  o.start_date ? (o.end_date && o.end_date !== o.start_date ? `${fmtDate(o.start_date)} – ${fmtDate(o.end_date)}` : fmtDate(o.start_date)) : 'Dates to come'

export function StatusPill({ status }: { status: Offering['status'] }) {
  const [label, cls] = STATUS[status]
  return <span className={`flex-none rounded-full border px-2.5 py-1 text-xs ${cls}`}>{label}</span>
}

export default function OfferingCard({ o }: { o: Offering }) {
  return (
    <Link to={`/container/offering?id=${o.id}`} className="flex flex-col gap-2.5 rounded-[18px] bg-plum p-4 text-text no-underline">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs text-gold-soft">{`${o.format} · ${dateRange(o)}`}</span>
          <span className="text-base font-semibold text-ink">{o.title || 'Untitled offering'}</span>
          <span className="text-[13px] text-muted">{`0 of ${o.spots} spots filled`}</span>
        </div>
        <StatusPill status={o.status} />
      </div>
    </Link>
  )
}
