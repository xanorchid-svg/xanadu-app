import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Chip, EmptyState, H2, Page, PrimaryButton, Screen, SeekerTabs, Segmented, Switch } from '../../components/ui'
import { IconChart, IconSettings } from '../../components/icons'
import { CONTACT_EMAIL } from '../../data'

const ALIGN = ['Yoga', 'Breathwork', 'Meditation', 'Sound', 'Ecstatic dance', 'Kirtan', 'Trainings', "Women's retreats", "Men's retreats", 'Permaculture']
const JOURNEY_TABS = ['Upcoming', 'Past'] as const

export default function You() {
  const [prefs, setPrefs] = useState<string[]>([])
  const [tab, setTab] = useState<(typeof JOURNEY_TABS)[number]>('Upcoming')
  const [chart, setChart] = useState(false)
  const [notify, setNotify] = useState(true)
  const toggle = (p: string) => setPrefs((xs) => (xs.includes(p) ? xs.filter((x) => x !== p) : [...xs, p]))

  const row = 'flex min-h-[52px] items-center justify-between border-b border-[#1F2B3E] text-[15px] text-text no-underline'

  return (
    <Screen footer={<SeekerTabs />}>
      <Page className="gap-6 pb-7">
        <div className="flex items-center gap-4">
          <div className="flex h-[72px] w-[72px] flex-none items-center justify-center rounded-full border border-gold bg-plum font-display text-3xl text-gold-pale">X</div>
          <div className="flex flex-1 flex-col gap-1">
            <h1 className="m-0 font-display text-3xl font-medium text-ink">[Your name]</h1>
            <span className="text-[13px] text-subtle">Seeker · Joined October 2026</span>
          </div>
          <button type="button" aria-label="Settings" className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted"><IconSettings /></button>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between"><H2 className="text-[22px]">Your alignment</H2><span className="text-xs text-subtle">Tap all that call to you</span></div>
          <div className="flex flex-wrap gap-2">{ALIGN.map((p) => <Chip key={p} on={prefs.includes(p)} onClick={() => toggle(p)}>{p}</Chip>)}</div>
          <p className="m-0 text-[13px] text-subtle">{prefs.length ? 'Discover will show experiences aligned with these first.' : 'Pick a few practices so Discover can show you what fits.'}</p>
        </section>

        <section className="flex flex-col gap-3">
          <H2 className="text-[22px]">Your journeys</H2>
          <Segmented label="Journeys" options={JOURNEY_TABS} value={tab} onChange={setTab} />
          {tab === 'Upcoming' ? (
            <EmptyState title="No upcoming journeys" action={<Link to="/discover" className="flex min-h-11 items-center text-sm font-semibold no-underline">Explore Discover</Link>}>
              Experiences you book will appear here with your schedule and what to bring.
            </EmptyState>
          ) : (
            <EmptyState title="No past journeys yet">
              After each experience you can leave a review and vouch for the space and facilitator. Vouches help them earn ✦ Verified.
            </EmptyState>
          )}
        </section>

        <section className="flex flex-col gap-2.5 rounded-[20px] border border-plum-line bg-[#1A1528] p-[18px]">
          <div className="flex items-center gap-2.5 text-gold-soft"><IconChart /><span className="text-[11px] tracking-[0.16em] uppercase">Coming soon</span></div>
          <h2 className="m-0 font-display text-2xl font-medium text-ink">Experiences aligned to your chart</h2>
          <p className="m-0 text-sm leading-relaxed text-muted">Add your birth details and we'll suggest places and practices using astrocartography.</p>
          <PrimaryButton done={chart} onClick={() => setChart(true)} className="min-h-11 self-start px-[18px] text-sm">{chart ? 'On the early list ✓' : 'Join early access'}</PrimaryButton>
        </section>

        <section className="flex flex-col">
          <H2 className="mb-1.5 text-[22px]">Account</H2>
          <div className={row}>Membership <span className="text-[13px] text-gold-soft">Founding Seeker · Free</span></div>
          <div className={row}>Home region <span className="text-[13px] text-subtle">Costa Rica</span></div>
          <div className={row}>New aligned experiences <Switch on={notify} onChange={setNotify} label="Notify me about new aligned experiences" /></div>
          <div className={row}>Privacy &amp; data <span className="text-[13px] text-subtle">Coming soon</span></div>
          <div className={row}>Community guidelines <span className="text-[13px] text-subtle">Coming soon</span></div>
          <a href={`mailto:${CONTACT_EMAIL}`} className={`${row} border-b-0`}>Help <span className="text-[13px] text-subtle">{CONTACT_EMAIL}</span></a>
        </section>

        <Link to="/apply" className="flex flex-col gap-1 rounded-[20px] bg-gold p-[18px] text-navy no-underline hover:text-navy">
          <span className="text-base font-semibold">Hold space on Xanadu</span>
          <span className="text-[13px]">List your retreat space or offer your practice →</span>
        </Link>
        <Link to="/" className="flex min-h-11 items-center justify-center text-sm text-subtle no-underline">Sign out</Link>
      </Page>
    </Screen>
  )
}
