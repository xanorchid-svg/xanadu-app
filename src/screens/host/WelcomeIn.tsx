import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Glow } from '../../components/ui'
import { HOME, Loading, hostState, useAuth } from '../../auth'
import { supabase } from '../../lib/supabase'

type Step = { title: string; sub: string; to: string }
const WELCOME: Record<'container' | 'facilitator', { kicker: string; lede: string; steps: Step[]; cta: string; ctaTo: string }> = {
  container: {
    kicker: 'Founding Container',
    lede: 'You’ve been personally reviewed and welcomed into Xanadu. Your space is now part of the network, and Seekers aligned with it will start finding you.',
    steps: [
      { title: 'Post your first offering', sub: 'A class, a weekend, a season. It goes live once we’ve looked it over.', to: '/container/new' },
      { title: 'Make your space page shine', sub: 'Photos, Life here and what you welcome. This is what Seekers fall for.', to: '/container/space' },
      { title: 'Meet your Facilitators', sub: 'Verified guides looking for a home for their work can now find you and write to you.', to: '/messages' },
    ],
    cta: 'Enter your space',
    ctaTo: '/container',
  },
  facilitator: {
    kicker: 'Founding Facilitator',
    lede: 'You’ve been personally reviewed and welcomed into Xanadu. Spaces around the world can now find you, and you can find them.',
    steps: [
      { title: 'Find your space', sub: 'Explore verified retreat spaces and write to the ones that fit your work.', to: '/facilitator/spaces' },
      { title: 'Complete your profile', sub: 'Your practice, your training, your photo. Spaces read this first.', to: '/facilitator/profile' },
      { title: 'Find your people', sub: 'Join Community to meet Seekers and Facilitators near you.', to: '/community' },
    ],
    cta: 'Find your space',
    ctaTo: '/facilitator/spaces',
  },
}

/** /welcome-in: shown once, the first time a Container or Facilitator opens Xanadu after being approved. */
export default function WelcomeIn() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  if (!profile) return <Loading />
  if (profile.role === 'seeker' || hostState(profile).status !== 'approved') return <Navigate to={HOME[profile.role]} replace />
  const role = profile.role
  const w = WELCOME[role]

  const go = async (to: string) => {
    setBusy(true)
    await supabase.rpc('mark_welcomed', { p_role: role })
    await refreshProfile()
    navigate(to, { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      <main className="xa-page flex flex-1 flex-col gap-7 overflow-y-auto px-5 pt-safe pb-6">
        <img src="/logo-emblem-light.png" alt="" className="mt-8 w-32 self-center opacity-95" />
        <div className="flex flex-col gap-2.5 text-center">
          <span className="text-xs tracking-[0.2em] text-gold-soft uppercase">{w.kicker}</span>
          <h1 className="m-0 font-display text-[38px] leading-[1.05] font-medium text-ink">Welcome to <span className="whitespace-nowrap"><Glow>Xanadu</Glow> ✦</span></h1>
          <p className="m-0 text-[15px] leading-relaxed text-muted">{w.lede}</p>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-subtle uppercase">Your first steps</span>
          {w.steps.map((s, i) => (
            <button key={s.title} type="button" disabled={busy} onClick={() => go(s.to)}
              className="ring-iri flex items-center gap-3.5 rounded-2xl bg-plum/50 px-4 py-3.5 text-left">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border-[1.5px] border-gold text-[13px] font-semibold text-gold-pale">{i + 1}</span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] font-semibold text-ink">{s.title}</span>
                <span className="text-[13px] leading-snug text-subtle">{s.sub}</span>
              </span>
              <span aria-hidden className="ml-auto text-gold-soft">›</span>
            </button>
          ))}
        </div>
      </main>
      <footer className="border-t border-[#1F2B3E] bg-navy-deep px-5 pt-3.5 pb-safe">
        <button type="button" disabled={busy} onClick={() => go(w.ctaTo)}
          className="min-h-[54px] w-full rounded-2xl bg-iri text-[15px] font-semibold text-navy disabled:opacity-70">{busy ? 'Opening…' : w.cta}</button>
      </footer>
    </div>
  )
}
