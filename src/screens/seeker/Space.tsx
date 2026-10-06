import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Reviews, Screen } from '../../components/ui'
import { IconBack } from '../../components/icons'
import { Loading } from '../../auth'
import { supabase } from '../../lib/supabase'

type Row = {
  id: string; name: string; town: string; about: string; practices: string[]; photos: string[]
  sleeps: string; rooms: string; mats: string; kitchen: string; getting_here: string; volunteer_exchange: boolean; volunteer_details: string
}

const h2 = 'm-0 font-display text-[22px] font-semibold text-ink'

/** A retreat space as guests see it (approved spaces only). */
export default function Space() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [space, setSpace] = useState<Row | null | undefined>(undefined)

  useEffect(() => {
    supabase.from('spaces').select('*').eq('id', id ?? '').maybeSingle().then(({ data }) => setSpace((data as Row) ?? null))
  }, [id])

  if (space === undefined) return <Loading label="Opening space…" />
  const back = <button type="button" aria-label="Back" onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/70 text-text"><IconBack /></button>
  if (!space) return <Screen><div className="flex flex-col gap-4 px-5 pt-[52px]">{back}<p className="m-0 text-[15px] text-muted">This space isn't available right now.</p></div></Screen>

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
        <div className="relative">{back}</div>
      </div>
      {space.photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-5 pt-3">
          {space.photos.slice(1).map((p, i) => <img key={i} src={p} alt={`${space.name} photo ${i + 2}`} className="h-16 w-16 flex-none rounded-xl object-cover" />)}
        </div>
      )}
      <div className="flex flex-col gap-6 px-5 pt-5 pb-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 font-display text-[32px] font-medium text-ink">{space.name}</h1>
          <span className="text-sm text-muted">{`Retreat space · ${space.town}, Costa Rica`}</span>
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
            <p className="m-0 text-[14px] leading-relaxed whitespace-pre-line text-muted">{space.volunteer_details || 'This space welcomes volunteers. Details coming soon.'}</p>
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
        <Reviews categories={['Space', 'Food', 'Hospitality', 'Location']} emptyText="Guests who book through Xanadu can review this space after their stay." />
      </div>
    </Screen>
  )
}
