import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Chip, EmptyState, H1, Page, Screen, SeekerTabs, Segmented } from '../../components/ui'
import { IconBack, IconCalendar, IconNext } from '../../components/icons'
import ExperienceCard from '../../components/ExperienceCard'
import { useListings, type Listing } from '../../store'

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const at = (s: string) => new Date(s + 'T12:00:00')
const add = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12)
  return add(x, -((x.getDay() + 6) % 7)) // weeks start on Monday
}
const fmt = (s: string, o: Intl.DateTimeFormatOptions) => at(s).toLocaleDateString('en-US', o)
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type View = 'Month' | 'Week' | 'Day'
/** Runs on this day? */
const runs = (e: Listing, d: string) => !!e.start_date && e.start_date <= d && (e.end_date || e.start_date) >= d
/** Overlaps these dates? */
const overlaps = (e: Listing, a: string, b: string) => !!e.start_date && e.start_date <= b && (e.end_date || e.start_date) >= a

/**
 * Every live experience by date. Month, Week or Day view, arrows to move through time.
 * In Month view tap a date to see that day, or tap a second date to pick a range.
 */
export default function Calendar() {
  const today = useMemo(() => iso(new Date()), [])
  const [view, setView] = useState<View>('Month')
  const [cursor, setCursor] = useState(today) // the day the period is anchored on
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState('') // '' = a single day
  const [picking, setPicking] = useState(false) // a first date was just tapped: the next later tap ends the range
  const [place, setPlace] = useState('Everywhere')
  const { listings, loading } = useListings()

  const countries = Array.from(new Set(listings.map((e) => e.space?.country.trim()).filter(Boolean) as string[])).sort()
  const dated = listings.filter((e) => e.start_date && (place === 'Everywhere' || e.space?.country === place))
  const busyOn = (d: string) => dated.filter((e) => runs(e, d)).length

  const c = at(cursor)
  const move = (n: number) => {
    const next = view === 'Month' ? new Date(c.getFullYear(), c.getMonth() + n, 1, 12) : add(c, view === 'Week' ? 7 * n : n)
    setCursor(iso(next))
    if (view === 'Day') { setFrom(iso(next)); setTo('') }
  }
  const pick = (d: string) => {
    // first tap: a day; second tap later in time: the end of a range; any other tap starts again
    if (view === 'Month' && picking && d > from) { setTo(d); setPicking(false) }
    else { setFrom(d); setTo(''); setPicking(true) }
  }
  const changeView = (v: View) => { setView(v); setCursor(from || cursor) }
  const goToday = () => { setCursor(today); setFrom(today); setTo(''); setPicking(false) }

  const title = view === 'Month' ? c.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : view === 'Week' ? (() => { const a = startOfWeek(c), b = add(a, 6); return `${a.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${b.toLocaleDateString('en-US', a.getMonth() === b.getMonth() ? { day: 'numeric' } : { month: 'short', day: 'numeric' })}` })()
      : fmt(cursor, { weekday: 'long', month: 'long', day: 'numeric' })

  const arrows = (
    <div className="flex items-center gap-1 text-muted">
      {cursor !== today && <button type="button" onClick={goToday} className="min-h-10 px-2 text-[13px] text-gold-soft">Today</button>}
      <button type="button" aria-label={`Previous ${view.toLowerCase()}`} onClick={() => move(-1)} className="flex h-11 w-11 items-center justify-center rounded-xl"><IconBack size={18} /></button>
      <button type="button" aria-label={`Next ${view.toLowerCase()}`} onClick={() => move(1)} className="flex h-11 w-11 items-center justify-center rounded-xl"><IconNext /></button>
    </div>
  )

  const empty = (
    <EmptyState icon={<IconCalendar size={36} />} title={dated.length ? 'Nothing on these dates' : 'Nothing scheduled yet'}
      action={<Link to="/discover" className="flex min-h-11 items-center text-sm no-underline">Back to Discover</Link>}>
      {dated.length ? 'Days with a dot have something on. Try another day or week.' : 'When spaces and Facilitators publish retreats, trainings and classes, they’ll show up here by day.'}
    </EmptyState>
  )

  return (
    <Screen footer={<SeekerTabs />}>
      <Page className="gap-4">
        <H1>Calendar</H1>
        <Segmented options={['Month', 'Week', 'Day'] as const} value={view} onChange={changeView} label="Calendar view" />
        {countries.length > 1 && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
            {['Everywhere', ...countries].map((r) => <Chip key={r} solid on={place === r} onClick={() => setPlace(r)}>{r}</Chip>)}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-[22px] leading-tight text-ink">{title}</span>
            {arrows}
          </div>
          {view === 'Month' && <MonthGrid cursor={c} today={today} from={from} to={to} busyOn={busyOn} onPick={pick} />}
          {view === 'Week' && <WeekStrip cursor={c} today={today} selected={from} busyOn={busyOn} onPick={(d) => { setView('Day'); setCursor(d); setFrom(d); setTo('') }} />}
        </div>

        {loading ? <span className="text-[13px] text-subtle">Finding experiences…</span>
          : view === 'Week' ? <WeekAgenda cursor={c} list={dated} onDay={(d) => { setView('Day'); setCursor(d); setFrom(d); setTo('') }} empty={empty} />
            : <Picked from={view === 'Day' ? cursor : from} to={view === 'Day' ? '' : to} list={dated} empty={empty} onClear={to ? () => setTo('') : undefined} />}
      </Page>
    </Screen>
  )
}

function MonthGrid({ cursor, today, from, to, busyOn, onPick }: {
  cursor: Date; today: string; from: string; to: string; busyOn: (d: string) => number; onPick: (d: string) => void
}) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12)
  const start = startOfWeek(first)
  const weeks = Math.ceil((((first.getDay() + 6) % 7) + new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()) / 7)
  const cells = Array.from({ length: weeks * 7 }, (_, i) => add(start, i))
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-7 text-center text-[11px] text-subtle">{WEEKDAYS.map((w) => <span key={w}>{w}</span>)}</div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d) => {
          const id = iso(d)
          const inMonth = d.getMonth() === cursor.getMonth()
          const ends = id === from || id === to
          const between = !!to && id > from && id < to
          const n = busyOn(id)
          return (
            <button key={id} type="button" onClick={() => onPick(id)} aria-pressed={ends}
              aria-label={`${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${n ? `, ${n} ${n === 1 ? 'experience' : 'experiences'}` : ''}`}
              className={`flex h-11 flex-col items-center justify-center gap-0.5 text-[14px] ${between ? 'bg-iri-violet/15' : ''} ${id === from && to ? 'rounded-l-[12px]' : ''} ${id === to ? 'rounded-r-[12px]' : ''}`}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${ends ? 'bg-iri font-semibold text-navy' : id === today ? 'ring-1 ring-gold/70 text-ink' : inMonth ? 'text-text' : 'text-faint'}`}>{d.getDate()}</span>
              <span className="flex h-[5px] gap-[3px]">
                {Array.from({ length: Math.min(3, n) }, (_, i) => <span key={i} className="h-[5px] w-[5px] rounded-full bg-iri-strong" />)}
              </span>
            </button>
          )
        })}
      </div>
      <span className="pt-1 text-[12px] text-subtle">Tap a date, then a later one to see a range.</span>
    </div>
  )
}

function WeekStrip({ cursor, today, selected, busyOn, onPick }: { cursor: Date; today: string; selected: string; busyOn: (d: string) => number; onPick: (d: string) => void }) {
  const start = startOfWeek(cursor)
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 7 }, (_, i) => add(start, i)).map((d, i) => {
        const id = iso(d); const on = id === selected
        return (
          <button key={id} type="button" onClick={() => onPick(id)} aria-pressed={on}
            aria-label={d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 rounded-[14px] ${on ? 'bg-iri text-navy' : id === today ? 'ring-1 ring-gold/60 text-text' : 'text-text'}`}>
            <span className="text-[11px] opacity-80">{WEEKDAYS[i]}</span>
            <span className="text-base font-semibold">{d.getDate()}</span>
            <span className={`h-[5px] w-[5px] rounded-full ${busyOn(id) ? (on ? 'bg-navy' : 'bg-iri-strong') : 'bg-transparent'}`} />
          </button>
        )
      })}
    </div>
  )
}

/** Week view: each day of the week with what's on. */
function WeekAgenda({ cursor, list, onDay, empty }: { cursor: Date; list: Listing[]; onDay: (d: string) => void; empty: ReactNode }) {
  const start = startOfWeek(cursor)
  const days = Array.from({ length: 7 }, (_, i) => iso(add(start, i)))
  if (!list.some((e) => overlaps(e, days[0], days[6]))) return <>{empty}</>
  return (
    <div className="flex flex-col gap-4">
      {days.filter((d) => list.some((e) => runs(e, d))).map((d) => {
        const on = list.filter((e) => runs(e, d))
        return (
          <section key={d} className="flex flex-col gap-2">
            <button type="button" onClick={() => onDay(d)} className="flex items-baseline justify-between text-left">
              <span className="text-xs tracking-[0.14em] text-subtle uppercase">{fmt(d, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              <span className="text-[12px] text-gold-soft">Day view ›</span>
            </button>
            {on.map((e) => <ExperienceCard key={e.id} e={e} />)}
          </section>
        )
      })}
    </div>
  )
}

/** Month and Day views: what's on the chosen day or range. */
function Picked({ from, to, list, empty, onClear }: { from: string; to: string; list: Listing[]; empty: ReactNode; onClear?: () => void }) {
  const on = list.filter((e) => (to ? overlaps(e, from, to) : runs(e, from)))
  const label = to ? `${fmt(from, { month: 'short', day: 'numeric' })} – ${fmt(to, { month: 'short', day: 'numeric' })}` : fmt(from, { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs tracking-[0.14em] text-subtle uppercase">{label}</span>
        {onClear && <button type="button" onClick={onClear} className="min-h-9 text-[13px] text-gold-soft">Clear range</button>}
      </div>
      {on.length ? on.map((e) => <ExperienceCard key={e.id} e={e} />) : empty}
    </div>
  )
}
