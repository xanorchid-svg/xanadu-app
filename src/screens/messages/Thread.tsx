import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { BackButton, Screen } from '../../components/ui'
import { IconSend } from '../../components/icons'
import { ReportSheet } from '../../components/Report'
import { Loading, useAuth } from '../../auth'
import { blockMember } from '../../community'
import { roleName, useThread, useThreads } from '../../threads'
import { Avatar } from '../community/Community'

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const dayLabel = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  const y = new Date(); y.setDate(today.getDate() - 1)
  return d.toDateString() === today.toDateString() ? 'Today' : d.toDateString() === y.toDateString() ? 'Yesterday'
    : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** A private conversation between two members. New messages arrive live. Only the two of them can read it. */
export default function Thread() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const { threads, loading: tLoading, reload } = useThreads()
  const { messages, loading, send } = useThread(id)
  const [text, setText] = useState(() => (location.state as { draft?: string } | null)?.draft ?? '')
  const [error, setError] = useState('')
  const [menu, setMenu] = useState<'closed' | 'open' | 'block'>('closed')
  const [reporting, setReporting] = useState(false)
  const [notice, setNotice] = useState('')
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [messages.length])

  if (tLoading) return <Loading label="Opening conversation…" />
  const t = threads.find((x) => x.id === id)
  if (!t || !session) {
    return (
      <Screen>
        <div className="flex flex-col gap-4 px-5 pt-safe">
          <BackButton to="/messages" />
          <p className="m-0 text-[15px] text-muted">This conversation isn’t available.</p>
        </div>
      </Screen>
    )
  }
  const me = session.user.id
  const who = t.name?.trim() || 'Xanadu member'
  // a space goes by its full name; a person by their first name
  const first = t.role === 'container' ? who : who.split(' ')[0]
  const profileLink = t.role === 'container' && t.space_id ? `/space/${t.space_id}` : null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setError(''); setText('')
    const err = await send(body.slice(0, 4000))
    if (err) { setError(err); setText(body) }
  }
  const block = async () => {
    const err = await blockMember(me, t.other_id)
    if (err) { setError(err); return }
    await reload()
    navigate('/messages', { replace: true })
  }

  const header = (
    <div className="flex flex-col gap-2 border-b border-[#1F2B3E] bg-navy px-4 pt-safe pb-3">
      <div className="flex items-center gap-3">
        <BackButton to="/messages" />
        <Avatar name={who} photo={t.photo_url ?? ''} size={40} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[16px] font-semibold text-ink">{who}</span>
          <span className="truncate text-xs text-subtle">{roleName(t.role)}{t.space_name && t.role !== 'container' ? ` · about ${t.space_name}` : ''}{t.offering_title ? ` · ${t.offering_title}` : ''}</span>
        </div>
        <button type="button" aria-label="Conversation options" aria-expanded={menu !== 'closed'} onClick={() => setMenu(menu === 'closed' ? 'open' : 'closed')}
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-muted">⋯</button>
      </div>
      {menu === 'open' && (
        <div className="flex flex-col rounded-2xl bg-surface p-1.5 text-[14px]">
          {profileLink && <Link to={profileLink} className="flex min-h-11 items-center rounded-xl px-3 text-text no-underline">View their space</Link>}
          <button type="button" onClick={() => { setMenu('closed'); setReporting(true) }} className="min-h-11 rounded-xl px-3 text-left text-text">{`Report ${first}`}</button>
          <button type="button" onClick={() => setMenu('block')} className="min-h-11 rounded-xl px-3 text-left text-gold-pale">{`Block ${first}`}</button>
        </div>
      )}
      {menu === 'block' && (
        <div className="flex flex-col gap-2 rounded-2xl bg-surface p-3">
          <span className="text-[13px] leading-normal text-muted">{`Block ${who}? Neither of you will be able to send messages here, and you’ll stop seeing each other in Community.`}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMenu('closed')} className="min-h-10 flex-1 rounded-xl border border-line-2 text-[13px] text-muted">Cancel</button>
            <button type="button" onClick={block} className="min-h-10 flex-1 rounded-xl bg-iri text-[13px] font-semibold text-navy">Block</button>
          </div>
        </div>
      )}
    </div>
  )

  const footer = t.blocked ? (
    <div className="border-t border-[#1F2B3E] bg-navy-deep px-4 pt-3 pb-safe text-center text-[13px] text-subtle">This conversation is closed.</div>
  ) : (
    <form onSubmit={submit} className="flex flex-col gap-1.5 border-t border-[#1F2B3E] bg-navy-deep px-4 pt-3 pb-safe">
      {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
      <div className="flex items-end gap-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${first}`} aria-label="Message" rows={1} maxLength={4000}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(hover: hover)').matches) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit() } }}
          className="max-h-32 min-h-12 flex-1 resize-none rounded-[24px] border border-line bg-surface-2 px-4 py-3 text-[15px] leading-snug text-text outline-none placeholder:text-faint focus:border-gold" />
        <button type="submit" aria-label="Send" disabled={!text.trim()} className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-iri text-navy disabled:opacity-50"><IconSend /></button>
      </div>
    </form>
  )

  let lastDay = ''
  return (
    <Screen header={header} footer={footer}>
      <div className="flex flex-col gap-2 px-4 py-4">
        <p className="m-0 mb-1 self-center rounded-full bg-surface px-3 py-1.5 text-center text-[11.5px] text-subtle">Private between you and {first}. Only the two of you can read it.</p>
        {notice && <p className="m-0 self-center rounded-full bg-surface px-3 py-1.5 text-xs text-muted">{notice}</p>}
        {!loading && !messages.length && <p className="m-0 mt-6 text-center text-[14px] text-subtle">{`Say hello to ${first}.`}</p>}
        {messages.map((m) => {
          const mine = m.sender === me
          const d = dayLabel(m.created_at)
          const showDay = d !== lastDay
          lastDay = d
          return (
            <div key={m.id} className="contents">
              {showDay && <span className="my-1 self-center text-[11px] tracking-wide text-faint uppercase">{d}</span>}
              <div className={`flex max-w-[80%] flex-col gap-0.5 ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
                <span className={`selectable rounded-[18px] px-3.5 py-2.5 text-[15px] leading-snug whitespace-pre-wrap ${mine ? 'bg-iri text-navy' : 'bg-surface text-text'}`}>{m.body}</span>
                <span className="px-1 text-[11px] text-faint">{time(m.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={end} />
      </div>
      {reporting && (
        <ReportSheet memberId={t.other_id} name={who} context="message" contextId={t.id} onClose={() => setReporting(false)}
          onDone={async (blocked) => {
            setReporting(false)
            if (blocked) { await reload(); navigate('/messages', { replace: true }) }
            else setNotice('Thank you. Our team will look into it.')
          }} />
      )}
    </Screen>
  )
}
