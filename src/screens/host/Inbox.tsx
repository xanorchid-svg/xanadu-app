import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BackButton, ContainerTabs, EmptyState, FacilitatorTabs, H1, Page, Screen, SeekerTabs } from '../../components/ui'
import { IconSend } from '../../components/icons'
import type { Role } from '../../data'
import { useMessages } from '../../store'

const READ_KEY = 'xa-inbox-read'
const fmt = (iso: string) => {
  const d = new Date(iso)
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Inbox for every member: their thread with the Xanadu team, saved in the database. ?draft= opens it with a message started. */
export default function Inbox({ role }: { role: Role }) {
  const { messages, loading, send } = useMessages()
  const [params] = useSearchParams()
  const [open, setOpen] = useState(() => !!params.get('draft'))
  const [draft, setDraft] = useState(() => params.get('draft') ?? '')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [lastRead, setLastRead] = useState(() => { try { return localStorage.getItem(READ_KEY) ?? '' } catch { return '' } })
  const endRef = useRef<HTMLDivElement>(null)
  const tabs = role === 'Container' ? <ContainerTabs /> : role === 'Facilitator' ? <FacilitatorTabs /> : <SeekerTabs />
  const latest = messages[messages.length - 1]
  const unread = !!latest && latest.from_team && latest.created_at > lastRead

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ block: 'end' }) }, [open, messages.length])
  // reading the thread marks it read, including replies that arrive while it's open
  useEffect(() => {
    if (open && latest && latest.created_at > lastRead) { try { localStorage.setItem(READ_KEY, latest.created_at) } catch { /* private mode */ } setLastRead(latest.created_at) }
  }, [open, latest, lastRead])

  const openThread = () => {
    setOpen(true)
    if (latest) { try { localStorage.setItem(READ_KEY, latest.created_at) } catch { /* private mode */ } setLastRead(latest.created_at) }
  }

  if (open) {
    const submit = async () => {
      const body = draft.trim()
      if (!body || sending) return
      setSending(true); setError('')
      const err = await send(body)
      setSending(false)
      if (err) setError(err); else setDraft('')
    }
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-[#1F2B3E] px-4 pt-safe pb-3">
          <BackButton onClick={() => setOpen(false)} />
          <div className="flex flex-1 flex-col gap-0.5"><span className="text-[15px] font-semibold text-ink">Xanadu</span><span className="text-xs text-subtle">The Xanadu team · usually replies within a day</span></div>
        </div>
        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex max-w-[280px] flex-col gap-1 px-3.5 py-2.5 text-sm leading-snug ${m.from_team ? 'self-start rounded-[18px_18px_18px_4px] bg-[#22304A] text-text' : 'self-end rounded-[18px_18px_4px_18px] bg-gold text-navy'}`}>
              <span className="selectable whitespace-pre-line">{m.body}</span>
              <span className={`text-[10px] ${m.from_team ? 'text-subtle' : 'text-navy/70'}`}>{fmt(m.created_at)}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); submit() }} className="flex flex-col gap-1.5 border-t border-[#1F2B3E] bg-navy-deep px-4 pt-2.5 pb-safe">
          {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
          <div className="flex items-center gap-2">
            <label className="flex flex-1"><span className="sr-only">Message</span>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={4000} placeholder="Write a message" className="min-h-[46px] flex-1 rounded-full border border-line bg-surface px-4 text-[15px] text-text outline-none placeholder:text-faint" />
            </label>
            <button type="submit" disabled={sending || !draft.trim()} aria-label="Send" className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-gold text-navy disabled:opacity-60"><IconSend /></button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <Screen footer={tabs}>
      <Page className="gap-4">
        <H1>{role === 'Seeker' ? 'Messages' : 'Inbox'}</H1>
        {loading ? <p className="m-0 text-sm text-subtle">Loading…</p> : (
          <button type="button" onClick={openThread} className="flex min-h-[72px] items-center gap-3 border-b border-[#1F2B3E] py-2.5 text-left text-text">
            <span className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full bg-ivory"><img src="/xanadu-mark.png" alt="" className="h-9 w-auto" /></span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex justify-between gap-2"><span className="text-[15px] font-semibold text-ink">Xanadu</span><span className="text-xs text-subtle">{latest ? fmt(latest.created_at) : ''}</span></span>
              <span className="truncate text-[13px] text-subtle">{latest ? `${latest.from_team ? '' : 'You: '}${latest.body}` : 'Say hello to the Xanadu team'}</span>
            </span>
            <span className={`h-2 w-2 flex-none rounded-full ${unread ? 'bg-gold' : 'bg-transparent'}`} />
          </button>
        )}
        <EmptyState title="No other conversations yet">{role === 'Seeker'
          ? 'Replies about the spots you request, and chats with your Community connections, live here and in Community.'
          : 'Intros from Xanadu and messages with spaces and guests will appear here.'}</EmptyState>
      </Page>
    </Screen>
  )
}
