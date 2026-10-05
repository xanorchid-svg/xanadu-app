import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../../components/ui'
import { IconBack, IconHeart } from '../../components/icons'
import { experiences } from '../../data'

/** Experience detail. With no listings yet, /experience/preview shows the listing template. */
export default function Experience() {
  const { id } = useParams()
  const navigate = useNavigate()
  const e = experiences.find((x) => x.id === id)
  const [saved, setSaved] = useState(false)
  const [requested, setRequested] = useState(false)

  const kicker = e ? `${e.practice} · ${e.format} · ${e.town}` : '[Practice] · [Length] · [Town]'
  const title = e?.title ?? '[Experience title]'
  const price = e?.priceUsd ? `$${e.priceUsd.toLocaleString()}` : '[Price]'

  const footer = (
    <div className="flex items-center gap-3 border-t border-[#1F2B3E] bg-navy-deep px-5 pt-3.5 pb-[max(30px,env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col"><span className="text-xs text-subtle">from</span><span className="text-[17px] font-semibold text-ink">{price}</span></div>
      <button type="button" onClick={() => setRequested(true)}
        className={`min-h-[52px] rounded-2xl px-6 text-[15px] font-semibold text-navy ${requested ? 'bg-calm' : 'bg-gold'}`}>
        {requested ? 'Request sent ✓' : 'Request a spot'}
      </button>
    </div>
  )

  const included = [['Daily schedule', '[Schedule details]'], ['Meals', '[Meal details]'], ['Outings', '[Outing details]'], ['Stay', '[Room details]']]

  return (
    <Screen footer={footer}>
      <div className="flex h-[300px] flex-col justify-between bg-sage px-4 pt-[52px] pb-4">
        <div className="flex justify-between">
          <button type="button" aria-label="Back" onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/70 text-text"><IconBack /></button>
          <button type="button" aria-label={saved ? 'Remove from saved' : 'Save'} aria-pressed={saved} onClick={() => setSaved(!saved)}
            className={`flex h-11 w-11 items-center justify-center rounded-full bg-navy/70 ${saved ? 'text-gold-soft' : 'text-text'}`}><IconHeart size={20} filled={saved} /></button>
        </div>
        <span className="text-[11px] tracking-[0.14em] text-[#E9E3D3] uppercase">[Cover photo]</span>
      </div>

      <div className="flex flex-col gap-[22px] px-5 pt-[22px] pb-7">
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[0.06em] text-gold-soft">{kicker}</span>
          <h1 className="m-0 font-display text-4xl leading-[1.05] font-medium text-ink">{title}</h1>
          <span className="text-sm text-muted">{`[Dates] · [Spots left] · from ${price}`}</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {[['Container', e?.containerName ?? '[Container name]', e?.verified ? '✦ Verified' : ''], ['Facilitator', e?.facilitatorName ?? '[Facilitator name]', '[N] vouches']].map(([k, name, tag], i) => (
            <div key={k} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
              <div className={`h-12 w-12 flex-none bg-mist ${i ? 'rounded-full bg-[#5A3F55]' : 'rounded-xl'}`} />
              <div className="flex flex-1 flex-col gap-0.5"><span className="text-[11px] tracking-[0.12em] text-subtle uppercase">{k}</span><span className="text-[15px] font-semibold text-ink">{name}</span></div>
              {tag && <span className="text-xs text-gold-pale">{tag}</span>}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-display text-[22px] font-semibold text-ink">The experience</h2>
          <p className="m-0 text-[15px] leading-relaxed text-muted">[Two or three sentences from the host on what this experience holds and who it's for.]</p>
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
