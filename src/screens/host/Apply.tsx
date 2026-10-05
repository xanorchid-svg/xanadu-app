import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BackButton, Field, inputCls, Screen } from '../../components/ui'
import type { Role } from '../../data'

type HostRole = Exclude<Role, 'Seeker'>

/** Founding-member application for Containers and Facilitators. */
export default function Apply() {
  const [params] = useSearchParams()
  const [role, setRole] = useState<HostRole>(params.get('role') === 'Facilitator' ? 'Facilitator' : 'Container')
  const [sent, setSent] = useState(false)
  const c = role === 'Container'

  const footer = (
    <div className="border-t border-[#1F2B3E] bg-navy-deep px-5 pt-3.5 pb-[max(30px,env(safe-area-inset-bottom))]">
      <button type="submit" form="apply" className={`min-h-[54px] w-full rounded-2xl text-base font-semibold text-navy ${sent ? 'bg-calm' : 'bg-gold'}`}>
        {sent ? 'Application received ✓' : `Apply as ${role}`}
      </button>
      {sent && <Link to={`/apply/status?role=${role}`} className="mt-1.5 flex min-h-11 items-center justify-center text-sm no-underline">Track your application →</Link>}
    </div>
  )

  return (
    <Screen footer={footer}>
      <form id="apply" onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="flex flex-col gap-5 px-5 pt-[52px] pb-6">
        <BackButton to="/" />
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[0.2em] text-gold-soft uppercase">Founding members · Costa Rica</span>
          <h1 className="m-0 font-display text-4xl leading-[1.05] font-medium text-ink">Hold space with us</h1>
          <p className="m-0 text-[15px] leading-relaxed text-muted">We help you market, organize and fill your offerings, hand in hand. Founding members join free.</p>
        </div>

        <div role="radiogroup" aria-label="I am a" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-surface p-1">
          {(['Container', 'Facilitator'] as const).map((r) => (
            <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)}
              className={`min-h-11 rounded-xl text-sm ${role === r ? 'bg-gold font-semibold text-navy' : 'text-muted'}`}>{r}</button>
          ))}
        </div>

        <div className="flex flex-col gap-3.5">
          <Field label={c ? 'Space name' : 'Your name'}><input required type="text" className={inputCls} /></Field>
          <Field label="Location"><input required type="text" placeholder="e.g. Nosara" className={inputCls} /></Field>
          <Field label={c ? 'Reviews or referrals (links welcome)' : 'Training, experience and references'}>
            <textarea required rows={3} className={`${inputCls} resize-none py-3`} />
          </Field>
          <Field label="Email"><input required type="email" autoComplete="email" className={inputCls} /></Field>
        </div>

        <p className="m-0 rounded-xl bg-plum px-3.5 py-3 text-[13px] leading-normal text-muted">We use AI to help review applications; a person makes every decision.</p>
      </form>
    </Screen>
  )
}
