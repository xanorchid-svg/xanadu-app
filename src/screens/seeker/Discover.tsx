import { useState } from 'react'
import { Chip, EmptyState, H1, H2, Page, PrimaryButton, RowLink, Screen, SeekerTabs } from '../../components/ui'
import { IconSearch, IconStar } from '../../components/icons'
import ExperienceCard from '../../components/ExperienceCard'
import { CONTACT_EMAIL, PRACTICES } from '../../data'
import { useAuth } from '../../auth'
import { useMatches } from '../../matching'
import { useListings, useSpaces, type Listing, type PublicSpace } from '../../store'
import { Link } from 'react-router-dom'

/** Does a practice chip match this experience or space? ("Trainings" also matches the Training format.) */
const fits = (picked: string, practices: string[], format?: string) =>
  picked === 'All' || practices.includes(picked) || (picked === 'Trainings' && format === 'Training')

export default function Discover() {
  const [picked, setPicked] = useState<string>('All')
  const [query, setQuery] = useState('')
  const { profile, updateProfile } = useAuth()
  const notified = profile?.launch_notify ?? false
  const { matches } = useMatches(6)
  const { listings, loading } = useListings()
  const { spaces } = useSpaces()
  const hasWords = !!profile?.seeking?.trim() || (profile?.prefs?.length ?? 0) > 0
  const prefs = profile?.prefs ?? []

  const q = query.trim().toLowerCase()
  const textOf = (e: Listing) => `${e.title} ${e.format} ${e.practices.join(' ')} ${e.description} ${e.space?.name ?? ''} ${e.space?.town ?? ''}`.toLowerCase()
  const spaceText = (s: PublicSpace) => `${s.name} ${s.town} ${s.about} ${s.practices.join(' ')}`.toLowerCase()
  // aligned first: experiences sharing the most of the Seeker's practices, then soonest
  const overlap = (e: Listing) => e.practices.filter((p) => prefs.includes(p)).length
  const shown = listings
    .filter((e) => fits(picked, e.practices, e.format) && (!q || textOf(e).includes(q)))
    .sort((a, b) => overlap(b) - overlap(a))
  const places = spaces.filter((s) => fits(picked, s.practices) && (!q || spaceText(s).includes(q)))
  const filtering = picked !== 'All' || !!q

  const emptyTitle = q ? `Nothing matches "${query.trim()}" yet` : picked === 'All' ? 'The first experiences are on their way' : `No ${picked.toLowerCase()} experiences yet`

  return (
    <Screen footer={<SeekerTabs />}>
      <Page>
        <div className="flex flex-col gap-1">
          <span className="text-xs tracking-[0.08em] text-subtle">Costa Rica</span>
          <H1>What are you seeking?</H1>
        </div>

        <label className="flex min-h-12 items-center gap-2.5 rounded-[14px] border border-line bg-surface-2 px-4 text-subtle">
          <IconSearch />
          <span className="sr-only">Search</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Retreats, trainings, guides, places"
            className="flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-faint" />
        </label>

        <div className="flex flex-wrap gap-2">
          {['All', ...PRACTICES].map((p) => <Chip key={p} solid on={picked === p} onClick={() => setPicked(p)}>{p}</Chip>)}
        </div>

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

        {loading ? <span className="text-[13px] text-subtle">Finding experiences…</span> : shown.length > 0 ? (
          <section className="flex flex-col gap-3">
            <H2>{filtering ? 'Experiences' : 'Aligned for you'}</H2>
            {shown.map((e) => <ExperienceCard key={e.id} e={e} />)}
          </section>
        ) : filtering && listings.length > 0 ? (
          <EmptyState title={emptyTitle} action={<button type="button" onClick={() => { setPicked('All'); setQuery('') }} className="flex min-h-11 items-center text-sm font-semibold text-gold-soft">Show everything</button>}>
            Try another practice or a different word.
          </EmptyState>
        ) : (
          <EmptyState icon={<span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/50"><IconStar /></span>}
            title={emptyTitle}
            action={<PrimaryButton done={notified} onClick={() => updateProfile({ launch_notify: true })} className="mt-1">{notified ? "We'll let you know ✓" : 'Notify me when they open'}</PrimaryButton>}>
            We're welcoming our founding retreat spaces and facilitators in Costa Rica. Their experiences will appear here as they join.
          </EmptyState>
        )}

        {places.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5"><H2>Retreat spaces</H2><span className="text-xs text-subtle">Founding spaces welcomed by Xanadu</span></div>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
              {places.map((s) => (
                <Link key={s.id} to={`/space/${s.id}`} className="flex w-[200px] flex-none flex-col overflow-hidden rounded-[18px] bg-surface text-text no-underline">
                  <div className="h-[110px] bg-sage">{s.photos[0] && <img src={s.photos[0]} alt="" className="h-full w-full object-cover" />}</div>
                  <div className="flex flex-col gap-0.5 p-3">
                    <span className="truncate font-display text-[19px] leading-tight text-ink">{s.name}</span>
                    <span className="truncate text-xs text-subtle">{[s.town, s.volunteer_exchange ? 'Welcomes volunteers' : ''].filter(Boolean).join(' · ')}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <H2>Help shape Xanadu</H2>
          <RowLink to="/you" title="Set your alignment" sub="Tell us what you're seeking so we show you the right experiences first." />
          <RowLink href={`mailto:${CONTACT_EMAIL}?subject=A%20space%20or%20guide%20for%20Xanadu`} title="Know a space or guide?" sub="Recommend a retreat space or facilitator who belongs here." />
        </section>
      </Page>
    </Screen>
  )
}
