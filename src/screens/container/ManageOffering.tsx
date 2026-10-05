import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BackButton, ContainerTabs, EmptyState, PrimaryButton, Screen } from '../../components/ui'
import { IconPeople } from '../../components/icons'

const TABS = ['Guests', 'Schedule', 'Meals', 'Outings'] as const

/** Manage one offering: guests, day-by-day schedule, meals and outings. Starts empty. */
export default function ManageOffering() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Guests')
  const [day, setDay] = useState(1)
  const [plan, setPlan] = useState<Record<number, string[]>>({ 1: [], 2: [], 3: [] })
  const sessions = plan[day]

  const header = (
    <div className="flex flex-col gap-3.5 bg-plum px-5 pt-[52px]">
      <div className="flex items-center justify-between">
        <BackButton to="/container" />
        <Link to="/experience/preview" className="flex min-h-11 items-center text-[13px] no-underline">Preview as guest</Link>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gold-soft">In review · [Dates]</span>
        <h1 className="m-0 font-display text-[30px] leading-[1.05] font-medium text-ink">[Offering title]</h1>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 rounded-full bg-plum-line" />
        <span className="text-xs text-muted">0 of [N] spots filled · opens to guests once approved</span>
      </div>
      <div role="tablist" className="grid grid-cols-4">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`min-h-11 border-b-2 text-sm ${tab === t ? 'border-gold font-semibold text-ink' : 'border-transparent text-subtle'}`}>{t}</button>
        ))}
      </div>
    </div>
  )

  return (
    <Screen header={header} footer={<ContainerTabs />}>
      <div className="flex flex-col gap-3 px-5 pt-[18px] pb-7">
        {tab === 'Guests' && (
          <EmptyState icon={<IconPeople size={32} />} title="No guest requests yet">
            When Seekers request a spot, you'll approve or decline them here. Their dietary needs and outing choices come with each request.
          </EmptyState>
        )}

        {tab === 'Schedule' && (
          <>
            <div className="flex gap-2 overflow-x-auto">
              {[1, 2, 3].map((d) => (
                <button key={d} type="button" aria-pressed={day === d} onClick={() => setDay(d)}
                  className={`min-h-10 flex-none rounded-full border px-4 text-[13px] ${day === d ? 'border-gold bg-gold font-semibold text-navy' : 'border-line-2 text-muted'}`}>{`Day ${d}`}</button>
              ))}
            </div>
            {sessions.map((s, i) => (
              <div key={i} className="flex items-center gap-3.5 rounded-[14px] bg-surface px-3.5 py-3">
                <span className="w-[52px] flex-none text-sm font-semibold text-gold-pale">[Time]</span>
                <span className="text-[15px] text-ink">{s}</span>
              </div>
            ))}
            {!sessions.length && <span className="text-[13px] text-subtle">{`Nothing planned for Day ${day} yet.`}</span>}
            <button type="button" onClick={() => setPlan((p) => ({ ...p, [day]: [...p[day], '[New session]'] }))}
              className="min-h-12 rounded-[14px] border border-dashed border-slate text-sm text-gold-pale">{`+ Add to Day ${day}`}</button>
          </>
        )}

        {tab === 'Meals' && (
          <>
            <div className="flex flex-col gap-1.5 rounded-2xl bg-plum p-4">
              <span className="text-[15px] font-semibold text-ink">Dietary needs from guests</span>
              <span className="text-[13px] leading-normal text-subtle">Collected at sign-up and shown here as a list you can share with your kitchen.</span>
            </div>
            {['Breakfasts', 'Lunches', 'Dinners'].map((m) => (
              <div key={m} className="flex items-center justify-between rounded-[14px] bg-surface p-3.5">
                <span className="text-[15px] text-ink">{m}</span><span className="text-xs text-subtle">Not set</span>
              </div>
            ))}
          </>
        )}

        {tab === 'Outings' && (
          <EmptyState title="No outings added" action={<PrimaryButton className="mt-1 min-h-[46px] text-sm">Add an outing</PrimaryButton>}>
            Add optional trips like a hike or surf lesson. Guests opt in, and you'll see who's going and what transport you need.
          </EmptyState>
        )}
      </div>
    </Screen>
  )
}
