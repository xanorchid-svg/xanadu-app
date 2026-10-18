import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { day, LANDSCAPE, place, useTeamQuery, type Space } from '../lib/data'
import { Answers, Avatar, Chips, Drawer, Gallery, LifeChips, Search, Section } from '../parts'
import { Card, EmptyState, PageTitle, Spinner, StatusPill, type Status } from '../ui'

const pillOf = (s: Space): Status => (s.owner_status === 'approved' ? 'approved' : s.owner_status === 'declined' ? 'declined' : 'pending')

export default function Spaces() {
  const { data, error } = useTeamQuery<Space[]>('team_list_spaces')
  const [q, setQ] = useState('')
  const [country, setCountry] = useState('')
  const [land, setLand] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const close = useCallback(() => setOpenId(null), [])

  const countries = useMemo(() => [...new Set((data ?? []).map((s) => s.country).filter(Boolean) as string[])].sort(), [data])
  const lands = useMemo(() => Object.keys(LANDSCAPE).filter((l) => data?.some((s) => s.lifestyle?.includes(l))), [data])
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (data ?? []).filter((s) => (!country || s.country === country) && (!land || s.lifestyle?.includes(land)) &&
      (!t || [s.name, s.owner_name, s.town, s.region, s.country].some((v) => v?.toLowerCase().includes(t))))
  }, [data, q, country, land])
  const open = data?.find((s) => s.id === openId) ?? null

  const chip = (on: boolean) => `h-8 shrink-0 rounded-full px-3.5 text-[12.5px] font-semibold ${on ? 'bg-surface text-ink ring-1 ring-gold/50' : 'text-faint hover:text-text'}`

  return (
    <div className="xa-page">
      <PageTitle title="Spaces"><Search value={q} onChange={setQ} placeholder="Search space, host, place" /></PageTitle>

      {(countries.length > 0 || lands.length > 0) && (
        <div className="mb-5 space-y-2">
          {countries.length > 0 && <div className="flex gap-1 overflow-x-auto">
            <button className={chip(!country)} onClick={() => setCountry('')}>All countries</button>
            {countries.map((c) => <button key={c} className={chip(country === c)} onClick={() => setCountry(country === c ? '' : c)}>{c}</button>)}
          </div>}
          {lands.length > 0 && <div className="flex gap-1.5 overflow-x-auto">
            {lands.map((l) => (
              <button key={l} onClick={() => setLand(land === l ? '' : l)}
                className={`h-8 shrink-0 rounded-full px-3.5 text-[12.5px] font-semibold ${land === l ? 'text-navy' : 'text-subtle ring-1 ring-line'}`}
                style={land === l ? { background: LANDSCAPE[l] } : undefined}>{l}</button>
            ))}
          </div>}
        </div>
      )}

      {error && <p className="text-[14px] text-rose">{error}</p>}
      {!data && !error && <div className="grid place-items-center py-16"><Spinner /></div>}
      {data && shown.length === 0 && (
        <EmptyState title={data.length ? 'Nothing matches' : 'No spaces yet'}
          body={data.length ? 'Try another country, landscape or search.' : 'When a Container sets up their space, it appears here, whether or not it’s approved yet.'} />
      )}

      {data && shown.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((s) => (
            <button key={s.id} onClick={() => setOpenId(s.id)} className="text-left">
              <Card className="h-full overflow-hidden hover:bg-surface">
                <div className="relative aspect-[16/10]">
                  {s.photos?.[0] ? <img src={s.photos[0]} alt="" className="size-full object-cover" loading="lazy" /> : <div className="size-full bg-portal" />}
                  <div className="absolute top-3 left-3"><StatusPill status={pillOf(s)} /></div>
                  {s.volunteer_exchange && <span className="absolute top-3 right-3 rounded-full bg-navy/80 px-2.5 py-1 text-[11px] font-semibold text-iri-sage ring-1 ring-iri-sage/40">Volunteers</span>}
                </div>
                <div className="space-y-2 p-4">
                  <p className="font-display text-[22px] leading-tight text-ink">{s.name || 'Unnamed space'}</p>
                  <p className="text-[13px] text-subtle">{place(s.town, s.region, s.country) || 'No location'} · {s.live_offerings} live offering{s.live_offerings === 1 ? '' : 's'}</p>
                  <LifeChips items={s.lifestyle?.filter((l) => LANDSCAPE[l])} />
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {open && (
        <Drawer label={open.name} onClose={close} title={open.name || 'Unnamed space'}
          image={<Avatar src={open.photos?.[0]} size="size-14" square />}
          sub={<>Container<StatusPill status={pillOf(open)} /></>}>
          {open.photos?.length ? <Gallery photos={open.photos} /> : null}
          <Section title="The space">
            <Answers rows={[
              ['Location', place(open.town, open.region, open.country)],
              ['About', open.about],
              ['Practices', open.practices?.length ? <Chips items={open.practices} /> : null],
              ['Life here', open.lifestyle?.length ? <LifeChips items={open.lifestyle} /> : null],
              ['Volunteers', open.volunteer_exchange ? (open.volunteer_details || 'Welcomes volunteers') : 'Not offered'],
            ]} />
          </Section>
          <Section title="Details">
            <Answers rows={[
              ['Sleeps', open.sleeps], ['Practice space holds', open.mats], ['Room types', open.rooms],
              ['Kitchen and meals', open.kitchen], ['Getting here', open.getting_here],
            ]} />
          </Section>
          <Section title="Host">
            <Answers rows={[
              ['Host', open.owner_name], ['Email', open.owner_email && <span className="select-all">{open.owner_email}</span>],
              ['Live offerings', String(open.live_offerings)], ['Created', day(open.created_at)],
            ]} />
            <Link to={`/applications?id=${open.owner_id}`} className="mt-3 inline-block text-[13.5px]">Open their application →</Link>
          </Section>
        </Drawer>
      )}
    </div>
  )
}
