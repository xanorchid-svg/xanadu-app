import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Chip, Field, inputCls, Switch } from '../../components/ui'
import { IconClose } from '../../components/icons'
import { PRACTICES } from '../../data'

const STEP_NAMES = ['Basics', 'Dates & spots', 'Held for you', 'Review']
const FORMATS = ['Retreat', 'Training', 'Drop-in'] as const
const INCLUDED = [
  ['stay', 'Stay', 'Rooms or shared dorms on site'],
  ['meals', 'Meals', 'Guests share dietary needs at sign-up'],
  ['schedule', 'Daily schedule', 'Sessions, rest and free time by day'],
  ['outings', 'Outings', 'Hikes, surf or beach trips that guests opt into'],
  ['transport', 'Airport transport', 'From Liberia or San José'],
] as const

/** Four-step builder for a new retreat, training or drop-in. */
export default function NewOffering() {
  const [step, setStep] = useState(1)
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('Retreat')
  const [title, setTitle] = useState('')
  const [practices, setPractices] = useState<string[]>([])
  const [spots, setSpots] = useState(12)
  const [inc, setInc] = useState<Record<string, boolean>>({ stay: true, meals: true, schedule: true, outings: false, transport: false })
  const [submitted, setSubmitted] = useState(false)

  const togglePractice = (p: string) => setPractices((xs) => (xs.includes(p) ? xs.filter((x) => x !== p) : [...xs, p]))
  const box = (on: boolean) => `min-h-12 rounded-xl border text-sm ${on ? 'border-gold bg-gold font-semibold text-navy' : 'border-line-2 text-text'}`
  const kicker = [format, ...(practices.length ? practices.slice(0, 2) : ['[Practices]'])].join(' · ')
  const h1 = 'm-0 font-display text-[32px] leading-[1.05] font-medium text-ink'

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-col gap-3.5 border-b border-[#1F2B3E] px-5 pt-[52px] pb-3.5">
        <div className="flex items-center justify-between">
          <Link to="/container" aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text"><IconClose /></Link>
          <span className="text-[13px] text-subtle">{`Step ${step} of 4 · ${STEP_NAMES[step - 1]}`}</span>
          <span className="w-11 text-right text-[13px] text-subtle">Draft</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {STEP_NAMES.map((n, i) => <span key={n} className={`h-1 rounded-full ${i < step ? 'bg-gold' : 'bg-line'}`} />)}
        </div>
      </header>

      <main className="xa-page flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 py-[22px]">
        {step === 1 && (
          <>
            <h1 className={h1}>What are you offering?</h1>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] text-muted">Format</span>
              <div className="grid grid-cols-3 gap-2">{FORMATS.map((f) => <button key={f} type="button" aria-pressed={format === f} onClick={() => setFormat(f)} className={box(format === f)}>{f}</button>)}</div>
            </div>
            <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ocean Breath Weekend" className={inputCls} /></Field>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] text-muted">Practices (helps Seekers find you)</span>
              <div className="flex flex-wrap gap-2">{PRACTICES.filter((p) => p !== 'Trainings').map((p) => <Chip key={p} on={practices.includes(p)} onClick={() => togglePractice(p)}>{p}</Chip>)}</div>
            </div>
            <Field label="Description"><textarea rows={4} placeholder="What will people experience? Who is it for?" className={`${inputCls} resize-none py-3`} /></Field>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className={h1}>When, who and how many</h1>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Starts"><input type="date" className={`${inputCls} px-3 text-sm [color-scheme:dark]`} /></Field>
              <Field label="Ends"><input type="date" className={`${inputCls} px-3 text-sm [color-scheme:dark]`} /></Field>
            </div>
            <div className="flex items-center justify-between rounded-[14px] bg-surface-2 px-4 py-3.5">
              <span className="text-[15px] text-ink">Spots</span>
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Fewer spots" onClick={() => setSpots((s) => Math.max(1, s - 1))} className="h-11 w-11 rounded-xl border border-line-2 text-xl text-text">−</button>
                <span className="min-w-7 text-center text-lg font-semibold text-ink" aria-live="polite">{spots}</span>
                <button type="button" aria-label="More spots" onClick={() => setSpots((s) => s + 1)} className="h-11 w-11 rounded-xl border border-line-2 text-xl text-text">+</button>
              </div>
            </div>
            <Field label="Price per person (USD)"><input inputMode="decimal" placeholder="e.g. 850" className={inputCls} /></Field>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] text-muted">Facilitator</span>
              <div className="flex items-center gap-3 rounded-[14px] border border-dashed border-slate p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-plum text-gold-soft">+</div>
                <div className="flex flex-1 flex-col gap-0.5"><span className="text-sm font-semibold text-ink">Add a facilitator</span><span className="text-xs text-subtle">Invite one by email, or hold it yourself</span></div>
                <button type="button" className="min-h-10 px-3 text-[13px] font-semibold text-gold-soft">Invite</button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className={h1}>What's held for guests</h1>
            <p className="-mt-2 m-0 text-sm text-subtle">Xanadu turns these into the guest's schedule, meals list and outing sign-ups.</p>
            {INCLUDED.map(([k, label, sub]) => (
              <div key={k} className="flex items-center gap-3 rounded-[14px] bg-surface-2 px-4 py-3.5">
                <div className="flex flex-1 flex-col gap-0.5"><span className="text-[15px] font-semibold text-ink">{label}</span><span className="text-xs text-subtle">{sub}</span></div>
                <Switch on={inc[k]} onChange={(v) => setInc((x) => ({ ...x, [k]: v }))} label={label} />
              </div>
            ))}
          </>
        )}

        {step === 4 && (
          <>
            <h1 className={h1}>Looks beautiful</h1>
            <div className="flex flex-col overflow-hidden rounded-[22px] bg-plum">
              <div className="flex h-40 items-end bg-slate p-3.5"><span className="text-[11px] tracking-[0.14em] text-[#E9E3D3] uppercase">[Add a cover photo]</span></div>
              <div className="flex flex-col gap-1.5 px-[18px] pt-4 pb-[18px]">
                <span className="text-xs text-gold-soft">{kicker}</span>
                <span className="font-display text-2xl text-ink">{title.trim() || '[Your title]'}</span>
                <span className="text-[13px] text-muted">{`[Your space name] · [Dates] · ${spots} spots`}</span>
              </div>
            </div>
            <p className="m-0 rounded-xl bg-surface px-3.5 py-3 text-[13px] leading-normal text-muted">The Xanadu team reviews every new offering before it goes live, usually within a day.</p>
            {submitted && <Link to="/container" className="flex min-h-12 items-center justify-center rounded-[14px] border border-gold text-sm no-underline">Sent for review ✓ · Back to home</Link>}
          </>
        )}
      </main>

      <footer className="flex gap-2.5 border-t border-[#1F2B3E] bg-navy-deep px-5 pt-3.5 pb-[max(30px,env(safe-area-inset-bottom))]">
        <button type="button" disabled={step === 1} onClick={() => { setStep((s) => Math.max(1, s - 1)); setSubmitted(false) }}
          className="min-h-[54px] rounded-2xl border border-line-2 px-5 text-[15px] text-text disabled:text-[#5B6780]">Back</button>
        <button type="button" onClick={() => (step < 4 ? setStep(step + 1) : setSubmitted(true))}
          className="min-h-[54px] flex-1 rounded-2xl bg-gold text-[15px] font-semibold text-navy">
          {step < 4 ? 'Continue' : submitted ? 'Submitted ✓' : 'Submit for review'}
        </button>
      </footer>
    </div>
  )
}
