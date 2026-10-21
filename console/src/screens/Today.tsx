import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useGate } from '../gate'
import { Card, EmptyState, Glow, PageTitle, Spinner } from '../ui'
import { useTeamQuery } from '../lib/data'
import { HeardFrom, SignupChart, type Heard, type SignupDay } from '../charts'

type Counts = {
  pending_containers: number
  pending_facilitators: number
  offerings_in_review: number
  unanswered_messages: number
  open_reports: number
  members: { seeker: number; container: number; facilitator: number }
  new_this_week: number
  live_offerings: number
  approved_spaces: number
}
type Action = { id: number; action: string; target_kind: string | null; note: string | null; created_at: string }

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Today() {
  const { me } = useGate()
  const [counts, setCounts] = useState<Counts | null>(null)
  const [actions, setActions] = useState<Action[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState(0)
  const signups = useTeamQuery<SignupDay[]>('team_signups', { p_days: 30 })
  const heard = useTeamQuery<Heard[]>('team_heard_from')

  useEffect(() => {
    supabase.rpc('team_counts').then(({ data, error }) => {
      if (error) setError("Couldn't load today's numbers. Refresh to try again.")
      else setCounts(data as Counts)
    })
    supabase.rpc('team_pending_community_events').then(({ data }) => setEvents(Number(data) || 0))
    supabase.from('team_actions').select('id, action, target_kind, note, created_at').order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setActions((data as Action[]) ?? []))
  }, [])

  const first = me?.name?.split(' ')[0]
  const attention = counts && [
    { n: counts.pending_containers, label: 'Container applications', to: '/applications?role=container' },
    { n: counts.pending_facilitators, label: 'Facilitator applications', to: '/applications?role=facilitator' },
    { n: counts.offerings_in_review, label: 'Offerings in review', to: '/offerings' },
    { n: counts.unanswered_messages, label: 'Messages to answer', to: '/inbox' },
    { n: counts.open_reports, label: 'Safety reports', to: '/safety' },
    { n: events, label: 'Community events to review', to: '/events' },
  ]
  const waiting = attention?.reduce((s, a) => s + a.n, 0) ?? 0
  const total = counts ? counts.members.seeker + counts.members.container + counts.members.facilitator : 0

  return (
    <div className="xa-page">
      <PageTitle eyebrow={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        title={<>{greeting()}{first ? <>, <Glow>{first}</Glow></> : ''}</>} />

      {error && <p className="mb-6 text-[14px] text-rose">{error}</p>}
      {!counts && !error && <div className="py-16 grid place-items-center"><Spinner /></div>}

      {counts && attention && (
        <>
          <section aria-labelledby="attn" className="mb-10">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="attn" className="text-[12px] font-semibold uppercase tracking-[.16em] text-faint">Needs your attention</h2>
              <p className="text-[13px] text-subtle">{waiting === 0 ? 'All clear' : `${waiting} waiting`}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {attention.map((a) => (
                <Link key={a.label} to={a.to} className="no-underline">
                  <Card glow={a.n > 0} className="h-full p-4 hover:bg-surface">
                    <p className={`font-display text-[44px] leading-none ${a.n > 0 ? 'text-gold-pale' : 'text-faint'}`}>{a.n}</p>
                    <p className="mt-2 text-[13px] leading-snug text-subtle">{a.label}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="growth" className="mb-10">
            <h2 id="growth" className="mb-3 text-[12px] font-semibold uppercase tracking-[.16em] text-faint">Xanadu so far</h2>
            <Card className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
              <Stat n={total} label="Members" sub={`${counts.members.seeker} Seekers · ${counts.members.container} Containers · ${counts.members.facilitator} Facilitators`} />
              <Stat n={counts.new_this_week} label="Joined this week" />
              <Stat n={counts.approved_spaces} label="Approved spaces" />
              <Stat n={counts.live_offerings} label="Live offerings" />
            </Card>
          </section>

          <section aria-labelledby="signups" className="mb-10 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
            <Card className="p-5">
              <h2 id="signups" className="mb-1 text-[12px] font-semibold uppercase tracking-[.16em] text-faint">New members, last 30 days</h2>
              {signups.data ? <SignupChart days={signups.data} /> : <div className="grid h-40 place-items-center"><Spinner /></div>}
            </Card>
            <Card className="p-5">
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[.16em] text-faint">Where people heard about us</h2>
              {heard.data ? <HeardFrom rows={heard.data} /> : <div className="grid h-40 place-items-center"><Spinner /></div>}
            </Card>
          </section>
        </>
      )}

      <AiSpend />

      <section aria-labelledby="activity">
        <h2 id="activity" className="mb-3 text-[12px] font-semibold uppercase tracking-[.16em] text-faint">Recent team activity</h2>
        {actions === null ? null : actions.length === 0 ? (
          <EmptyState title="Nothing yet" body="Approvals, replies and other team actions will appear here, so there's always a record of who did what and when." />
        ) : (
          <Card>
            <ul className="divide-y divide-line">
              {actions.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3 text-[14px]">
                  <span className="text-text first-letter:uppercase">{a.action.replace(/_/g, ' ')}{a.note ? <span className="text-subtle"> · {a.note}</span> : null}</span>
                  <time className="shrink-0 text-[12px] text-faint">{new Date(a.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  )
}

function Stat({ n, label, sub }: { n: number; label: string; sub?: string }) {
  return (
    <div className="p-4 sm:p-5">
      <p className="font-display text-[36px] leading-none text-ink">{n}</p>
      <p className="mt-2 text-[13px] font-semibold text-subtle">{label}</p>
      {sub && <p className="mt-1 text-[11.5px] leading-snug text-faint">{sub}</p>}
    </div>
  )
}

/** The website and flyer import (Claude) costs a little per use. Shown here so spend is never a surprise. */
function AiSpend() {
  const [d, setD] = useState<{ month_usd: number; total_usd: number; imports_month: number; monthly_cap_usd: number; alert_every_usd: number } | null>(null)
  useEffect(() => { supabase.rpc('team_ai_spend').then(({ data }) => setD(data as typeof d)) }, [])
  if (!d) return null
  const pct = Math.min(100, (Number(d.month_usd) / Math.max(1, Number(d.monthly_cap_usd))) * 100)
  return (
    <section aria-labelledby="ai-spend" className="mb-8">
      <h2 id="ai-spend" className="mb-3 text-[12px] font-semibold uppercase tracking-[.16em] text-faint">AI import spend</h2>
      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-[30px] leading-none text-ink">{`$${Number(d.month_usd).toFixed(2)}`}<span className="ml-2 font-sans text-[13px] text-subtle">{`this month · ${d.imports_month} imports`}</span></p>
          <p className="text-[12.5px] text-faint">{`$${Number(d.total_usd).toFixed(2)} all time`}</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-iri-strong" style={{ width: `${pct}%` }} /></div>
        <p className="text-[12.5px] leading-snug text-faint">{`Pauses for the month at $${Number(d.monthly_cap_usd).toFixed(0)}. The team gets an email every $${Number(d.alert_every_usd).toFixed(0)} spent.`}</p>
      </Card>
    </section>
  )
}
