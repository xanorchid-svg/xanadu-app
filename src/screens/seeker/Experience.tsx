import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../../components/ui'
import { IconBack, IconHeart } from '../../components/icons'
import { dateRange } from '../../components/OfferingCard'
import { Loading, useAuth } from '../../auth'
import { supabase } from '../../lib/supabase'
import { placeLabel } from '../../data'
import { useSaved, type Offering, type PublicSpace } from '../../store'

type Row = Offering & { owner_id: string }

/**
 * Experience detail. Live offerings are open to every member; a host also sees their own
 * offering here as a guest preview, whatever its status.
 */
export default function Experience() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const { isSaved, toggle } = useSaved()
  const [offering, setOffering] = useState<Row | null | undefined>(undefined)
  const [space, setSpace] = useState<PublicSpace | null>(null)
  const [requested, setRequested] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    ;(async () => {
      const { data } = await supabase.from('offerings').select('*').eq('id', id ?? '').maybeSingle()
      if (!live) return
      const o = data as Row | null
      setOffering(o)
      if (!o) return
      const { data: sp } = await supabase.from('spaces').select('*').eq('owner_id', o.owner_id).maybeSingle()
      if (live) setSpace(sp as PublicSpace | null)
      // already asked for a spot? keep the button in its "sent" state
      if (session && o.owner_id !== session.user.id && o.title) {
        const { data: prior } = await supabase.from('messages').select('id').eq('user_id', session.user.id).eq('from_team', false).ilike('body', `%"${o.title.replace(/[%_]/g, '')}"%`).limit(1)
        if (live && prior?.length) setRequested(true)
      }
    })()
    return () => { live = false }
  }, [id, session])

  if (offering === undefined) return <Loading label="Opening experience…" />

  const back = (
    <button type="button" aria-label="Back" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/70 text-text"><IconBack /></button>
  )

  if (!offering) {
    return (
      <Screen>
        <div className="flex flex-col gap-4 px-5 pt-safe">
          {back}
          <h1 className="m-0 font-display text-3xl font-medium text-ink">This experience isn't available</h1>
          <p className="m-0 text-[15px] leading-relaxed text-muted">It may have ended or been taken down by its host.</p>
          <Link to="/" className="flex min-h-12 items-center justify-center rounded-2xl bg-gold font-semibold text-navy no-underline hover:text-navy">Explore Xanadu</Link>
        </div>
      </Screen>
    )
  }

  const o = offering
  const isOwner = o.owner_id === session?.user.id
  const isSeeker = profile?.role === 'seeker'
  const saved = isSaved('offering', o.id)
  const kicker = [o.practices.slice(0, 2).join(' · '), o.format, space?.region || space?.country].filter(Boolean).join(' · ')
  const price = o.price_usd != null ? `$${Number(o.price_usd).toLocaleString()}` : 'Ask the host'
  const meta = `${dateRange(o)} · ${o.spots} spots`
  const cover = space?.photos[0]

  const request = async () => {
    if (!session || isOwner || sending) return
    setError(''); setSending(true)
    const { error } = await supabase.from('messages').insert({ user_id: session.user.id, body: `I'd like to request a spot on "${o.title}" (${dateRange(o)}).` })
    setSending(false)
    if (error) setError("We couldn't send your request. Please try again."); else setRequested(true)
  }

  const action = isOwner
    ? <span className="rounded-2xl border border-line-2 px-4 py-3 text-[13px] text-subtle">{o.status === 'live' ? 'Your guest preview' : 'Preview · not live yet'}</span>
    : !isSeeker
      ? <span className="rounded-2xl border border-line-2 px-4 py-3 text-[13px] text-subtle">Seekers request spots</span>
      : requested
        ? <Link to="/messages" className="flex min-h-[52px] items-center rounded-2xl bg-calm px-5 text-[15px] font-semibold text-navy no-underline hover:text-navy">Request sent ✓</Link>
        : <button type="button" onClick={request} disabled={sending} className="min-h-[52px] rounded-2xl bg-gold px-6 text-[15px] font-semibold text-navy disabled:opacity-70">{sending ? 'Sending…' : 'Request a spot'}</button>

  const footer = (
    <div className="flex flex-col gap-1.5 border-t border-[#1F2B3E] bg-navy-deep px-5 pt-3.5 pb-safe">
      {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
      {requested && isSeeker && <p className="m-0 text-[13px] text-muted">The Xanadu team will reply in your Messages, usually within a day.</p>}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-col"><span className="text-xs text-subtle">{o.price_usd != null ? 'from' : 'Price'}</span><span className="text-[17px] font-semibold text-ink">{price}</span></div>
        {action}
      </div>
    </div>
  )

  const inc = o.included ?? {}
  const included: [string, string][] = [
    ['Stay', inc.stay ? 'Included' : 'Not included'],
    ['Meals', inc.meals ? 'Included' : 'Not included'],
    ['Daily schedule', inc.schedule ? 'Shared on booking' : 'Not included'],
    ['Outings', inc.outings ? 'Optional, guests opt in' : 'Not included'],
    ['Airport transport', inc.transport ? 'Included' : 'Not included'],
  ]
  const outings = (o.schedule?.outings ?? []).map((x) => x.split('|'))

  return (
    <Screen footer={footer}>
      <div className="relative flex h-[300px] flex-col bg-sage px-4 pt-safe pb-4">
        {cover && <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="relative flex justify-between">
          {back}
          {isSeeker && (
            <button type="button" aria-label={saved ? 'Remove from saved' : 'Save'} aria-pressed={saved}
              onClick={async () => { setError(''); const err = await toggle('offering', o.id); if (err) setError(err) }}
              className={`flex h-11 w-11 items-center justify-center rounded-full bg-navy/70 ${saved ? 'text-gold-soft' : 'text-text'}`}><IconHeart size={20} filled={saved} /></button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-[22px] px-5 pt-[22px] pb-7">
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[0.06em] text-gold-soft">{kicker}</span>
          <h1 className="m-0 font-display text-4xl leading-[1.05] font-medium text-ink">{o.title || 'Untitled experience'}</h1>
          <span className="text-sm text-muted">{meta}</span>
        </div>

        {space && (
          <Link to={`/space/${space.id}`} className="flex items-center gap-3 rounded-[18px] bg-surface p-3 text-text no-underline">
            <div className="h-12 w-12 flex-none overflow-hidden rounded-[12px] bg-sage">{space.photos[0] && <img src={space.photos[0]} alt="" className="h-full w-full object-cover" />}</div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-xs text-subtle">Held at</span>
              <span className="truncate text-[15px] font-semibold text-ink">{space.name}</span>
              {placeLabel(space) && <span className="text-xs text-subtle">{placeLabel(space)}</span>}
            </div>
            <span className="text-gold-soft" aria-hidden>›</span>
          </Link>
        )}

        {o.description && (
          <div className="flex flex-col gap-2">
            <h2 className="m-0 font-display text-[22px] font-semibold text-ink">The experience</h2>
            <p className="m-0 text-[15px] leading-relaxed whitespace-pre-line text-muted">{o.description}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-display text-[22px] font-semibold text-ink">Held for you</h2>
          <div className="grid grid-cols-2 gap-2">
            {included.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 rounded-[14px] border border-line p-3.5"><span className="text-sm font-semibold text-ink">{k}</span><span className="text-xs text-subtle">{v}</span></div>
            ))}
          </div>
        </div>

        {outings.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="m-0 font-display text-[22px] font-semibold text-ink">Optional outings</h2>
            {outings.map(([d, name], i) => (
              <div key={i} className="flex items-center gap-3 rounded-[14px] bg-surface px-3.5 py-3">
                <span className="w-[56px] flex-none text-sm font-semibold text-gold-pale">{`Day ${d}`}</span>
                <span className="text-[15px] text-ink">{name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  )
}
