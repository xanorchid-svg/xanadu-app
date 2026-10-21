import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { day, fill, firstName, place, ROLE_LABEL, useTeamQuery, useTemplates, type Application, type Msg } from '../lib/data'
import { Answers, Avatar, Chips, Composer, Drawer, Gallery, LifeChips, Search, Section, Tabs, ThreadView, useToast } from '../parts'
import { Button, Card, EmptyState, PageTitle, Spinner, StatusPill, type Status } from '../ui'

type Tab = 'pending' | 'started' | 'approved' | 'declined' | 'all'
const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'started', label: 'Not finished' },
  { key: 'approved', label: 'Approved' },
  { key: 'declined', label: 'Declined' },
  { key: 'all', label: 'All' },
] as const
type RoleFilter = 'all' | 'container' | 'facilitator'
const ROLES = [
  { key: 'all', label: 'Everyone' },
  { key: 'container', label: 'Containers' },
  { key: 'facilitator', label: 'Facilitators' },
] as const

const tabOf = (a: Application): Exclude<Tab, 'all'> =>
  a.status === 'approved' ? 'approved' : a.status === 'declined' ? 'declined' : a.onboarded ? 'pending' : 'started'
const pillOf = (a: Application): Status | null =>
  a.status === 'approved' ? 'approved' : a.status === 'declined' ? 'declined' : a.onboarded ? 'pending' : null
const titleOf = (a: Application) => (a.role === 'container' ? a.space?.name || a.name : a.name) || 'No name yet'
const photoOf = (a: Application) => (a.role === 'container' ? a.space?.photos?.[0] ?? a.photo_url : a.photo_url)
const whereOf = (a: Application) => (a.role === 'container' ? place(a.space?.town, a.space?.region, a.space?.country) : place(a.town, a.region))

/** Submitted and not yet approved: can be approved from the list */
const canBulkApprove = (a: Application) => a.onboarded && a.status !== 'approved'

function Check({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick}
      className={`grid size-5 place-items-center rounded-md text-[12px] font-bold ${on ? 'bg-iri-strong text-navy' : 'ring-1 ring-line-2 hover:ring-gold/60'}`}>
      {on ? '✓' : ''}
    </button>
  )
}

/** What the app asks for before review, so Xan can see at a glance what's missing */
function checklist(a: Application): [string, boolean][] {
  if (a.role === 'container') {
    const photos = a.space?.photos?.length ?? 0
    return [
      [`Photos ${photos}/5`, photos >= 5],
      ['About', !!a.space?.about?.trim()],
      ['Reviews or referrals', !!a.proof?.trim()],
      ['Agreed to guidelines', a.agreed_guidelines],
    ]
  }
  return [
    ['Photo', !!a.photo_url],
    ['About', !!a.about?.trim()],
    [`References ${a.references_list?.length ?? 0}`, (a.references_list?.length ?? 0) > 0],
    ['Agreed to guidelines', a.agreed_guidelines],
  ]
}

export default function Applications() {
  const [params, setParams] = useSearchParams()
  const { data, error, reload, setData } = useTeamQuery<Application[]>('team_list_applications')
  const [tab, setTab] = useState<Tab>('pending')
  const role = (params.get('role') as RoleFilter) || 'all'
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(params.get('id'))
  const toast = useToast()

  const inRole = useMemo(() => (data ?? []).filter((a) => role === 'all' || a.role === role), [data, role])
  const counts = useMemo(() => {
    const c: Record<Tab, number> = { pending: 0, started: 0, approved: 0, declined: 0, all: 0 }
    inRole.forEach((a) => { c[tabOf(a)]++; c.all++ })
    return c
  }, [inRole])
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return inRole.filter((a) => (tab === 'all' || tabOf(a) === tab) && (!s ||
      [a.name, a.email, a.space?.name, a.town, a.region, a.space?.country, a.space?.town].some((v) => v?.toLowerCase().includes(s))))
  }, [inRole, tab, q])

  const open = (data ?? []).find((a) => a.key === openId) ?? (data ?? []).find((a) => a.id === openId) ?? null
  const idx = shown.findIndex((a) => a.key === open?.key)
  const close = useCallback(() => setOpenId(null), [])
  const step = useCallback((d: number) => {
    if (!shown.length) return
    const next = shown[(Math.max(idx, 0) + d + shown.length) % shown.length]
    setOpenId(next.key)
  }, [shown, idx])

  const decided = (key: string, status: Application['status'], label: string) => {
    setData((list) => list?.map((a) => (a.key === key ? { ...a, status } : a)) ?? null)
    toast.show(label)
    reload()
  }

  // Select several submitted applications and approve them together
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const selectable = useMemo(() => shown.filter(canBulkApprove), [shown])
  const pickedList = useMemo(() => selectable.filter((a) => picked.has(a.key)), [selectable, picked])
  useEffect(() => { setPicked(new Set()) }, [tab, role])
  const toggle = (key: string) => setPicked((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n })
  const allPicked = selectable.length > 0 && pickedList.length === selectable.length
  const tpl = useTemplates()
  const [confirming, setConfirming] = useState(false)
  const [withMessage, setWithMessage] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  async function approvePicked() {
    const list = pickedList
    const failed: string[] = []
    for (let i = 0; i < list.length; i++) {
      const a = list[i]
      setBusy(`Approving ${i + 1} of ${list.length}…`)
      const body = withMessage
        ? fill(tpl.get(a.role === 'container' ? 'approve_container' : 'approve_facilitator'), { name: firstName(a.name), space: a.space?.name || 'Your space' })
        : ''
      const { error } = await supabase.rpc('team_review_role', { p_member: a.id, p_role: a.role, p_decision: 'approve', p_message: body })
      if (error) failed.push(titleOf(a))
      else setData((d) => d?.map((x) => (x.key === a.key ? { ...x, status: 'approved' } : x)) ?? null)
    }
    setBusy(null); setConfirming(false); setPicked(new Set())
    const ok = list.length - failed.length
    toast.show(failed.length ? `Approved ${ok}. Couldn’t approve: ${failed.join(', ')}` : `Approved ${ok}${withMessage ? ', welcome messages sent' : ''}`)
    reload()
  }

  return (
    <div className="xa-page">
      <PageTitle title="Applications"><Search value={q} onChange={setQ} placeholder="Search name, email, space, place" /></PageTitle>

      <div className="mb-3"><Tabs tabs={TABS} value={tab} onChange={setTab} counts={counts} /></div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {ROLES.map((r) => (
          <button key={r.key} onClick={() => { const p = new URLSearchParams(params); if (r.key === 'all') p.delete('role'); else p.set('role', r.key); setParams(p, { replace: true }) }}
            className={`h-8 rounded-full px-3.5 text-[12.5px] font-semibold ${role === r.key ? 'bg-surface text-ink ring-1 ring-gold/50' : 'text-faint hover:text-text'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {error && <p className="text-[14px] text-rose">{error}</p>}
      {!data && !error && <div className="grid place-items-center py-16"><Spinner /></div>}
      {data && shown.length === 0 && (
        <EmptyState
          title={q ? 'No one matches' : tab === 'pending' ? 'Nothing waiting' : 'Nothing here yet'}
          body={q ? 'Try a different name, email or place.' : tab === 'pending'
            ? 'When a Container or Facilitator finishes their application, it appears here for you to review.'
            : tab === 'started' ? 'People who started a Container or Facilitator application but haven’t submitted it yet appear here.'
            : 'Applications you decide on will be listed here.'} />
      )}

      {data && shown.length > 0 && (
        <Card>
          {selectable.length > 0 && (
            <div className="flex items-center gap-3 border-b border-line px-4 py-2.5 sm:px-5">
              <Check on={allPicked} onClick={() => setPicked(allPicked ? new Set() : new Set(selectable.map((a) => a.key)))} label="Select all" />
              <span className="text-[12.5px] font-semibold text-subtle">
                {pickedList.length ? `${pickedList.length} selected` : `Select to approve several at once`}
              </span>
            </div>
          )}
          <ul className="divide-y divide-line">
            {shown.map((a) => (
              <li key={a.key} className="flex items-center">
                {selectable.length > 0 && (
                  <div className="shrink-0 pl-4 sm:pl-5">
                    {canBulkApprove(a) ? <Check on={picked.has(a.key)} onClick={() => toggle(a.key)} label={`Select ${titleOf(a)}`} /> : <span className="block size-5" />}
                  </div>
                )}
                <button onClick={() => setOpenId(a.key)} className="flex min-w-0 flex-1 items-center gap-3.5 px-4 py-3.5 text-left hover:bg-surface/60 sm:px-5">
                  <Avatar src={photoOf(a)} size="size-12" square={a.role === 'container'} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-text">{titleOf(a)}</p>
                    <p className="truncate text-[12.5px] text-faint">
                      {ROLE_LABEL[a.role]}{a.role === 'container' && a.name && a.space?.name ? ` · ${a.name}` : ''} · {whereOf(a) || 'No location yet'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {a.referred_by && <span className="rounded-full bg-iri-teal/15 px-2 py-0.5 text-[11px] font-semibold text-iri-teal">{`Referred by ${a.referred_by.name ?? 'a Facilitator'}`}</span>}
                      {a.fast_track && <span className="rounded-full bg-iri-violet/15 px-2 py-0.5 text-[11px] font-semibold text-iri-violet">{`Fast track · approved ${a.role === 'container' ? 'Facilitator' : 'Container'}`}</span>}
                      {checklist(a).map(([label, ok]) => (
                        <span key={label} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ok ? 'bg-iri-sage/12 text-iri-sage' : 'bg-surface text-faint ring-1 ring-line'}`}>
                          {ok ? '✓ ' : ''}{label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-[12.5px] text-subtle">{a.onboarded ? 'Submitted' : 'Started'} {day(a.onboarded ? a.submitted : a.created_at)}</p>
                    {a.heard_from && <p className="text-[11.5px] text-faint">Heard via {a.heard_from.replace(/^Other: /, '')}</p>}
                  </div>
                  {pillOf(a) && <StatusPill status={pillOf(a)!} />}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {pickedList.length > 0 && !open && createPortal(
        <div className="xa-page fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-6 md:pl-60">
          <div className="ring-iri w-full max-w-xl rounded-2xl bg-surface p-3.5 shadow-2xl">
            {confirming ? (
              <>
                <p className="text-[14px] font-semibold text-text">
                  Approve {pickedList.length} {pickedList.length === 1 ? 'application' : 'applications'}?
                </p>
                <p className="mt-0.5 text-[12.5px] text-faint">{pickedList.map(titleOf).join(', ')}</p>
                <label className="mt-2.5 flex items-center gap-2 text-[13px] text-subtle">
                  <input type="checkbox" checked={withMessage} onChange={(e) => setWithMessage(e.target.checked)} className="size-4 accent-[#B89567]" />
                  Send each their welcome message (your approve templates, with their name)
                </label>
                <div className="mt-3 flex gap-2">
                  <Button variant="quiet" onClick={() => setConfirming(false)} disabled={!!busy}>Back</Button>
                  <Button className="flex-1" onClick={approvePicked} disabled={!!busy}>{busy ?? `Approve ${pickedList.length}`}</Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex-1 pl-1.5 text-[14px] font-semibold text-text">{pickedList.length} selected</span>
                <Button variant="ghost" onClick={() => setPicked(new Set())}>Clear</Button>
                <Button onClick={() => setConfirming(true)}>Approve {pickedList.length}</Button>
              </div>
            )}
          </div>
        </div>, document.body,
      )}

      {open && <Review key={open.key} a={open} onClose={close} onStep={step} position={idx >= 0 ? `${idx + 1} of ${shown.length}` : ''} onDecided={decided} />}
      {toast.node}
    </div>
  )
}

type Decision = 'approve' | 'changes' | 'decline' | 'reopen'
const DECISION: Record<Decision, { label: string; send: string; status: Application['status']; done: string }> = {
  approve: { label: 'Approve', send: 'Send and approve', status: 'approved', done: 'Approved, and their welcome message is sent' },
  changes: { label: 'Ask for changes', send: 'Send request', status: 'pending', done: 'Changes requested' },
  decline: { label: 'Decline', send: 'Send and decline', status: 'declined', done: 'Declined' },
  reopen: { label: 'Move back to pending', send: 'Move back to pending', status: 'pending', done: 'Moved back to pending' },
}

function Review({ a, onClose, onStep, position, onDecided }: {
  a: Application; onClose: () => void; onStep: (d: number) => void; position: string
  onDecided: (id: string, status: Application['status'], label: string) => void
}) {
  const [thread, setThread] = useState<Msg[] | null>(null)
  const [decision, setDecision] = useState<Decision | null>(null)
  const tpl = useTemplates()

  useEffect(() => {
    supabase.rpc('team_member_thread', { p_member: a.id }).then(({ data }) => setThread((data as Msg[]) ?? []))
  }, [a.id])

  // Keyboard: A approve, C changes, D decline, J/K next/previous
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      const k = e.key.toLowerCase()
      if (k === 'j') onStep(1)
      else if (k === 'k') onStep(-1)
      else if (decision) return
      else if (k === 'a' && a.status !== 'approved') setDecision('approve')
      else if (k === 'c' && a.status !== 'approved') setDecision('changes')
      else if (k === 'd' && a.status !== 'declined') setDecision('decline')
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onStep, decision, a.status])

  const vars = { name: firstName(a.name), space: a.space?.name || 'Your space' }
  const initial = decision === 'approve' ? fill(tpl.get(a.role === 'container' ? 'approve_container' : 'approve_facilitator'), vars)
    : decision === 'changes' ? fill(tpl.get('changes'), vars)
    : decision === 'decline' ? fill(tpl.get('decline'), vars) : ''

  async function send(body: string) {
    if (!decision) return null
    const { error } = await supabase.rpc('team_review_role', { p_member: a.id, p_role: a.role, p_decision: decision, p_message: body })
    if (error) return error.message
    onDecided(a.key, DECISION[decision].status, DECISION[decision].done)
    setDecision(null)
    if (body) setThread((t) => [...(t ?? []), { id: crypto.randomUUID(), from_team: true, body, created_at: new Date().toISOString() }])
    return null
  }

  const s = a.space
  const footer = decision ? (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-text">{DECISION[decision].label}: {decision === 'reopen' ? 'no message is sent' : 'this message goes to their Xanadu inbox'}</p>
      {decision === 'reopen'
        ? <div className="flex gap-2 pb-1"><Button variant="quiet" onClick={() => setDecision(null)}>Cancel</Button><Button className="flex-1" onClick={() => send('')}>Move back to pending</Button></div>
        : <Composer key={decision + initial} initial={initial} sendLabel={DECISION[decision].send} onSend={send} onCancel={() => setDecision(null)} autoFocus
            hint="Edit anything before sending. Leave it empty to change the status without a message." />}
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-2 pb-1">
      {a.status !== 'approved' && <Button onClick={() => setDecision('approve')} className="flex-1" title="A">Approve</Button>}
      {a.status !== 'approved' && <Button variant="quiet" onClick={() => setDecision('changes')} title="C">Ask for changes</Button>}
      {a.status !== 'declined' && <Button variant="quiet" onClick={() => setDecision('decline')} title="D">Decline</Button>}
      {(a.status === 'approved' || a.status === 'declined') && <Button variant="quiet" onClick={() => setDecision('reopen')} className="flex-1">Move back to pending</Button>}
      <p className="hidden w-full pt-1 text-[11.5px] text-faint lg:block">Shortcuts: A approve · C ask for changes · D decline · J / K next and previous · Esc close {position && `· ${position}`}</p>
    </div>
  )

  return (
    <Drawer label={titleOf(a)} onClose={onClose} footer={footer}
      image={<Avatar src={photoOf(a)} size="size-14" square={a.role === 'container'} />}
      title={titleOf(a)}
      sub={<>{ROLE_LABEL[a.role]}{pillOf(a) && <StatusPill status={pillOf(a)!} />}{a.other_status === 'approved' && <span className="text-iri-violet">{`Already an approved ${a.role === 'container' ? 'Facilitator' : 'Container'}`}</span>}{!a.onboarded && <span className="text-gold-pale">Hasn’t submitted yet</span>}</>}>

      <Section title="Account">
        <Answers rows={[
          ['Email', <span className="select-all">{a.email}</span>],
          ['Heard about us', a.heard_from],
          ...(a.referred_by ? [['Referred by', `${a.referred_by.name ?? 'A Facilitator'}${a.referred_by.facilitator_approved ? ' (approved Facilitator)' : ''}${a.referred_by.venue ? `, who holds an experience at ${a.referred_by.venue}` : ''} · ${day(a.referred_by.at)}`] as [string, string]] : []),
          [a.onboarded ? 'Submitted' : 'Started', day(a.onboarded ? a.submitted : a.created_at)],
          ['Last seen', day(a.last_sign_in_at)],
          ...(a.role === 'container' ? [['Offerings', String(a.offerings)] as [string, string]] : []),
        ]} />
      </Section>

      {a.role === 'container' ? (
        <>
          <Section step="1" title="Your space">
            <Answers rows={[
              ['Space name', s?.name],
              ['Country', s?.country],
              ['Region', s?.region],
              ['Town', s?.town],
              ['Phone (private)', a.phone && <a href={`tel:${a.phone}`}>{a.phone}</a>],
            ]} />
          </Section>
          <Section step="2" title="The spirit of the place">
            <Answers rows={[
              ['About the space', s?.about],
              ['Practices hosted', s?.practices?.length ? <Chips items={s.practices} /> : null],
              ['Life here', s?.lifestyle?.length ? <LifeChips items={s.lifestyle} /> : null],
              ['Volunteers', s?.volunteer_exchange ? (s.volunteer_details || 'Welcomes volunteers') : 'Not offered'],
            ]} />
          </Section>
          <Section step="3" title="Photos & details">
            {s?.photos?.length ? <div className="mb-4"><Gallery photos={s.photos} /></div> : <p className="mb-4 text-[13.5px] italic text-faint">No photos yet</p>}
            <Answers rows={[
              ['Sleeps', s?.sleeps],
              ['Practice space holds', s?.mats],
              ['Room types', s?.rooms],
              ['Kitchen and meals', s?.kitchen],
              ['Getting here', s?.getting_here],
            ]} />
          </Section>
          <Section step="4" title="Trust & safety">
            <Answers rows={[
              ['Reviews or referrals', a.proof && <Linkified text={a.proof} />],
              ['Agreed to guidelines', a.agreed_guidelines ? '✓ Yes' : 'No'],
            ]} />
          </Section>
        </>
      ) : (
        <>
          <Section step="1" title="You">
            {a.photo_url && <div className="mb-4 w-28"><Gallery photos={[a.photo_url]} /></div>}
            <Answers rows={[
              ['Name', a.name],
              ['Based in', place(a.town, a.region)],
            ]} />
          </Section>
          <Section step="2" title="Your practice">
            <Answers rows={[
              ['What they offer', a.practices?.length ? <Chips items={a.practices} /> : null],
              ['Languages', a.languages],
              ['About them', a.about],
            ]} />
          </Section>
          <Section step="3" title="Training">
            {a.trainings?.length ? (
              <ul className="space-y-2">
                {a.trainings.map((t, i) => (
                  <li key={i} className="rounded-xl bg-surface/70 px-4 py-3 ring-1 ring-line">
                    <p className="text-[14px] font-semibold text-text">{t.title}</p>
                    <p className="text-[13px] text-subtle">{[t.school, t.year].filter(Boolean).join(' · ') || 'No school or year given'}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-[13.5px] italic text-faint">No trainings added</p>}
          </Section>
          <Section step="4" title="Trust & safety">
            {a.references_list?.length ? (
              <ul className="mb-4 space-y-2">
                {a.references_list.map((r, i) => (
                  <li key={i} className="rounded-xl bg-surface/70 px-4 py-3 ring-1 ring-line">
                    <p className="text-[14px] font-semibold text-text">{r.name}</p>
                    <p className="select-all text-[13px] text-subtle"><Linkified text={r.contact} /></p>
                  </li>
                ))}
              </ul>
            ) : <p className="mb-4 text-[13.5px] italic text-faint">No references yet</p>}
            <Answers rows={[
              ['Insurance', a.insurance],
              ['Agreed to guidelines', a.agreed_guidelines ? '✓ Yes' : 'No'],
            ]} />
          </Section>
        </>
      )}

      <Section title="Messages with the Xanadu team">
        <ThreadView messages={thread} />
      </Section>
    </Drawer>
  )
}

/** Shows links and emails in an answer as tappable links */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/\S+|[\w.+-]+@[\w-]+\.[\w.]+)/g)
  return <>{parts.map((p, i) => /^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noreferrer noopener" className="break-all">{p}</a>
    : /@/.test(p) && /^[\w.+-]+@/.test(p) ? <a key={i} href={`mailto:${p}`}>{p}</a> : <span key={i}>{p}</span>)}</>
}
