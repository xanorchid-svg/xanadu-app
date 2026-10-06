import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackButton, Screen } from '../../components/ui'
import { IconSend } from '../../components/icons'
import { Loading, useAuth } from '../../auth'
import { blockMember, removeConnection, reportMember, useChat, useConnections } from '../../community'
import { Avatar } from './Community'

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

/** One-to-one chat between two connected members. New messages arrive live. */
export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { connections, loading: cLoading } = useConnections()
  const { messages, loading, send } = useChat(id)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [menu, setMenu] = useState<'closed' | 'open' | 'report' | 'block' | 'remove'>('closed')
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState('')
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [messages.length])

  if (cLoading) return <Loading label="Opening chat…" />
  const c = connections.find((x) => x.connection_id === id && x.status === 'accepted')
  if (!c || !session) {
    return (
      <Screen>
        <div className="flex flex-col gap-4 px-5 pt-safe">
          <BackButton to="/community" />
          <p className="m-0 text-[15px] text-muted">This chat isn't available. It opens once you're both connected.</p>
        </div>
      </Screen>
    )
  }
  const me = session.user.id

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setError(''); setText('')
    const err = await send(body.slice(0, 4000))
    if (err) { setError(err); setText(body) }
  }
  const block = async () => {
    const err = await blockMember(me, c.other_id)
    if (err) { setError(err); return }
    await removeConnection(c.connection_id)
    navigate('/community', { replace: true })
  }
  const disconnect = async () => {
    const err = await removeConnection(c.connection_id)
    if (err) setError(err); else navigate('/community', { replace: true })
  }
  const report = async () => {
    if (!reason.trim()) { setError('Tell us briefly what happened.'); return }
    const err = await reportMember(me, c.other_id, reason.trim())
    if (err) setError(err); else { setMenu('closed'); setReason(''); setNotice('Thank you. Our team will look into it.') }
  }

  const header = (
    <div className="flex flex-col gap-2 border-b border-[#1F2B3E] bg-navy px-4 pt-safe pb-3">
      <div className="flex items-center gap-3">
        <BackButton to="/community" />
        <Avatar name={c.name} photo={c.photo_url} size={40} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[16px] font-semibold text-ink">{c.name.trim() || 'Xanadu member'}</span>
          <span className="text-xs text-subtle">{c.role === 'facilitator' ? 'Facilitator' : 'Seeker'}</span>
        </div>
        <button type="button" aria-label="Chat options" aria-expanded={menu !== 'closed'} onClick={() => setMenu(menu === 'closed' ? 'open' : 'closed')}
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-muted">⋯</button>
      </div>
      {menu === 'open' && (
        <div className="flex flex-col rounded-2xl bg-surface p-1.5 text-[14px]">
          <button type="button" onClick={() => setMenu('report')} className="min-h-11 rounded-xl px-3 text-left text-text">Report</button>
          <button type="button" onClick={() => setMenu('remove')} className="min-h-11 rounded-xl px-3 text-left text-text">Remove connection</button>
          <button type="button" onClick={() => setMenu('block')} className="min-h-11 rounded-xl px-3 text-left text-gold-pale">Block</button>
        </div>
      )}
      {(menu === 'block' || menu === 'remove') && (
        <div className="flex flex-col gap-2 rounded-2xl bg-surface p-3">
          <span className="text-[13px] leading-normal text-muted">{menu === 'block'
            ? `Block ${c.name.trim() || 'this member'}? You'll stop seeing each other in Community and this chat closes.`
            : `Remove ${c.name.trim() || 'this member'} as a connection? This chat closes. You can connect again later.`}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMenu('closed')} className="min-h-10 flex-1 rounded-xl border border-line-2 text-[13px] text-muted">Cancel</button>
            <button type="button" onClick={menu === 'block' ? block : disconnect} className="min-h-10 flex-1 rounded-xl bg-gold text-[13px] font-semibold text-navy">{menu === 'block' ? 'Block' : 'Remove'}</button>
          </div>
        </div>
      )}
      {menu === 'report' && (
        <div className="flex flex-col gap-2 rounded-2xl bg-surface p-3">
          <span className="text-[13px] text-muted">What happened? Only the Xanadu team sees this.</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
            className="rounded-xl border border-line bg-surface-2 p-3 text-[15px] text-text outline-none focus:border-gold" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setMenu('closed')} className="min-h-10 flex-1 rounded-xl border border-line-2 text-[13px] text-muted">Cancel</button>
            <button type="button" onClick={report} className="min-h-10 flex-1 rounded-xl bg-gold text-[13px] font-semibold text-navy">Send report</button>
          </div>
        </div>
      )}
    </div>
  )

  const footer = (
    <form onSubmit={submit} className="flex flex-col gap-1.5 border-t border-[#1F2B3E] bg-navy-deep px-4 pt-3 pb-safe">
      {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
      <div className="flex items-center gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" aria-label="Message"
          className="min-h-12 flex-1 rounded-full border border-line bg-surface-2 px-4 text-[15px] text-text outline-none placeholder:text-faint focus:border-gold" />
        <button type="submit" aria-label="Send" disabled={!text.trim()} className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gold text-navy disabled:opacity-50"><IconSend /></button>
      </div>
    </form>
  )

  return (
    <Screen header={header} footer={footer}>
      <div className="flex flex-col gap-2 px-4 py-4">
        {notice && <p className="m-0 self-center rounded-full bg-surface px-3 py-1.5 text-xs text-muted">{notice}</p>}
        {!loading && !messages.length && <p className="m-0 mt-6 text-center text-[14px] text-subtle">{`You're connected. Say hello to ${c.name.trim().split(' ')[0] || 'them'}.`}</p>}
        {messages.map((m) => {
          const mine = m.sender === me
          return (
            <div key={m.id} className={`flex max-w-[80%] flex-col gap-0.5 ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
              <span className={`selectable rounded-[18px] px-3.5 py-2.5 text-[15px] leading-snug whitespace-pre-wrap ${mine ? 'bg-gold text-navy' : 'bg-surface text-text'}`}>{m.body}</span>
              <span className="px-1 text-[11px] text-faint">{time(m.created_at)}</span>
            </div>
          )
        })}
        <div ref={end} />
      </div>
    </Screen>
  )
}
