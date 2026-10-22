import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useGate } from '../gate'
import { Button, Card, EmptyState, PageTitle, Spinner, StatusPill, type Status } from '../ui'

type Member = {
  id: string; role: 'seeker' | 'container' | 'facilitator'; status: 'active' | 'pending' | 'approved' | 'declined'
  onboarded: boolean; name: string | null; email: string | null; photo_url: string | null
  town: string | null; region: string | null; practices: string[] | null; lifestyle: string[] | null
  seeking: string | null; about: string | null; languages: string | null; community_visible: boolean
  created_at: string; last_sign_in_at: string | null
  space_name: string | null; space_country: string | null; space_region: string | null; space_town: string | null
  last_message_at: string | null; awaiting_reply: boolean
}
type Msg = { id: string; from_team: boolean; body: string; created_at: string }
type Act = { id: number; action: string; note: string | null; created_at: string }
type Removal = {
  id: string; user_id: string | null; email: string | null; name: string | null; reason: Reason; note: string
  removed_at: string; removed_by: string | null; restored_at: string | null; restored_by: string | null; restore_note: string | null
}
type Reason = 'safety' | 'harassment' | 'fake' | 'guidelines' | 'asked' | 'other'
const REASONS: { key: Reason; label: string }[] = [
  { key: 'safety', label: 'Safety concern' },
  { key: 'harassment', label: 'Harassment or abuse' },
  { key: 'fake', label: 'Fake account or spam' },
  { key: 'guidelines', label: 'Broke the community guidelines' },
  { key: 'asked', label: 'They asked to leave' },
  { key: 'other', label: 'Something else' },
]
const REASON_LABEL = Object.fromEntries(REASONS.map((r) => [r.key, r.label])) as Record<Reason, string>
const cleanError = (m: string) => { const s = m.replace(/^.*?: (?=[a-z])/, ''); return s.charAt(0).toUpperCase() + s.slice(1) }

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'seeker', label: 'Seekers' },
  { key: 'container', label: 'Containers' },
  { key: 'facilitator', label: 'Facilitators' },
  { key: 'removed', label: 'Removed' },
] as const
type Tab = (typeof TABS)[number]['key']

const ROLE_LABEL = { seeker: 'Seeker', container: 'Container', facilitator: 'Facilitator' } as const
const LANDSCAPE: Record<string, string> = {
  Beach: '#E6CDA6', Ocean: '#7FB3C2', Jungle: '#86A06A', Mountains: '#8C95C9', Desert: '#D9A67E',
  Forest: '#6E9A7E', Countryside: '#B7B470', Town: '#C8A0C4', City: '#A58BD6',
}

const pill = (m: Member): Status | null =>
  m.role === 'seeker' ? null : m.status === 'approved' ? 'approved' : m.status === 'declined' ? 'declined' : m.onboarded ? 'pending' : null

const place = (...p: (string | null)[]) => p.filter(Boolean).join(', ')
const day = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—')
const when = (d: string) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function Members() {
  const { me } = useGate()
  const [all, setAll] = useState<Member[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Member | null>(null)
  const closeDrawer = useCallback(() => setOpen(null), [])
  const [removals, setRemovals] = useState<Removal[]>([])

  const load = useCallback(() => {
    supabase.rpc('team_list_members').then(({ data, error }) => {
      if (error) setError("Couldn't load members. Refresh to try again.")
      else setAll((data as Member[]) ?? [])
    })
    supabase.rpc('team_removals').then(({ data }) => setRemovals((data as Removal[]) ?? []))
  }, [])
  useEffect(() => { load() }, [load])
  /** The open (not restored) removal for each member */
  const removed = useMemo(() => new Map(removals.filter((r) => !r.restored_at && r.user_id).map((r) => [r.user_id!, r])), [removals])

  const counts = useMemo(() => {
    const c = { all: 0, seeker: 0, container: 0, facilitator: 0, removed: 0 }
    all?.forEach((m) => { c.all++; c[m.role]++; if (removed.has(m.id)) c.removed++ })
    return c
  }, [all, removed])

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (all ?? []).filter((m) => (tab === 'all' || (tab === 'removed' ? removed.has(m.id) : m.role === tab)) && (!s ||
      [m.name, m.email, m.space_name, m.town, m.region, m.space_country].some((v) => v?.toLowerCase().includes(s))))
  }, [all, tab, q, removed])

  return (
    <div className="xa-page">
      <PageTitle title="Members">
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, place"
          aria-label="Search members"
          className="h-10 w-full rounded-full bg-navy/70 px-4 text-[14px] text-ink outline-none ring-1 ring-line-2 focus:ring-gold-soft sm:w-72"
        />
      </PageTitle>

      <div role="tablist" className="mb-5 flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={`h-9 shrink-0 rounded-full px-4 text-[13.5px] font-semibold ${tab === t.key ? 'bg-iri text-navy' : 'bg-surface/70 text-subtle ring-1 ring-line hover:text-text'}`}>
            {t.label} <span className={tab === t.key ? 'text-navy/70' : 'text-gold-soft'}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {error && <p className="text-[14px] text-rose">{error}</p>}
      {!all && !error && <div className="grid place-items-center py-16"><Spinner /></div>}

      {all && shown.length === 0 && (
        <EmptyState title={q ? 'No one matches' : 'No one here yet'}
          body={q ? 'Try a different name, email or place.' : 'When people join as this kind of member, they’ll appear here.'} />
      )}

      {all && shown.length > 0 && (
        <Card>
          <ul className="divide-y divide-line">
            {shown.map((m) => (
              <li key={m.id}>
                <button onClick={() => setOpen(m)} className="flex w-full items-center gap-3.5 px-4 py-3 text-left hover:bg-surface/60 sm:px-5">
                  <Avatar m={m} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-semibold text-text">
                      <span className="truncate">{m.role === 'container' && m.space_name ? m.space_name : m.name || 'No name yet'}</span>
                      {m.id === me?.user_id && <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-gold-pale ring-1 ring-gold/40">You</span>}
                      {removed.has(m.id) && <span className="rounded-full bg-rose/12 px-2 py-0.5 text-[11px] font-semibold text-rose ring-1 ring-rose/40">Removed</span>}
                      {m.awaiting_reply && <span className="rounded-full bg-rose/12 px-2 py-0.5 text-[11px] font-semibold text-rose ring-1 ring-rose/40">Awaiting reply</span>}
                    </p>
                    <p className="truncate text-[12.5px] text-faint">
                      {ROLE_LABEL[m.role]}{m.role === 'container' && m.space_name && m.name ? ` · ${m.name}` : ''}
                      {' · '}{place(m.space_town ?? m.town, m.space_region ?? m.region, m.space_country) || 'No location'}
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-[12.5px] text-subtle">Joined {day(m.created_at)}</p>
                    <p className="text-[11.5px] text-faint">Last seen {day(m.last_sign_in_at)}</p>
                  </div>
                  {pill(m) && !removed.has(m.id) && <StatusPill status={pill(m)!} />}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {open && createPortal(<Drawer m={open} onClose={closeDrawer} isMe={open.id === me?.user_id}
        removal={removed.get(open.id) ?? null} history={removals.filter((r) => r.user_id === open.id)} onChanged={load} />, document.body)}
    </div>
  )
}

function Avatar({ m, size = 'size-10' }: { m: Member; size?: string }) {
  return m.photo_url
    ? <img src={m.photo_url} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
    : <div className={`${size} shrink-0 rounded-full bg-portal`} />
}

function Drawer({ m, onClose, isMe, removal, history, onChanged }: {
  m: Member; onClose: () => void; isMe: boolean; removal: Removal | null; history: Removal[]; onChanged: () => void
}) {
  const [thread, setThread] = useState<Msg[] | null>(null)
  const [acts, setActs] = useState<Act[]>([])
  const [extra, setExtra] = useState<{ heard_from: string; community_removed: boolean; reports_against: number } | null>(null)

  useEffect(() => {
    setThread(null)
    supabase.rpc('team_member_thread', { p_member: m.id }).then(({ data }) => setThread((data as Msg[]) ?? []))
    supabase.rpc('team_member_extra', { p_member: m.id }).then(({ data }) => setExtra(data as typeof extra))
    supabase.from('team_actions').select('id, action, note, created_at').eq('target_id', m.id).order('created_at', { ascending: false })
      .then(({ data }) => setActs((data as Act[]) ?? []))
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [m.id, onClose])

  const landscapes = (m.lifestyle ?? []).filter((l) => LANDSCAPE[l])
  const otherWays = (m.lifestyle ?? []).filter((l) => !LANDSCAPE[l])

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={m.name ?? 'Member'}>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-deep/70 backdrop-blur-[2px]" />
      <aside className="xa-page absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-line bg-navy shadow-2xl">
        <header className="pt-safe flex items-start gap-4 border-b border-line px-5 pb-5 sm:pt-6">
          <Avatar m={m} size="size-14" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[28px] leading-tight text-ink">{m.name || 'No name yet'}</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-subtle">
              {ROLE_LABEL[m.role]} {removal ? <span className="inline-flex h-6 items-center rounded-full bg-rose/12 px-2.5 text-[11.5px] font-semibold text-rose ring-1 ring-rose/40">Removed from Xanadu</span> : pill(m) && <StatusPill status={pill(m)!} />}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full text-subtle ring-1 ring-line hover:text-text">✕</button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {removal && <RemovedNotice r={removal} />}
          <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2.5 text-[14px]">
            <dt className="text-faint">Email</dt><dd className="break-all text-text select-all">{m.email ?? '—'}</dd>
            {m.role === 'container' && <><dt className="text-faint">Space</dt><dd className="text-text">{m.space_name || 'Not added yet'}</dd></>}
            <dt className="text-faint">{m.role === 'container' ? 'Location' : m.role === 'facilitator' ? 'Based in' : 'Lives in'}</dt>
            <dd className="text-text">{place(m.space_town ?? m.town, m.space_region ?? m.region, m.space_country) || '—'}</dd>
            {m.languages && <><dt className="text-faint">Languages</dt><dd className="text-text">{m.languages}</dd></>}
            <dt className="text-faint">Joined</dt><dd className="text-text">{day(m.created_at)}</dd>
            <dt className="text-faint">Last seen</dt><dd className="text-text">{day(m.last_sign_in_at)}</dd>
            <dt className="text-faint">Heard about us</dt><dd className="text-text">{extra?.heard_from || <span className="italic text-faint">Not answered</span>}</dd>
            <dt className="text-faint">Community</dt><dd className="text-text">{extra?.community_removed ? 'Removed by the team' : m.community_visible ? 'Visible' : 'Not joined'}{extra?.reports_against ? ` · ${extra.reports_against} report${extra.reports_against > 1 ? 's' : ''}` : ''}</dd>
          </dl>

          {(landscapes.length > 0 || otherWays.length > 0) && (
            <Section title="Way of living">
              <div className="flex flex-wrap gap-1.5">
                {otherWays.map((l) => <span key={l} className="rounded-full bg-surface px-2.5 py-1 text-[12.5px] text-text ring-1 ring-line-2">{l}</span>)}
                {landscapes.map((l) => (
                  <span key={l} className="rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-navy" style={{ background: LANDSCAPE[l] }}>{l}</span>
                ))}
              </div>
            </Section>
          )}
          {m.practices && m.practices.length > 0 && (
            <Section title="Practices"><p className="text-[14px] text-text">{m.practices.join(' · ')}</p></Section>
          )}
          {m.seeking && <Section title="Seeking"><p className="text-[14px] leading-relaxed text-text">{m.seeking}</p></Section>}
          {m.about && <Section title="About"><p className="whitespace-pre-line text-[14px] leading-relaxed text-text">{m.about}</p></Section>}

          <Section title="Messages with the Xanadu team">
            {thread === null ? <Spinner /> : thread.length === 0 ? (
              <p className="text-[13.5px] text-faint">No messages yet.</p>
            ) : (
              <ul className="space-y-2">
                {thread.map((t) => (
                  <li key={t.id} className={`flex ${t.from_team ? 'justify-end' : ''}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${t.from_team ? 'bg-plum text-ink ring-1 ring-plum-line' : 'bg-surface-2 text-text ring-1 ring-line'}`}>
                      <p className="whitespace-pre-line">{t.body}</p>
                      <p className="mt-1 text-[11px] text-faint">{t.from_team ? 'Xanadu team' : 'Member'} · {when(t.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[12px] text-faint">Members' private Community chats are never shown here.</p>
          </Section>

          <Section title="History">
            {acts.length === 0 ? <p className="text-[13.5px] text-faint">No team actions yet.</p> : (
              <ul className="space-y-1.5 text-[13.5px]">
                {acts.map((a) => (
                  <li key={a.id} className="flex justify-between gap-3">
                    <span className="text-text">{a.action.replace(/_/g, ' ')}{a.note ? <span className="text-subtle"> · {a.note}</span> : null}</span>
                    <span className="shrink-0 text-faint">{when(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {history.filter((h) => h.restored_at).length > 0 && (
            <Section title="Past removals">
              <ul className="space-y-2 text-[13px]">
                {history.filter((h) => h.restored_at).map((h) => (
                  <li key={h.id} className="rounded-xl bg-surface/60 px-3.5 py-2.5 ring-1 ring-line">
                    <p className="text-text">{REASON_LABEL[h.reason]} · <span className="text-subtle">{h.note}</span></p>
                    <p className="mt-0.5 text-[12px] text-faint">Removed {day(h.removed_at)}{h.removed_by ? ` by ${h.removed_by}` : ''} · restored {day(h.restored_at)}{h.restored_by ? ` by ${h.restored_by}` : ''}{h.restore_note ? ` · ${h.restore_note}` : ''}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {!isMe && (
            <section className="border-t border-line pt-5">
              {removal ? <RestoreMember m={m} onDone={onChanged} /> : <RemoveMember m={m} onDone={onChanged} />}
            </section>
          )}
        </div>
      </aside>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[11.5px] font-semibold uppercase tracking-[.16em] text-faint">{title}</h3>
      {children}
    </section>
  )
}

function RemovedNotice({ r }: { r: Removal }) {
  return (
    <div className="rounded-2xl bg-rose/10 px-4 py-3.5 ring-1 ring-rose/40">
      <p className="text-[14px] font-semibold text-rose">Removed from Xanadu · {REASON_LABEL[r.reason]}</p>
      <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-text">{r.note}</p>
      <p className="mt-1.5 text-[12px] text-faint">{when(r.removed_at)}{r.removed_by ? ` · by ${r.removed_by}` : ''}. They can’t sign in, and nothing of theirs shows on Xanadu.</p>
    </div>
  )
}

function RemoveMember({ m, onDone }: { m: Member; onDone: () => void }) {
  const [step, setStep] = useState<'idle' | 'confirm'>('idle')
  const [reason, setReason] = useState<Reason | ''>('')
  const [note, setNote] = useState('')
  const [sure, setSure] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const who = m.name || m.email || 'this member'
  const ready = !!reason && note.trim().length >= 3 && sure

  async function remove() {
    setBusy(true); setError(null)
    const { error } = await supabase.rpc('team_remove_from_xanadu', { p_member: m.id, p_reason: reason, p_note: note.trim() })
    setBusy(false)
    if (error) setError(cleanError(error.message))
    else { setStep('idle'); onDone() }
  }

  if (step === 'idle') return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-xs text-[12.5px] text-faint">For safety. Blocks their account and hides everything of theirs. You can restore them later.</p>
      <button onClick={() => setStep('confirm')}
        className="inline-flex h-10 items-center rounded-full px-4 text-[13.5px] font-semibold text-rose ring-1 ring-rose/50 hover:bg-rose/10">
        Remove from Xanadu
      </button>
    </div>
  )
  return (
    <div className="space-y-3 rounded-2xl bg-navy-deep/60 p-4 ring-1 ring-rose/40">
      <p className="text-[15px] font-semibold text-text">Remove {who} from Xanadu?</p>
      <ul className="list-disc space-y-0.5 pl-5 text-[13px] text-subtle">
        <li>They’re signed out and can’t sign in or sign up again with {m.email ?? 'this email'}.</li>
        <li>Their profile{m.role === 'container' ? ', space page' : ''} and offerings disappear, and they leave Community.</li>
        <li>Nothing is deleted. They aren’t emailed. You can restore them later.</li>
      </ul>
      <label className="block">
        <span className="mb-1 block text-[12.5px] font-semibold text-subtle">Why are you removing them?</span>
        <select value={reason} onChange={(e) => setReason(e.target.value as Reason)}
          className="h-10 w-full rounded-xl bg-navy/70 px-3 text-[14px] text-ink ring-1 ring-line-2 focus:ring-gold-soft">
          <option value="" disabled>Choose a reason</option>
          {REASONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[12.5px] font-semibold text-subtle">What happened?</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
          placeholder="A few words for the safety record: what happened, any report or message it relates to."
          className="w-full resize-y rounded-xl bg-navy/70 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink outline-none ring-1 ring-line-2 focus:ring-gold-soft" />
        <span className="text-[11.5px] text-faint">Saved with your name and the date. Only the Xanadu team can see it.</span>
      </label>
      <label className="flex items-start gap-2 text-[13px] text-text">
        <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} className="mt-0.5 size-4 accent-[#E09AC4]" />
        I’m sure I want to remove {who} from Xanadu.
      </label>
      {error && <p role="alert" className="text-[13px] text-rose">{error}</p>}
      <div className="flex gap-2">
        <Button variant="quiet" onClick={() => { setStep('idle'); setError(null) }} disabled={busy}>Cancel</Button>
        <button onClick={remove} disabled={!ready || busy}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-rose px-5 text-[14px] font-semibold text-navy disabled:opacity-40">
          {busy ? 'Removing…' : 'Remove from Xanadu'}
        </button>
      </div>
    </div>
  )
}

function RestoreMember({ m, onDone }: { m: Member; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function restore() {
    setBusy(true); setError(null)
    const { error } = await supabase.rpc('team_restore_to_xanadu', { p_member: m.id, p_note: note.trim() })
    setBusy(false)
    if (error) setError(cleanError(error.message))
    else { setOpen(false); onDone() }
  }
  if (!open) return (
    <div className="flex justify-end"><Button variant="quiet" onClick={() => setOpen(true)}>Restore to Xanadu</Button></div>
  )
  return (
    <div className="space-y-3 rounded-2xl bg-navy-deep/60 p-4 ring-1 ring-line-2">
      <p className="text-[15px] font-semibold text-text">Restore {m.name || m.email}?</p>
      <p className="text-[13px] text-subtle">They can sign in again, and their status, Community and offerings go back to how they were. Events other hosts had linked to them stay unlinked.</p>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Why you’re restoring them (optional)"
        className="w-full resize-y rounded-xl bg-navy/70 px-3.5 py-2.5 text-[13.5px] text-ink outline-none ring-1 ring-line-2 focus:ring-gold-soft" />
      {error && <p role="alert" className="text-[13px] text-rose">{error}</p>}
      <div className="flex gap-2">
        <Button variant="quiet" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
        <Button className="flex-1" onClick={restore} disabled={busy}>{busy ? 'Restoring…' : 'Restore'}</Button>
      </div>
    </div>
  )
}
