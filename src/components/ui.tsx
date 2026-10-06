import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { HOME, useAuth } from '../auth'
import { IconBack, IconCalendar, IconChat, IconCompass, IconHeart, IconHome, IconPeople, IconPin, IconPlus, IconUser } from './icons'

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

/** Content of a main (tab) screen; sits under the AppHeader. */
export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-6 px-5 pt-5 pb-8 ${className}`}>{children}</div>
}

/**
 * The app bar on every main screen: a solid navy band locked to the top, holding only the
 * Xanadu lockup, centred: the emblem (transparent background) with the wordmark beside it.
 * Clears the notch / Dynamic Island on every iPhone.
 */
export function AppHeader() {
  const { profile } = useAuth()
  return (
    <header className="pt-safe-bar relative z-20 flex flex-none items-center justify-center border-b border-white/[0.06] bg-navy px-4 pb-2">
      <Link to={HOME[profile?.role ?? 'seeker']} aria-label="Xanadu home" className="flex min-h-12 items-center gap-2.5 no-underline">
        <img src="/logo-emblem-light.png?v=3" alt="" className="h-[54px] w-auto flex-none" />
        <img src="/logo-xanadu-text.png" alt="Xanadu" className="h-[16px] w-auto" />
      </Link>
    </header>
  )
}

export const H1 = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <h1 className={`m-0 font-display text-[34px] leading-[1.05] font-medium text-ink ${className}`}>{children}</h1>
)
export const H2 = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <h2 className={`m-0 font-display text-2xl font-semibold text-ink ${className}`}>{children}</h2>
)
export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="text-xs tracking-[0.2em] text-gold-soft uppercase">{children}</span>
)

export function BackButton({ to, label = 'Back', onClick }: { to?: string; label?: string; onClick?: () => void }) {
  const cls = 'flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text'
  if (onClick) return <button type="button" aria-label={label} onClick={onClick} className={cls}><IconBack /></button>
  return <Link to={to ?? '/'} aria-label={label} className={cls}><IconBack /></Link>
}

export function Chip({ on, onClick, children, solid = false }: { on: boolean; onClick: () => void; children: ReactNode; solid?: boolean }) {
  const onCls = solid ? 'border-gold bg-gold text-navy font-semibold' : 'border-gold bg-gold/18 text-gold-pale font-semibold'
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
      className={`flex h-[30px] w-[52px] flex-none rounded-full p-[3px] transition-colors ${on ? 'justify-end bg-gold' : 'justify-start bg-line'}`}>
      <span className="h-6 w-6 rounded-full bg-ink" />
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
      className={`min-h-12 rounded-2xl px-6 text-[15px] font-semibold text-navy transition-colors ${done ? 'bg-calm' : 'bg-gold hover:bg-gold-soft'} ${className}`}>
      {children}
    </button>
  )
}

export function PrimaryLink({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`flex min-h-12 items-center justify-center rounded-2xl bg-gold px-6 text-[15px] font-semibold text-navy no-underline hover:bg-gold-soft hover:text-navy ${className}`}>
      {children}
    </Link>
  )
}

export function RowLink({ to, href, title, sub }: { to?: string; href?: string; title: string; sub: string }) {
  const inner = (
    <>
      <span className="flex flex-col gap-0.5"><span className="text-[15px] font-semibold text-ink">{title}</span><span className="text-[13px] text-subtle">{sub}</span></span>
      <span className="text-gold-soft" aria-hidden>›</span>
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
  return <span className="self-start rounded-full border border-gold px-2.5 py-1 text-xs text-gold-pale">{children}</span>
}

export function Progress({ value }: { value: number }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-plum-line"><div className="h-1.5 rounded-full bg-gold transition-[width] duration-500" style={{ width: `${Math.round(value * 100)}%` }} /></div>
}

/* ---------- Tab bars ---------- */
type Tab = { to: string; label: string; icon: ReactNode; end?: boolean }

function TabBar({ tabs, center, label }: { tabs: Tab[]; center?: Tab; label: string }) {
  const item = (t: Tab) => (
    <NavLink key={t.to} to={t.to} end={t.end ?? true}
      className={({ isActive }) => `flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 text-[10.5px] font-medium tracking-[0.01em] no-underline ${isActive ? 'text-gold-soft' : 'text-faint'}`}>
      {t.icon}{t.label}
    </NavLink>
  )
  const left = center ? tabs.slice(0, 2) : tabs
  const right = center ? tabs.slice(2) : []
  return (
    <nav aria-label={label} className="pb-tab relative z-20 flex flex-none items-start justify-around border-t border-white/[0.06] bg-navy-deep/90 px-2 pt-2 backdrop-blur-xl">
      {left.map(item)}
      {center && (
        <Link to={center.to} aria-label={center.label} className="-mt-1.5 flex h-13 w-13 items-center justify-center rounded-full bg-gold text-navy hover:text-navy">{center.icon}</Link>
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
    { to: '/saved', label: 'Saved', icon: <IconHeart /> },
    { to: '/you', label: 'You', icon: <IconUser /> },
  ]} />
)

export const ContainerTabs = () => (
  <TabBar label="Host" center={{ to: '/container/new', label: 'New offering', icon: <IconPlus size={24} /> }} tabs={[
    { to: '/container', label: 'Home', icon: <IconHome /> },
    { to: '/container/offering', label: 'Offerings', icon: <IconCalendar /> },
    { to: '/container/inbox', label: 'Inbox', icon: <IconChat /> },
    { to: '/container/space', label: 'Space', icon: <IconPin /> },
  ]} />
)

export const FacilitatorTabs = () => (
  <TabBar label="Facilitator" tabs={[
    { to: '/facilitator', label: 'Home', icon: <IconHome /> },
    { to: '/facilitator/spaces', label: 'Spaces', icon: <IconPin /> },
    { to: '/community', label: 'Community', icon: <IconPeople size={22} />, end: false },
    { to: '/facilitator/inbox', label: 'Inbox', icon: <IconChat /> },
    { to: '/facilitator/profile', label: 'Profile', icon: <IconUser /> },
  ]} />
)

/** Checklist used on Container and Facilitator home screens. Items tick themselves off as the profile fills in. */
export function Checklist({ title, items, done }: { title: string; items: { id: string; title: string; sub: string; to: string }[]; done: string[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-[20px] bg-plum p-[18px]">
      <div className="flex items-baseline justify-between"><H2>{title}</H2><span className="text-[13px] text-gold-pale">{`${done.length} of ${items.length}`}</span></div>
      <Progress value={done.length / items.length} />
      {items.map((t) => {
        const d = done.includes(t.id)
        return (
          <div key={t.id} className="flex items-center gap-3 py-2.5">
            <span aria-hidden className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg text-sm font-bold ${d ? 'bg-gold text-navy' : 'border-[1.5px] border-slate text-transparent'}`}>✓</span>
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
