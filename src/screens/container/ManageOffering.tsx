import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BackButton, Chip, ContainerTabs, EmptyState, Field, inputCls, PrimaryLink, Screen, Switch } from '../../components/ui'
import { IconPeople } from '../../components/icons'
import OfferingCard, { StatusPill, dateRange } from '../../components/OfferingCard'
import { EditFooter } from '../../components/edit'
import { Loading } from '../../auth'
import { friendlyError, supabase } from '../../lib/supabase'
import { PRACTICES } from '../../data'
import { useOfferings, type Offering } from '../../store'

const FORMATS = ['Retreat', 'Training', 'Drop-in'] as const
const INCLUDED = [['stay', 'Stay'], ['meals', 'Meals'], ['schedule', 'Daily schedule'], ['outings', 'Outings'], ['transport', 'Airport transport']] as const

/** Edit an offering's basics after it's been submitted, or delete it. */
function EditOffering({ o, onDone, update }: { o: Offering; onDone: () => void; update: (id: string, patch: Partial<Offering>) => Promise<string | null> }) {
  const navigate = useNavigate()
  const [d, setD] = useState({
    title: o.title, format: o.format, practices: o.practices, description: o.description,
    start: o.start_date ?? '', end: o.end_date ?? '', spots: o.spots, price: o.price_usd != null ? String(o.price_usd) : '', included: { ...o.included },
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }))

  const save = async () => {
    setError('')
    if (!d.title.trim()) { setError('Please give your offering a title.'); return }
    if (!d.practices.length) { setError('Please choose at least one practice.'); return }
    if (!d.start) { setError('Please choose a start date.'); return }
    if (d.end && d.end < d.start) { setError('The end date is before the start date.'); return }
    if (d.price && !(Number(d.price) >= 0)) { setError('Please enter the price as a number, e.g. 850.'); return }
    setBusy(true)
    const err = await update(o.id, {
      title: d.title.trim(), format: d.format, practices: d.practices, description: d.description.trim(),
      start_date: d.start, end_date: d.end || d.start, spots: d.spots, price_usd: d.price ? Number(d.price) : null, included: d.included,
    })
    setBusy(false)
    if (err) setError(err); else onDone()
  }
  const remove = async () => {
    setBusy(true)
    const { error } = await supabase.from('offerings').delete().eq('id', o.id)
    setBusy(false)
    if (error) { setError(friendlyError(error.message)); return }
    navigate('/container', { replace: true })
  }
  const box = (on: boolean) => `min-h-12 rounded-xl border text-sm ${on ? 'border-gold bg-gold font-semibold text-navy' : 'border-line-2 text-text'}`

  return (
    <Screen footer={<EditFooter onCancel={onDone} onSave={save} error={error} busy={busy} />}>
      <div className="flex flex-col gap-[18px] px-5 pt-safe pb-8">
        <h1 className="m-0 font-display text-[32px] font-medium text-ink">Edit offering</h1>
        {o.status === 'live' && <p className="m-0 rounded-xl bg-plum px-3.5 py-3 text-[13px] leading-normal text-muted">This offering is live. Your changes show to guests as soon as you save.</p>}
        <div className="grid grid-cols-3 gap-2">{FORMATS.map((f) => <button key={f} type="button" aria-pressed={d.format === f} onClick={() => set('format', f)} className={box(d.format === f)}>{f}</button>)}</div>
        <Field label="Title"><input value={d.title} onChange={(e) => set('title', e.target.value)} className={inputCls} /></Field>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-muted">Practices</span>
          <div className="flex flex-wrap gap-2">{PRACTICES.filter((p) => p !== 'Trainings').map((p) => (
            <Chip key={p} on={d.practices.includes(p)} onClick={() => set('practices', d.practices.includes(p) ? d.practices.filter((x) => x !== p) : [...d.practices, p])}>{p}</Chip>
          ))}</div>
        </div>
        <Field label="Description"><textarea rows={5} value={d.description} onChange={(e) => set('description', e.target.value)} className={`${inputCls} resize-none py-3 leading-relaxed`} /></Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Starts"><input type="date" value={d.start} onChange={(e) => set('start', e.target.value)} className={`${inputCls} px-3 text-sm [color-scheme:dark]`} /></Field>
          <Field label="Ends"><input type="date" value={d.end} min={d.start || undefined} onChange={(e) => set('end', e.target.value)} className={`${inputCls} px-3 text-sm [color-scheme:dark]`} /></Field>
        </div>
        <div className="flex items-center justify-between rounded-[14px] bg-surface-2 px-4 py-3.5">
          <span className="text-[15px] text-ink">Spots</span>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Fewer spots" onClick={() => set('spots', Math.max(1, d.spots - 1))} className="h-11 w-11 rounded-xl border border-line-2 text-xl text-text">−</button>
            <span className="min-w-7 text-center text-lg font-semibold text-ink" aria-live="polite">{d.spots}</span>
            <button type="button" aria-label="More spots" onClick={() => set('spots', d.spots + 1)} className="h-11 w-11 rounded-xl border border-line-2 text-xl text-text">+</button>
          </div>
        </div>
        <Field label="Price per person (USD)"><input inputMode="decimal" value={d.price} onChange={(e) => set('price', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="e.g. 850" className={inputCls} /></Field>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-muted">Held for guests</span>
          {INCLUDED.map(([k, label]) => (
            <div key={k} className="flex items-center justify-between gap-3 rounded-[14px] bg-surface-2 px-4 py-3">
              <span className="text-[15px] text-ink">{label}</span>
              <Switch on={!!d.included[k]} onChange={(v) => set('included', { ...d.included, [k]: v })} label={label} />
            </div>
          ))}
        </div>
        {confirmDelete ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-gold/50 p-4">
            <span className="text-[14px] text-text">Delete this offering? This can't be undone.</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="min-h-11 flex-1 rounded-xl border border-line-2 text-[13px] text-muted">Keep it</button>
              <button type="button" disabled={busy} onClick={remove} className="min-h-11 flex-1 rounded-xl bg-gold text-[13px] font-semibold text-navy">Delete</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className="min-h-11 self-center text-[13px] text-subtle">Delete offering</button>
        )}
      </div>
    </Screen>
  )
}

const TABS = ['Guests', 'Schedule', 'Meals', 'Outings'] as const

/** Number of days the offering runs (1–14), from its dates. */
function dayCount(o: Offering) {
  if (!o.start_date) return 3
  const a = new Date(o.start_date + 'T12:00:00').getTime()
  const b = new Date((o.end_date || o.start_date) + 'T12:00:00').getTime()
  return Math.min(14, Math.max(1, Math.round((b - a) / 86400000) + 1))
}

/** Manage one offering: guests, a day-by-day schedule, meals and outings. Everything saves to the offering. */
export default function ManageOffering() {
  const [params] = useSearchParams()
  const { offerings, loading, update } = useOfferings()
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<(typeof TABS)[number]>('Guests')
  const [day, setDay] = useState(1)
  const [time, setTime] = useState('')
  const [what, setWhat] = useState('')
  const [outing, setOuting] = useState('')
  const [outingDay, setOutingDay] = useState('1')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <Loading label="Loading your offering…" />
  const id = params.get('id')
  const o = offerings.find((x) => x.id === id)

  // Offerings tab: every offering at a glance
  if (!id && offerings.length) {
    return (
      <Screen footer={<ContainerTabs />}>
        <div className="flex flex-col gap-4 px-5 pt-safe pb-6">
          <div className="flex items-baseline justify-between">
            <h1 className="m-0 font-display text-[34px] font-medium text-ink">Offerings</h1>
            <Link to="/container/new" className="text-[13px] no-underline">+ New offering</Link>
          </div>
          {offerings.map((x) => <OfferingCard key={x.id} o={x} />)}
        </div>
      </Screen>
    )
  }

  if (!o) {
    return (
      <Screen footer={<ContainerTabs />}>
        <div className="flex flex-col gap-5 px-5 pt-safe pb-6">
          <h1 className="m-0 font-display text-[34px] font-medium text-ink">Offerings</h1>
          {id && <p className="m-0 text-[14px] text-muted">That offering couldn't be found. It may have been deleted.</p>}
          <EmptyState title="No offerings yet" action={<PrimaryLink to="/container/new" className="mt-1 min-h-[46px] text-sm">Create your first offering</PrimaryLink>}>
            Create a retreat, training or drop-in. Guests, schedules, meals and outings will all live here.
          </EmptyState>
        </div>
      </Screen>
    )
  }

  if (editing) return <EditOffering o={o} onDone={() => setEditing(false)} update={update} />

  const resubmit = async () => {
    setBusy(true); setError('')
    const err = await update(o.id, { status: 'in_review' })
    setBusy(false)
    if (err) setError(err)
  }

  const days = dayCount(o)
  const schedule = o.schedule ?? {}
  const sessions = schedule[String(day)] ?? []
  const outings = schedule.outings ?? []

  const saveSchedule = async (next: Record<string, string[]>) => {
    setBusy(true); setError('')
    const err = await update(o.id, { schedule: next })
    setBusy(false)
    if (err) setError(err)
    return !err
  }
  const addSession = async () => {
    if (!what.trim()) { setError('Add what is happening, e.g. Sunrise breathwork.'); return }
    const entry = `${time.trim() || '—'}|${what.trim()}`
    if (await saveSchedule({ ...schedule, [String(day)]: [...sessions, entry].sort() })) { setTime(''); setWhat('') }
  }
  const removeSession = (i: number) => saveSchedule({ ...schedule, [String(day)]: sessions.filter((_, j) => j !== i) })
  const addOuting = async () => {
    if (!outing.trim()) { setError('Name the outing, e.g. Waterfall hike.'); return }
    if (await saveSchedule({ ...schedule, outings: [...outings, `${outingDay}|${outing.trim()}`] })) setOuting('')
  }
  const removeOuting = (i: number) => saveSchedule({ ...schedule, outings: outings.filter((_, j) => j !== i) })

  const header = (
    <div className="flex flex-col gap-3.5 bg-plum px-5 pt-safe">
      <div className="flex items-center justify-between">
        <BackButton to="/container/offering" />
        <div className="flex items-center gap-1">
          <Link to={`/experience/${o.id}`} className="flex min-h-11 items-center px-2 text-[13px] no-underline">Preview</Link>
          <button type="button" onClick={() => { setError(''); setEditing(true) }} className="min-h-10 rounded-full border border-gold px-3.5 text-[13px] font-semibold text-gold-pale">Edit details</button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2"><StatusPill status={o.status} /><span className="text-xs text-gold-soft">{`${o.format} · ${dateRange(o)}`}</span></div>
        <h1 className="m-0 font-display text-[30px] leading-[1.05] font-medium text-ink">{o.title || 'Untitled offering'}</h1>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 rounded-full bg-plum-line" />
        <span className="text-xs text-muted">{o.status === 'live' ? `0 of ${o.spots} spots filled` : `0 of ${o.spots} spots · opens to guests once approved`}</span>
      </div>
      <div role="tablist" className="grid grid-cols-4">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setError('') }}
            className={`min-h-11 border-b-2 text-sm ${tab === t ? 'border-gold font-semibold text-ink' : 'border-transparent text-subtle'}`}>{t}</button>
        ))}
      </div>
    </div>
  )

  const row = 'flex items-center gap-3 rounded-[14px] bg-surface px-3.5 py-3'
  const remove = 'ml-auto flex h-9 min-w-9 items-center justify-center rounded-full text-sm text-subtle'

  return (
    <Screen header={header} footer={<ContainerTabs />}>
      <div className="flex flex-col gap-3 px-5 pt-[18px] pb-7">
        {o.status === 'declined' && (
          <div className="flex flex-col gap-2.5 rounded-2xl border border-gold/60 bg-plum p-4">
            <span className="text-[15px] font-semibold text-ink">The team asked for a few changes</span>
            <span className="text-[13px] leading-normal text-subtle">Their note is in your Inbox. Tap Edit details to make the changes, then resubmit.</span>
            <div className="flex gap-2">
              <Link to="/container/inbox" className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-line-2 text-[13px] text-text no-underline">Open Inbox</Link>
              <button type="button" disabled={busy} onClick={resubmit} className="min-h-11 flex-1 rounded-xl bg-gold text-[13px] font-semibold text-navy disabled:opacity-70">Resubmit for review</button>
            </div>
          </div>
        )}
        {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}

        {tab === 'Guests' && (
          <EmptyState icon={<IconPeople size={32} />} title="No guest requests yet">
            When Seekers request a spot, you'll approve or decline them here. Their dietary needs and outing choices come with each request.
          </EmptyState>
        )}

        {tab === 'Schedule' && (
          <>
            <div className="flex gap-2 overflow-x-auto">
              {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                <button key={d} type="button" aria-pressed={day === d} onClick={() => setDay(d)}
                  className={`min-h-10 flex-none rounded-full border px-4 text-[13px] ${day === d ? 'border-gold bg-gold font-semibold text-navy' : 'border-line-2 text-muted'}`}>{`Day ${d}`}</button>
              ))}
            </div>
            {sessions.map((s, i) => {
              const [t, w] = s.split('|')
              return (
                <div key={i} className={row}>
                  <span className="w-[56px] flex-none text-sm font-semibold text-gold-pale">{t}</span>
                  <span className="text-[15px] text-ink">{w}</span>
                  <button type="button" aria-label={`Remove ${w}`} onClick={() => removeSession(i)} className={remove}>✕</button>
                </div>
              )
            })}
            {!sessions.length && <span className="text-[13px] text-subtle">{`Nothing planned for Day ${day} yet.`}</span>}
            <div className="flex flex-col gap-2.5 rounded-2xl border border-dashed border-slate p-3.5">
              <div className="grid grid-cols-[96px_1fr] gap-2.5">
                <Field label="Time"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${inputCls} px-2.5 text-sm [color-scheme:dark]`} /></Field>
                <Field label="What's happening"><input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="e.g. Opening circle" className={inputCls} /></Field>
              </div>
              <button type="button" disabled={busy} onClick={addSession} className="min-h-11 rounded-xl bg-gold text-sm font-semibold text-navy disabled:opacity-70">{busy ? 'Saving…' : `Add to Day ${day}`}</button>
            </div>
          </>
        )}

        {tab === 'Meals' && (
          <>
            <div className="flex flex-col gap-1.5 rounded-2xl bg-plum p-4">
              <span className="text-[15px] font-semibold text-ink">{o.included?.meals ? 'Meals are included' : 'Meals are not included'}</span>
              <span className="text-[13px] leading-normal text-subtle">Guests share dietary needs when they request a spot. They'll be listed here for your kitchen.</span>
            </div>
            <EmptyState title="No dietary needs yet">They'll appear here as guests sign up.</EmptyState>
          </>
        )}

        {tab === 'Outings' && (
          <>
            {outings.map((x, i) => {
              const [d, name] = x.split('|')
              return (
                <div key={i} className={row}>
                  <span className="w-[56px] flex-none text-sm font-semibold text-gold-pale">{`Day ${d}`}</span>
                  <span className="text-[15px] text-ink">{name}</span>
                  <button type="button" aria-label={`Remove ${name}`} onClick={() => removeOuting(i)} className={remove}>✕</button>
                </div>
              )
            })}
            {!outings.length && <span className="text-[13px] leading-normal text-subtle">Add optional trips like a hike or surf lesson. Guests opt in, and you'll see who's going.</span>}
            <div className="flex flex-col gap-2.5 rounded-2xl border border-dashed border-slate p-3.5">
              <div className="grid grid-cols-[96px_1fr] gap-2.5">
                <Field label="Day">
                  <select value={outingDay} onChange={(e) => setOutingDay(e.target.value)} className={`${inputCls} px-2.5 text-sm`}>
                    {Array.from({ length: days }, (_, i) => String(i + 1)).map((d) => <option key={d} value={d}>{`Day ${d}`}</option>)}
                  </select>
                </Field>
                <Field label="Outing"><input value={outing} onChange={(e) => setOuting(e.target.value)} placeholder="e.g. Waterfall hike" className={inputCls} /></Field>
              </div>
              <button type="button" disabled={busy} onClick={addOuting} className="min-h-11 rounded-xl bg-gold text-sm font-semibold text-navy disabled:opacity-70">{busy ? 'Saving…' : 'Add outing'}</button>
            </div>
          </>
        )}

        {offerings.length > 1 && (
          <section className="mt-4 flex flex-col gap-2">
            <span className="text-xs tracking-[0.14em] text-subtle uppercase">Your other offerings</span>
            {offerings.filter((x) => x.id !== o.id).map((x) => (
              <Link key={x.id} to={`/container/offering?id=${x.id}`} className="flex items-center justify-between rounded-[14px] bg-surface p-3.5 text-text no-underline">
                <span className="text-sm">{x.title || 'Untitled offering'}</span><StatusPill status={x.status} />
              </Link>
            ))}
          </section>
        )}
      </div>
    </Screen>
  )
}
