import { NavLink, Outlet } from 'react-router-dom'
import { useGate } from './gate'
import { Emblem, Wordmark } from './ui'

type Item = { to: string; label: string; icon: string; phone?: boolean }
/** Icons are simple 24px line paths, drawn to match the app's fine-line look */
export const NAV: Item[] = [
  { to: '/', label: 'Today', icon: 'M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z', phone: true },
  { to: '/applications', label: 'Applications', icon: 'M9 4h6M8 4H6a1 1 0 00-1 1v15a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1h-2M9 12l2 2 4-4', phone: true },
  { to: '/offerings', label: 'Offerings', icon: 'M4 7h16v13H4zM4 7l2-3h12l2 3M9 12h6' },
  { to: '/inbox', label: 'Inbox', icon: 'M4 5h16v11H8l-4 4zM8 9h8M8 12h5', phone: true },
  { to: '/members', label: 'Members', icon: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.2a3 3 0 010 5.6M18 14.4c1.8.9 3 2.9 3 5.6', phone: true },
  { to: '/events', label: 'Community events', icon: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h3' },
  { to: '/waitlist', label: 'Waitlist', icon: 'M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z' },
  { to: '/spaces', label: 'Spaces', icon: 'M3 20h18M5 20V10l7-6 7 6v10M10 20v-5h4v5' },
  { to: '/emails', label: 'Emails', icon: 'M3 6h18v12H3zM3 7l9 6 9-6' },
  { to: '/instagram', label: 'Instagram', icon: 'M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zM12 8a4 4 0 100 8 4 4 0 000-8zM17.5 6.5h.01' },
  { to: '/safety', label: 'Safety', icon: 'M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z' },
  { to: '/settings', label: 'Settings', icon: 'M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z', phone: true },
]

export function Icon({ d, className = 'size-[19px]' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  )
}

export default function Shell() {
  const { me, session } = useGate()
  const name = me?.name || session?.user.email || 'Team'
  return (
    <div className="relative min-h-dvh">
      <div className="xa-aurora" />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line/70 bg-navy-deep/70 px-4 py-6 backdrop-blur-md md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <Emblem className="w-7" />
          <div>
            <Wordmark className="w-24" />
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.28em] text-faint">Console</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Console">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => `flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-medium no-underline ${isActive ? 'ring-iri bg-surface/80 text-ink' : 'text-subtle hover:bg-surface/50 hover:text-text'}`}>
              <Icon d={n.icon} />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          {me?.photo_url
            ? <img src={me.photo_url} alt="" className="size-8 rounded-full object-cover" />
            : <div className="size-8 rounded-full bg-portal" />}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-text">{name}</p>
            <p className="text-[11px] text-faint capitalize">{me?.role ?? 'admin'}</p>
          </div>
        </div>
      </aside>

      {/* Phone header */}
      <header className="pt-safe relative z-10 flex items-center gap-2.5 px-4 pb-2 md:hidden">
        <Emblem className="w-6" />
        <Wordmark className="w-20" />
        <span className="text-[10px] font-semibold uppercase tracking-[.26em] text-faint">Console</span>
      </header>

      <main className="relative z-10 px-4 pt-4 pb-28 sm:px-6 md:ml-60 md:px-10 md:pt-10 md:pb-12">
        <div className="mx-auto max-w-6xl"><Outlet /></div>
      </main>

      {/* Phone bottom bar */}
      <nav aria-label="Console" className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-navy-deep/80 pt-1.5 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-md justify-around">
          {NAV.filter((n) => n.phone).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => `flex min-w-14 flex-col items-center gap-1 px-1 py-1 text-[10.5px] font-semibold no-underline ${isActive ? 'text-ink' : 'text-faint'}`}>
              {({ isActive }) => (<>
                <span className={`grid h-8 w-12 place-items-center rounded-full ${isActive ? 'ring-iri bg-surface/80' : ''}`}><Icon d={n.icon} className="size-[19px]" /></span>
                {n.label}
              </>)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
