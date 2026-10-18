import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BackButton, Screen, Switch } from '../components/ui'
import { useAuth } from '../auth'
import { pushState, turnOffPush, turnOnPush, useNotifications, type AppNotification, type PushState } from '../notifications'

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.round(h / 24)
  return d < 7 ? `${d}d` : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
const ICON: Record<string, string> = {
  approved: '✦', changes: '✎', declined: '✉', offering_live: '✦', offering_changes: '✎', team_message: '✉',
  message: '✉', community_request: '☺', community_accepted: '☺', match: '✧',
}

/** /notifications: everything Xanadu has told you, plus how you'd like to hear about it. */
export default function Notifications() {
  const navigate = useNavigate()
  const { session, profile, updateProfile } = useAuth()
  const { items, loading, markRead, unread } = useNotifications()
  const [push, setPush] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { pushState().then(setPush) }, [])

  const open = (n: AppNotification) => {
    if (!n.read_at) markRead([n.id])
    navigate(n.link || '/')
  }
  const togglePush = async (on: boolean) => {
    if (!session) return
    setBusy(true); setError('')
    if (on) { const err = await turnOnPush(session.user.id); if (err) setError(err) } else await turnOffPush()
    setPush(await pushState()); setBusy(false)
  }

  const header = (
    <div className="flex items-center gap-3 border-b border-[#1F2B3E] bg-navy px-4 pt-safe pb-3">
      <BackButton />
      <h1 className="m-0 flex-1 font-display text-[26px] font-medium text-ink">Notifications</h1>
      {unread > 0 && <button type="button" onClick={() => markRead()} className="min-h-10 px-2 text-[13px] text-gold-soft">Mark all read</button>}
    </div>
  )

  return (
    <Screen header={header}>
      <div className="flex flex-col gap-5 px-5 py-5">
        {/* phone notifications */}
        {push && push !== 'on' && push !== 'unsupported' && (
          <section className="ring-iri flex flex-col gap-2.5 rounded-[20px] bg-plum/60 p-4">
            <h2 className="m-0 font-display text-[22px] font-medium text-ink">Get notified on this phone</h2>
            {push === 'install-first' ? (
              <p className="m-0 text-[14px] leading-relaxed text-muted">On iPhone, add Xanadu to your Home Screen first: tap <span className="text-text">Share</span>, then <span className="text-text">Add to Home Screen</span>. Open Xanadu from there and turn notifications on here.</p>
            ) : push === 'blocked' ? (
              <p className="m-0 text-[14px] leading-relaxed text-muted">Notifications are blocked for Xanadu. Turn them on in your phone’s Settings → Notifications → Xanadu.</p>
            ) : (
              <>
                <p className="m-0 text-[14px] leading-relaxed text-muted">Hear right away when you’re approved, get a message, or we find something aligned with you.</p>
                <button type="button" onClick={() => togglePush(true)} disabled={busy} className="min-h-12 self-start rounded-2xl bg-iri px-5 text-[15px] font-semibold text-navy disabled:opacity-60">{busy ? 'Turning on…' : 'Turn on notifications'}</button>
              </>
            )}
            {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
          </section>
        )}

        {/* the list */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-line-2 px-6 py-10 text-center">
            <span className="text-2xl text-gold-soft" aria-hidden>✧</span>
            <p className="m-0 font-display text-[22px] text-ink">Nothing yet</p>
            <p className="m-0 text-[14px] leading-relaxed text-subtle">Approvals, messages, Community requests and new matches will appear here.</p>
          </div>
        )}
        {items.length > 0 && (
          <ul className="m-0 flex list-none flex-col p-0">
            {items.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => open(n)} className="flex w-full items-start gap-3 border-b border-[#1F2B3E] py-3.5 text-left">
                  <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-[16px] ${n.read_at ? 'bg-surface text-subtle' : 'ring-iri bg-plum text-gold-pale'}`} aria-hidden>{ICON[n.kind] ?? '✧'}</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={`text-[15px] leading-snug ${n.read_at ? 'text-text' : 'font-semibold text-ink'}`}>{n.title}</span>
                    {n.body && <span className="line-clamp-2 text-[13px] leading-snug text-subtle">{n.body}</span>}
                  </span>
                  <span className="flex flex-none flex-col items-end gap-1.5">
                    <span className="text-[12px] text-faint">{ago(n.created_at)}</span>
                    {!n.read_at && <span className="bg-iri-strong h-2.5 w-2.5 rounded-full" aria-label="Unread" />}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* what to hear about */}
        <section className="flex flex-col">
          <h2 className="m-0 mb-1 font-display text-[22px] font-medium text-ink">How we reach you</h2>
          {push === 'on' && (
            <div className="flex min-h-14 items-center justify-between border-b border-[#1F2B3E] text-[15px] text-text">
              Phone notifications <Switch on onChange={() => togglePush(false)} label="Phone notifications" />
            </div>
          )}
          <div className="flex min-h-14 items-center justify-between border-b border-[#1F2B3E] text-[15px] text-text">
            <span className="flex flex-col">Email me about new messages<span className="text-[12px] text-subtle">At most one email every few hours per conversation</span></span>
            <Switch on={profile?.email_messages ?? true} onChange={(v) => updateProfile({ email_messages: v })} label="Email me about new messages" />
          </div>
          {profile?.role === 'seeker' && (
            <div className="flex min-h-14 items-center justify-between border-b border-[#1F2B3E] text-[15px] text-text">
              <span className="flex flex-col">New aligned experiences<span className="text-[12px] text-subtle">When a new place or experience matches you</span></span>
              <Switch on={profile.notify} onChange={(v) => updateProfile({ notify: v })} label="Notify me about new aligned experiences" />
            </div>
          )}
          <p className="m-0 pt-3 text-[12px] leading-relaxed text-faint">Decisions about your application and messages from the Xanadu team are always emailed. <Link to="/privacy">Privacy</Link></p>
        </section>
      </div>
    </Screen>
  )
}
