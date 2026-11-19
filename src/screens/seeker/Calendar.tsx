import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Chip, EmptyState, H1, Page, Screen, SeekerTabs, Segmented } from '../../components/ui'
import { IconBack, IconCalendar, IconNext } from '../../components/icons'
import ExperienceCard from '../../components/ExperienceCard'
import CommunityEventCard from '../../components/CommunityEventCard'
import FoundingInvite from '../../components/FoundingInvite'
import { GuestBar, GuestInvite, MembersLink } from '../../components/Guest'
import { useAuth } from '../../auth'
import { CATEGORIES, inCategory, typesLabel, useCommunityEvents, type CommunityEvent } from '../../events'
import TypePicker from '../../components/TypePicker'
import { specialBetween, specialOn, type SpecialDay } from '../../specialDays'
import { useListings, type Listing } from '../../store'

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const at = (s: string) => new Date(s + 'T12:00:00')
const add = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const shift = (s: string, n: number) => iso(add(at(s), n))
function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12)
  return add(x, -((x.getDay() + 6) % 7)) // weeks start on Monday
}
const fmt = (s: string, o: Intl.DateTimeFormatOptions) => at(s).toLocaleDateString('en-US', o)
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
/** "6:30 pm" → minutes after midnight (unknown times sort last). */
const minutes = (t = '') => {
  const m = t.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (!m) return 24 * 60
  let h = Number(m[1]) % 12; if (m[3] === 'pm') h += 12
  return h * 60 + Number(m[2] ?? 0)
}

/** Reviewed experiences and community events share the calendar. */
type Item = Listing | CommunityEvent
const isCommunity = (e: Item): e is CommunityEvent => 'submitted_by' in e && 'tags' in e
const timeOf = (e: Item) => (isCommunity(e) ? e.start_time : '')
/** Overlaps these dates? */
const overlaps = (e: Item, a: string, b: string) => !!e.start_date && e.start_date <= b && (e.end_date || e.start_date) >= a

/** Moons and the sky in violet, holidays in gold, celebrations in teal. */
const tagCls = (x: SpecialDay) => x.kind === 'moon' || x.kind === 'sky' ? 'border-iri-violet/40 bg-iri-violet/10 text-ink'
  : x.kind === 'holiday' ? 'border-gold/40 bg-gold/10 text-gold-pale' : 'border-iri-teal/40 bg-iri-teal/10 text-ink'

type Quick = '' | 'Coming up' | 'Today' | 'Tomorrow' | 'This weekend' | 'This week' | 'Next 2 weeks' | 'This month'
const QUICK: Quick[] = ['Coming up', 'Today', 'Tomorrow', 'This weekend', 'This week', 'Next 2 weeks', 'This month']
type Mode = 'One day' | 'Date range'

/**
 * What's on, as a list by day. Opens on today and the next three days.
 * "When" chips answer the common questions in one tap; "Pick dates" opens a month to choose
 * one day or a date range, chosen up front so two taps never turn into a range by surprise.
 * "I'm looking for" takes several types at once: an event shows if it fits any of them.
 */
export default function Calendar() {
  const today = useMemo(() => iso(new Date()), [])
  const [params] = useSearchParams()
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(() => shift(today, 3))
  const [quick, setQuick] = useState<Quick>('Coming up')
  const [cats, setCats] = useState<string[]>(() => (params.get('type') ?? '').split(',').filter((t) => CATEGORIES.some((c) => c.label === t)))
  const [place, setPlace] = useState('Everywhere')
  const [picking, setPicking] = useState(false)
  const { listings, loading } = useListings()
  const { events } = useCommunityEvents()
  const { session } = useAuth()
  const guest = !session

  const countries = Array.from(new Set(listings.map((e) => e.space?.country.trim()).filter(Boolean) as string[])).sort()
  const all: Item[] = [
    ...listings.filter((e) => e.start_date && (place === 'Everywhere' || e.space?.country === place)),
    ...events.filter((e) => e.start_date),
  ].sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? '') || minutes(timeOf(a)) - minutes(timeOf(b)))
  const dated = cats.length ? all.filter((e) => cats.some((c) => inCategory(e, c))) : all
  const has = (label: string) => all.some((e) => inCategory(e, label))

  /** Quick periods: one tap for the common questions ("what's on this weekend?"). */
  const choose = (q: Quick) => {
    setQuick(q); setPicking(false)
    const t = at(today), dow = t.getDay() // 0 Sun … 6 Sat
    const set = (a: string, b: string) => { setFrom(a); setTo(b) }
    if (q === 'Coming up') return set(today, shift(today, 3))
    if (q === 'Today') return set(today, today)
    if (q === 'Tomorrow') { const d = shift(today, 1); return set(d, d) }
    if (q === 'This weekend') {
      const fri = dow === 0 ? add(t, -2) : dow === 6 ? add(t, -1) : add(t, 5 - dow)
      const a = iso(fri) < today ? today : iso(fri)
      return set(a, iso(add(fri, 2)))
    }
    if (q === 'This week') return set(today, iso(add(startOfWeek(t), 6)))
    if (q === 'Next 2 weeks') return set(today, shift(today, 13))
    if (q === 'This month') return set(today, iso(new Date(t.getFullYear(), t.getMonth() + 1, 0, 12)))
  }

  const on = dated.filter((e) => overlaps(e, from, to))
  // after the chosen dates: what's next, so a quiet day never ends in a dead end
  const next = on.length < 4 ? dated.filter((e) => e.start_date! > to).slice(0, 5) : []
  const period = from === to
    ? from === today ? 'Today' : from === shift(today, 1) ? 'Tomorrow' : fmt(from, { weekday: 'long', month: 'long', day: 'numeric' })
    : `${fmt(from, { weekday: 'short', month: 'short', day: 'numeric' })} – ${fmt(to, { weekday: 'short', month: 'short', day: 'numeric' })}`

  // the list, by day: an event that began earlier shows under the first day of the chosen dates
  const byDay = new Map<string, Item[]>()
  for (const e of on) {
    const d = e.start_date! < from ? from : e.start_date!
    byDay.set(d, [...(byDay.get(d) ?? []), e])
  }
  const days = [...byDay.keys()].sort()
  const specials = specialBetween(from, to)
  const dayLabel = (d: string) => (d === today ? `Today · ${fmt(d, { weekday: 'short', month: 'short', day: 'numeric' })}`
    : d === shift(today, 1) ? `Tomorrow · ${fmt(d, { weekday: 'short', month: 'short', day: 'numeric' })}`
      : fmt(d, { weekday: 'long', month: 'short', day: 'numeric' }))
  const card = (e: Item) => (isCommunity(e) ? <CommunityEventCard key={e.id} e={e} /> : <ExperienceCard key={e.id} e={e} />)

  return (
    <Screen footer={guest ? <GuestBar /> : <SeekerTabs />}>
      <Page className="gap-4">
        <div className="flex items-end justify-between gap-3">
          <H1>Calendar</H1>
          {guest
            ? <MembersLink to="/events/new" title="Join free to share an event" body="Members share the gatherings they love, and the community calendar grows from there." className="mb-1 flex min-h-10 flex-none items-center rounded-full border border-line-2 px-3.5 text-[13px] text-text">+ Share an event</MembersLink>
            : <Link to="/events/new" className="mb-1 flex min-h-10 flex-none items-center rounded-full border border-line-2 px-3.5 text-[13px] text-text no-underline">+ Share an event</Link>}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs tracking-[0.14em] text-subtle uppercase">I’m looking for</span>
            <span className="text-[12px] text-faint">{cats.length ? typesLabel(cats) : 'Pick as many as you like'}</span>
          </div>
          <TypePicker value={cats} onChange={setCats} has={has} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[0.14em] text-subtle uppercase">When</span>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-0.5" role="group" aria-label="Choose a period">
            {QUICK.map((q) => <Chip key={q} solid on={quick === q} onClick={() => choose(q)}>{q}</Chip>)}
          </div>
        </div>

        {countries.length > 1 && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
            {['Everywhere', ...countries].map((r) => <Chip key={r} solid on={place === r} onClick={() => setPlace(r)}>{r}</Chip>)}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 rounded-[18px] bg-surface px-4 py-3">
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-display text-[20px] leading-tight text-ink">{period}</span>
            <span className="text-[12px] text-subtle">{loading ? 'Finding what’s on…' : `${on.length} on${cats.length ? ` · ${typesLabel(cats)}` : ''}`}</span>
          </div>
          <button type="button" onClick={() => setPicking((p) => !p)} aria-expanded={picking}
            className={`flex min-h-10 flex-none items-center gap-1.5 rounded-full border px-3.5 text-[13px] ${picking ? 'border-gold bg-gold/15 text-gold-pale' : 'border-line-2 text-text'}`}>
            <IconCalendar size={16} />{picking ? 'Close' : 'Pick dates'}
          </button>
        </div>

        {/* special days in these dates: moons, eclipses, solstices, holidays. Tap one to see that day */}
        {specials.length > 0 && (
          <div className="-mx-5 -mt-2 flex gap-1.5 overflow-x-auto px-5 pb-0.5" role="list" aria-label="Special days">
            {specials.map((x) => (
              <button key={x.date + x.label} type="button" role="listitem" onClick={() => { setFrom(x.date); setTo(x.date); setQuick(''); setPicking(false) }}
                className={`flex min-h-8 flex-none items-center gap-1.5 rounded-full border px-3 text-[12px] ${tagCls(x)}`}>
                <span aria-hidden>{x.icon}</span>{x.label}<span className="opacity-60">{from === to ? '' : ` · ${fmt(x.date, { weekday: 'short', day: 'numeric' })}`}</span>
              </button>
            ))}
          </div>
        )}

        {picking && (
          <DatePicker today={today} from={from} to={to} dated={dated}
            onDone={(a, b) => { setFrom(a); setTo(b); setQuick(''); setPicking(false) }} />
        )}

        {loading ? null : days.length > 0 ? (
          <div className="flex flex-col gap-5">
            {days.map((d) => (
              <section key={d} className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-xs tracking-[0.14em] text-subtle uppercase">{dayLabel(d)}</span>
                  {specialOn(d).map((x) => <span key={x.label} className={`rounded-full border px-2 py-0.5 text-[11px] ${tagCls(x)}`}>{`${x.icon} ${x.label}`}</span>)}
                </div>
                {byDay.get(d)!.map((e) => (e.start_date! < from
                  ? <div key={e.id} className="flex flex-col gap-1"><span className="pl-1 text-[12px] text-gold-soft">{`Already started · runs until ${fmt(e.end_date || e.start_date!, { month: 'short', day: 'numeric' })}`}</span>{card(e)}</div>
                  : card(e)))}
              </section>
            ))}
          </div>
        ) : (
          <EmptyState icon={<IconCalendar size={36} />} title={cats.length ? `No ${typesLabel(cats).toLowerCase()} on these dates` : 'Nothing on these dates'}
            action={<button type="button" onClick={() => setPicking(true)} className="flex min-h-11 items-center text-sm font-semibold text-gold-soft">Pick other dates</button>}>
            {all.length ? 'Try a longer period, another type, or see what’s coming up next below.' : 'When spaces and Facilitators publish classes, circles and retreats, they’ll show up here by day. Seen a poster for something nearby? Share it.'}
          </EmptyState>
        )}

        {!loading && next.length > 0 && (
          <section className="mt-1 flex flex-col gap-2.5">
            <span className="text-xs tracking-[0.14em] text-subtle uppercase">Coming up after</span>
            {next.map((e) => (
              <div key={e.id} className="flex flex-col gap-1">
                <span className="pl-1 text-[12px] text-gold-soft">{fmt(e.start_date!, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                {card(e)}
              </div>
            ))}
          </section>
        )}

        {!loading && (
          guest ? (
            <MembersLink to="/sessions" title="Sessions are for members" body="Massage, guidance, private classes, private chefs and more, with practitioners Xanadu has welcomed. Join free to see them." className="flex flex-col gap-0.5 rounded-[18px] bg-surface px-4 py-3.5 text-text">
              <span className="text-[15px] font-semibold text-ink">Looking for one-on-one? ›</span>
              <span className="text-[13px] text-subtle">Massage, guidance, private classes and more. Join free to see Sessions.</span>
            </MembersLink>
          ) : (
          <Link to="/sessions" className="flex flex-col gap-0.5 rounded-[18px] bg-surface px-4 py-3.5 text-text no-underline">
            <span className="text-[15px] font-semibold text-ink">Looking for one-on-one? ›</span>
            <span className="text-[13px] text-subtle">Massage, guidance, private classes and more, with practitioners Xanadu has welcomed.</span>
          </Link>)
        )}
        {!loading && <FoundingInvite />}
        {guest && <GuestInvite />}
      </Page>
    </Screen>
  )
}

/** The month, opened from "Pick dates": choose one day, or a first and last day. */
function DatePicker({ today, from, to, dated, onDone }: { today: string; from: string; to: string; dated: Item[]; onDone: (a: string, b: string) => void }) {
  const [mode, setMode] = useState<Mode>(from === to ? 'One day' : 'Date range')
  const [start, setStart] = useState('') // range mode: the first day, waiting for the last
  const [month, setMonth] = useState(() => { const d = at(from); return new Date(d.getFullYear(), d.getMonth(), 1, 12) })
  const thisMonth = new Date(at(today).getFullYear(), at(today).getMonth(), 1, 12)
  const busy = (d: string) => dated.filter((e) => overlaps(e, d, d)).length

  const tap = (d: string) => {
    if (mode === 'One day') return onDone(d, d)
    if (!start || d < start) { setStart(d); return }
    onDone(start, d)
  }
  // while choosing a range only the first day shows; otherwise the current choice
  const a = mode === 'Date range' && start ? start : from
  const b = mode === 'Date range' && start ? start : to

  const first = month
  const grid = startOfWeek(first)
  const weeks = Math.ceil((((first.getDay() + 6) % 7) + new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()) / 7)
  const cells = Array.from({ length: weeks * 7 }, (_, i) => add(grid, i))
  const move = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1, 12))

  return (
    <div className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
      <Segmented options={['One day', 'Date range'] as const} value={mode} onChange={(m) => { setMode(m); setStart('') }} label="Choose one day or a date range" />
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[20px] leading-tight text-ink">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        <div className="flex items-center gap-1 text-muted">
          <button type="button" aria-label="Previous month" disabled={month <= thisMonth} onClick={() => move(-1)} className="flex h-11 w-11 items-center justify-center rounded-xl disabled:opacity-30"><IconBack size={18} /></button>
          <button type="button" aria-label="Next month" onClick={() => move(1)} className="flex h-11 w-11 items-center justify-center rounded-xl"><IconNext /></button>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-7 text-center text-[11px] text-subtle">{WEEKDAYS.map((w) => <span key={w}>{w}</span>)}</div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((d) => {
            const id = iso(d)
            const past = id < today
            const inMonth = d.getMonth() === month.getMonth()
            const ends = id === a || id === b
            const between = a !== b && id > a && id < b
            const n = past ? 0 : busy(id)
            const sp = inMonth ? specialOn(id) : []
            return (
              <button key={id} type="button" disabled={past} onClick={() => tap(id)} aria-pressed={ends}
                aria-label={`${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${sp.length ? `, ${sp.map((x) => x.label).join(', ')}` : ''}${n ? `, ${n} on` : ''}`}
                className={`flex h-11 flex-col items-center justify-center gap-0.5 text-[14px] disabled:opacity-30 ${between ? 'bg-iri-violet/15' : ''} ${id === a && a !== b ? 'rounded-l-[12px] bg-iri-violet/15' : ''} ${id === b && a !== b ? 'rounded-r-[12px] bg-iri-violet/15' : ''}`}>
                <span className={`relative flex h-8 w-8 items-center justify-center rounded-full ${ends ? 'bg-iri font-semibold text-navy' : id === today ? 'ring-1 ring-gold/70 text-ink' : inMonth ? 'text-text' : 'text-faint'}`}>
                  {d.getDate()}
                  {sp[0] && <span aria-hidden className="absolute -top-1.5 -right-2 text-[10px] leading-none">{sp[0].icon}</span>}
                </span>
                <span className="flex h-[5px] gap-[3px]">
                  {Array.from({ length: Math.min(3, n) }, (_, i) => <span key={i} className="h-[5px] w-[5px] rounded-full bg-iri-strong" />)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <span className="text-[12px] text-gold-soft">
        {mode === 'One day' ? 'Tap a day to see what’s on.' : start ? `From ${fmt(start, { weekday: 'short', month: 'short', day: 'numeric' })}. Now tap the last day.` : 'Tap the first day, then the last day.'}
      </span>
      <span className="text-[11px] text-faint">Dots show days with something on. 🌕 full moon · 🌑 new moon · 🇨🇷 holiday.</span>
    </div>
  )
}
