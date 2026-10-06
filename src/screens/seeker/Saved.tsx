import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, H1, Page, PrimaryLink, Screen, SeekerTabs, Segmented } from '../../components/ui'
import { IconHeart } from '../../components/icons'
import ExperienceCard from '../../components/ExperienceCard'
import { supabase } from '../../lib/supabase'
import { fetchListings, useSaved, type Listing, type PublicSpace } from '../../store'

const TABS = ['Experiences', 'Places', 'Guides'] as const
const COPY: Record<(typeof TABS)[number], [string, string]> = {
  Experiences: ['No saved experiences yet', 'Tap the heart on any retreat, training or drop-in to keep it here.'],
  Places: ['No saved places yet', 'Tap the heart on a retreat space to return to it or visit one day.'],
  Guides: ['No saved guides yet', 'Save the facilitators whose work speaks to you. Guide profiles open soon.'],
}

/** Everything the Seeker has hearted, loaded fresh from the database. */
export default function Saved() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Experiences')
  const { saved, loading } = useSaved()
  const [experiences, setExperiences] = useState<Listing[]>([])
  const [places, setPlaces] = useState<PublicSpace[]>([])
  const [ready, setReady] = useState(false)

  const offeringIds = saved.filter((s) => s.kind === 'offering').map((s) => s.ref_id).join(',')
  const spaceIds = saved.filter((s) => s.kind === 'space').map((s) => s.ref_id).join(',')

  useEffect(() => {
    if (loading) return
    let live = true
    ;(async () => {
      const [l, sp] = await Promise.all([
        offeringIds ? fetchListings({ ids: offeringIds.split(','), includePast: true }) : Promise.resolve([]),
        spaceIds ? supabase.from('spaces').select('*').in('id', spaceIds.split(',')).then(({ data }) => (data as PublicSpace[]) ?? []) : Promise.resolve([]),
      ])
      if (live) { setExperiences(l); setPlaces(sp); setReady(true) }
    })()
    return () => { live = false }
  }, [loading, offeringIds, spaceIds])

  const [title, body] = COPY[tab]
  const empty = <EmptyState icon={<IconHeart size={36} />} title={title} action={<PrimaryLink to="/discover" className="mt-1">Explore Discover</PrimaryLink>}>{body}</EmptyState>

  return (
    <Screen footer={<SeekerTabs />}>
      <Page className="gap-5">
        <H1>Saved</H1>
        <Segmented label="Saved" options={TABS} value={tab} onChange={setTab} />
        {!ready ? <span className="text-[13px] text-subtle">Loading…</span>
          : tab === 'Experiences' ? (experiences.length ? <div className="flex flex-col gap-3">{experiences.map((e) => <ExperienceCard key={e.id} e={e} />)}</div> : empty)
            : tab === 'Places' ? (places.length ? (
              <div className="flex flex-col gap-3">
                {places.map((s) => (
                  <Link key={s.id} to={`/space/${s.id}`} className="flex items-center gap-3.5 rounded-[18px] bg-surface p-2.5 text-text no-underline">
                    <div className="h-[76px] w-[76px] flex-none overflow-hidden rounded-[14px] bg-sage">{s.photos[0] && <img src={s.photos[0]} alt="" className="h-full w-full object-cover" />}</div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-xs text-gold-soft">Retreat space</span>
                      <span className="truncate text-[15px] font-semibold text-ink">{s.name}</span>
                      <span className="truncate text-[13px] text-subtle">{s.town}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : empty)
              : empty}
      </Page>
    </Screen>
  )
}
