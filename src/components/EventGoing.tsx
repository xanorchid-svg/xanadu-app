import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { requestConnection } from '../community'
import { fetchMyReviews, saveReviews, setGoing, useAttendees, type Attendee, type CommunityEvent, type ReviewTarget } from '../events'

const Face = ({ src, name, size = 40 }: { src?: string | null; name: string; size?: number }) => (
  <span className="flex flex-none items-center justify-center overflow-hidden rounded-full bg-plum text-[13px] font-semibold text-gold-pale ring-2 ring-navy" style={{ width: size, height: size }}>
    {src ? <img decoding="async" loading="lazy" src={src} alt="" className="h-full w-full object-cover" /> : (name.trim()[0] ?? '·').toUpperCase()}
  </span>
)

/**
 * On an event page: "I'm going", how many are going, and (for members who share their profile in Community)
 * who's going, with a way to connect. Once the event has happened, those who went are asked how it was.
 */
export default function EventGoing({ e }: { e: CommunityEvent }) {
  const { session, profile } = useAuth()
  const { attendees, reload } = useAttendees(e.id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [reviewed, setReviewed] = useState(false)
  const today = new Date(); const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const started = !!e.start_date && e.start_date <= todayIso
  const over = !!e.start_date && (e.end_date || e.start_date) < todayIso
  const isSeeker = profile?.role === 'seeker'

  useEffect(() => { if (attendees?.me && started) fetchMyReviews(e.id).then((r) => setReviewed(r.length > 0)) }, [attendees?.me, started, e.id])
  if (!attendees || !session) return null
  const { going, me, visible, people } = attendees
  const others = going - (me ? 1 : 0) - people.length

  const toggle = async () => {
    setBusy(true); setError('')
    const err = await setGoing(session.user.id, e.id, !me)
    if (err) setError(err)
    await reload()
    setBusy(false)
  }

  return (
    <section className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-display text-[22px] leading-tight text-ink">{over ? 'Who went' : 'Who’s going'}</span>
          <span className="text-[13px] text-subtle">{going ? `${going} ${going === 1 ? 'member' : 'members'} ${over ? 'went' : 'going'}${me ? ', including you' : ''}` : over ? 'No one marked this one.' : 'Be the first from Xanadu to say you’re going.'}</span>
        </div>
        {going > 0 && (
          <div className="flex -space-x-2.5">
            {people.slice(0, 4).map((p) => <Face key={p.id} src={p.photo_url} name={p.name} size={34} />)}
          </div>
        )}
      </div>

      {isSeeker && !over && (
        <button type="button" disabled={busy} onClick={toggle} aria-pressed={me}
          className={`flex min-h-12 items-center justify-center rounded-2xl text-[15px] ${me ? 'border border-line-2 text-text' : 'bg-iri font-semibold text-navy'}`}>
          {busy ? '…' : me ? 'You’re going ✓  ·  Tap to change' : 'I’m going'}
        </button>
      )}
      {isSeeker && !over && me && (
        <Link to="/you" className="-mt-1 text-center text-[12px] text-gold-soft no-underline">Added to your journeys ›</Link>
      )}
      {me && started && (
        <button type="button" onClick={() => setReviewing(true)}
          className="flex min-h-12 items-center justify-center rounded-2xl bg-iri text-[15px] font-semibold text-navy">
          {reviewed ? 'Edit your review' : 'How was it? Leave a review'}
        </button>
      )}
      {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}

      {people.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {people.map((p) => <PersonRow key={p.id} p={p} onChange={reload} />)}
        </ul>
      )}
      {others > 0 && <span className="text-[12px] text-subtle">{`+ ${others} more ${others === 1 ? 'member' : 'members'} who keep their profile private`}</span>}
      {!visible && going > (me ? 1 : 0) && (
        <Link to="/community" className="text-[13px] text-gold-soft no-underline">Turn on Community to see who’s going and connect ›</Link>
      )}
      {me && !visible && <span className="text-[12px] text-subtle">Only members who share their profile in Community appear here by name.</span>}

      {reviewing && <ReviewSheet e={e} onClose={() => setReviewing(false)} onDone={() => { setReviewing(false); setReviewed(true) }} />}
    </section>
  )
}

function PersonRow({ p, onChange }: { p: Attendee; onChange: () => void }) {
  const { session } = useAuth()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const connect = async () => {
    if (!session) return
    setBusy(true); setErr('')
    const e = await requestConnection(session.user.id, p.id)
    setBusy(false)
    if (e) setErr(e); else onChange()
  }
  const status = p.connection_status
  return (
    <li className="flex items-center gap-3">
      <Face src={p.photo_url} name={p.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] font-semibold text-ink">{p.name || 'A member'}</span>
        <span className="truncate text-[12px] text-subtle">{[p.town, p.practices.slice(0, 2).join(' · ')].filter(Boolean).join(' · ') || 'Seeker'}</span>
        {err && <span role="alert" className="text-[12px] text-gold-pale">{err}</span>}
      </div>
      {status === 'accepted' && p.connection_id
        ? <Link to={`/community/chat/${p.connection_id}`} className="flex min-h-10 flex-none items-center rounded-full border border-line-2 px-3.5 text-[13px] text-text no-underline">Message</Link>
        : status === 'pending'
          ? <Link to="/community" className="flex min-h-10 flex-none items-center px-2 text-[13px] text-subtle no-underline">{p.incoming ? 'Respond ›' : 'Requested'}</Link>
          : <button type="button" disabled={busy} onClick={connect} className="flex min-h-10 flex-none items-center rounded-full bg-iri px-3.5 text-[13px] font-semibold text-navy">{busy ? '…' : 'Connect'}</button>}
    </li>
  )
}

const LABELS = ['Not good', 'Poor', 'Okay', 'Good', 'Great', 'Wonderful']

function Stars({ value, onChange, label }: { value: number | null; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
        <button type="button" role="radio" aria-checked={value === 0} onClick={() => onChange(0)}
          className={`mr-1 flex h-10 min-w-10 items-center justify-center rounded-full border px-2 text-[13px] ${value === 0 ? 'border-gold bg-gold/15 text-gold-pale' : 'border-line-2 text-subtle'}`}>0</button>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`} onClick={() => onChange(n)}
            className={`flex h-10 w-10 items-center justify-center text-[28px] leading-none ${value !== null && n <= value ? 'text-gold-soft' : 'text-line-2'}`}>★</button>
        ))}
      </div>
      <span className="text-[12px] text-subtle">{value === null ? 'Tap to rate (0–5)' : `${value} · ${LABELS[value]}`}</span>
    </div>
  )
}

/** Rate the space and the facilitator/host: 0–5 stars and a few words each. */
function ReviewSheet({ e, onClose, onDone }: { e: CommunityEvent; onClose: () => void; onDone: () => void }) {
  const { session } = useAuth()
  const [r, setR] = useState<Record<ReviewTarget, { rating: number | null; comment: string }>>({ space: { rating: null, comment: '' }, facilitator: { rating: null, comment: '' } })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    fetchMyReviews(e.id).then((rows) => setR((cur) => {
      const next = { ...cur }
      rows.forEach((x) => { next[x.target] = { rating: x.rating, comment: x.comment } })
      return next
    }))
  }, [e.id])
  const set = (t: ReviewTarget, patch: Partial<{ rating: number | null; comment: string }>) => setR((cur) => ({ ...cur, [t]: { ...cur[t], ...patch } }))
  const place = e.venue || 'The space'

  const save = async () => {
    if (!session) return
    const rows = (['space', 'facilitator'] as const).filter((t) => r[t].rating !== null).map((t) => ({ target: t, rating: r[t].rating as number, comment: r[t].comment }))
    if (!rows.length) { setError('Rate the space or the facilitator (or both).'); return }
    setBusy(true); setError('')
    const err = await saveReviews(session.user.id, e.id, rows)
    setBusy(false)
    if (err) setError(err); else onDone()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={`Review ${e.title}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-deep/75" />
      <div className="xa-page relative flex max-h-[92%] w-full flex-col gap-5 overflow-y-auto rounded-t-[26px] border-t border-line bg-navy px-5 pt-5 pb-safe sm:max-w-[430px]">
        <div className="mx-auto h-1 w-10 rounded-full bg-line-2" aria-hidden />
        <div className="flex flex-col gap-1">
          <span className="text-xs tracking-[0.14em] text-gold-soft uppercase">How was it?</span>
          <h2 className="m-0 font-display text-[26px] leading-tight font-medium text-ink">{e.title}</h2>
          <span className="text-[13px] text-subtle">Your review helps other seekers. It appears on the space’s and facilitator’s Xanadu page once they’ve joined, with your first name.</span>
        </div>

        {(['space', 'facilitator'] as const).map((t) => (
          <div key={t} className="flex flex-col gap-2.5 rounded-[18px] bg-surface p-4">
            <span className="text-[15px] font-semibold text-ink">{t === 'space' ? place : 'The facilitator or host'}</span>
            <Stars value={r[t].rating} onChange={(v) => set(t, { rating: v })} label={t === 'space' ? `Rate ${place}` : 'Rate the facilitator or host'} />
            <textarea value={r[t].comment} onChange={(ev) => set(t, { comment: ev.target.value })} maxLength={2000} rows={3}
              placeholder={t === 'space' ? 'The space, the setting, how you were welcomed…' : 'How they held the space, their guidance, presence…'}
              className="min-h-[84px] w-full resize-y rounded-[14px] border border-line bg-surface-2 px-3.5 py-3 text-[15px] text-text outline-none placeholder:text-faint" />
          </div>
        ))}

        {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
        <div className="flex flex-col gap-2 pb-4">
          <button type="button" disabled={busy} onClick={save} className="flex min-h-[52px] items-center justify-center rounded-2xl bg-iri text-[15px] font-semibold text-navy">{busy ? 'Saving…' : 'Share my review'}</button>
          <button type="button" onClick={onClose} className="min-h-11 text-[14px] text-subtle">Not now</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export { ReviewSheet }
