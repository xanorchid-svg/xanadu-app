import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { day, useTeamQuery } from '../lib/data'
import { Answers, Drawer, Search, Tabs, useToast } from '../parts'
import { Button, Card, EmptyState, PageTitle, Spinner } from '../ui'

type Ev = {
  id: string; title: string; description: string; start_date: string | null; end_date: string | null
  start_time: string; end_time: string; venue: string; town: string; price_note: string; contact: string; link: string
  tags: string[]; photo_url: string; aligned: boolean | null; status: 'pending' | 'live' | 'declined'
  space_id: string | null; facilitator_id: string | null
  created_at: string; submitted_by_name: string | null; submitted_by_email: string | null
}
type Tab = 'pending' | 'live' | 'declined' | 'claims'
const TABS = [{ key: 'pending', label: 'To review' }, { key: 'live', label: 'On the calendar' }, { key: 'declined', label: 'Not added' }, { key: 'claims', label: 'Claims' }] as const

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
  const claims = useTeamQuery<Claim[]>('team_list_event_claims')

  const counts = useMemo(() => {
    const c = { pending: 0, live: 0, declined: 0, claims: 0 } as Record<Tab, number>
    ;(list.data ?? []).forEach((e) => { c[e.status]++ })
    c.claims = (claims.data ?? []).filter((x) => x.status === 'open').length
    return c
  }, [list.data, claims.data])
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

      {tab === 'claims' && <ClaimsList q={claims} toast={toast.show} onRemoved={(id) => list.setData((d) => d?.map((x) => (x.id === id ? { ...x, status: 'declined' } : x)) ?? null)} />}
      {tab !== 'claims' && <>
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
      </>}

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
          <LinkPicker e={open} onSaved={(space_id, facilitator_id) => {
            list.setData((d) => d?.map((x) => (x.id === open.id ? { ...x, space_id, facilitator_id } : x)) ?? null)
            setOpen({ ...open, space_id, facilitator_id }); toast.show('Linked. Reviews from this event will show on their page once they’re approved.')
          }} />
        </Drawer>
      )}
      {toast.node}
    </div>
  )
}

type Opt = { id: string; name: string; town: string; approved: boolean }
/**
 * Connect an event to the Xanadu space and/or Facilitator who runs it. Seekers' reviews of the event then
 * appear on that space's or Facilitator's page, but only once they've applied and been approved.
 */
function LinkPicker({ e, onSaved }: { e: Ev; onSaved: (space: string | null, facilitator: string | null) => void }) {
  const [opts, setOpts] = useState<{ spaces: Opt[]; facilitators: Opt[] } | null>(null)
  const [space, setSpace] = useState(e.space_id ?? '')
  const [guide, setGuide] = useState(e.facilitator_id ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => { supabase.rpc('team_link_options').then(({ data }) => setOpts((data as { spaces: Opt[]; facilitators: Opt[] } | null) ?? { spaces: [], facilitators: [] })) }, [])
  useEffect(() => { setSpace(e.space_id ?? ''); setGuide(e.facilitator_id ?? '') }, [e.id, e.space_id, e.facilitator_id])
  const changed = space !== (e.space_id ?? '') || guide !== (e.facilitator_id ?? '')
  const save = async () => {
    setBusy(true); setErr('')
    const { error } = await supabase.rpc('team_link_community_event', { p_event: e.id, p_space: space || null, p_facilitator: guide || null })
    setBusy(false)
    if (error) setErr('That didn’t save. Please try again.'); else onSaved(space || null, guide || null)
  }
  const label = (o: Opt) => `${o.name || 'Unnamed'}${o.town ? ` · ${o.town}` : ''}${o.approved ? '' : ' (not approved yet)'}`
  const sel = 'h-10 w-full rounded-lg bg-surface px-3 text-[14px] text-text ring-1 ring-line'
  return (
    <div className="mt-5 flex flex-col gap-2.5 rounded-xl bg-surface/60 p-4 ring-1 ring-line">
      <p className="text-[13px] font-semibold text-text">Link to Xanadu members</p>
      <p className="text-[12.5px] leading-relaxed text-faint">Who runs this event on Xanadu. Seekers who went can review it, and those reviews appear on the linked space and Facilitator pages once they’re approved.</p>
      {!opts ? <Spinner /> : (
        <>
          <label className="flex flex-col gap-1 text-[12px] text-subtle">Space
            <select value={space} onChange={(ev) => setSpace(ev.target.value)} className={sel}>
              <option value="">Not on Xanadu yet</option>
              {opts.spaces.map((o) => <option key={o.id} value={o.id}>{label(o)}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-subtle">Facilitator
            <select value={guide} onChange={(ev) => setGuide(ev.target.value)} className={sel}>
              <option value="">Not on Xanadu yet</option>
              {opts.facilitators.map((o) => <option key={o.id} value={o.id}>{label(o)}</option>)}
            </select>
          </label>
          {changed && <Button className="h-9 self-start" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save link'}</Button>}
          {err && <p className="text-[13px] text-rose">{err}</p>}
        </>
      )}
    </div>
  )
}

type Claim = {
  id: string; kind: 'claim' | 'remove'; note: string; status: 'open' | 'done' | 'declined'; created_at: string
  event_id: string; event_title: string; event_date: string | null; event_photo: string
  user_id: string; user_name: string | null; user_email: string | null
  facilitator_status: string | null; container_status: string | null; space_name: string | null
}

/**
 * Organizers who said "this is mine" or "please take it down" on an event shared from the community.
 * A claim can only be approved once the member is an approved Facilitator or Container: approving links
 * the event to them. Approving a removal takes the event off the calendar.
 */
function ClaimsList({ q, toast, onRemoved }: { q: ReturnType<typeof useTeamQuery<Claim[]>>; toast: (m: string) => void; onRemoved: (eventId: string) => void }) {
  const [busy, setBusy] = useState('')
  const decide = async (c: Claim, decision: 'approve' | 'decline') => {
    setBusy(c.id)
    const { error } = await supabase.rpc('team_resolve_event_claim', { p_claim: c.id, p_decision: decision })
    setBusy('')
    if (error) { toast(error.message.includes('application') ? 'Approve their Facilitator or Container application first.' : 'That didn’t work. Please try again.'); return }
    q.setData((d) => d?.map((x) => (x.id === c.id ? { ...x, status: decision === 'approve' ? 'done' : 'declined' } : x)) ?? null)
    if (decision === 'approve' && c.kind === 'remove') onRemoved(c.event_id)
    toast(decision === 'decline' ? 'Declined' : c.kind === 'claim' ? 'Linked to them. They’ve been told.' : 'Taken off the calendar. They’ve been told.')
  }
  const host = (c: Claim) => {
    const r = [c.facilitator_status && `Facilitator: ${c.facilitator_status}`, c.container_status && `Container: ${c.container_status}${c.space_name ? ` (${c.space_name})` : ''}`].filter(Boolean)
    return r.length ? r.join(' · ') : 'Seeker only, hasn’t applied'
  }
  if (q.error) return <p className="text-[14px] text-rose">{q.error}</p>
  if (!q.data) return <div className="grid place-items-center py-16"><Spinner /></div>
  if (!q.data.length) return <EmptyState title="No claims yet" body="When an organizer taps “Is this yours? Claim it” or asks for removal on an event, it appears here." />
  return (
    <Card>
      <ul className="divide-y divide-line">
        {q.data.map((c) => {
          const ready = c.kind === 'remove' || c.facilitator_status === 'approved' || c.container_status === 'approved'
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-3.5 px-4 py-3.5 sm:px-5">
              <div className="size-14 flex-none overflow-hidden rounded-xl bg-surface">{c.event_photo && <img src={c.event_photo} alt="" className="size-full object-cover" loading="lazy" />}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-text">{c.kind === 'claim' ? 'Claim' : 'Remove'} · {c.event_title}</p>
                <p className="truncate text-[12.5px] text-faint">{c.user_name || 'A member'}{c.user_email ? ` · ${c.user_email}` : ''} · {day(c.created_at)}</p>
                <p className="text-[12.5px] text-subtle">{c.kind === 'claim' ? host(c) : 'Asked to take it down'}{c.note ? ` · “${c.note}”` : ''}</p>
              </div>
              {c.status === 'open' ? (
                <div className="flex gap-2">
                  <Button variant="quiet" className="h-9" disabled={busy === c.id} onClick={() => decide(c, 'decline')}>Decline</Button>
                  <Button className="h-9" disabled={busy === c.id || !ready} title={ready ? '' : 'Approve their application first (Applications)'} onClick={() => decide(c, 'approve')}>
                    {c.kind === 'claim' ? (ready ? 'Link to them' : 'Waiting on application') : 'Remove event'}</Button>
                </div>
              ) : <span className="text-[12.5px] text-faint">{c.status === 'done' ? 'Done' : 'Declined'}</span>}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
