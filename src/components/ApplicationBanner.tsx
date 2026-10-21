import { Link } from 'react-router-dom'
import { hostState, useAuth, type Profile } from '../auth'

type HostRole = 'container' | 'facilitator'
const LABEL: Record<HostRole, string> = { container: 'Container', facilitator: 'Facilitator' }

// a decline is shown once on the card; after it has been read on the application page the card goes away
const seenKey = (uid: string, r: HostRole) => `xanadu_decline_seen_${r}_${uid}`
export const markDeclineSeen = (uid: string, r: HostRole) => { try { localStorage.setItem(seenKey(uid, r), '1') } catch { /* private mode */ } }
const declineSeen = (uid: string, r: HostRole) => { try { return localStorage.getItem(seenKey(uid, r)) === '1' } catch { return false } }

/** The hosting applications this member should hear about right now: in review, a note from the team, or a fresh decision. */
type Open = { role: HostRole; kind: 'review' | 'changes' | 'declined' }
export function openApplications(p: Profile): Open[] {
  return (['container', 'facilitator'] as const).flatMap((r): Open[] => {
    const { status, note } = hostState(p, r)
    if (status === 'pending') return [{ role: r, kind: note ? 'changes' : 'review' }]
    if (status === 'declined' && !declineSeen(p.id, r)) return [{ role: r, kind: 'declined' }]
    return []
  })
}

/**
 * A quiet card at the top of Discover (and host homes) while a Container or Facilitator application is open.
 * It turns gold when the team leaves a note, and shows a decision once. Tapping it opens the application page.
 */
export default function ApplicationBanner() {
  const { profile } = useAuth()
  if (!profile) return null
  const open = openApplications(profile).filter((a) => a.role !== profile.role)
  if (!open.length) return null
  return (
    <div className="flex flex-col gap-2.5">
      {open.map(({ role, kind }) => {
        const [title, sub] = kind === 'changes'
          ? ['The Xanadu team left you a note', `About your ${LABEL[role]} application. Tap to see what to update.`]
          : kind === 'declined'
            ? ['An update on your application', `About your ${LABEL[role]} application.`]
            : [`Your ${LABEL[role]} application · In review`, 'We’ll let you know as soon as you’re welcomed in.']
        return (
          <Link key={role} to={`/apply/status?role=${role}`}
            className={`flex items-center justify-between gap-3 rounded-[18px] p-4 text-text no-underline ${kind === 'changes' ? 'border border-gold bg-gold/10' : 'ring-iri bg-plum/60'}`}>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[15px] font-semibold text-ink">{title}</span>
              <span className="text-[13px] leading-snug text-subtle">{sub}</span>
            </span>
            <span className={kind === 'changes' ? 'text-gold-pale' : 'text-gold-soft'} aria-hidden>›</span>
          </Link>
        )
      })}
    </div>
  )
}
