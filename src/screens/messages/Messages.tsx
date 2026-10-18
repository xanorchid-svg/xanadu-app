import { useState, type ReactNode } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { ContainerTabs, EmptyState, FacilitatorTabs, H1, Page, Screen, SeekerTabs } from '../../components/ui'
import { useAuth } from '../../auth'
import { useMessages } from '../../store'
import { useConnections } from '../../community'
import { roleName, useThreads } from '../../threads'
import { Avatar } from '../community/Community'
import { Bell } from '../../components/Bell'

export const TEAM_READ_KEY = 'xa-inbox-read'

export const when = (iso: string) => {
  const d = new Date(iso)
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function TabsFor({ role }: { role?: string }) {
  return role === 'container' ? <ContainerTabs /> : role === 'facilitator' ? <FacilitatorTabs /> : <SeekerTabs />
}

type Row = { key: string; to: string; at: string; title: string; sub: string; label: string; unread: boolean; avatar: ReactNode }

/**
 * Messages: one place for every conversation a member has.
 *  - the Xanadu team
 *  - private messages with spaces, guides and guests
 *  - Community chats (Seekers and Facilitators)
 * The Xanadu team can read only the first kind. Private member messages stay between the two members.
 */
export default function Messages() {
  const [params] = useSearchParams()
  const { session, profile } = useAuth()
  const team = useMessages()
  const { threads, loading } = useThreads()
  const { connections } = useConnections()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // old links (/messages?draft=…) open the team thread with the message started
  if (params.get('draft')) return <Navigate to={`/messages/team?${params.toString()}`} replace />

  const me = session?.user.id
  const role = profile?.role
  const lastTeam = team.messages[team.messages.length - 1]
  let lastRead = ''
  try { lastRead = localStorage.getItem(TEAM_READ_KEY) ?? '' } catch { /* private mode */ }

  const rows: Row[] = [
    ...threads.filter((t) => !t.blocked).map((t) => ({
      key: t.id, to: `/messages/${t.id}`, at: t.last_at,
      title: t.name?.trim() || 'Xanadu member',
      sub: t.last_body ? `${t.last_sender === me ? 'You: ' : ''}${t.last_body}` : 'Say hello',
      label: t.space_name && t.role !== 'container' ? `${roleName(t.role)} · about ${t.space_name}` : t.offering_title ? `${roleName(t.role)} · ${t.offering_title}` : roleName(t.role),
      unread: t.unread,
      avatar: <Avatar name={t.name ?? ''} photo={t.photo_url ?? ''} size={48} />,
    })),
    ...connections.filter((c) => c.status === 'accepted').map((c) => ({
      key: `c-${c.connection_id}`, to: `/community/chat/${c.connection_id}`, at: c.last_at,
      title: c.name.trim() || 'Xanadu member', sub: c.last_body ?? 'You’re connected. Say hello.',
      label: `Community · ${c.role === 'facilitator' ? 'Facilitator' : 'Seeker'}`, unread: false,
      avatar: <Avatar name={c.name} photo={c.photo_url} size={48} />,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  const teamUnread = !!lastTeam && lastTeam.from_team && lastTeam.created_at > lastRead
  const shown = filter === 'unread' ? rows.filter((r) => r.unread) : rows
  const pendingRequests = connections.filter((c) => c.status === 'pending' && c.incoming).length

  return (
    <Screen footer={<TabsFor role={role} />}>
      <Page className="gap-4">
        <div className="flex items-center justify-between gap-3"><H1>Messages</H1><Bell /></div>

        {/* the Xanadu team is always at the top */}
        <Link to="/messages/team" className="flex min-h-[72px] items-center gap-3 rounded-[18px] bg-plum/60 px-3.5 py-3 text-text no-underline ring-iri">
          <span className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full bg-ivory"><img decoding="async" loading="lazy" src="/xanadu-mark.png" alt="" className="h-9 w-auto" /></span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex justify-between gap-2"><span className="text-[15px] font-semibold text-ink">Xanadu team</span><span className="text-xs text-subtle">{lastTeam ? when(lastTeam.created_at) : ''}</span></span>
            <span className={`truncate text-[13px] ${teamUnread ? 'font-semibold text-text' : 'text-subtle'}`}>{lastTeam ? `${lastTeam.from_team ? '' : 'You: '}${lastTeam.body}` : 'Questions, spot requests and help'}</span>
          </span>
          <span className={`h-2.5 w-2.5 flex-none rounded-full ${teamUnread ? 'bg-iri-strong' : 'bg-transparent'}`} aria-label={teamUnread ? 'Unread' : undefined} />
        </Link>

        {rows.length > 0 && (
          <div className="flex gap-2" role="tablist">
            {(['all', 'unread'] as const).map((f) => (
              <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
                className={`min-h-9 rounded-full px-4 text-[13px] ${filter === f ? 'bg-iri font-semibold text-navy' : 'border border-line-2 text-muted'}`}>
                {f === 'all' ? 'All' : `Unread${rows.some((r) => r.unread) ? ` · ${rows.filter((r) => r.unread).length}` : ''}`}
              </button>
            ))}
          </div>
        )}

        {pendingRequests > 0 && (
          <Link to="/community" className="flex min-h-12 items-center justify-between rounded-2xl border border-line-2 px-4 text-[14px] text-text no-underline">
            {`${pendingRequests} Community request${pendingRequests > 1 ? 's' : ''} waiting`}<span className="text-gold-soft">›</span>
          </Link>
        )}

        {!loading && shown.length === 0 && (
          <EmptyState title={filter === 'unread' ? 'All caught up' : 'No conversations yet'}>
            {filter === 'unread' ? 'You’ve read everything.' : role === 'container'
              ? 'When guests or facilitators message your space, the conversation appears here. You can reply right away.'
              : role === 'facilitator'
                ? 'Message a retreat space from your Spaces tab, or connect with people nearby in Community. Your conversations appear here.'
                : 'Message a retreat space or guide from their page, or connect with people nearby in Community. Your conversations appear here.'}
          </EmptyState>
        )}

        <div className="flex flex-col">
          {shown.map((r) => (
            <Link key={r.key} to={r.to} className="flex min-h-[76px] items-center gap-3 border-b border-[#1F2B3E] py-2.5 text-text no-underline">
              {r.avatar}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex justify-between gap-2">
                  <span className={`truncate text-[15px] ${r.unread ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>{r.title}</span>
                  <span className="flex-none text-xs text-subtle">{when(r.at)}</span>
                </span>
                <span className="truncate text-[11.5px] text-gold-soft">{r.label}</span>
                <span className={`truncate text-[13px] ${r.unread ? 'font-semibold text-text' : 'text-subtle'}`}>{r.sub}</span>
              </span>
              <span className={`h-2.5 w-2.5 flex-none rounded-full ${r.unread ? 'bg-iri-strong' : 'bg-transparent'}`} aria-label={r.unread ? 'Unread' : undefined} />
            </Link>
          ))}
        </div>
      </Page>
    </Screen>
  )
}
