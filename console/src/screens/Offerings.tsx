import { useCallback, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { dateRange, day, fill, firstName, money, place, useTeamQuery, useTemplates, type Offering } from '../lib/data'
import { Answers, Avatar, Chips, Composer, Drawer, Search, Section, Tabs, useToast } from '../parts'
import { Button, Card, EmptyState, PageTitle, Spinner, StatusPill, type Status } from '../ui'

type Tab = 'review' | 'live' | 'changes' | 'past' | 'all'
const TABS = [
  { key: 'review', label: 'In review' },
  { key: 'live', label: 'Live' },
  { key: 'changes', label: 'Needs changes' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
] as const

const today = () => new Date().toISOString().slice(0, 10)
const isPast = (o: Offering) => !!(o.end_date ?? o.start_date) && (o.end_date ?? o.start_date)! < today()
const tabOf = (o: Offering): Exclude<Tab, 'all'> =>
  isPast(o) ? 'past' : o.status === 'live' ? 'live' : o.status === 'declined' ? 'changes' : 'review'
const pillOf = (o: Offering): Status => (o.status === 'live' ? 'live' : o.status === 'declined' ? 'changes' : 'review')

const INCLUDED: [string, string, string][] = [
  ['stay', 'Stay', 'Included'],
  ['meals', 'Meals', 'Included'],
  ['schedule', 'Daily schedule', 'Shared on booking'],
  ['outings', 'Outings', 'Optional, guests opt in'],
  ['transport', 'Airport transport', 'Included'],
]
const SCHEDULE_LABEL: Record<string, string> = { outings: 'Optional outings', meals: 'Meals', days: 'Daily schedule' }

export default function Offerings() {
  const { data, error, reload, setData } = useTeamQuery<Offering[]>('team_list_offerings')
  const [tab, setTab] = useState<Tab>('review')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const toast = useToast()

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { review: 0, live: 0, changes: 0, past: 0, all: 0 }
    data?.forEach((o) => { c[tabOf(o)]++; c.all++ })
    return c
  }, [data])
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    const list = (data ?? []).filter((o) => (tab === 'all' || tabOf(o) === tab) && (!s ||
      [o.title, o.space_name, o.host_name, o.space_country, o.format, o.facilitator_name, o.venue_name].some((v) => v?.toLowerCase().includes(s))))
    return tab === 'live' || tab === 'review' ? [...list].sort((a, b) => (a.start_date ?? '9').localeCompare(b.start_date ?? '9')) : list
  }, [data, tab, q])

  const open = (data ?? []).find((o) => o.id === openId) ?? null
  const close = useCallback(() => setOpenId(null), [])

  return (
    <div className="xa-page">
      <PageTitle title="Offerings"><Search value={q} onChange={setQ} placeholder="Search title, space, host" /></PageTitle>
      <div className="mb-5"><Tabs tabs={TABS} value={tab} onChange={setTab} counts={counts} /></div>

      {error && <p className="text-[14px] text-rose">{error}</p>}
      {!data && !error && <div className="grid place-items-center py-16"><Spinner /></div>}
      {data && shown.length === 0 && (
        <EmptyState title={q ? 'Nothing matches' : tab === 'review' ? 'Nothing waiting' : 'Nothing here yet'}
          body={q ? 'Try a different title, space or host.' : tab === 'review'
            ? 'When a Container submits a retreat, training or drop-in, it appears here for you to review.'
            : 'Offerings will be listed here as they move through review.'} />
      )}

      {data && shown.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((o) => (
            <button key={o.id} onClick={() => setOpenId(o.id)} className="text-left">
              <Card className="h-full overflow-hidden hover:bg-surface">
                <div className="relative aspect-[16/9]">
                  {o.cover ? <img src={o.cover} alt="" className="size-full object-cover" loading="lazy" /> : <div className="size-full bg-portal" />}
                  <div className="absolute top-3 left-3"><StatusPill status={pillOf(o)} /></div>
                </div>
                <div className="p-4">
                  <p className="text-[11.5px] font-semibold uppercase tracking-[.14em] text-faint">{o.format}</p>
                  <p className="mt-1 font-display text-[22px] leading-tight text-ink">{o.title || 'Untitled'}</p>
                  <p className="mt-1 text-[13px] text-subtle">{o.space_name || o.venue_name || o.host_name} · {place(o.space_town, o.space_country) || o.venue_place || 'No location'}{o.facilitator_name ? ` · led by ${o.facilitator_name}` : ''}</p>
                  <p className="mt-2 text-[13px] text-text">{dateRange(o.start_date, o.end_date)} · {money(o.price_usd)}{o.spots ? ` · ${o.spots} spots` : ''}</p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {open && <Review key={open.id} o={open} onClose={close} onDecided={(status, label) => {
        setData((l) => l?.map((x) => (x.id === open.id ? { ...x, status } : x)) ?? null); toast.show(label); reload()
      }} />}
      {toast.node}
    </div>
  )
}

type Decision = 'live' | 'changes' | 'review'
const DECISION: Record<Decision, { label: string; send: string; status: Offering['status']; done: string }> = {
  live: { label: 'Approve to go live', send: 'Send and go live', status: 'live', done: 'Live on Xanadu' },
  changes: { label: 'Ask for changes', send: 'Send request', status: 'declined', done: 'Changes requested' },
  review: { label: 'Take offline for review', send: 'Move back to review', status: 'in_review', done: 'Moved back to review' },
}

function Review({ o, onClose, onDecided }: { o: Offering; onClose: () => void; onDecided: (s: Offering['status'], label: string) => void }) {
  const [decision, setDecision] = useState<Decision | null>(null)
  const tpl = useTemplates()
  const vars = { name: firstName(o.host_name), title: o.title, space: o.space_name }
  const initial = decision === 'live' ? fill(tpl.get('offering_live'), vars) : decision === 'changes' ? fill(tpl.get('offering_changes'), vars) : ''

  async function send(body: string) {
    if (!decision) return null
    const { error } = await supabase.rpc('team_review_offering', { p_offering: o.id, p_decision: decision, p_message: body })
    if (error) return error.message
    onDecided(DECISION[decision].status, DECISION[decision].done)
    setDecision(null)
    return null
  }

  const inc = o.included ?? {}
  const schedule = Object.entries(o.schedule ?? {}).filter(([, v]) => Array.isArray(v) && v.length)

  const footer = decision ? (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-text">{DECISION[decision].label}{decision !== 'review' ? ': this message goes to the host' : ''}</p>
      {decision === 'review'
        ? <div className="flex gap-2 pb-1"><Button variant="quiet" onClick={() => setDecision(null)}>Cancel</Button><Button className="flex-1" onClick={() => send('')}>Move back to review</Button></div>
        : <Composer key={decision + initial} initial={initial} sendLabel={DECISION[decision].send} onSend={send} onCancel={() => setDecision(null)} autoFocus
            hint="Edit anything before sending. Leave it empty to change the status without a message." />}
    </div>
  ) : (
    <div className="flex flex-wrap gap-2 pb-1">
      {o.status !== 'live' && <Button className="flex-1" onClick={() => setDecision('live')}>Approve to go live</Button>}
      {o.status !== 'declined' && <Button variant="quiet" onClick={() => setDecision('changes')}>Ask for changes</Button>}
      {o.status === 'live' && <Button variant="quiet" onClick={() => setDecision('review')}>Take offline</Button>}
    </div>
  )

  return (
    <Drawer label={o.title} onClose={onClose} footer={footer}
      image={<Avatar src={o.cover} size="size-14" square />}
      title={o.title || 'Untitled'}
      sub={<>{o.format}<StatusPill status={pillOf(o)} />{o.host_status !== 'approved' && <span className="text-gold-pale">Host not approved yet</span>}</>}>
      <Section title="The offering">
        <Answers rows={[
          ['Dates', dateRange(o.start_date, o.end_date)],
          ['Price', money(o.price_usd)],
          ['Spots', o.spots ? String(o.spots) : null],
          ['Practices', o.practices?.length ? <Chips items={o.practices} /> : null],
          ['Description', o.description],
        ]} />
      </Section>
      <Section title="What's included">
        <Answers rows={INCLUDED.map(([k, label, yes]) => [label, inc[k] ? yes : 'Not included'] as [string, string])} />
      </Section>
      {schedule.length > 0 && (
        <Section title="Schedule">
          <div className="space-y-4">
            {schedule.map(([k, items]) => (
              <div key={k}>
                <p className="mb-1.5 text-[13px] font-semibold text-subtle">{SCHEDULE_LABEL[k] ?? k.replace(/_/g, ' ')}</p>
                <ul className="space-y-1 text-[14px] text-text">{items.map((it, i) => <li key={i}>{it.split('|').filter(Boolean).join(' · ')}</li>)}</ul>
              </div>
            ))}
          </div>
        </Section>
      )}
      <Section title="Who and where">
        <Answers rows={[
          ['Created by', `${o.host_name ?? ''}${o.created_as === 'facilitator' ? ' (Facilitator)' : ' (Container)'}`],
          ['Held at', o.space_name || (o.venue_name ? `${o.venue_name} · not on Xanadu yet` : 'Not set')],
          ['Location', place(o.space_town, o.space_region, o.space_country) || o.venue_place],
          ['Led by', o.facilitator_name],
          ['Email', o.host_email && <span className="select-all">{o.host_email}</span>],
          ['Host status', o.host_status === 'approved' ? 'Approved' : o.host_status === 'declined' ? 'Declined' : 'Pending'],
          ['Submitted', day(o.created_at)],
          ['Last changed', day(o.updated_at)],
        ]} />
      </Section>
    </Drawer>
  )
}
