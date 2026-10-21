import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ApplicantTabs, Glow, Screen, SeekerTabs } from '../../components/ui'
import { SignOutButton } from '../../components/edit'
import { markDeclineSeen } from '../../components/ApplicationBanner'
import { CONTACT_EMAIL } from '../../data'
import { HOME, Loading, hostState, useAuth, type Profile } from '../../auth'
import { supabase } from '../../lib/supabase'

type HostRole = 'container' | 'facilitator'
const LABEL: Record<HostRole, string> = { container: 'Container', facilitator: 'Facilitator' }

/** Which application this page is about: the one asked for, the side they're on, or the one with news. */
function pickRole(p: Profile, asked: string | null): HostRole | null {
  if (asked === 'container' || asked === 'facilitator') return asked
  if (p.role !== 'seeker') return p.role
  const order: HostRole[] = ['container', 'facilitator']
  return order.find((r) => hostState(p, r).note) ?? order.find((r) => hostState(p, r).status === 'pending') ?? order.find((r) => hostState(p, r).status) ?? null
}

const STEPS = [
  { title: 'Application received', body: 'Thank you for sharing your work with us.' },
  { title: 'Personal review', body: 'We read every application by hand, with your reviews and references.' },
  { title: 'Intro call', body: 'A short conversation, so we can meet you and your work.' },
  { title: 'Welcome to Xanadu', body: 'You’re verified ✦ and your side of Xanadu opens.' },
]

function Timeline({ at }: { at: number }) {
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {STEPS.map((s, i) => {
        const done = i < at, now = i === at, last = i === STEPS.length - 1
        return (
          <li key={s.title} className="flex gap-3.5">
            <div className="flex w-7 flex-none flex-col items-center">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold ${done ? 'bg-iri text-navy' : now ? 'border-[1.5px] border-gold text-gold-pale' : 'border-[1.5px] border-line-2 text-subtle'}`}>{done ? '✓' : i + 1}</span>
              <span className={`my-1 w-[1.5px] flex-1 ${last ? 'bg-transparent' : done ? 'bg-iri' : 'bg-line'}`} />
            </div>
            <div className="flex flex-col gap-1 pb-[22px]">
              <span className={`text-[15px] font-semibold ${done || now ? 'text-ink' : 'text-subtle'}`}>{s.title}</span>
              <span className="text-[13px] leading-normal text-subtle">{s.body}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const primary = 'flex min-h-[54px] w-full items-center justify-center rounded-2xl bg-iri text-[15px] font-semibold text-navy no-underline hover:text-navy disabled:opacity-70'
const secondary = 'flex min-h-[54px] w-full items-center justify-center rounded-2xl border border-line-2 text-[15px] text-text no-underline'

/**
 * /apply/status: where a Container or Facilitator application stands. Containers and Facilitators wait on the
 * Seeker side; their hosting side opens only once the Xanadu team has personally reviewed and approved them.
 */
export default function Status() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const role = profile ? pickRole(profile, params.get('role')) : null
  const state = profile && role ? hostState(profile, role) : null
  const declined = state?.status === 'declined'

  // a decision is shown on the Discover card until it has been read here once
  useEffect(() => { if (profile && role && declined) markDeclineSeen(profile.id, role) }, [profile, role, declined])

  if (!profile) return <Loading />
  if (!role || !state?.status) return <Navigate to={HOME[profile.role]} replace />

  // Explore as a Seeker: move to the Seeker side if they're still on an unapproved hosting side
  const explore = async () => {
    if (profile.role !== 'seeker') {
      setBusy(true)
      await supabase.rpc('switch_role', { p_role: 'seeker' })
      await refreshProfile()
    }
    navigate('/discover', { replace: true })
  }

  const label = LABEL[role]
  const sent = params.has('sent'), updated = params.has('updated')
  const onSeeker = profile.role === 'seeker'
  const footer = onSeeker ? <SeekerTabs /> : <ApplicantTabs />

  let kicker: string, title: ReactNode, lede: string, body: ReactNode, actions: ReactNode
  if (state.status === 'approved') {
    kicker = `Founding ${label}`; title = <>You’re <Glow>verified</Glow> ✦</>
    lede = 'You’ve been personally reviewed and welcomed into Xanadu.'
    body = null
    actions = <button type="button" className={primary} onClick={async () => { setBusy(true); await supabase.rpc('switch_role', { p_role: role }); await refreshProfile(); navigate(HOME[role], { replace: true }) }}>{role === 'container' ? 'Enter your space' : 'Open your Facilitator side'}</button>
  } else if (declined) {
    kicker = `${label} application`; title = 'Thank you for applying'
    lede = `At the moment, we find you don’t yet match the qualifications to be Xanadu verified as a ${label}.`
    body = (
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-muted">
        <p className="m-0">You’re warmly welcome to keep exploring Xanadu as a Seeker: connect with the community and grow your practice.</p>
        <p className="m-0">If you still wish to host, you can apply again at a later date from You → Your roles.</p>
      </div>
    )
    actions = (
      <>
        <button type="button" className={primary} disabled={busy} onClick={explore}>Keep exploring</button>
        <a href={`mailto:${CONTACT_EMAIL}`} className={secondary}>Write to us</a>
      </>
    )
  } else if (state.note) {
    kicker = `${label} application`; title = <>One small thing <Glow>before we welcome you</Glow></>
    lede = 'The Xanadu team has looked through your application and left you a note.'
    body = (
      <div className="ring-iri flex flex-col gap-1.5 rounded-2xl bg-plum/50 px-4 py-4">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-gold-soft uppercase">A note from the Xanadu team</span>
        <p className="selectable m-0 text-[15px] leading-relaxed whitespace-pre-line text-text">{state.note}</p>
      </div>
    )
    actions = (
      <>
        <Link to={`/apply/update?role=${role}`} className={primary}>Update my application</Link>
        <Link to="/messages/team" className={secondary}>Message the Xanadu team</Link>
      </>
    )
  } else {
    kicker = updated ? 'Update received' : sent ? 'Application received' : `${label} application · In review`
    title = updated ? <>Thank you. <Glow>We’ll take another look.</Glow></> : sent ? <>Your application is <Glow>with us</Glow> ✦</> : <>We’re <Glow>reviewing</Glow> your application</>
    lede = 'Every space and guide on Xanadu is personally reviewed before joining. We’ll email you as soon as you’re welcomed in. Most reviews take a few days.'
    body = (
      <>
        <Timeline at={1} />
        <p className="m-0 rounded-xl bg-plum px-3.5 py-3 text-[13px] leading-normal text-muted">
          While we review, explore Xanadu as a Seeker: see the places, guides and people you’ll be part of. Your {label} side opens once you’re verified.
        </p>
      </>
    )
    actions = (
      <>
        <button type="button" className={primary} disabled={busy} onClick={explore}>Explore Xanadu as a Seeker</button>
        <Link to="/messages/team" className={secondary}>Message the Xanadu team</Link>
      </>
    )
  }

  return (
    <Screen footer={footer}>
      <div className="flex flex-col gap-6 px-5 pt-safe pb-8">
        {onSeeker && <Link to="/discover" className="-ml-1 self-start text-[14px] text-subtle no-underline">‹ Discover</Link>}
        <img src="/logo-emblem-light.png" alt="" className="mt-2 w-24 self-center opacity-90" />
        <div className="flex flex-col gap-2 text-center">
          <span className="text-xs tracking-[0.2em] text-gold-soft uppercase">{kicker}</span>
          <h1 className="m-0 font-display text-[34px] leading-[1.08] font-medium text-ink">{title}</h1>
          <p className="m-0 text-[15px] leading-relaxed text-muted">{lede}</p>
        </div>
        {body}
        <div className="flex flex-col gap-2.5">{actions}</div>
        <p className="m-0 text-center text-[12px] leading-normal text-faint">We use AI to help review applications; a person makes every decision.</p>
        {!onSeeker && <SignOutButton />}
      </div>
    </Screen>
  )
}
