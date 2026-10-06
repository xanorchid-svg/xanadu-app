import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { inputCls, Field } from '../components/ui'
import Logo from '../components/Logo'
import type { Role } from '../data'
import { HOME, toDbRole, useAuth } from '../auth'
import { friendlyError, supabase, enabledProviders } from '../lib/supabase'

const ROLES: { role: Role; sub: string }[] = [
  { role: 'Seeker', sub: 'Explore' },
  { role: 'Container', sub: 'My space' },
  { role: 'Facilitator', sub: 'My practice' },
]

const JOIN: Record<Role, { lead: string; label: string }> = {
  Seeker: { lead: 'New to Xanadu?', label: 'Create a free account' },
  Container: { lead: 'Have a retreat space?', label: 'Apply as a founding Container' },
  Facilitator: { lead: 'Guide or teacher?', label: 'Apply as a founding Facilitator' },
}

const INTRO_MS = 2700 // logo zooms out on ivory
const GROW_MS = 1500 // emblem grows into the navy background
const ease = 'cubic-bezier(.2,.7,.1,1)'
const growEase = 'cubic-bezier(.65,0,.25,1)'

// Intro logo geometry (artwork: emblem 900×518 above wordmark 900×170)
const LOGO_W = 300
const LOGO_SCALE = 1.05
const EMBLEM_H = (LOGO_W * 518) / 900
const COMPOSITE_H = (LOGO_W * (518 + 170)) / 900
const EMBLEM_CENTER_Y = EMBLEM_H / 2 - COMPOSITE_H / 2
const LOGO_TOP = 0.47
const BG_TOP = 0.42
const BG_HEIGHT = 0.7

type Mode = 'signin' | 'signup' | 'check-email'

/**
 * 1. Ivory: the full logo zooms out from a gold portal.
 * 2. The screen turns navy while the emblem grows, from the same spot, into a large background.
 * 3. On the navy the emblem's fine lines begin to orbit, and the sign-in rises in.
 * Signed-in members skip straight to their home.
 */
export default function Intro() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { session, profile, loading } = useAuth()
  const rootRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 390, h: 844 })
  const [phase, setPhase] = useState<'intro' | 'grow' | 'spin'>('intro')
  const [run, setRun] = useState(0)
  const startRole = (['Seeker', 'Container', 'Facilitator'] as Role[]).find((r) => r === params.get('role')) ?? 'Seeker'
  const [role, setRole] = useState<Role>(startRole)
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [providers, setProviders] = useState({ google: false })
  useEffect(() => { enabledProviders().then(setProviders) }, [])

  // Already signed in: go home (or finish setting up)
  useEffect(() => {
    if (loading || !session || !profile) return
    navigate(profile.onboarded ? HOME[profile.role] : '/welcome', { replace: true })
  }, [loading, session, profile, navigate])

  useLayoutEffect(() => {
    const measure = () => { const r = rootRef.current; if (r) setSize({ w: r.clientWidth, h: r.clientHeight }) }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    setPhase('intro')
    const t1 = window.setTimeout(() => setPhase('grow'), INTRO_MS)
    const t2 = window.setTimeout(() => setPhase('spin'), INTRO_MS + GROW_MS)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
  }, [run])

  const login = phase !== 'intro'
  const join = JOIN[role]
  const origin = window.location.origin

  const targetW = (size.h * BG_HEIGHT * 900) / 518
  const growScale = targetW / (LOGO_W * LOGO_SCALE)
  const growY = ((BG_TOP - LOGO_TOP) * size.h - EMBLEM_CENTER_Y * LOGO_SCALE) / LOGO_SCALE

  const rise = (i: number) => ({
    opacity: login ? 1 : 0,
    transform: login ? 'none' : 'translateY(14px)',
    transition: `opacity .9s ease ${0.9 + i * 0.07}s, transform .9s ${ease} ${0.9 + i * 0.07}s`,
  })

  const submit = async () => {
    setError(''); setInfo('')
    if (!email.trim() || !password) { setError('Please enter your email and a password.'); return }
    setBusy(true)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setError(friendlyError(error.message))
      // on success the auth listener loads the profile and the effect above takes them home
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { role: toDbRole(role) }, emailRedirectTo: `${origin}/auth/callback` },
      })
      if (error) setError(friendlyError(error.message))
      else if (!data.session) setMode('check-email')
      // with a session, the effect above takes them to /welcome
    }
    setBusy(false)
  }

  const oauth = async (provider: 'google') => {
    setError(''); setInfo('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider, options: { redirectTo: `${origin}/auth/callback?role=${toDbRole(role)}` },
    })
    if (error) setError(friendlyError(error.message))
  }

  const forgot = async () => {
    setError(''); setInfo('')
    if (!email.trim()) { setError('Type your email above first, then tap Forgot?'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin}/reset-password` })
    if (error) setError(friendlyError(error.message))
    else setInfo('Check your email for a link to set a new password.')
  }

  const resend = async () => {
    setError(''); setInfo('')
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: `${origin}/auth/callback` } })
    if (error) setError(friendlyError(error.message))
    else setInfo('Sent again. It can take a minute to arrive.')
  }

  const signup = mode === 'signup'

  return (
    <div ref={rootRef} className="relative h-full overflow-hidden bg-navy">
      {/* Ivory ground: fades away to the navy underneath */}
      <div aria-hidden className="absolute inset-0 bg-ivory" style={{ opacity: login ? 0 : 1, transition: `opacity ${GROW_MS}ms ease` }}>
        <span key={`r1-${run}`} className="absolute top-[47%] left-1/2 h-[260px] w-[260px] rounded-full border border-gold/55" style={{ animation: 'xa-ring 2.4s ease-out .4s both' }} />
        <span key={`r2-${run}`} className="absolute top-[47%] left-1/2 h-[260px] w-[260px] rounded-full border border-gold/35" style={{ animation: 'xa-ring 2.4s ease-out .9s both' }} />
      </div>

      {/* The logo: zooms out on ivory, then its emblem grows into the background and starts to orbit */}
      <div key={`logo-${run}`} aria-hidden className="pointer-events-none absolute left-1/2"
        style={{ top: `${LOGO_TOP * 100}%`, width: LOGO_W, transform: `translate(-50%,-50%) scale(${LOGO_SCALE})`, animation: `xa-zoom 2s ${ease} both` }}>
        <div style={{
          transformOrigin: '50% 50%',
          transform: login ? `translateY(${growY}px) scale(${growScale})` : 'none',
          opacity: login ? 0.6 : 1,
          filter: login ? 'brightness(1.15) saturate(.8)' : 'none',
          transition: `transform ${GROW_MS}ms ${growEase}, opacity ${GROW_MS}ms ease, filter ${GROW_MS}ms ease`,
        }}>
          <Logo emblemOnly animated={phase === 'spin'} />
        </div>
        <img src="/logo-wordmark.png" alt="" draggable={false} className="block w-full select-none"
          style={{ opacity: login ? 0 : 1, transition: 'opacity .6s ease' }} />
      </div>

      {/* soft shade so the form stays easy to read over the emblem */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ opacity: login ? 1 : 0, transition: `opacity ${GROW_MS}ms ease`, background: 'linear-gradient(to bottom, rgba(16,27,44,0) 38%, rgba(16,27,44,.42) 62%, rgba(16,27,44,.78) 100%)' }} />

      {/* ---------- Sign-in / sign-up ---------- */}
      <form
        onSubmit={(e) => { e.preventDefault(); submit() }}
        aria-hidden={!login}
        className="relative flex h-full flex-col overflow-y-auto px-[22px] pt-[max(56px,calc(env(safe-area-inset-top)+28px))] pb-[max(26px,env(safe-area-inset-bottom))]"
        style={{ pointerEvents: login ? 'auto' : 'none' }}
      >
        <img src="/logo-wordmark-clean.png" alt="Xanadu — a network for awakening places"
          className="mx-auto block w-[270px] max-w-full select-none"
          style={{ filter: 'brightness(0) invert(1) sepia(.18) brightness(.97)', ...rise(0) }} />

        <div className="min-h-8 flex-1" />

        {mode === 'check-email' ? (
          <div className="flex flex-col gap-3 rounded-[22px] bg-navy/80 p-5 backdrop-blur-sm" style={rise(1)}>
            <h1 className="m-0 font-display text-[30px] leading-[1.05] font-medium text-ink">Check your email</h1>
            <p className="m-0 text-[15px] leading-relaxed text-muted">{`We sent a link to ${email.trim()}. Tap it to confirm your account, and you'll come right back here to set up your profile.`}</p>
            {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
            {info && <p role="status" className="m-0 text-[13px] text-calm-text">{info}</p>}
            <button type="button" onClick={resend} className="min-h-12 rounded-2xl border border-line-2 text-sm text-text">Send the link again</button>
            <button type="button" onClick={() => { setMode('signin'); setInfo(''); setError('') }} className="min-h-10 text-sm text-gold-soft">Back to sign in</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1" style={rise(1)}>
              <h1 className="m-0 font-display text-[32px] leading-[1.05] font-medium text-ink">
                {signup ? <>Join <em className="text-gold-soft">Xanadu</em></> : <>Xanadu begins <em className="text-gold-soft">with you.</em></>}
              </h1>
              <span className="text-sm text-subtle">{signup ? 'I am joining as' : 'Sign in as'}</span>
            </div>

            <div role="radiogroup" aria-label={signup ? 'Joining as' : 'Sign in as'} className="grid grid-cols-3 gap-1.5 rounded-2xl bg-surface/85 p-1 backdrop-blur-sm" style={rise(2)}>
              {ROLES.map(({ role: r, sub }) => (
                <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)}
                  className={`flex min-h-12 flex-col items-center justify-center rounded-xl transition-colors ${role === r ? 'bg-gold text-navy' : 'text-muted'}`}>
                  <span className="text-sm font-semibold">{r}</span>
                  <span className="text-[11px] opacity-80">{sub}</span>
                </button>
              ))}
            </div>

            <div style={rise(3)}><Field label="Email"><input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field></div>
            <div style={rise(4)}>
              <Field label={<span className="flex justify-between">{signup ? 'Create a password' : 'Password'}{!signup && <button type="button" onClick={forgot} className="text-gold-soft">Forgot?</button>}</span>}>
                <input type="password" required minLength={6} autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
              </Field>
            </div>

            {error && <p role="alert" className="m-0 rounded-xl bg-plum/90 px-3.5 py-2.5 text-[13px] text-gold-pale">{error}</p>}
            {info && <p role="status" className="m-0 rounded-xl bg-surface/90 px-3.5 py-2.5 text-[13px] text-calm-text">{info}</p>}

            <button type="submit" disabled={busy} style={rise(5)} className="mt-1 min-h-[54px] flex-none rounded-2xl bg-gold text-base font-semibold text-navy hover:bg-gold-soft disabled:opacity-70">
              {busy ? 'One moment…' : signup ? `Create account as ${role}` : `Sign in as ${role}`}
            </button>

            {providers.google && (
              <>
                <div className="flex items-center gap-2.5 text-xs text-faint" style={rise(6)}><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
                <div className="grid grid-cols-1 gap-2" style={rise(6)}>
                  <button type="button" onClick={() => oauth('google')} className="min-h-12 rounded-[14px] border border-line-2 bg-navy/60 text-sm text-text">Continue with Google</button>
                </div>
              </>
            )}

            <p className="m-0 flex flex-wrap justify-center gap-x-1.5 pt-1 text-[13px] text-subtle" style={rise(7)}>
              {signup
                ? <><span>Already a member?</span><button type="button" onClick={() => { setMode('signin'); setError(''); setInfo('') }} className="font-semibold text-gold-soft">Sign in</button></>
                : <><span>{join.lead}</span><button type="button" onClick={() => { setMode('signup'); setError(''); setInfo('') }} className="font-semibold text-gold-soft">{join.label}</button></>}
            </p>
            <button type="button" onClick={() => setRun((n) => n + 1)} style={rise(7)} className="min-h-7 self-center text-xs text-[#6B7790]">Replay intro</button>
            <p className="m-0 text-center text-[11px] text-[#6B7790]" style={rise(7)}>By continuing you agree to our <a href="/terms" className="text-[#8A95AB]">Terms</a> and <a href="/privacy" className="text-[#8A95AB]">Privacy Policy</a>.</p>
          </div>
        )}
      </form>
    </div>
  )
}
