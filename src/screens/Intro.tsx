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

const INTRO_MS = 2700
const ease = 'cubic-bezier(.2,.7,.1,1)'

/**
 * 1. Ivory: the logo zooms all the way out of a gold portal.
 * 2. The whole screen fades to Xanadu navy.
 * 3. Full-screen sign-in, with the emblem orbiting large in the background.
 */
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

  const login = phase === 'login'
  const join = JOIN[role]
  // content rises in gently, one piece after another
  const rise = (i: number) => ({
    opacity: login ? 1 : 0,
    transform: login ? 'none' : 'translateY(14px)',
    transition: `opacity .9s ease ${0.55 + i * 0.07}s, transform .9s ${ease} ${0.55 + i * 0.07}s`,
  })

  return (
    <div className="relative h-full overflow-hidden bg-navy">
      {/* ---------- Sign-in (navy) ---------- */}
      {/* Background: the emblem, large, orbiting slowly behind everything */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{ opacity: login ? 0.6 : 0, filter: 'brightness(1.15) saturate(.8)', transition: 'opacity 1.6s ease .3s' }}>
        <div className="flex-none" style={{ height: '70%', aspectRatio: '900 / 518', marginTop: '-10%' }}>
          {login && <Logo emblemOnly animated />}
        </div>
      </div>
      {/* soft shade so the form stays easy to read over the emblem */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(16,27,44,0) 38%, rgba(16,27,44,.42) 62%, rgba(16,27,44,.78) 100%)' }} />

      <form
        onSubmit={(e) => { e.preventDefault(); navigate(ROLE_HOME[role]) }}
        aria-hidden={!login}
        className="relative flex h-full flex-col overflow-y-auto px-[22px] pt-[max(56px,calc(env(safe-area-inset-top)+28px))] pb-[max(26px,env(safe-area-inset-bottom))]"
        style={{ pointerEvents: login ? 'auto' : 'none' }}
      >
        <img src="/logo-wordmark.png" alt="Xanadu — a network for awakening places"
          className="mx-auto block w-[270px] max-w-full select-none"
          style={{ filter: 'brightness(0) invert(1) sepia(.18) brightness(.97)', ...rise(0) }} />

        <div className="min-h-8 flex-1" />

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1" style={rise(1)}>
            <h1 className="m-0 font-display text-[32px] leading-[1.05] font-medium text-ink">Xanadu begins <em className="text-gold-soft">with you.</em></h1>
            <span className="text-sm text-subtle">Sign in as</span>
          </div>

          <div role="radiogroup" aria-label="Sign in as" className="grid grid-cols-3 gap-1.5 rounded-2xl bg-surface/85 p-1 backdrop-blur-sm" style={rise(2)}>
            {ROLES.map(({ role: r, sub }) => (
              <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)}
                className={`flex min-h-12 flex-col items-center justify-center rounded-xl transition-colors ${role === r ? 'bg-gold text-navy' : 'text-muted'}`}>
                <span className="text-sm font-semibold">{r}</span>
                <span className="text-[11px] opacity-80">{sub}</span>
              </button>
            ))}
          </div>

          <div style={rise(3)}><Field label="Email"><input type="email" autoComplete="email" className={inputCls} /></Field></div>
          <div style={rise(4)}>
            <Field label={<span className="flex justify-between">Password<a href="mailto:networkxanadu@gmail.com?subject=Password%20help" className="no-underline">Forgot?</a></span>}>
              <input type="password" autoComplete="current-password" className={inputCls} />
            </Field>
          </div>

          <button type="submit" style={rise(5)} className="mt-1 min-h-[54px] flex-none rounded-2xl bg-gold text-base font-semibold text-navy hover:bg-gold-soft">{`Sign in as ${role}`}</button>

          <div className="flex items-center gap-2.5 text-xs text-faint" style={rise(6)}><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
          <div className="grid grid-cols-2 gap-2" style={rise(6)}>
            <button type="submit" className="min-h-12 rounded-[14px] border border-line-2 bg-navy/60 text-sm text-text">Continue with Google</button>
            <button type="submit" className="min-h-12 rounded-[14px] border border-line-2 bg-navy/60 text-sm text-text">Continue with Apple</button>
          </div>

          <p className="m-0 flex flex-wrap justify-center gap-x-1.5 pt-1 text-[13px] text-subtle" style={rise(7)}>
            <span>{join.lead}</span>
            <Link to={join.to} className="font-semibold no-underline">{join.label}</Link>
          </p>
          <button type="button" onClick={() => setRun((n) => n + 1)} style={rise(7)} className="min-h-7 self-center text-xs text-[#6B7790]">Replay intro</button>
        </div>
      </form>

      {/* ---------- Intro (ivory): fades away to reveal the navy sign-in ---------- */}
      <div aria-hidden={login} className="absolute inset-0 bg-ivory"
        style={{ opacity: login ? 0 : 1, transition: 'opacity 1.1s ease', pointerEvents: login ? 'none' : 'auto' }}>
        <span key={`r1-${run}`} className="absolute top-[47%] left-1/2 h-[260px] w-[260px] rounded-full border border-gold/55" style={{ animation: 'xa-ring 2.4s ease-out .4s both' }} />
        <span key={`r2-${run}`} className="absolute top-[47%] left-1/2 h-[260px] w-[260px] rounded-full border border-gold/35" style={{ animation: 'xa-ring 2.4s ease-out .9s both' }} />
        <div key={`logo-${run}`} className="absolute top-[47%] left-1/2 w-[300px]"
          style={{ transform: 'translate(-50%,-50%) scale(1.05)', animation: `xa-zoom 2s ${ease} both` }}>
          <Logo />
        </div>
      </div>
    </div>
  )
}
