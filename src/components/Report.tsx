import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../auth'
import { blockMember } from '../community'
import { reportMember } from '../threads'

const REASONS = ['Inappropriate or unsafe', 'Harassment or unwanted contact', 'Scam or misleading', 'Not who they say they are', 'Something else'] as const

/**
 * Report a Seeker, Container or Facilitator from anywhere they appear.
 * Only the Xanadu team sees reports. Blocking is optional and immediate.
 */
export function ReportSheet({ memberId, name, context, contextId, onClose, onDone }: {
  memberId: string; name: string; context: 'community' | 'message' | 'space' | 'offering' | 'profile' | 'community_event'; contextId?: string | null
  onClose: () => void; onDone: (blocked: boolean) => void
}) {
  const { session } = useAuth()
  const [why, setWhy] = useState<string>('')
  const [details, setDetails] = useState('')
  const [block, setBlock] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const who = name.trim() || 'this member'

  const send = async () => {
    if (!session) return
    if (!why) { setError('Choose what happened.'); return }
    setBusy(true); setError('')
    const reason = details.trim() ? `${why}: ${details.trim()}` : why
    const err = await reportMember(session.user.id, memberId, reason, context, contextId)
    const err2 = !err && block ? await blockMember(session.user.id, memberId) : null
    setBusy(false)
    if (err || err2) setError(err || err2 || ''); else onDone(block)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={`Report ${who}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-deep/75" />
      <div className="xa-page relative flex max-h-[90%] w-full flex-col gap-4 overflow-y-auto rounded-t-[26px] border-t border-line bg-navy px-5 pt-5 pb-safe sm:max-w-[430px]">
        <div className="mx-auto h-1 w-10 rounded-full bg-line-2" aria-hidden />
        <div className="flex flex-col gap-1">
          <h2 className="m-0 font-display text-[26px] font-medium text-ink">{`Report ${who}`}</h2>
          <p className="m-0 text-[13px] leading-normal text-muted">Only the Xanadu team sees this. They won’t be told who reported them.</p>
        </div>
        <div className="flex flex-col gap-2">
          {REASONS.map((r) => (
            <button key={r} type="button" aria-pressed={why === r} onClick={() => setWhy(r)}
              className={`min-h-12 rounded-2xl border px-4 text-left text-[15px] ${why === r ? 'ring-iri border-transparent bg-iri-violet/14 text-ink' : 'border-line-2 text-text'}`}>{r}</button>
          ))}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Anything else we should know? (optional)</span>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={1800}
            className="rounded-xl border border-line bg-surface-2 p-3 text-[15px] text-text outline-none focus:border-gold" />
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-surface p-3.5 text-[14px] leading-normal text-text">
          <input type="checkbox" checked={block} onChange={(e) => setBlock(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-[#B89567]" />
          <span>{`Also block ${who}. You won’t be able to message each other, and you’ll stop seeing each other in Community.`}</span>
        </label>
        {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
        <div className="flex gap-2.5 pb-2">
          <button type="button" onClick={onClose} className="min-h-[52px] rounded-2xl border border-line-2 px-5 text-[15px] text-text">Cancel</button>
          <button type="button" onClick={send} disabled={busy} className="min-h-[52px] flex-1 rounded-2xl bg-iri text-[15px] font-semibold text-navy disabled:opacity-70">{busy ? 'Sending…' : 'Send report'}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
