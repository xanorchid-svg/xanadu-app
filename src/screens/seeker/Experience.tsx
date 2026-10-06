import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../../components/ui'
import { IconBack, IconHeart } from '../../components/icons'
import { dateRange } from '../../components/OfferingCard'
import { experiences } from '../../data'
import { useAuth } from '../../auth'
import { supabase } from '../../lib/supabase'
import type { Offering } from '../../store'

type Row = Offering & { owner_id: string }

/**
 * Experience detail. Loads a saved offering by id (its owner sees a preview; live offerings are open to all).
 * /experience/preview shows the empty listing template.
 */
export default function Experience() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [offering, setOffering] = useState<Row | null>(null)
  const [saved, setSaved] = useState(false)
  const [requested, setRequested] = useState(false)
  const [error, setError] = useState('')
  const sample = experiences.find((x) => x.id === id)

  useEffect(() => {
    if (!id || id === 'preview' || sample) return
    supabase.from('offerings').select('*').eq('id', id).maybeSingle().then(({ data }) => setOffering(data as Row | null))
  }, [id, sample])

  const o = offering
  const isOwner = !!o && o.owner_id === session?.user.id
  const kicker = o ? [o.practices.slice(0, 2).join(' · '), o.format].filter(Boolean).join(' · ') : sample ? `${sample.practice} · ${sample.format} · ${sample.town}` : '[Practice] · [Length] · [Town]'
  const title = o?.title || sample?.title || '[Experience title]'
  const price = o?.price_usd != null ? `$${Number(o.price_usd).toLocaleString()}` : sample?.priceUsd ? `$${sample.priceUsd.toLocaleString()}` : '[Price]'
  const meta = o ? `${dateRange(o)} · ${o.spots} spots` : '[Dates] · [Spots left]'

  const request = async () => {
    if (!o || !session || isOwner) return
    setError('')
    const { error } = await supabase.from('messages').insert({ user_id: session.user.id, body: `I'd like to request a spot on "${o.title}" (${dateRange(o)}).` })
    if (error) setError("We couldn't send your request. Please try again."); else setRequested(true)
  }

  const footer = (
    <div className="flex flex-col gap-1.5 border-t border-[#1F2B3E] bg-navy-deep px-5 pt-3.5 pb-[max(30px,env(safe-area-inset-bottom))]">
      {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-col"><span className="text-xs text-subtle">from</span><span className="text-[17px] font-semibold text-ink">{price}</span></div>
        {isOwner || !o
          ? <span className="rounded-2xl border border-line-2 px-4 py-3 text-[13px] text-subtle">{isOwner ? 'Your guest preview' : 'Listing template'}</span>
          : <button type="button" onClick={request} disabled={requested}
              className={`min-h-[52px] rounded-2xl px-6 text-[15px] font-semibold text-navy ${requested ? 'bg-calm' : 'bg-gold'}`}>
              {requested ? 'Request sent ✓' : 'Request a spot'}
            </button>}
      </div>
    </div>
  )

  const inc = o?.included ?? {}
  const included: [string, string][] = o
    ? [
      ['Daily schedule', inc.schedule ? 'Shared on booking' : 'Not included'],
      ['Meals', inc.meals ? 'Included' : 'Not included'],
      ['Outings', inc.outings ? 'Optional, guests opt in' : 'Not included'],
      ['Stay', inc.stay ? 'Included' : 'Not included'],
    ]
    : [['Daily schedule', '[Schedule details]'], ['Meals', '[Meal details]'], ['Outings', '[Outing details]'], ['Stay', '[Room details]']]

  return (
    <Screen footer={footer}>
      <div className="flex h-[300px] flex-col justify-between bg-sage px-4 pt-[52px] pb-4">
        <div className="flex justify-between">
          <button type="button" aria-label="Back" onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/70 text-text"><IconBack /></button>
          <button type="button" aria-label={saved ? 'Remove from saved' : 'Save'} aria-pressed={saved} onClick={() => setSaved(!saved)}
            className={`flex h-11 w-11 items-center justify-center rounded-full bg-navy/70 ${saved ? 'text-gold-soft' : 'text-text'}`}><IconHeart size={20} filled={saved} /></button>
        </div>
        <span className="text-[11px] tracking-[0.14em] text-[#E9E3D3] uppercase">{o ? '' : '[Cover photo]'}</span>
      </div>

      <div className="flex flex-col gap-[22px] px-5 pt-[22px] pb-7">
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[0.06em] text-gold-soft">{kicker}</span>
          <h1 className="m-0 font-display text-4xl leading-[1.05] font-medium text-ink">{title}</h1>
          <span className="text-sm text-muted">{`${meta} · from ${price}`}</span>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-display text-[22px] font-semibold text-ink">The experience</h2>
          <p className="m-0 text-[15px] leading-relaxed whitespace-pre-line text-muted">{o?.description || "[Two or three sentences from the host on what this experience holds and who it's for.]"}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-display text-[22px] font-semibold text-ink">Held for you</h2>
          <div className="grid grid-cols-2 gap-2">
            {included.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 rounded-[14px] border border-line p-3.5"><span className="text-sm font-semibold text-ink">{k}</span><span className="text-xs text-subtle">{v}</span></div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  )
}
