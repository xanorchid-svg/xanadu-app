import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Chip, EmptyState, H1, Page, Screen, SeekerTabs } from '../../components/ui'
import { IconBack, IconCalendar, IconNext } from '../../components/icons'
import ExperienceCard from '../../components/ExperienceCard'
import { REGIONS } from '../../data'
import { useListings } from '../../store'

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (x.getDay() + 6) % 7 // Monday = 0
  x.setDate(x.getDate() - dow)
  return x
}

export default function Calendar() {
  const today = useMemo(() => new Date(), [])
  const [place, setPlace] = useState<string>(REGIONS[0])
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))
  const [day, setDay] = useState(() => iso(today))
  const { listings } = useListings()

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d })
  const monthLabel = days[3].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const selected = new Date(day + 'T12:00:00')
  const heading = selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const where = place === REGIONS[0] ? 'Costa Rica' : place

  const shiftWeek = (n: number) => { const d = new Date(weekStart); d.setDate(d.getDate() + 7 * n); setWeekStart(d); setDay(iso(d)) }
  const inPlace = listings.filter((e) => e.start_date && (place === REGIONS[0] || (e.space?.town ?? '').toLowerCase().includes(place.toLowerCase())))
  const runs = (e: (typeof listings)[number], d: string) => e.start_date! <= d && (e.end_date || e.start_date)! >= d
  const busy = new Set(days.map(iso).filter((d) => inPlace.some((e) => runs(e, d))))
  const onDay = inPlace.filter((e) => runs(e, day))

  return (
    <Screen footer={<SeekerTabs />}>
      <Page className="gap-5">
        <H1>Calendar</H1>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
          {REGIONS.map((r) => <Chip key={r} solid on={place === r} onClick={() => setPlace(r)}>{r}</Chip>)}
        </div>

        <div className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-[22px] text-ink">{monthLabel}</span>
            <div className="flex gap-1 text-muted">
              <button type="button" aria-label="Previous week" onClick={() => shiftWeek(-1)} className="flex h-11 w-11 items-center justify-center rounded-xl"><IconBack size={18} /></button>
              <button type="button" aria-label="Next week" onClick={() => shiftWeek(1)} className="flex h-11 w-11 items-center justify-center rounded-xl"><IconNext /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const id = iso(d); const on = id === day
              return (
                <button key={id} type="button" onClick={() => setDay(id)}
                  aria-label={d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} aria-pressed={on}
                  className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 rounded-[14px] ${on ? 'bg-gold text-navy' : 'text-text'}`}>
                  <span className="text-[11px] opacity-80">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="text-base font-semibold">{d.getDate()}</span>
                  <span className={`h-[5px] w-[5px] rounded-full ${busy.has(id) ? (on ? 'bg-navy' : 'bg-gold-soft') : 'bg-transparent'}`} />
                </button>
              )
            })}
          </div>
        </div>

        <span className="text-xs tracking-[0.14em] text-subtle uppercase">{heading}</span>
        {onDay.length ? onDay.map((e) => <ExperienceCard key={e.id} e={e} />) : (
          <EmptyState icon={<IconCalendar size={36} />} title={inPlace.length ? 'Nothing on this day' : `Nothing scheduled in ${where} yet`}
            action={<Link to="/discover" className="flex min-h-11 items-center text-sm no-underline">Back to Discover</Link>}>
            {inPlace.length ? 'Days with a gold dot have something on. Tap one, or try another week.' : "When spaces and facilitators publish retreats, trainings and drop-ins, they'll show up here by day."}
          </EmptyState>
        )}
      </Page>
    </Screen>
  )
}
