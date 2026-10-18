import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ago, fill, firstName, ROLE_LABEL, useTeamQuery, useTemplates, type Msg, type Thread } from '../lib/data'
import { Avatar, Composer, Search, Tabs, ThreadView } from '../parts'
import { Card, EmptyState, PageTitle, Spinner } from '../ui'

type Tab = 'waiting' | 'requests' | 'all'
const TABS = [
  { key: 'waiting', label: 'Waiting for you' },
  { key: 'requests', label: 'Spot & volunteer requests' },
  { key: 'all', label: 'All' },
] as const

/**
 * Every member's thread with the Xanadu team. Updates live: new member messages
 * appear without refreshing, and replies arrive live in the member's app.
 * Members' private Community chats are a different table and never appear here.
 */
export default function Inbox() {
  const { data, error, reload } = useTeamQuery<Thread[]>('team_inbox')
  const [tab, setTab] = useState<Tab>('waiting')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [thread, setThread] = useState<Msg[] | null>(null)
  const tpl = useTemplates()
  const [draft, setDraft] = useState('')
  const openRef = useRef<string | null>(null)
  useEffect(() => { openRef.current = openId }, [openId])

  // live updates
  useEffect(() => {
    const ch = supabase.channel('team-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
        const m = p.new as Msg & { user_id: string }
        reload()
        setThread((t) => (t && m.user_id === openRef.current && !t.some((x) => x.id === m.id) ? [...t, m] : t))
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [reload])

  useEffect(() => {
    if (!openId) return
    setThread(null); setDraft('')
    supabase.rpc('team_member_thread', { p_member: openId }).then(({ data }) => setThread((data as Msg[]) ?? []))
  }, [openId])

  const counts = useMemo(() => ({
    waiting: data?.filter((t) => t.awaiting).length ?? 0,
    requests: data?.filter((t) => t.has_request).length ?? 0,
    all: data?.length ?? 0,
  }), [data])
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (data ?? []).filter((t) => (tab === 'all' || (tab === 'waiting' ? t.awaiting : t.has_request)) &&
      (!s || [t.name, t.email, t.last_body].some((v) => v?.toLowerCase().includes(s))))
  }, [data, tab, q])

  const open = data?.find((t) => t.id === openId) ?? null

  async function reply(body: string) {
    if (!openId) return null
    const { data: id, error } = await supabase.rpc('team_reply', { p_member: openId, p_body: body })
    if (error) return error.message
    setThread((t) => [...(t ?? []), { id: id as string, from_team: true, body, created_at: new Date().toISOString() }])
    setDraft('')
    reload()
    return null
  }

  const quick = tpl.list.filter((t) => t.key.startsWith('reply_'))

  const conversation = open && (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <button onClick={() => setOpenId(null)} className="text-[13px] text-gold-soft lg:hidden">← All</button>
        <Avatar src={open.photo_url} size="size-9" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-text">{open.name || 'No name yet'}</p>
          <p className="truncate text-[12px] text-faint">{ROLE_LABEL[open.role]} · <span className="select-all">{open.email}</span></p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4"><ThreadView messages={thread} /></div>
      <div className="border-t border-line px-4 pt-3 pb-3">
        {quick.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {quick.map((t) => (
              <button key={t.key} onClick={() => setDraft(fill(t.body, { name: firstName(open.name) }))}
                className="h-7 rounded-full bg-surface px-3 text-[12px] text-subtle ring-1 ring-line hover:text-text">
                {t.label.replace(/^Reply: /, '')}
              </button>
            ))}
          </div>
        )}
        <Composer initial={draft} sendLabel="Send reply" onSend={reply} placeholder={`Reply to ${firstName(open.name)}…`}
          hint="Arrives live in their Xanadu inbox. ⌘/Ctrl + Enter to send." />
      </div>
    </div>
  )

  return (
    <div className="xa-page">
      <PageTitle title="Inbox"><Search value={q} onChange={setQ} placeholder="Search name, email, message" /></PageTitle>
      <div className="mb-5"><Tabs tabs={TABS} value={tab} onChange={setTab} counts={counts} /></div>

      {error && <p className="text-[14px] text-rose">{error}</p>}
      {!data && !error && <div className="grid place-items-center py-16"><Spinner /></div>}

      {data && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div className={open ? 'hidden lg:block' : ''}>
            {shown.length === 0 ? (
              <EmptyState title={q ? 'No one matches' : tab === 'waiting' ? 'All answered' : 'No messages yet'}
                body={q ? 'Try a different name or word.' : tab === 'waiting' ? 'When a member writes to the team, their thread appears here until you reply.' : 'Member messages to the team appear here.'} />
            ) : (
              <Card>
                <ul className="divide-y divide-line">
                  {shown.map((t) => (
                    <li key={t.id}>
                      <button onClick={() => setOpenId(t.id)} className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-surface/60 ${t.id === openId ? 'bg-surface/80' : ''}`}>
                        <Avatar src={t.photo_url} size="size-10" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className={`truncate text-[14.5px] ${t.awaiting ? 'font-bold text-ink' : 'font-semibold text-text'}`}>{t.name || 'No name yet'}</p>
                            <span className="shrink-0 text-[11.5px] text-faint">{ago(t.last_at)}</span>
                          </div>
                          <p className={`truncate text-[13px] ${t.awaiting ? 'text-text' : 'text-faint'}`}>{t.last_from_team ? 'You: ' : ''}{t.last_body}</p>
                          <div className="mt-1 flex gap-1.5">
                            <span className="text-[11px] text-faint">{ROLE_LABEL[t.role]}</span>
                            {t.has_request && <span className="rounded-full bg-gold/15 px-2 text-[11px] font-semibold text-gold-pale ring-1 ring-gold/40">Request</span>}
                            {t.awaiting && <span className="rounded-full bg-rose/12 px-2 text-[11px] font-semibold text-rose ring-1 ring-rose/40">Waiting</span>}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
          <div className={open ? '' : 'hidden lg:block'}>
            <Card className="h-[calc(100dvh-260px)] min-h-[440px] overflow-hidden lg:sticky lg:top-6">
              {conversation || (
                <div className="grid h-full place-items-center p-8 text-center">
                  <div><div className="mx-auto mb-4 size-14 rounded-full bg-portal opacity-80" /><p className="font-display text-[22px] text-ink">Choose a conversation</p>
                    <p className="mt-1 text-[13.5px] text-subtle">Only each member’s thread with the Xanadu team. Private Community chats stay private.</p></div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
