import { useState } from 'react'
import { Chip, EmptyState, H1, H2, Page, PrimaryButton, RowLink, Screen, SeekerTabs } from '../../components/ui'
import { IconSearch, IconStar } from '../../components/icons'
import ExperienceCard from '../../components/ExperienceCard'
import { CONTACT_EMAIL, experiences, PRACTICES } from '../../data'
import { useAuth } from '../../auth'
import { useMatches } from '../../matching'
import { Link } from 'react-router-dom'

export default function Discover() {
  const [picked, setPicked] = useState<string>('All')
  const [query, setQuery] = useState('')
  const { profile, updateProfile } = useAuth()
  const notified = profile?.launch_notify ?? false
  const { matches } = useMatches(6)
  const hasWords = !!profile?.seeking?.trim() || (profile?.prefs?.length ?? 0) > 0

  const q = query.trim().toLowerCase()
  const shown = experiences.filter((e) =>
    (picked === 'All' || e.practice === picked) &&
    (!q || `${e.title} ${e.practice} ${e.containerName} ${e.town}`.toLowerCase().includes(q)))

  const emptyTitle = picked === 'All' ? 'The first experiences are on their way' : `No ${picked.toLowerCase()} experiences yet`

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

        {shown.length > 0 ? (
          <section className="flex flex-col gap-3">
            <H2>Aligned for you</H2>
            {shown.map((e) => <ExperienceCard key={e.id} e={e} />)}
          </section>
        ) : (
          <EmptyState icon={<span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/50"><IconStar /></span>}
            title={emptyTitle}
            action={<PrimaryButton done={notified} onClick={() => updateProfile({ launch_notify: true })} className="mt-1">{notified ? "We'll let you know ✓" : 'Notify me when they open'}</PrimaryButton>}>
            We're welcoming our founding retreat spaces and facilitators in Costa Rica. Their experiences will appear here as they join.
          </EmptyState>
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
