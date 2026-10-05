import { useState } from 'react'
import { BackButton, ContainerTabs, EmptyState, FacilitatorTabs, H1, Page, Screen } from '../../components/ui'
import { IconSend } from '../../components/icons'
import type { Role } from '../../data'

type Msg = { me: boolean; text: string }

const WELCOME: Msg[] = [
  { me: false, text: "Welcome to Xanadu. We're so glad you're one of our founding members." },
  { me: false, text: "Here's how it works: as spaces and facilitators join, we'll introduce you to the ones aligned with your work. Every intro lands right here in your inbox." },
  { me: false, text: 'Questions? Reply here anytime, or write to networkxanadu@gmail.com.' },
]

/** Shared inbox for Containers and Facilitators. Starts with a welcome thread from Xanadu. */
export default function Inbox({ role }: { role: Exclude<Role, 'Seeker'> }) {
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState(false)
  const [draft, setDraft] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>(WELCOME)
  const tabs = role === 'Container' ? <ContainerTabs /> : <FacilitatorTabs />

  if (open) {
    const send = () => { if (!draft.trim()) return; setMsgs((m) => [...m, { me: true, text: draft.trim() }]); setDraft('') }
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-[#1F2B3E] px-4 pt-[52px] pb-3">
          <BackButton onClick={() => setOpen(false)} />
          <div className="flex flex-1 flex-col gap-0.5"><span className="text-[15px] font-semibold text-ink">Xanadu</span><span className="text-xs text-subtle">The Xanadu team</span></div>
        </div>
        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
          {msgs.map((m, i) => (
            <div key={i} className={`max-w-[280px] px-3.5 py-2.5 text-sm leading-snug ${m.me ? 'self-end rounded-[18px_18px_4px_18px] bg-gold text-navy' : 'self-start rounded-[18px_18px_18px_4px] bg-[#22304A] text-text'}`}>{m.text}</div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex items-center gap-2 border-t border-[#1F2B3E] bg-navy-deep px-4 pt-2.5 pb-[max(30px,env(safe-area-inset-bottom))]">
          <label className="flex flex-1"><span className="sr-only">Message</span>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message" className="min-h-[46px] flex-1 rounded-full border border-line bg-surface px-4 text-[15px] text-text outline-none placeholder:text-faint" />
          </label>
          <button type="submit" aria-label="Send" className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-gold text-navy"><IconSend /></button>
        </form>
      </div>
    )
  }

  return (
    <Screen footer={tabs}>
      <Page className="gap-4">
        <H1>Inbox</H1>
        <button type="button" onClick={() => { setOpen(true); setRead(true) }}
          className="flex min-h-[72px] items-center gap-3 border-b border-[#1F2B3E] py-2.5 text-left text-text">
          <span className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full bg-ivory"><img src="/xanadu-mark.png" alt="" className="h-9 w-auto" /></span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex justify-between gap-2"><span className="text-[15px] font-semibold text-ink">Xanadu</span><span className="text-xs text-subtle">Today</span></span>
            <span className="truncate text-[13px] text-subtle">Welcome, founding member. Here's how intros work.</span>
          </span>
          <span className={`h-2 w-2 flex-none rounded-full ${read ? 'bg-transparent' : 'bg-gold'}`} />
        </button>
        <EmptyState title="No other conversations yet">Intros from Xanadu and messages with spaces and guests will appear here.</EmptyState>
      </Page>
    </Screen>
  )
}
