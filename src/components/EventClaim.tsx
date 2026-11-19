import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth'

type Kind = 'claim' | 'remove'

/**
 * "Shared from the community · Is this yours?" on events the team gathered from public posts.
 * Claiming needs an approved Facilitator or Container: anyone else is invited to apply, and the claim waits
 * for the team, who link the event to them once they're approved. Asking for removal only needs an account.
 */
export default function EventClaim({ eventId, title }: { eventId: string; title: string }) {
  const { session } = useAuth()
  const [open, setOpen] = useState<Kind | null>(null)
  const [sent, setSent] = useState<Kind[]>([])

  useEffect(() => {
    if (!session) return
    let live = true
    supabase.rpc('my_event_claims', { p_event: eventId }).then(({ data }) => {
      if (live && data) setSent((data as { kind: Kind; status: string }[]).filter((c) => c.status === 'open').map((c) => c.kind))
    })
    return () => { live = false }
  }, [eventId, session])

  return (
    <>
      <div className="flex flex-col gap-2 rounded-xl ring-rainbow px-3.5 py-3 text-[13px] leading-normal text-subtle">
        <p className="m-0"><span className="text-text">Shared from the community.</span> Not verified by Xanadu: check the details with the organizer before you go.</p>
        {sent.length ? (
          <p className="m-0 text-iri-teal">{sent.includes('remove') ? 'We have your request to remove it.' : 'We have your claim. The team will be in touch.'}</p>
        ) : (
          <p className="m-0">
            Is this yours?{' '}
            <button type="button" onClick={() => setOpen('claim')} className="text-gold-pale underline underline-offset-2">Claim it</button>
            {' or '}
            <button type="button" onClick={() => setOpen('remove')} className="text-gold-pale underline underline-offset-2">ask us to remove it</button>.
          </p>
        )}
      </div>
      {open && <ClaimSheet kind={open} eventId={eventId} title={title} onClose={() => setOpen(null)} onDone={(k) => { setSent((s) => [...s, k]); setOpen(null) }} />}
    </>
  )
}

function ClaimSheet({ kind, eventId, title, onClose, onDone }: { kind: Kind; eventId: string; title: string; onClose: () => void; onDone: (k: Kind) => void }) {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const approved = profile?.facilitator_status === 'approved' || profile?.container_status === 'approved'
  const applying = profile?.facilitator_status === 'pending' || profile?.container_status === 'pending'
  const needsApply = kind === 'claim' && !approved

  const send = async () => {
    setBusy('send'); setError('')
    const { error: err } = await supabase.rpc('request_event_claim', { p_event: eventId, p_kind: kind, p_note: note.trim() })
    setBusy('')
    if (err) setError('That didn’t go through. Please try again.'); else onDone(kind)
  }

  // record the claim, then start their application; the team links the event once they're approved
  const apply = async (r: 'facilitator' | 'container') => {
    setBusy(r); setError('')
    const claim = await supabase.rpc('request_event_claim', { p_event: eventId, p_kind: 'claim', p_note: note.trim() })
    if (claim.error) { setBusy(''); setError('That didn’t go through. Please try again.'); return }
    const { data, error: err } = await supabase.rpc('add_role', { p_role: r })
    if (err) { setBusy(''); setError('Your claim is saved, but we couldn’t start the application. Try again from your profile.'); return }
    await refreshProfile()
    navigate(data === 'setup' ? '/welcome' : '/apply/status', { replace: true })
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={kind === 'claim' ? 'Claim this event' : 'Ask us to remove this event'}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-deep/75" />
      <div className="xa-page relative flex max-h-[90%] w-full flex-col gap-4 overflow-y-auto rounded-t-[26px] border-t border-line bg-navy px-5 pt-5 pb-safe sm:max-w-[430px]">
        <div className="mx-auto h-1 w-10 rounded-full bg-line-2" aria-hidden />
        <div className="flex flex-col gap-1">
          <h2 className="m-0 font-display text-[26px] font-medium text-ink">{kind === 'claim' ? 'Claim your event' : 'Remove this event'}</h2>
          <p className="m-0 text-[14px] leading-normal text-muted">{title}</p>
        </div>

        {kind === 'remove' && <p className="m-0 text-[14px] leading-normal text-muted">If this is your event and you’d rather it wasn’t on Xanadu, tell us and the team will take it down.</p>}
        {kind === 'claim' && approved && <p className="m-0 text-[14px] leading-normal text-muted">Once the team confirms it’s yours, the event is linked to your profile with the Trusted badge, you can update it, and you’ll hear when people are interested.</p>}
        {needsApply && (
          <div className="flex flex-col gap-2 text-[14px] leading-normal text-muted">
            <p className="m-0">Events on Xanadu are claimed by verified Facilitators and Containers. {applying ? 'Your application is in review: send your claim now and we’ll link the event to you once you’re approved.' : 'Apply in a few minutes, and once you’re approved your event is linked to you with:'}</p>
            {!applying && (
              <ul className="m-0 flex list-none flex-col gap-1 p-0 text-text">
                <li>✦ The Trusted badge, shown above community events</li>
                <li>✦ Alerts when people are interested or going</li>
                <li>✦ Your own events, Sessions and retreats, with help promoting them</li>
              </ul>
            )}
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">{kind === 'claim' ? 'How we can confirm it’s yours (optional)' : 'Anything we should know? (optional)'}</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={600}
            placeholder={kind === 'claim' ? 'e.g. I’m the teacher, my WhatsApp is on the flyer' : ''}
            className="rounded-xl border border-line bg-surface-2 p-3 text-[15px] text-text outline-none focus:border-gold" />
        </label>

        {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
        <div className="flex flex-col gap-2 pb-4">
          {needsApply && !applying ? (
            <>
              <button type="button" disabled={!!busy} onClick={() => apply('facilitator')} className="min-h-[52px] rounded-2xl bg-iri text-[15px] font-semibold text-navy disabled:opacity-60">{busy === 'facilitator' ? 'One moment…' : 'Apply as a Facilitator'}</button>
              <button type="button" disabled={!!busy} onClick={() => apply('container')} className="min-h-[52px] rounded-2xl border border-line-2 text-[15px] text-text disabled:opacity-60">{busy === 'container' ? 'One moment…' : 'Apply as a Container (a space)'}</button>
            </>
          ) : (
            <button type="button" disabled={!!busy} onClick={send} className="min-h-[52px] rounded-2xl bg-iri text-[15px] font-semibold text-navy disabled:opacity-60">
              {busy ? 'Sending…' : kind === 'claim' ? 'Send my claim' : 'Ask to remove it'}</button>
          )}
          <button type="button" onClick={onClose} className="min-h-11 text-[14px] text-subtle">Not now</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
