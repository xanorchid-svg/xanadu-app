import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Chip, EmptyState, FacilitatorTabs, Page, PrimaryButton, Screen, SeekerTabs, Segmented, Switch } from '../../components/ui'
import { IconChat, IconPeople, IconPin } from '../../components/icons'
import { HOME, useAuth } from '../../auth'
import {
  forgetLocation, hasLocation, requestConnection, respondToConnection, shareApproxLocation,
  useConnections, useNearby, type Connection, type NearbyMember,
} from '../../community'

const RADII = [5, 10, 25] as const
const TABS = ['Nearby', 'Connections'] as const

export function Avatar({ name, photo, size = 52 }: { name: string; photo: string; size?: number }) {
  return (
    <div className="flex flex-none items-center justify-center overflow-hidden rounded-full border border-gold/60 bg-plum font-display text-gold-pale"
      style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : (name.trim()[0] ?? 'X').toUpperCase()}
    </div>
  )
}

const roleLabel = (r: string) => (r === 'facilitator' ? 'Facilitator' : 'Seeker')
const btn = 'min-h-10 rounded-xl px-3.5 text-[13px] font-semibold'

/** Community: see Seekers and Facilitators nearby, connect, and chat once both say yes. */
export default function Community() {
  const { profile, session, updateProfile } = useAuth()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Nearby')
  const [radius, setRadius] = useState<number>(5)
  const [located, setLocated] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState(false)

  const userId = session?.user.id ?? ''
  const visible = !!profile?.community_visible
  const approved = profile?.role === 'seeker' || profile?.status === 'approved'
  const ready = visible && approved && !!located
  const { members, loading, reload } = useNearby(radius, ready)
  const { connections, loading: cLoading, reload: cReload } = useConnections()

  useEffect(() => { if (userId) hasLocation(userId).then(setLocated) }, [userId])

  if (!profile) return null
  if (profile.role === 'container') return <Navigate to={HOME.container} replace />
  const Tabs = profile.role === 'facilitator' ? FacilitatorTabs : SeekerTabs

  const join = async () => {
    setBusy(true); setError('')
    const err = await updateProfile({ community_visible: true })
    if (err) { setError(err); setBusy(false); return }
    const locErr = await shareApproxLocation(userId)
    setBusy(false)
    if (locErr) setError(locErr); else setLocated(true)
  }
  const refreshLocation = async () => {
    setBusy(true); setError('')
    const err = await shareApproxLocation(userId)
    setBusy(false)
    if (err) setError(err); else { setLocated(true); reload() }
  }
  const leave = async () => {
    setBusy(true)
    await forgetLocation(userId)
    await updateProfile({ community_visible: false })
    setLocated(false); setSettings(false); setBusy(false)
  }
  const act = async (fn: () => Promise<string | null>) => {
    setError('')
    const err = await fn()
    if (err) setError(err)
    reload(); cReload()
  }

  const [inviteNote, setInviteNote] = useState('')
  const invite = async () => {
    const url = window.location.origin
    try {
      if (navigator.share) { await navigator.share({ title: 'Xanadu', text: 'Join me on Xanadu, a network for awakening places.', url }); return }
      await navigator.clipboard.writeText(url); setInviteNote('Link copied ✓')
    } catch (e) { if ((e as Error).name !== 'AbortError') setInviteNote(url) }
  }

  const pending = connections.filter((c) => c.status === 'pending' && c.incoming)

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 font-display text-[34px] leading-[1.05] font-medium text-ink">Community</h1>
        <span className="text-[13px] text-subtle">Seekers and Facilitators near you</span>
      </div>
      {visible && located && (
        <button type="button" onClick={() => setSettings(!settings)} aria-expanded={settings}
          className="min-h-10 rounded-full border border-line px-3.5 text-[13px] text-muted">{settings ? 'Done' : 'Settings'}</button>
      )}
    </div>
  )

  // Facilitators join once a person on the team has approved their profile
  if (!approved) {
    return (
      <Screen footer={<Tabs />}>
        <Page>
          {header}
          <EmptyState icon={<IconPeople size={32} />} title="Opens once you're approved">
            Community is where you'll meet Seekers and other Facilitators nearby. It opens as soon as your profile is approved.
          </EmptyState>
        </Page>
      </Screen>
    )
  }

  // Opt-in: nobody appears in Community until they choose to
  if (!visible || located === false) {
    return (
      <Screen footer={<Tabs />}>
        <Page>
          {header}
          <section className="flex flex-col gap-4 rounded-[22px] bg-plum p-5">
            <div className="text-gold-soft"><IconPeople size={36} /></div>
            <h2 className="m-0 font-display text-[26px] leading-tight text-ink">Find your people nearby</h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[14px] leading-relaxed text-muted">
              <li>See Seekers and Facilitators within a few miles of you.</li>
              <li>Connect, and chat once they say yes too.</li>
              <li>Others only see your name, photo, practices and roughly how far away you are. Never your exact location.</li>
              <li>You can hide yourself any time.</li>
            </ul>
            {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
            <PrimaryButton onClick={join}>{busy ? 'Joining…' : visible ? 'Share my approximate location' : 'Join Community'}</PrimaryButton>
            <span className="text-center text-xs text-subtle">Your phone will ask to share your location.</span>
          </section>
        </Page>
      </Screen>
    )
  }

  if (located === null) return <Screen footer={<Tabs />}><Page>{header}</Page></Screen>

  return (
    <Screen footer={<Tabs />}>
      <Page className="gap-5">
        {header}

        {settings && (
          <section className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex flex-col gap-0.5"><span className="text-[15px] font-semibold text-ink">Show me in Community</span><span className="text-xs text-subtle">Turning this off hides you and forgets your location</span></span>
              <Switch on label="Show me in Community" onChange={() => leave()} />
            </div>
            <button type="button" onClick={refreshLocation} className="flex min-h-11 items-center gap-2 text-[14px] text-gold-pale">
              <IconPin size={18} />{busy ? 'Updating…' : 'Update my location'}
            </button>
          </section>
        )}

        {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}

        <Segmented label="Community" options={TABS} value={tab} onChange={setTab} />

        {tab === 'Nearby' && (
          <>
            <div className="flex items-center gap-2">
              <span className="mr-1 text-[13px] text-subtle">Within</span>
              {RADII.map((r) => <Chip key={r} on={radius === r} onClick={() => setRadius(r)}>{`${r} mi`}</Chip>)}
            </div>
            {loading && !members.length
              ? <span className="text-[13px] text-subtle">Looking nearby…</span>
              : members.length
                ? <div className="flex flex-col gap-2.5">{members.map((m) => <MemberCard key={m.id} m={m} act={act} me={userId} />)}</div>
                : (
                  <EmptyState icon={<IconPeople size={32} />} title={`No one within ${radius} miles yet`}
                    action={<button type="button" onClick={invite} className="flex min-h-11 items-center text-sm font-semibold text-gold-soft">{inviteNote || 'Invite a friend'}</button>}>
                    {radius < 25 ? 'Try a wider circle. ' : ''}Xanadu is just opening, so Community grows as people join.
                  </EmptyState>
                )}
          </>
        )}

        {tab === 'Connections' && (
          cLoading ? <span className="text-[13px] text-subtle">Loading…</span>
            : connections.length ? (
              <div className="flex flex-col gap-2.5">
                {pending.length > 0 && <span className="text-xs tracking-[0.14em] text-subtle uppercase">{`Requests · ${pending.length}`}</span>}
                {pending.map((c) => <ConnectionRow key={c.connection_id} c={c} act={act} />)}
                {connections.some((c) => !(c.status === 'pending' && c.incoming)) && <span className="mt-2 text-xs tracking-[0.14em] text-subtle uppercase">Your connections</span>}
                {connections.filter((c) => !(c.status === 'pending' && c.incoming)).map((c) => <ConnectionRow key={c.connection_id} c={c} act={act} />)}
              </div>
            ) : (
              <EmptyState icon={<IconChat size={32} />} title="No connections yet">
                Connect with someone nearby. Once they say yes, you can chat here.
              </EmptyState>
            )
        )}
      </Page>
    </Screen>
  )
}

function MemberCard({ m, act, me }: { m: NearbyMember; act: (fn: () => Promise<string | null>) => void; me: string }) {
  let action
  if (m.connection_status === 'accepted') action = <Link to={`/community/chat/${m.connection_id}`} className={`${btn} flex items-center bg-gold text-navy no-underline hover:text-navy`}>Message</Link>
  else if (m.connection_status === 'pending' && m.incoming) action = (
    <div className="flex gap-1.5">
      <button type="button" onClick={() => act(() => respondToConnection(m.connection_id!, true))} className={`${btn} bg-gold text-navy`}>Accept</button>
      <button type="button" onClick={() => act(() => respondToConnection(m.connection_id!, false))} className={`${btn} border border-line-2 text-muted`}>Decline</button>
    </div>
  )
  else if (m.connection_status === 'pending') action = <span className={`${btn} flex items-center border border-line-2 text-subtle`}>Requested</span>
  else if (m.connection_status === 'declined') action = null
  else action = <button type="button" onClick={() => act(() => requestConnection(me, m.id))} className={`${btn} border border-gold text-gold-pale`}>Connect</button>

  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-surface p-3.5">
      <Avatar name={m.name} photo={m.photo_url} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold text-ink">{m.name.trim() || 'Xanadu member'}</span>
        <span className="text-xs text-gold-soft">{`${roleLabel(m.role)} · ~${m.miles} mi away`}</span>
        {m.practices?.length > 0 && <span className="truncate text-xs text-subtle">{m.practices.slice(0, 3).join(' · ')}</span>}
      </div>
      {action}
    </div>
  )
}

function ConnectionRow({ c, act }: { c: Connection; act: (fn: () => Promise<string | null>) => void }) {
  const sub = c.status === 'accepted' ? (c.last_body ?? 'Say hello') : c.incoming ? 'Wants to connect' : 'Request sent'
  const inner = (
    <>
      <Avatar name={c.name} photo={c.photo_url} size={48} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold text-ink">{c.name.trim() || 'Xanadu member'}</span>
        <span className="truncate text-xs text-subtle">{`${roleLabel(c.role)} · ${sub}`}</span>
      </div>
    </>
  )
  const cls = 'flex items-center gap-3 rounded-[18px] bg-surface p-3.5 text-text no-underline'
  if (c.status === 'accepted') return <Link to={`/community/chat/${c.connection_id}`} className={cls}>{inner}<span className="text-gold-soft" aria-hidden>›</span></Link>
  return (
    <div className={cls}>
      {inner}
      {c.incoming && (
        <div className="flex gap-1.5">
          <button type="button" onClick={() => act(() => respondToConnection(c.connection_id, true))} className={`${btn} bg-gold text-navy`}>Accept</button>
          <button type="button" onClick={() => act(() => respondToConnection(c.connection_id, false))} className={`${btn} border border-line-2 text-muted`}>Decline</button>
        </div>
      )}
    </div>
  )
}
