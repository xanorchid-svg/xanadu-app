import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BackButton, Screen } from '../../components/ui'
import { CONTACT_EMAIL } from '../../data'

type Stage = 'review' | 'call' | 'accepted'

const STEPS = [
  { title: 'Application received', body: 'Thank you for applying as a founding member.' },
  { title: 'Review', body: 'We read every application by hand, with reviews and references.' },
  { title: 'Intro call', body: 'A short conversation so we can meet you and your work.' },
  { title: 'Welcome to Xanadu', body: 'Your profile goes live and your founding membership begins.' },
]

const COPY: Record<Stage, [string, string, string]> = {
  review: ['In review', "We're reading your application", "Most reviews take a few days. We'll email you either way."],
  call: ['Next step', "Let's meet", 'Your application looks aligned. Pick a time below for a short intro call.'],
  accepted: ['Founding member', 'Welcome to Xanadu ✦', "You're in. Set up your profile and your first offering, and we'll help you fill it."],
}

const SLOTS = ['Tue 10:00', 'Tue 14:00', 'Wed 11:00', 'Thu 9:30', 'Thu 15:00', 'Fri 12:00']

/** Application tracker. Until the backend exists, ?stage=review|call|accepted previews each state. */
export default function Status() {
  const [params] = useSearchParams()
  const stage = (['review', 'call', 'accepted'].includes(params.get('stage') ?? '') ? params.get('stage') : 'review') as Stage
  const role = params.get('role') === 'Facilitator' ? 'Facilitator' : 'Container'
  const [slot, setSlot] = useState<string | null>(null)
  const idx = { review: 1, call: 2, accepted: 4 }[stage]
  const [kicker, headline, lede] = COPY[stage]

  const footer = (
    <div className="border-t border-[#1F2B3E] bg-navy-deep px-5 pt-3.5 pb-[max(30px,env(safe-area-inset-bottom))]">
      {stage === 'accepted'
        ? <Link to={role === 'Facilitator' ? '/facilitator' : '/container'} className="flex min-h-[54px] items-center justify-center rounded-2xl bg-gold font-semibold text-navy no-underline hover:text-navy">Open your home</Link>
        : <a href={`mailto:${CONTACT_EMAIL}`} className="flex min-h-[54px] items-center justify-center rounded-2xl border border-line-2 text-[15px] text-text no-underline">Questions? Write to us</a>}
    </div>
  )

  return (
    <Screen footer={footer}>
      <div className="flex flex-col gap-6 px-5 pt-[52px] pb-6">
        <BackButton to="/apply" />
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[0.2em] text-gold-soft uppercase">{kicker}</span>
          <h1 className="m-0 font-display text-4xl leading-[1.05] font-medium text-ink">{headline}</h1>
          <p className="m-0 text-[15px] leading-relaxed text-muted">{lede}</p>
        </div>

        <ol className="m-0 flex list-none flex-col p-0">
          {STEPS.map((s, i) => {
            const done = i < idx, now = i === idx, last = i === STEPS.length - 1
            return (
              <li key={s.title} className="flex gap-3.5">
                <div className="flex w-7 flex-none flex-col items-center">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold ${done ? 'bg-gold text-navy' : now ? 'border-[1.5px] border-gold text-gold-pale' : 'border-[1.5px] border-line-2 text-subtle'}`}>{done ? '✓' : i + 1}</span>
                  <span className={`my-1 w-[1.5px] flex-1 ${last ? 'bg-transparent' : done ? 'bg-gold' : 'bg-line'}`} />
                </div>
                <div className="flex flex-col gap-1 pb-[22px]">
                  <span className={`text-[15px] font-semibold ${done || now ? 'text-ink' : 'text-subtle'}`}>{s.title}</span>
                  <span className="text-[13px] leading-normal text-subtle">{s.body}</span>
                </div>
              </li>
            )
          })}
        </ol>

        {stage === 'call' && (
          <div className="flex flex-col gap-3 rounded-[20px] bg-surface p-[18px]">
            <span className="text-[15px] font-semibold text-ink">Pick a time for your intro call</span>
            <div className="grid grid-cols-3 gap-2">
              {SLOTS.map((t) => (
                <button key={t} type="button" aria-pressed={slot === t} onClick={() => setSlot(t)}
                  className={`min-h-11 rounded-[10px] border text-[13px] ${slot === t ? 'border-gold bg-gold font-semibold text-navy' : 'border-line-2 text-text'}`}>{t}</button>
              ))}
            </div>
            <span className="text-xs text-subtle">20 minutes · video · times in Costa Rica time</span>
          </div>
        )}

        <p className="m-0 rounded-xl bg-plum px-3.5 py-3 text-[13px] leading-normal text-muted">We use AI to help review applications; a person makes every decision.</p>
      </div>
    </Screen>
  )
}
