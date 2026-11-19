import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { rememberReturn } from '../auth'
import { useGoingCounts } from '../events'

/**
 * Visitors without an account can browse the Calendar and open events. Everything else (who's going,
 * "I'm going", Sessions, messages, community) asks them to join, at the moment they reach for it.
 */

const VIEWS = 'xa_guest_views'
const SHOWN = 'xa_guest_invite_at'
const WEEK = 7 * 24 * 3600 * 1000
const read = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } }

/** Go to sign-up or sign-in, coming back to this page afterwards. */
export function useJoinLinks() {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const go = (mode: 'signup' | 'signin', role?: 'Facilitator' | 'Container') => {
    rememberReturn(pathname + search)
    navigate(`/?mode=${mode}${role ? `&role=${role}` : ''}`)
  }
  return go
}

/** The sheet a visitor sees when they tap something that needs an account. */
export function JoinSheet({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  const go = useJoinLinks()
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-deep/75" />
      <div className="xa-page relative flex w-full flex-col gap-4 rounded-t-[26px] border-t border-line bg-navy px-5 pt-5 pb-safe sm:max-w-[430px]">
        <div className="mx-auto h-1 w-10 rounded-full bg-line-2" aria-hidden />
        <div className="flex flex-col gap-1.5">
          <h2 className="m-0 font-display text-[28px] leading-tight font-medium text-ink">{title}</h2>
          <p className="m-0 text-[14px] leading-normal text-muted">{body}</p>
        </div>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[14px] text-text">
          <li>✦ See who’s going, and say you’re going</li>
          <li>✦ Picked for you, from your way of living</li>
          <li>✦ Sessions: bodywork, guidance, private chefs and more</li>
          <li>✦ Connect and message the community</li>
        </ul>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => go('signup')} className="min-h-[52px] rounded-2xl bg-iri text-[15px] font-semibold text-navy">Join free as a seeker</button>
          <button type="button" onClick={() => go('signin')} className="min-h-12 rounded-2xl border border-line-2 text-[15px] text-text">I have an account</button>
        </div>
        <p className="m-0 pb-4 text-center text-[13px] leading-normal text-subtle">
          Host events or offer sessions?{' '}
          <button type="button" onClick={() => go('signup', 'Facilitator')} className="text-gold-pale underline underline-offset-2">Apply as a Facilitator</button>
          {' or '}
          <button type="button" onClick={() => go('signup', 'Container')} className="text-gold-pale underline underline-offset-2">a Container</button>
        </p>
      </div>
    </div>,
    document.body,
  )
}

/** Bottom bar for visitors: where they are, and the way in. */
export function GuestBar() {
  const go = useJoinLinks()
  return (
    <nav aria-label="Join Xanadu" className="flex items-center justify-between gap-3 border-t border-line bg-navy/95 px-5 pt-3 pb-safe backdrop-blur">
      <span className="pb-3 text-[13px] leading-snug text-subtle">Nosara’s trusted calendar.<br />Join free for the full Xanadu.</span>
      <div className="flex gap-2 pb-3">
        <button type="button" onClick={() => go('signin')} className="min-h-11 rounded-full px-3.5 text-[14px] text-text">Sign in</button>
        <button type="button" onClick={() => go('signup')} className="min-h-11 rounded-full bg-iri px-4 text-[14px] font-semibold text-navy">Join free</button>
      </div>
    </nav>
  )
}

/** "Who's going" for visitors: the number only; names and faces are for members. */
export function GuestGoing({ eventId, over }: { eventId: string; over: boolean }) {
  const counts = useGoingCounts([eventId])
  const [open, setOpen] = useState(false)
  const going = counts[eventId] ?? 0
  return (
    <section className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-display text-[22px] leading-tight text-ink">{over ? 'Who went' : 'Who’s going'}</span>
        <span className="text-[13px] text-subtle">{going ? `${going} ${going === 1 ? 'member' : 'members'} ${over ? 'went' : 'going'}` : over ? 'No one marked this one.' : 'Be the first from Xanadu to say you’re going.'}</span>
      </div>
      {!over && <button type="button" onClick={() => setOpen(true)} className="min-h-12 rounded-2xl bg-iri text-[15px] font-semibold text-navy">I’m going</button>}
      <button type="button" onClick={() => setOpen(true)} className="min-h-10 text-[13px] text-gold-pale underline-offset-2 hover:underline">See who’s going</button>
      {open && <JoinSheet title="Join free to see who’s going" body="Say you’re going, see who else will be there, and find your people in Nosara." onClose={() => setOpen(false)} />}
    </section>
  )
}

/**
 * A gentle invitation once a visitor has looked at a few events: at most once a week.
 * Call with countView on event pages so the views add up.
 */
export function GuestInvite({ countView = false }: { countView?: boolean }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const views = Number(read(VIEWS) ?? '0') + (countView ? 1 : 0)
    if (countView) write(VIEWS, String(views))
    const last = Number(read(SHOWN) ?? '0')
    if (views >= 3 && Date.now() - last > WEEK) {
      const t = setTimeout(() => { setOpen(true); write(SHOWN, String(Date.now())) }, 4000)
      return () => clearTimeout(t)
    }
  }, [countView])
  if (!open) return null
  return <JoinSheet title="Make Xanadu yours" body="You’ve been exploring. Join free and Xanadu will pick the gatherings that fit your way of living, and connect you with the people behind them." onClose={() => setOpen(false)} />
}

/** For links that need an account (e.g. Sessions): visitors get the join sheet instead. */
export function MembersLink({ to, className, children, title, body }: { to: string; className?: string; children: React.ReactNode; title: string; body: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${className ?? ''} text-left`} data-to={to}>{children}</button>
      {open && <JoinSheet title={title} body={body} onClose={() => setOpen(false)} />}
    </>
  )
}

