import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { day, useTeamQuery } from '../lib/data'
import { Answers, Drawer, Search, Tabs, useToast } from '../parts'
import { Button, Card, EmptyState, PageTitle, Spinner } from '../ui'

type Ev = {
  id: string; title: string; description: string; start_date: string | null; end_date: string | null
  start_time: string; end_time: string; venue: string; town: string; price_note: string; contact: string; link: string
  tags: string[]; photo_url: string; aligned: boolean | null; status: 'pending' | 'live' | 'declined'
  created_at: string; submitted_by_name: string | null; submitted_by_email: string | null
}
type Tab = 'pending' | 'live' | 'declined'
const TABS = [{ key: 'pending', label: 'To review' }, { key: 'live', label: 'On the calendar' }, { key: 'declined', label: 'Not added' }] as const

const when = (e: Ev) => {
  if (!e.start_date) return 'No date'
  const f = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return [e.end_date && e.end_date !== e.start_date ? `${f(e.start_date)} – ${f(e.end_date)}` : f(e.start_date), [e.start_time, e.end_time].filter(Boolean).join('–')].filter(Boolean).join(' · ')
}

/** Events members shared from posters and group chats. Approving puts them on the app's Calendar as "not verified". */
export default function CommunityEvents() {
  const list = useTeamQuery<Ev[]>('team_list_community_events')
  const [tab, setTab] = useState<Tab>('pending')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Ev | null>(null)
  const toast = useToast()

  const counts = useMemo(() => {
    const c = { pending: 0, live: 0, declined: 0 } as Record<Tab, number>
    ;(list.data ?? []).forEach((e) => { c[e.status]++ })
    return c
  }, [list.data])
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (list.data ?? []).filter((e) => e.status === tab && (!s || [e.title, e.venue, e.town, e.submitted_by_name, ...e.tags].some((v) => v?.toLowerCase().includes(s))))
  }, [list.data, tab, q])

  async function decide(e: Ev, decision: 'approve' | 'decline' | 'pending', message = '') {
    const { error } = await supabase.rpc('team_review_community_event', { p_event: e.id, p_decision: decision, p_message: message })
    if (error) { toast.show('That didn’t work. Please try again.'); return }
    const status = decision === 'approve' ? 'live' : decision === 'decline' ? 'declined' : 'pending'
    list.setData((d) => d?.map((x) => (x.id === e.id ? { ...x, status } : x)) ?? null)
    toast.show(decision === 'approve' ? 'On the calendar. We’ve thanked them.' : decision === 'decline' ? 'Not added' : 'Back to review')
    setOpen(null)
  }

  return (
    <div className="xa-page">
      <PageTitle title="Community events"><Search value={q} onChange={setQ} placeholder="Search title, place, who shared it" /></PageTitle>
      <p className="mb-4 max-w-2xl text-[14px] leading-relaxed text-subtle">Shared by members from posters and group chats. Approving one puts it on the app’s Calendar and Discover as a community event, marked “not verified by Xanadu”.</p>
      <div className="mb-5"><Tabs tabs={TABS} value={tab} onChange={setTab} counts={counts} /></div>

      {list.error && <p className="text-[14px] text-rose">{list.error}</p>}
      {!list.data && !list.error && <div className="grid place-items-center py-16"><Spinner /></div>}
      {list.data && shown.length === 0 && <EmptyState title={tab === 'pending' ? 'Nothing to review' : 'Nothing here'} body="When members share an event in the app, it appears here for a quick look." />}
      {list.data && shown.length > 0 && (
        <Card>
          <ul className="divide-y divide-line">
            {shown.map((e) => (
              <li key={e.id} className="flex items-center gap-3.5 px-4 py-3.5 sm:px-5">
                <button onClick={() => setOpen(e)} className="flex min-w-0 flex-1 items-center gap-3.5 text-left">
                  <div className="size-14 flex-none overflow-hidden rounded-xl bg-surface">{e.photo_url && <img src={e.photo_url} alt="" className="size-full object-cover" loading="lazy" />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-text">{e.title}</p>
                    <p className="truncate text-[12.5px] text-faint">{when(e)} · {[e.venue, e.town].filter(Boolean).join(', ') || 'No place'}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {e.aligned === false && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold-pale">Reader: may not fit</span>}
                      {e.tags.slice(0, 3).map((t) => <span key={t} className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-subtle ring-1 ring-line">{t}</span>)}
                      <span className="text-[11.5px] text-faint">Shared by {e.submitted_by_name || 'a member'} · {day(e.created_at)}</span>
                    </div>
                  </div>
                </button>
                {e.status === 'pending' && (
                  <div className="hidden gap-2 sm:flex">
                    <Button variant="quiet" className="h-9" onClick={() => decide(e, 'decline')}>Not this one</Button>
                    <Button className="h-9" onClick={() => decide(e, 'approve')}>Add to calendar</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {open && (
        <Drawer label={open.title} title={open.title} onClose={() => setOpen(null)}
          sub={<>{when(open)}{open.aligned === false && <span className="text-gold-pale">The reader thought this may not fit</span>}</>}
          footer={
            <div className="flex flex-wrap gap-2 pb-1">
              {open.status !== 'live' && <Button className="flex-1" onClick={() => decide(open, 'approve')}>Add to calendar</Button>}
              {open.status !== 'declined' && <Button variant="quiet" onClick={() => decide(open, 'decline')}>{open.status === 'live' ? 'Take it off the calendar' : 'Not this one'}</Button>}
              {open.status !== 'pending' && <Button variant="quiet" onClick={() => decide(open, 'pending')}>Back to review</Button>}
            </div>
          }>
          {open.photo_url && <img src={open.photo_url} alt="Poster" className="mb-4 max-h-[420px] w-full rounded-xl object-contain" />}
          <Answers rows={[
            ['When', when(open)],
            ['Where', [open.venue, open.town].filter(Boolean).join(', ')],
            ['Price', open.price_note],
            ['To book or ask', open.contact],
            ['Link', open.link && <a href={/^https?:/i.test(open.link) ? open.link : `https://${open.link}`} target="_blank" rel="noreferrer noopener" className="break-all">{open.link}</a>],
            ['Kind', open.tags.join(', ')],
            ['About', open.description],
            ['Shared by', `${open.submitted_by_name || 'A member'}${open.submitted_by_email ? ` · ${open.submitted_by_email}` : ''}`],
          ]} />
        </Drawer>
      )}
      {toast.node}
    </div>
  )
}
