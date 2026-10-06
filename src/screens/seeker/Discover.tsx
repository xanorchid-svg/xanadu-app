import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader, Chip, EmptyState, H1, H2, Page, PrimaryButton, RowLink, Screen, SeekerTabs } from '../../components/ui'
import { IconSearch, IconStar } from '../../components/icons'
import ExperienceCard from '../../components/ExperienceCard'
import FilterSheet from '../../components/FilterSheet'
import { CONTACT_EMAIL, placeLabel, PRACTICES } from '../../data'
import { useAuth } from '../../auth'
import { useMatches } from '../../matching'
import { useListings, useSpaces, type Listing, type PublicSpace } from '../../store'
import { activeCount, destinations, NO_FILTERS, passes, sortListings, spacePasses, useFilters } from '../../filters'

/** Does a practice chip match this experience or space? ("Trainings" also matches the Training format.) */
const fits = (picked: string, practices: string[], format?: string) =>
  picked === 'All' || practices.includes(picked) || (picked === 'Trainings' && format === 'Training')

function SpaceRow({ s, wide = false }: { s: PublicSpace; wide?: boolean }) {
  const sub = [placeLabel({ town: s.town, region: s.region }) || s.country, s.volunteer_exchange ? 'Welcomes volunteers' : ''].filter(Boolean).join(' · ')
  if (wide) return (
    <Link to={`/space/${s.id}`} className="flex items-center gap-3.5 rounded-[18px] bg-surface p-2.5 text-text no-underline">
      <div className="h-[76px] w-[76px] flex-none overflow-hidden rounded-[14px] bg-sage">{s.photos[0] && <img src={s.photos[0]} alt="" className="h-full w-full object-cover" />}</div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-gold-soft">Volunteer exchange</span>
        <span className="truncate text-[15px] font-semibold text-ink">{s.name}</span>
        <span className="truncate text-[13px] text-subtle">{placeLabel(s)}</span>
      </div>
    </Link>
  )
  return (
    <Link to={`/space/${s.id}`} className="flex w-[200px] flex-none flex-col overflow-hidden rounded-[18px] bg-surface text-text no-underline">
      <div className="h-[110px] bg-sage">{s.photos[0] && <img src={s.photos[0]} alt="" className="h-full w-full object-cover" />}</div>
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
  const { profile, updateProfile } = useAuth()
  const notified = profile?.launch_notify ?? false
  const { matches } = useMatches(6)
  const { listings, loading } = useListings()
  const { spaces } = useSpaces()
  const hasWords = !!profile?.seeking?.trim() || (profile?.prefs?.length ?? 0) > 0
  const prefs = profile?.prefs ?? []

  const q = query.trim().toLowerCase()
  const textOf = (e: Listing) => `${e.title} ${e.format} ${e.practices.join(' ')} ${e.description} ${e.space?.name ?? ''} ${placeLabel(e.space ?? {})}`.toLowerCase()
  const spaceText = (s: PublicSpace) => `${s.name} ${placeLabel(s)} ${s.about} ${s.practices.join(' ')}`.toLowerCase()

  const volunteering = f.type === 'Volunteer exchange'
  const shown = volunteering ? [] : sortListings(listings.filter((e) => passes(e, f) && fits(picked, e.practices, e.format) && (!q || textOf(e).includes(q))), f, prefs)
  const places = spaces.filter((s) => spacePasses(s, f) && fits(picked, s.practices) && (!q || spaceText(s).includes(q)))
  const nFilters = activeCount(f)
  const filtering = picked !== 'All' || !!q || nFilters > 0
  const where = f.region || f.country || 'Everywhere'

  const clearAll = () => { setPicked('All'); setQuery(''); setF({ ...NO_FILTERS, sort: f.sort }) }
  const emptyTitle = q ? `Nothing matches "${query.trim()}" yet` : volunteering ? 'No volunteer exchanges here yet' : picked === 'All' && !nFilters ? 'The first experiences are on their way' : 'Nothing matches these filters yet'

  return (
    <Screen header={<AppHeader />} footer={<SeekerTabs />}>
      <Page>
        <div className="flex flex-col gap-1">
          <button type="button" onClick={() => setSheet(true)} className="self-start text-xs tracking-[0.08em] text-subtle">{`${where} ▾`}</button>
          <H1>What are you seeking?</H1>
        </div>

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

        {!filtering && (
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5"><H2>Top matches for you</H2><span className="text-xs text-subtle">Chosen by Xanadu's AI from what you're seeking</span></div>
            {matches.length > 0 ? (
              <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
                {matches.map((m) => (
                  <Link key={`${m.kind}-${m.id}`} to={m.kind === 'offering' ? `/experience/${m.id}` : `/space/${m.id}`}
                    className="flex w-[220px] flex-none flex-col overflow-hidden rounded-[18px] bg-surface text-text no-underline">
                    <div className="h-[120px] bg-sage">{m.photo_url && <img src={m.photo_url} alt="" className="h-full w-full object-cover" />}</div>
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
          : volunteering ? (places.length ? (
            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5"><H2>Volunteer exchanges</H2><span className="text-xs text-subtle">Give your time, receive a place to stay, meals and practice</span></div>
              {places.map((s) => <SpaceRow key={s.id} s={s} wide />)}
            </section>
          ) : (
            <EmptyState title={emptyTitle} action={<button type="button" onClick={clearAll} className="flex min-h-11 items-center text-sm font-semibold text-gold-soft">Show everything</button>}>
              Spaces that welcome volunteers will appear here. Try another destination.
            </EmptyState>
          ))
            : shown.length > 0 ? (
              <section className="flex flex-col gap-3">
                <H2>{filtering ? `${shown.length} ${shown.length === 1 ? 'experience' : 'experiences'}` : 'Aligned for you'}</H2>
                {shown.map((e) => <ExperienceCard key={e.id} e={e} />)}
              </section>
            ) : filtering && listings.length > 0 ? (
              <EmptyState title={emptyTitle} action={<button type="button" onClick={clearAll} className="flex min-h-11 items-center text-sm font-semibold text-gold-soft">Show everything</button>}>
                Try another practice, date or destination.
              </EmptyState>
            ) : (
              <EmptyState icon={<span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/50"><IconStar /></span>}
                title={emptyTitle}
                action={<PrimaryButton done={notified} onClick={() => updateProfile({ launch_notify: true })} className="mt-1">{notified ? "We'll let you know ✓" : 'Notify me when they open'}</PrimaryButton>}>
                We're welcoming our founding retreat spaces and facilitators around the world. Their experiences will appear here as they join.
              </EmptyState>
            )}

        {!volunteering && places.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5"><H2>Retreat spaces</H2><span className="text-xs text-subtle">Founding spaces welcomed by Xanadu</span></div>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">{places.map((s) => <SpaceRow key={s.id} s={s} />)}</div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <H2>Help shape Xanadu</H2>
          <RowLink to="/you" title="Set your alignment" sub="Tell us what you're seeking so we show you the right experiences first." />
          <RowLink href={`mailto:${CONTACT_EMAIL}?subject=A%20space%20or%20guide%20for%20Xanadu`} title="Know a space or guide?" sub="Recommend a retreat space or facilitator who belongs here." />
        </section>
      </Page>

      {sheet && <FilterSheet value={f} onClose={() => setSheet(false)} onApply={(next) => { setF(next); setSheet(false) }}
        listings={listings} spaces={spaces} places={destinations(listings, spaces)} />}
    </Screen>
  )
}
