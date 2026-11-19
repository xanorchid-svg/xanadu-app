import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HOME, useAuth } from '../auth'
import { friendlyError, supabase } from '../lib/supabase'

type HostRole = 'container' | 'facilitator'

/**
 * An invitation for the people behind the calendar's events to join as founding members.
 * Signed-in members add the role (same as "Your roles" on You); if they've already applied, it shows where that stands.
 * `variant="card"` sits in the calendar list; `variant="line"` is the quieter note at the end of an event page.
 */
export default function FoundingInvite({ variant = 'card' }: { variant?: 'card' | 'line' }) {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState<HostRole | ''>('')
  const [error, setError] = useState('')
  if (!profile) return null

  const status = (r: HostRole) => (r === 'container' ? profile.container_status : profile.facilitator_status)
  const open = (['container', 'facilitator'] as const).filter((r) => !status(r) || status(r) === 'declined')
  // already a founding member (or applied) on both sides: nothing to invite to
  if (!open.length) return null

  const apply = async (r: HostRole) => {
    setBusy(r); setError('')
    const { data, error: err } = await supabase.rpc('add_role', { p_role: r })
    if (err) { setError(friendlyError(err.message)); setBusy(''); return }
    await refreshProfile()
    setBusy('')
    navigate(data === 'setup' ? '/welcome' : data === 'pending' ? '/apply/status' : HOME[r])
  }
  const label: Record<HostRole, string> = { container: 'Apply as a space', facilitator: 'Apply as a Facilitator' }

  if (variant === 'line') {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-line px-4 py-3.5">
        <span className="text-[14px] leading-snug text-muted">Is this your event? Join Xanadu as a founding member, free, and meet the spaces, guides and seekers aligned with your work.</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {open.map((r) => (
            <button key={r} type="button" disabled={!!busy} onClick={() => apply(r)} className="min-h-10 text-left text-[14px] font-semibold text-gold-soft">
              {busy === r ? 'Opening…' : `${label[r]} ›`}
            </button>
          ))}
        </div>
        {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
      </div>
    )
  }

  return (
    <section className="relative flex flex-col gap-3 overflow-hidden rounded-[20px] p-4 ring-iri">
      <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-iri-violet/20 blur-2xl" />
      <span className="text-xs tracking-[0.14em] text-gold-soft uppercase">The founding circle</span>
      <h2 className="m-0 font-display text-[24px] leading-tight font-medium text-ink">Do you hold space or guide others?</h2>
      <p className="m-0 text-[14px] leading-relaxed text-muted">
        Join Xanadu as a founding member. Connect with other facilitators and spaces, and with the seekers aligned with your work. Founding members join free.
      </p>
      <div className="flex flex-col gap-2">
        {open.map((r, i) => (
          <button key={r} type="button" disabled={!!busy} onClick={() => apply(r)}
            className={`flex min-h-12 items-center justify-center rounded-2xl text-[15px] ${i === 0 ? 'bg-iri font-semibold text-navy' : 'border border-line-2 text-text'}`}>
            {busy === r ? 'Opening…' : label[r]}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
    </section>
  )
}
