import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { inputCls, Field } from '../components/ui'
import Logo from '../components/Logo'
import { ROLE_HOME, type Role } from '../data'

const ROLES: { role: Role; sub: string }[] = [
  { role: 'Seeker', sub: 'Explore' },
  { role: 'Container', sub: 'My space' },
  { role: 'Facilitator', sub: 'My practice' },
]

const JOIN: Record<Role, { lead: string; label: string; to: string }> = {
  Seeker: { lead: 'New to Xanadu?', label: 'Create a free account', to: '/discover' },
  Container: { lead: 'Have a retreat space?', label: 'Apply as a founding Container', to: '/apply?role=Container' },
  Facilitator: { lead: 'Guide or teacher?', label: 'Apply as a founding Facilitator', to: '/apply?role=Facilitator' },
}

const INTRO_MS = 2600
const ease = 'cubic-bezier(.2,.7,.1,1)'

/** Logo zooms out of a gold portal, then the sign-in sheet rises. */
export default function Intro() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'intro' | 'login'>('intro')
  const [run, setRun] = useState(0)
  const [role, setRole] = useState<Role>('Seeker')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    setPhase('intro')
    timer.current = window.setTimeout(() => setPhase('login'), INTRO_MS)
    return () => window.clearTimeout(timer.current)
  }, [run])

  const intro = phase === 'intro'
  const join = JOIN[role]

  return (
    <div className="relative h-full overflow-hidden bg-ivory">
      {intro && (
        <>
          <span key={`r1-${run}`} className="absolute top-[46%] left-1/2 h-[260px] w-[260px] rounded-full border border-gold/55" style={{ animation: 'xa-ring 2.4s ease-out .4s both' }} />
          <span key={`r2-${run}`} className="absolute top-[46%] left-1/2 h-[260px] w-[260px] rounded-full border border-gold/35" style={{ animation: 'xa-ring 2.4s ease-out .9s both' }} />
        </>
      )}

      <div
        key={`logo-${run}`}
        className="absolute left-1/2 w-[320px]"
        style={intro
          ? { top: '46%', transform: 'translate(-50%,-50%) scale(1.05)', animation: `xa-zoom 1.8s ${ease} both` }
          : { top: 'calc(env(safe-area-inset-top) + 150px)', transform: 'translate(-50%,-50%) scale(1)', transition: `top 1.3s ${ease}, transform 1.3s ${ease}` }}
      >
        <Logo spinning={!intro} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); navigate(ROLE_HOME[role]) }}
        aria-hidden={intro}
        className="absolute inset-x-0 bottom-0 flex h-[calc(100%-282px-env(safe-area-inset-top))] flex-col gap-2.5 overflow-y-auto rounded-t-[32px] bg-navy px-[22px] pt-5 pb-[max(22px,env(safe-area-inset-bottom))]"
        style={{ transform: intro ? 'translateY(102%)' : 'translateY(0)', transition: `transform 1.1s ${ease} .2s` }}
      >
        <div className="flex flex-col gap-1">
          <h1 className="m-0 font-display text-[30px] leading-[1.05] font-medium text-ink">Xanadu begins <em className="text-gold-soft">with you.</em></h1>
          <span className="text-sm text-subtle">Sign in as</span>
        </div>

        <div role="radiogroup" aria-label="Sign in as" className="grid grid-cols-3 gap-1.5 rounded-2xl bg-surface p-1">
          {ROLES.map(({ role: r, sub }) => (
            <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)}
              className={`flex min-h-12 flex-col items-center justify-center rounded-xl transition-colors ${role === r ? 'bg-gold text-navy' : 'text-muted'}`}>
              <span className="text-sm font-semibold">{r}</span>
              <span className="text-[11px] opacity-80">{sub}</span>
            </button>
          ))}
        </div>

        <Field label="Email"><input type="email" autoComplete="email" className={inputCls} /></Field>
        <Field label={<span className="flex justify-between">Password<a href={`mailto:networkxanadu@gmail.com?subject=Password%20help`} className="no-underline">Forgot?</a></span>}>
          <input type="password" autoComplete="current-password" className={inputCls} />
        </Field>

        <button type="submit" className="min-h-[54px] flex-none rounded-2xl bg-gold text-base font-semibold text-navy hover:bg-gold-soft">{`Sign in as ${role}`}</button>

        <div className="flex items-center gap-2.5 text-xs text-faint"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
        <div className="grid grid-cols-2 gap-2">
          <button type="submit" className="min-h-12 rounded-[14px] border border-line-2 text-sm text-text">Continue with Google</button>
          <button type="submit" className="min-h-12 rounded-[14px] border border-line-2 text-sm text-text">Continue with Apple</button>
        </div>

        <p className="m-0 flex flex-wrap justify-center gap-x-1.5 text-[13px] text-subtle">
          <span>{join.lead}</span>
          <Link to={join.to} className="font-semibold no-underline">{join.label}</Link>
        </p>
        <button type="button" onClick={() => setRun((n) => n + 1)} className="min-h-6 self-center text-xs text-[#5B6780]">Replay intro</button>
      </form>
    </div>
  )
}
