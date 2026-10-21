import { useUnreadDot } from '../threads'
import { useAuth } from '../auth'
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { IconBack, IconCalendar, IconChat, IconCompass, IconHome, IconPeople, IconPin, IconPlus, IconUser } from './icons'

/** Full-height screen: scrolling content plus an optional fixed footer (tab bar or action bar). */
export function Screen({ children, footer, header, className = '' }: { children: ReactNode; footer?: ReactNode; header?: ReactNode; className?: string }) {
  return (
    <div className="flex h-full flex-col">
      {header}
      <main className={`xa-page flex-1 overflow-y-auto ${className}`}>{children}</main>
      {footer}
    </div>
  )
}

/** Content of a main (tab) screen; clears the status bar / Dynamic Island on every iPhone. */
export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`pt-safe flex flex-col gap-6 px-5 pb-8 ${className}`}>{children}</div>
}


export const H1 = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <h1 className={`m-0 font-display text-[34px] leading-[1.05] font-medium text-ink ${className}`}>{children}</h1>
)
export const H2 = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <h2 className={`m-0 font-display text-2xl font-semibold text-ink ${className}`}>{children}</h2>
)
export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="text-iri self-start text-xs font-semibold tracking-[0.2em] uppercase">{children}</span>
)
/** A word or phrase inside a heading that shimmers in the logo's iridescence. */
export const Glow = ({ children }: { children: ReactNode }) => <em className="text-iri not-italic">{children}</em>

export function BackButton({ to, label = 'Back', onClick }: { to?: string; label?: string; onClick?: () => void }) {
  const cls = 'flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text'
  if (onClick) return <button type="button" aria-label={label} onClick={onClick} className={cls}><IconBack /></button>
  return <Link to={to ?? '/'} aria-label={label} className={cls}><IconBack /></Link>
}

export function Chip({ on, onClick, children, solid = false }: { on: boolean; onClick: () => void; children: ReactNode; solid?: boolean }) {
  const onCls = solid ? 'border-transparent bg-iri text-navy font-semibold' : 'ring-iri border-transparent bg-iri-violet/14 text-ink font-semibold'
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={`min-h-9 flex-none rounded-full border px-3.5 text-[13px] transition-colors ${on ? onCls : 'border-line-2 text-muted'}`}>
      {children}
    </button>
  )
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="grid gap-1.5 rounded-2xl bg-surface p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button key={o} type="button" role="tab" aria-selected={value === o} onClick={() => onChange(o)}
          className={`min-h-10 rounded-[10px] text-sm transition-colors ${value === o ? 'bg-line font-semibold text-ink' : 'text-subtle'}`}>
          {o}
        </button>
      ))}
    </div>
  )
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`flex h-[30px] w-[52px] flex-none rounded-full p-[3px] transition-colors ${on ? 'justify-end bg-iri-strong' : 'justify-start bg-line'}`}>
      <span className="h-6 w-6 rounded-full bg-ink shadow-[0_1px_4px_rgba(0,0,0,.35)]" />
    </button>
  )
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[22px] border border-dashed border-line-2 px-5 py-8 text-center">
      {icon && <div className="text-gold-soft">{icon}</div>}
      <p className="m-0 font-display text-[24px] leading-tight text-ink">{title}</p>
      {children && <p className="m-0 text-sm leading-relaxed text-muted">{children}</p>}
      {action}
    </div>
  )
}

export function PrimaryButton({ children, onClick, className = '', done = false, type = 'button' }: { children: ReactNode; onClick?: () => void; className?: string; done?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button type={type} onClick={onClick}
      className={`min-h-12 rounded-2xl px-6 text-[15px] font-semibold text-navy transition-colors ${done ? 'bg-calm' : 'bg-iri shadow-[0_6px_24px_-8px_rgba(181,139,224,.55)]'} ${className}`}>
      {children}
    </button>
  )
}

export function PrimaryLink({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`flex min-h-12 items-center justify-center rounded-2xl bg-iri px-6 text-[15px] font-semibold text-navy no-underline hover:text-navy ${className}`}>
      {children}
    </Link>
  )
}

export function RowLink({ to, href, title, sub }: { to?: string; href?: string; title: string; sub: string }) {
  const inner = (
    <>
      <span className="flex flex-col gap-0.5"><span className="text-[15px] font-semibold text-ink">{title}</span><span className="text-[13px] text-subtle">{sub}</span></span>
      <span className="text-iri text-lg leading-none" aria-hidden>›</span>
    </>
  )
  const cls = 'flex items-center justify-between gap-3 rounded-[18px] bg-surface p-4 text-text no-underline'
  return href ? <a href={href} className={cls}>{inner}</a> : <Link to={to ?? '/'} className={cls}>{inner}</Link>
}

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-[13px] text-muted">{label}{children}</label>
}
export const inputCls = 'min-h-12 rounded-xl border border-line bg-surface-2 px-3.5 text-[15px] text-text outline-none placeholder:text-faint focus:border-gold'

export function Badge({ children }: { children: ReactNode }) {
  return <span className="ring-iri self-start rounded-full px-2.5 py-1 text-xs text-gold-pale">{children}</span>
}

export function Progress({ value }: { value: number }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-plum-line"><div className="bg-iri-strong h-1.5 rounded-full transition-[width] duration-500" style={{ width: `${Math.round(value * 100)}%` }} /></div>
}

/* ---------- Tab bars ---------- */
type Tab = { to: string; label: string; icon: ReactNode; end?: boolean; dot?: boolean }

function TabBar({ tabs, center, label }: { tabs: Tab[]; center?: Tab; label: string }) {
  const unread = useUnreadDot()
  const item = (t: Tab) => (
    <NavLink key={t.to} to={t.to} end={t.end ?? true}
      className={({ isActive }) => `relative flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 text-[10.5px] font-medium tracking-[0.01em] no-underline transition-colors ${isActive ? 'text-ink' : 'text-faint'}`}>
      {({ isActive }) => (
        <>
          <span className={`relative transition-[filter,transform] duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(181,139,224,.75)]' : ''}`}>{t.icon}{t.dot && unread && <span aria-label="Unread messages" className="bg-iri-strong absolute -top-0.5 -right-1 h-2.5 w-2.5 rounded-full ring-2 ring-navy-deep" />}</span>
          {t.label}
          <span aria-hidden className={`bg-iri-strong absolute -bottom-0.5 h-[3px] rounded-full transition-all duration-300 ${isActive ? 'w-5 opacity-100' : 'w-0 opacity-0'}`} />
        </>
      )}
    </NavLink>
  )
  const left = center ? tabs.slice(0, 2) : tabs
  const right = center ? tabs.slice(2) : []
  return (
    <nav aria-label={label} className="pb-tab relative z-20 flex flex-none items-start justify-around bg-navy-deep/85 px-2 pt-2 backdrop-blur-xl">
      <span aria-hidden className="bg-iri-strong absolute inset-x-0 top-0 h-px opacity-60" />
      {left.map(item)}
      {center && (
        <Link to={center.to} aria-label={center.label} className="-mt-1.5 flex h-13 w-13 items-center justify-center rounded-full bg-iri text-navy shadow-[0_0_22px_-2px_rgba(181,139,224,.7)] hover:text-navy">{center.icon}</Link>
      )}
      {right.map(item)}
    </nav>
  )
}

export const SeekerTabs = () => (
  <TabBar label="Main" tabs={[
    { to: '/discover', label: 'Discover', icon: <IconCompass /> },
    { to: '/calendar', label: 'Calendar', icon: <IconCalendar /> },
    { to: '/community', label: 'Community', icon: <IconPeople size={22} />, end: false },
    { to: '/messages', label: 'Messages', icon: <IconChat />, end: false, dot: true },
    { to: '/you', label: 'You', icon: <IconUser /> },
  ]} />
)

/** Before approval a host sees only their application, the team thread and (while in review) their space or profile. */
function ApplicantTabs({ edit }: { edit?: Tab }) {
  return <TabBar label="Application" tabs={[
    { to: '/apply/status', label: 'Application', icon: <IconHome /> },
    { to: '/messages/team', label: 'Messages', icon: <IconChat />, dot: true },
    ...(edit ? [edit] : []),
  ]} />
}
const useApproved = () => {
  const { profile } = useAuth()
  return !profile || profile.role === 'seeker' || profile.status === 'approved' ? null : profile.status
}

export const ContainerTabs = () => {
  const waiting = useApproved()
  if (waiting) return <ApplicantTabs edit={waiting === 'pending' ? { to: '/container/space', label: 'Space', icon: <IconPin /> } : undefined} />
  return (
  <TabBar label="Host" center={{ to: '/container/new', label: 'New offering', icon: <IconPlus size={24} /> }} tabs={[
    { to: '/container', label: 'Home', icon: <IconHome /> },
    { to: '/container/offering', label: 'Offerings', icon: <IconCalendar /> },
    { to: '/messages', label: 'Messages', icon: <IconChat />, end: false, dot: true },
    { to: '/container/space', label: 'Space', icon: <IconPin /> },
  ]} />
  )
}

export const FacilitatorTabs = () => {
  const waiting = useApproved()
  if (waiting) return <ApplicantTabs edit={waiting === 'pending' ? { to: '/facilitator/profile', label: 'Profile', icon: <IconUser /> } : undefined} />
  return (
  <TabBar label="Facilitator" tabs={[
    { to: '/facilitator', label: 'Home', icon: <IconHome /> },
    { to: '/facilitator/spaces', label: 'Spaces', icon: <IconPin /> },
    { to: '/community', label: 'Community', icon: <IconPeople size={22} />, end: false },
    { to: '/messages', label: 'Messages', icon: <IconChat />, end: false, dot: true },
    { to: '/facilitator/profile', label: 'Profile', icon: <IconUser /> },
  ]} />
  )
}

/** Checklist used on Container and Facilitator home screens. Items tick themselves off as the profile fills in. */
export function Checklist({ title, items, done }: { title: string; items: { id: string; title: string; sub: string; to: string }[]; done: string[] }) {
  return (
    <section className="ring-iri flex flex-col gap-3 rounded-[20px] bg-plum/80 p-[18px]">
      <div className="flex items-baseline justify-between"><H2>{title}</H2><span className="text-[13px] text-gold-pale">{`${done.length} of ${items.length}`}</span></div>
      <Progress value={done.length / items.length} />
      {items.map((t) => {
        const d = done.includes(t.id)
        return (
          <div key={t.id} className="flex items-center gap-3 py-2.5">
            <span aria-hidden className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg text-sm font-bold ${d ? 'bg-iri-strong text-navy' : 'border-[1.5px] border-slate text-transparent'}`}>✓</span>
            <Link to={t.to} aria-label={`${t.title}${d ? ' (done)' : ''}`} className="flex min-w-0 flex-1 flex-col gap-0.5 no-underline">
              <span className={`text-[15px] font-semibold ${d ? 'text-faint line-through' : 'text-ink'}`}>{t.title}</span>
              <span className="text-xs text-subtle">{t.sub}</span>
            </Link>
          </div>
        )
      })}
    </section>
  )
}

/** Review summary + empty state, shared by space and facilitator profiles. */
export function Reviews({ categories, emptyText }: { categories: string[]; emptyText: string }) {
  return (
    <section id="reviews" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="m-0 font-display text-[22px] font-semibold text-ink">Reviews</h2>
        <span className="text-xs text-subtle">Only guests who booked through Xanadu can leave a review</span>
      </div>
      <div className="flex items-center gap-4 rounded-[18px] bg-plum p-4">
        <div className="flex w-23 flex-none flex-col items-center gap-0.5">
          <span className="font-display text-[40px] leading-none text-faint">–</span>
          <span className="text-[13px] tracking-[2px] text-slate" aria-hidden>★★★★★</span>
          <span className="text-xs text-subtle">0 reviews</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {categories.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <span className="w-[88px] flex-none text-xs text-muted">{c}</span>
              <span className="h-[5px] flex-1 rounded-full bg-plum-line" />
            </div>
          ))}
        </div>
      </div>
      <EmptyState title="No reviews yet">{emptyText}</EmptyState>
    </section>
  )
}
