import { useState } from 'react'
import { FacilitatorTabs, Reviews, Screen } from '../../components/ui'

const VIEWS = ['My profile', 'As Seekers see it'] as const
const h2 = 'm-0 font-display text-[22px] font-semibold text-ink'

export default function FacilitatorProfile() {
  const [view, setView] = useState<(typeof VIEWS)[number]>('My profile')
  const [saved, setSaved] = useState(false)
  const edit = view === 'My profile'
  const privRow = 'flex min-h-11 items-center justify-between border-b border-[#1F2B3E] text-sm text-text'

  return (
    <Screen footer={<FacilitatorTabs />}>
      <div className="flex flex-col gap-6 px-5 pt-[52px] pb-7">
        <div role="tablist" aria-label="View" className="grid w-[300px] grid-cols-2 gap-1 self-center rounded-full bg-surface p-1">
          {VIEWS.map((v) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={`min-h-10 rounded-full text-xs ${view === v ? 'bg-line font-semibold text-ink' : 'text-subtle'}`}>{v}</button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full border border-dashed border-slate text-[13px] text-subtle">Add photo</div>
          <h1 className="m-0 font-display text-[32px] font-medium text-ink">[Your name]</h1>
          <span className="text-sm text-muted">[Your practices] · [Town], Costa Rica</span>
          <a href="#reviews" className="text-[13px] text-subtle no-underline">No reviews yet</a>
          {edit
            ? <button type="button" className="min-h-11 rounded-full border border-gold px-[18px] text-[13px] font-semibold text-gold-pale">Edit profile</button>
            : <button type="button" aria-pressed={saved} onClick={() => setSaved(!saved)} className="min-h-11 rounded-full border border-line-2 px-[18px] text-sm text-text">{saved ? 'Saved ♥' : 'Save'}</button>}
        </div>

        <section className="flex flex-col gap-2.5">
          <h2 className={h2}>About</h2>
          <p className="m-0 text-[15px] leading-relaxed text-subtle">[In your own words: how you came to this work and what people can expect when they sit with you.]</p>
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className={h2}>Training</h2>
          <div className="flex items-center justify-between gap-2.5 rounded-[14px] border border-dashed border-line-2 p-3.5">
            <span className="flex flex-col gap-0.5"><span className="text-[15px] font-semibold text-ink">[Certification or training]</span><span className="text-xs text-subtle">[School] · [Year]</span></span>
            <span className="text-xs text-subtle">Not added</span>
          </div>
        </section>

        {edit && (
          <section className="flex flex-col gap-2.5 rounded-[18px] border border-dashed border-slate p-4">
            <div className="flex items-baseline justify-between"><h2 className={h2}>Private to Xanadu</h2><span className="text-xs text-subtle">Not shown publicly</span></div>
            <div className={privRow}>References <span className="text-[13px] text-gold-pale">0 of 3 added</span></div>
            <div className={privRow}>Insurance <span className="text-[13px] text-subtle">Optional · add later</span></div>
            <div className={`${privRow} border-b-0`}>Community guidelines <span className="text-[13px] text-calm-text">Agreed ✓</span></div>
          </section>
        )}

        <Reviews categories={['Guidance', 'Safety & care', 'Presence', 'Clarity']}
          emptyText={edit
            ? "Seekers can review you after an experience they booked through Xanadu. You'll be able to reply publicly to each one."
            : 'Reviews from Seekers who booked through Xanadu will appear here.'} />

        <section className="flex flex-col gap-2.5">
          <h2 className={h2}>Holds space at</h2>
          <span className="text-[13px] leading-normal text-subtle">Spaces you co-host with will appear here.</span>
        </section>
      </div>
    </Screen>
  )
}
