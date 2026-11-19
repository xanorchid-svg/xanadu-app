import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Chip, EmptyState, Glow, H1, H2, Page, RowLink, Screen, SeekerTabs } from '../../components/ui'
import { LandChip } from '../../components/Lifestyle'
import { IconSearch } from '../../components/icons'
import ExperienceCard from '../../components/ExperienceCard'
import FilterSheet from '../../components/FilterSheet'
import { CONTACT_EMAIL, formatLabel, LANDSCAPES, placeLabel, PRACTICES } from '../../data'
import { useAuth } from '../../auth'
import { useMatches, useMatchScores } from '../../matching'
import { useListings, useSpaces, type Listing, type PublicSpace } from '../../store'
import { activeCount, destinations, NO_FILTERS, passes, sortListings, spacePasses, useFilters } from '../../filters'
import { Bell } from '../../components/Bell'
import ApplicationBanner from '../../components/ApplicationBanner'
import CommunityEventCard from '../../components/CommunityEventCard'
import { useCommunityEvents, useGoingCounts, useToReview, type CommunityEvent } from '../../events'
import { ReviewSheet } from '../../components/EventGoing'

const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
/** "6:30 pm" → minutes after midnight (unknown times sort last). */
const minutes = (t: string) => {
  const m = t.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (!m) return 24 * 60
  let h = Number(m[1]) % 12; if (m[3] === 'pm') h += 12
  return h * 60 + Number(m[2] ?? 0)
}

/** Does a practice chip match this experience or space? ("Trainings" also matches the Training format.) */
const fits = (picked: string, practices: string[], format?: string) =>
  picked === 'All' || practices.includes(picked) || (picked === 'Trainings' && format === 'Training')

function SpaceRow({ s, wide = false }: { s: PublicSpace; wide?: boolean }) {
  const sub = [placeLabel({ town: s.town, region: s.region }) || s.country, s.volunteer_exchange ? 'Welcomes volunteers' : ''].filter(Boolean).join(' · ')
  if (wide) return (
    <Link to={`/space/${s.id}`} className="flex items-center gap-3.5 rounded-[18px] bg-surface p-2.5 text-text no-underline">
      <div className="h-[76px] w-[76px] flex-none overflow-hidden rounded-[14px] bg-portal">{s.photos[0] && <img decoding="async" loading="lazy" src={s.photos[0]} alt="" className="h-full w-full object-cover" />}</div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-gold-soft">Volunteer exchange</span>
        <span className="truncate text-[15px] font-semibold text-ink">{s.name}</span>
        <span className="truncate text-[13px] text-subtle">{placeLabel(s)}</span>
      </div>
    </Link>
  )
  return (
    <Link to={`/space/${s.id}`} className="flex w-[200px] flex-none flex-col overflow-hidden rounded-[18px] bg-surface text-text no-underline">
      <div className="h-[110px] bg-portal">{s.photos[0] && <img decoding="async" loading="lazy" src={s.photos[0]} alt="" className="h-full w-full object-cover" />}</div>
      <div className="flex flex-col gap-0.5 p-3">
        <span className="truncate font-display text-[19px] leading-tight text-ink">{s.name}</span>
        <span className="truncate text-xs text-subtle">{sub}</span>
      </div>
    </Link>
  )
}

export default function Discover() {
  const [picked, setPicked] = useState<string>('All')
  const [query, setQuery] = useState('')
  const [f, setF] = useFilters()
  const [sheet, setSheet] = useState(false)
  const { profile } = useAuth()
  const { matches } = useMatches(6)
  const scores = useMatchScores()
  const { events } = useCommunityEvents()
  const goingCounts = useGoingCounts(events.map((e) => e.id))
  const { toReview, reload: reloadToReview } = useToReview()
  const [reviewing, setReviewing] = useState<CommunityEvent | null>(null)
  // Most sought after: what's on today (or this week, if today is quiet), most "going" first
  const today = isoDay(new Date()), weekEnd = isoDay(new Date(Date.now() + 6 * 86400000))
  const on = (e: CommunityEvent, a: string, b: string) => !!e.start_date && e.start_date <= b && (e.end_date || e.start_date) >= a
  const rank = (a: CommunityEvent, b: CommunityEvent) => (goingCounts[b.id] ?? 0) - (goingCounts[a.id] ?? 0)
    || (a.start_date ?? '').localeCompare(b.start_date ?? '') || minutes(a.start_time) - minutes(b.start_time)
  const todays = events.filter((e) => on(e, today, today)).sort(rank)
  const soughtToday = todays.length >= 3
  const sought = (soughtToday ? todays : events.filter((e) => on(e, today, weekEnd)).sort(rank)).slice(0, 6)
  const { listings, loading } = useListings()
  const { spaces } = useSpaces()
  const lifestyle = profile?.lifestyle ?? []
  const hasWords = !!profile?.seeking?.trim() || (profile?.prefs?.length ?? 0) > 0 || lifestyle.length > 0
  const prefs = profile?.prefs ?? []

  const q = query.trim().toLowerCase()
  const textOf = (e: Listing) => `${e.title} ${formatLabel(e.format)} ${e.practices.join(' ')} ${e.description} ${e.space?.name ?? ''} ${placeLabel(e.space ?? {})}`.toLowerCase()
  const spaceText = (s: PublicSpace) => `${s.name} ${placeLabel(s)} ${s.about} ${s.practices.join(' ')}`.toLowerCase()

  const shown = sortListings(listings.filter((e) => passes(e, f) && fits(picked, e.practices, e.format) && (!q || textOf(e).includes(q))), f, prefs, scores)
  const places = spaces.filter((s) => spacePasses(s, f) && fits(picked, s.practices) && (!q || spaceText(s).includes(q)))
  const dests = destinations(listings, spaces)
  const nFilters = activeCount(f)
  const filtering = picked !== 'All' || !!q || nFilters > 0
  const where = f.region || f.country || (dests.length === 1 ? dests[0].country : 'Everywhere')
  const volunteering = f.work === 'volunteer'

  const clearAll = () => { setPicked('All'); setQuery(''); setF({ ...NO_FILTERS, sort: f.sort }) }
  const emptyTitle = q ? `Nothing matches "${query.trim()}" yet` : picked === 'All' && !nFilters ? 'The first experiences are on their way' : 'Nothing matches these filters yet'

  return (
    <Screen footer={<SeekerTabs />}>
      <Page>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => setSheet(true)} className="self-start text-xs tracking-[0.08em] text-subtle">{`${where} ▾`}</button>
            <H1>What are you <Glow>seeking</Glow>?</H1>
          </div>
          <Bell className="mt-1" />
        </div>

        <ApplicationBanner />

        {toReview.length > 0 && (
          <section className="ring-iri flex flex-col gap-2.5 rounded-[20px] bg-plum/60 p-4">
            <span className="text-xs tracking-[0.14em] text-gold-soft uppercase">How was it?</span>
            {toReview.slice(0, 3).map((e) => (
              <button key={e.id} type="button" onClick={() => setReviewing(e)} className="flex items-center gap-3 text-left">
                <span className="h-12 w-12 flex-none overflow-hidden rounded-xl bg-portal">{e.photo_url && <img decoding="async" loading="lazy" src={e.photo_url} alt="" className="h-full w-full object-cover" />}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-semibold text-ink">{e.title}</span>
                  <span className="text-[12px] text-subtle">Rate the space and the facilitator ›</span>
                </span>
              </button>
            ))}
          </section>
        )}

        <div className="flex gap-2">
          <label className="flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-[14px] border border-line bg-surface-2 px-4 text-subtle">
            <IconSearch />
            <span className="sr-only">Search</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Retreats, places, practices"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-faint" />
          </label>
          <button type="button" onClick={() => setSheet(true)} aria-label={nFilters ? `Filters, ${nFilters} on` : 'Filters'}
            className={`flex min-h-12 flex-none items-center gap-1.5 rounded-[14px] border px-3.5 text-[14px] ${nFilters ? 'border-gold bg-gold/15 font-semibold text-gold-pale' : 'border-line text-muted'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden><path d="M4 6h16M7 12h10M10 18h4" /></svg>
            {nFilters ? `Filters · ${nFilters}` : 'Filters'}
          </button>
        </div>

        <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
          {['All', ...PRACTICES].map((p) => <Chip key={p} solid on={picked === p} onClick={() => setPicked(p)}>{p}</Chip>)}
        </div>
        {filtering && <button type="button" onClick={clearAll} className="-mt-3 min-h-9 self-start text-[13px] text-gold-soft">Clear search and filters</button>}

        {!filtering && (lifestyle.length === 0 ? (
          <Link to="/you" className="ring-iri relative flex flex-col gap-2 overflow-hidden rounded-[22px] bg-plum/70 p-[18px] text-text no-underline">
            <span aria-hidden className="bg-iri-strong pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-25 blur-2xl" />
            <span className="text-iri text-[11px] font-semibold tracking-[0.18em] uppercase">Design your way</span>
            <span className="font-display text-[24px] leading-tight text-ink">One class, a season, or a place to call home</span>
            <span className="text-[13px] text-muted">Drop in, stay a while, or join a community. Work remotely, volunteer, or just be. We match you. ›</span>
          </Link>
        ) : (
          <div className="-mx-5 flex items-center gap-2 overflow-x-auto px-5">
            <span className="flex-none text-xs text-subtle">Your way</span>
            {LANDSCAPES.filter((l) => lifestyle.includes(l)).map((l) => <LandChip key={l} name={l} on={f.land === l} onClick={() => setF({ ...f, land: f.land === l ? '' : l })} />)}
            <Link to="/you" className="flex min-h-9 flex-none items-center px-1 text-[13px] no-underline">Edit ›</Link>
          </div>
        ))}

        {!filtering && (
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5"><H2>Top matches for you</H2><span className="text-xs text-subtle">Chosen by Xanadu's AI from what you're seeking</span></div>
            {matches.length > 0 ? (
              <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
                {matches.map((m) => (
                  <Link key={`${m.kind}-${m.id}`} to={m.kind === 'offering' ? `/experience/${m.id}` : `/space/${m.id}`}
                    className="ring-iri flex w-[220px] flex-none flex-col overflow-hidden rounded-[18px] bg-surface text-text no-underline">
                    <div className="h-[120px] bg-portal">{m.photo_url && <img decoding="async" loading="lazy" src={m.photo_url} alt="" className="h-full w-full object-cover" />}</div>
                    <div className="flex flex-col gap-1 p-3">
                      <span className="text-[11px] tracking-[0.08em] text-gold-soft uppercase">{m.kind === 'offering' ? 'Experience' : 'Space'}{m.town ? ` · ${m.town}` : ''}</span>
                      <span className="font-display text-[19px] leading-tight text-ink">{m.title || 'Untitled'}</span>
                      {m.matched.length > 0 && <span className="text-xs text-subtle">{`Matches: ${m.matched.slice(0, 3).join(', ')}`}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <RowLink to="/you" title={hasWords ? 'Your matches will appear here' : "Tell us what you're seeking"}
                sub={hasWords ? 'As spaces and experiences join, the ones that fit you best show up first.' : 'Describe it in your own words and Xanadu will find your best fits.'} />
            )}
          </section>
        )}

        {loading ? <span className="text-[13px] text-subtle">Finding experiences…</span>
          : shown.length > 0 ? (
            <section className="flex flex-col gap-3">
              <H2>{filtering ? `${shown.length} ${shown.length === 1 ? 'experience' : 'experiences'}` : 'Aligned for you'}</H2>
              {shown.map((e) => <ExperienceCard key={e.id} e={e} />)}
            </section>
          ) : filtering && (listings.length > 0 || places.length > 0) ? (
            <EmptyState title={emptyTitle} action={<button type="button" onClick={clearAll} className="flex min-h-11 items-center text-sm font-semibold text-gold-soft">Show everything</button>}>
              {places.length ? 'No experiences match these choices yet. The spaces below do.' : 'Try another practice, date or price.'}
            </EmptyState>
          ) : null}

        {!filtering && !loading && shown.length === 0 && (sought.length > 0 ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <H2>{soughtToday ? 'Most sought after today' : 'Most sought after this week'}</H2>
                <span className="text-xs text-subtle">What the community is going to · community events, not verified</span>
              </div>
              <Link to="/calendar" className="flex min-h-9 flex-none items-center text-[13px] no-underline">Calendar ›</Link>
            </div>
            {sought.map((e) => <CommunityEventCard key={e.id} e={e} going={goingCounts[e.id] ?? 0} />)}
          </section>
        ) : (
          <RowLink to="/calendar" title="See what’s on" sub="Classes, circles, ceremonies and retreats near you, day by day." />
        ))}

        {places.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <H2>{volunteering ? 'Spaces that welcome volunteers' : 'Retreat spaces'}</H2>
              <span className="text-xs text-subtle">{volunteering ? 'Give your time, receive a place to stay, meals and practice' : 'Founding spaces welcomed by Xanadu'}</span>
            </div>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">{places.map((s) => <SpaceRow key={s.id} s={s} />)}</div>
          </section>
        )}

        {!filtering && (
          <section className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col gap-0.5"><H2>Happening nearby</H2><span className="text-xs text-subtle">Community events shared by members · not verified</span></div>
              <Link to="/events/new" className="flex min-h-9 flex-none items-center text-[13px] no-underline">+ Share</Link>
            </div>
            {events.length > 0
              ? <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">{events.filter((e) => shown.length > 0 || !sought.includes(e)).slice(0, 12).map((e) => <CommunityEventCard key={e.id} e={e} wide={false} going={goingCounts[e.id] ?? 0} />)}</div>
              : <RowLink to="/events/new" title="Seen a poster for a gathering?" sub="Share yoga, breathwork, sound healing, dance and circles happening near you." />}
          </section>
        )}

        <section className="flex flex-col gap-3">
          <H2>Help shape Xanadu</H2>
          <RowLink to="/you" title="Set your alignment" sub="Tell us what you're seeking so we show you the right experiences first." />
          <RowLink href={`mailto:${CONTACT_EMAIL}?subject=A%20space%20or%20guide%20for%20Xanadu`} title="Know a space or guide?" sub="Recommend a retreat space or facilitator who belongs here." />
        </section>
      </Page>

      {reviewing && <ReviewSheet e={reviewing} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); reloadToReview() }} />}
      {sheet && <FilterSheet value={f} onClose={() => setSheet(false)} onApply={(next) => { setF(next); setSheet(false) }}
        listings={listings} spaces={spaces} places={dests} />}
    </Screen>
  )
}
