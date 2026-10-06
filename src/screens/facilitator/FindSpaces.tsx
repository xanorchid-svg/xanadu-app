import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Chip, EmptyState, FacilitatorTabs, H1, Page, RowLink, Screen } from '../../components/ui'
import { IconPin, IconSearch } from '../../components/icons'
import { CONTACT_EMAIL, PRACTICES } from '../../data'
import { useSpaces } from '../../store'

const FILTERS = [...PRACTICES.filter((p) => p !== 'Trainings'), 'Sleeps 10+', 'Welcomes volunteers'] as const

/** Approved retreat spaces a Facilitator could hold an offering in. */
export default function FindSpaces() {
  const { spaces, loading } = useSpaces()
  const [filters, setFilters] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const toggle = (f: string) => setFilters((xs) => (xs.includes(f) ? xs.filter((x) => x !== f) : [...xs, f]))

  const q = query.trim().toLowerCase()
  const shown = spaces.filter((s) => filters.every((f) =>
    f === 'Sleeps 10+' ? (parseInt(s.sleeps, 10) || 0) >= 10
      : f === 'Welcomes volunteers' ? s.volunteer_exchange
        : s.practices.includes(f))
    && (!q || `${s.name} ${s.town} ${s.about}`.toLowerCase().includes(q)))

  return (
    <Screen footer={<FacilitatorTabs />}>
      <Page className="gap-[18px]">
        <div className="flex flex-col gap-1">
          <H1>Spaces to hold in</H1>
          <span className="text-sm text-muted">Retreat spaces across Costa Rica</span>
        </div>
        {spaces.length > 0 && (
          <>
            <label className="flex min-h-12 items-center gap-2.5 rounded-[14px] border border-line bg-surface-2 px-4 text-subtle">
              <IconSearch /><span className="sr-only">Search spaces</span>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or town"
                className="flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-faint" />
            </label>
            <div className="flex flex-wrap gap-2">{FILTERS.map((f) => <Chip key={f} on={filters.includes(f)} onClick={() => toggle(f)}>{f}</Chip>)}</div>
          </>
        )}

        {loading ? <span className="text-[13px] text-subtle">Finding spaces…</span>
          : shown.length ? shown.map((s) => (
            <Link key={s.id} to={`/space/${s.id}`} className="flex flex-col overflow-hidden rounded-[20px] bg-surface text-text no-underline">
              <div className="h-[140px] bg-sage">{s.photos[0] && <img src={s.photos[0]} alt="" className="h-full w-full object-cover" />}</div>
              <div className="flex flex-col gap-1 p-4">
                <span className="font-display text-[22px] leading-tight text-ink">{s.name}</span>
                <span className="text-[13px] text-subtle">{[s.town, s.sleeps && `Sleeps ${s.sleeps}`, s.volunteer_exchange && 'Welcomes volunteers'].filter(Boolean).join(' · ')}</span>
                {s.practices.length > 0 && <span className="text-xs text-gold-soft">{s.practices.slice(0, 4).join(' · ')}</span>}
              </div>
            </Link>
          )) : spaces.length ? (
            <EmptyState title="No spaces match" action={<button type="button" onClick={() => { setFilters([]); setQuery('') }} className="flex min-h-11 items-center text-sm font-semibold text-gold-soft">Clear filters</button>}>
              Try fewer filters or another word.
            </EmptyState>
          ) : (
            <EmptyState icon={<IconPin size={36} />} title="Spaces are joining now">
              We're welcoming our founding retreat spaces. When they go live, you'll find them here.
            </EmptyState>
          )}

        <RowLink to={`/messages?draft=${encodeURIComponent("Hi! I'd love to hold an offering at ")}`} title="Want to hold space somewhere?" sub="Tell us where, and we'll make the intro." />
        <RowLink href={`mailto:${CONTACT_EMAIL}?subject=A%20retreat%20space%20for%20Xanadu`} title="Know a space that belongs here?" sub="Recommend it and we'll reach out." />
      </Page>
    </Screen>
  )
}
