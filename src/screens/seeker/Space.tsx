import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Reviews, Screen } from '../../components/ui'
import { IconBack, IconHeart } from '../../components/icons'
import ExperienceCard from '../../components/ExperienceCard'
import { Loading, useAuth } from '../../auth'
import { supabase } from '../../lib/supabase'
import { placeLabel } from '../../data'
import { fetchListings, useSaved, type Listing } from '../../store'

type Row = {
  id: string; owner_id: string; name: string; town: string; region: string; country: string; about: string; practices: string[]; photos: string[]
  sleeps: string; rooms: string; mats: string; kitchen: string; getting_here: string; volunteer_exchange: boolean; volunteer_details: string
}

const h2 = 'm-0 font-display text-[22px] font-semibold text-ink'

/** A retreat space as guests see it (approved spaces only). */
export default function Space() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const { isSaved, toggle } = useSaved()
  const [space, setSpace] = useState<Row | null | undefined>(undefined)
  const [listings, setListings] = useState<Listing[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    supabase.from('spaces').select('*').eq('id', id ?? '').maybeSingle().then(async ({ data }) => {
      if (!live) return
      const row = (data as Row) ?? null
      setSpace(row)
      if (row) { const l = await fetchListings({ ownerId: row.owner_id }); if (live) setListings(l) }
    })
    return () => { live = false }
  }, [id])

  if (space === undefined) return <Loading label="Opening space…" />
  const back = <button type="button" aria-label="Back" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/70 text-text"><IconBack /></button>
  if (!space) return (
    <Screen><div className="flex flex-col gap-4 px-5 pt-[52px]">{back}
      <h1 className="m-0 font-display text-3xl font-medium text-ink">This space isn't available</h1>
      <p className="m-0 text-[15px] leading-relaxed text-muted">It may not be open to guests yet. Spaces appear once the Xanadu team has welcomed them.</p>
    </div></Screen>
  )
  const own = space.owner_id === session?.user.id
  const isSeeker = profile?.role === 'seeker'
  const saved = isSaved('space', space.id)
  const ask = (topic: string) => `/messages?draft=${encodeURIComponent(topic)}`

  const facts: [string, string][] = [
    [space.sleeps ? `Sleeps ${space.sleeps}` : 'Rooms', space.rooms],
    ['Practice space', space.mats ? `Holds ${space.mats}` : ''],
    ['Kitchen', space.kitchen],
    ['Getting here', space.getting_here],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <Screen>
      <div className="relative flex h-[280px] flex-col bg-sage px-4 pt-[52px]">
        {space.photos[0] && <img src={space.photos[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="relative flex justify-between">
          {back}
          {isSeeker && (
            <button type="button" aria-label={saved ? 'Remove from saved' : 'Save'} aria-pressed={saved}
              onClick={async () => { setError(''); const err = await toggle('space', space.id); if (err) setError(err) }}
              className={`flex h-11 w-11 items-center justify-center rounded-full bg-navy/70 ${saved ? 'text-gold-soft' : 'text-text'}`}><IconHeart size={20} filled={saved} /></button>
          )}
        </div>
      </div>
      {space.photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-5 pt-3">
          {space.photos.slice(1).map((p, i) => <img key={i} src={p} alt={`${space.name} photo ${i + 2}`} className="h-16 w-16 flex-none rounded-xl object-cover" />)}
        </div>
      )}
      <div className="flex flex-col gap-6 px-5 pt-5 pb-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 font-display text-[32px] font-medium text-ink">{space.name}</h1>
          <span className="text-sm text-muted">{`Retreat space · ${placeLabel(space)}`}</span>
          {own && <span className="text-[13px] text-subtle">This is how members see your space.</span>}
          {error && <span role="alert" className="text-[13px] text-gold-pale">{error}</span>}
        </div>
        {space.about && <p className="m-0 text-[15px] leading-relaxed whitespace-pre-line text-muted">{space.about}</p>}
        {space.practices.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h2 className={h2}>They host</h2>
            <div className="flex flex-wrap gap-2">{space.practices.map((p) => <span key={p} className="rounded-full border border-line-2 px-3 py-1.5 text-[13px] text-text">{p}</span>)}</div>
          </section>
        )}
        {space.volunteer_exchange && (
          <section className="flex flex-col gap-2 rounded-[18px] bg-plum p-4">
            <h2 className={h2}>Volunteer exchange</h2>
            <p className="m-0 text-[14px] leading-relaxed whitespace-pre-line text-muted">{space.volunteer_details || 'This space welcomes volunteers. Ask us for the details.'}</p>
            {isSeeker && <Link to={ask(`Hi! I'd love to volunteer at ${space.name}. `)} className="flex min-h-11 items-center self-start rounded-xl bg-gold px-4 text-[13px] font-semibold text-navy no-underline hover:text-navy">Ask about volunteering</Link>}
          </section>
        )}
        {facts.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h2 className={h2}>The space</h2>
            <div className="grid grid-cols-2 gap-2">
              {facts.map(([k, v]) => <div key={k} className="flex flex-col gap-0.5 rounded-[14px] bg-surface p-3.5"><span className="text-sm font-semibold text-ink">{k}</span><span className="text-xs text-subtle">{v}</span></div>)}
            </div>
          </section>
        )}
        <section className="flex flex-col gap-2.5">
          <h2 className={h2}>Upcoming here</h2>
          {listings.length
            ? listings.map((e) => <ExperienceCard key={e.id} e={{ ...e, space }} />)
            : <span className="text-[13px] leading-normal text-subtle">No experiences scheduled yet.</span>}
          {isSeeker && <Link to={ask(`Hi! I have a question about ${space.name}: `)} className="flex min-h-12 items-center justify-center rounded-2xl border border-line-2 text-[15px] text-text no-underline">Ask about this space</Link>}
        </section>
        <Reviews categories={['Space', 'Food', 'Hospitality', 'Location']} emptyText="Guests who book through Xanadu can review this space after their stay." />
      </div>
    </Screen>
  )
}
