import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Emblem({ className = 'w-10' }: { className?: string }) {
  return <img src="/logo-emblem-light.png" alt="" aria-hidden className={`${className} select-none`} draggable={false} />
}

export function Wordmark({ className = 'w-28' }: { className?: string }) {
  return <img src="/logo-xanadu-text.png" alt="Xanadu" className={`${className} select-none`} draggable={false} />
}

export function Glow({ children }: { children: ReactNode }) {
  return <span className="text-iri">{children}</span>
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'ghost' }
export function Button({ variant = 'primary', className = '', children, ...rest }: BtnProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-[14px] font-semibold disabled:opacity-50'
  const look = variant === 'primary'
    ? 'bg-iri text-navy'
    : variant === 'quiet'
      ? 'bg-surface-2 text-text ring-1 ring-line-2 hover:bg-surface'
      : 'text-subtle hover:text-text'
  return <button className={`${base} ${look} ${className}`} {...rest}>{children}</button>
}

export function Field({ label, hint, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[.14em] text-faint">{label}</span>
      <input
        {...rest}
        className={`h-12 w-full rounded-xl bg-navy/70 px-4 text-[15px] text-ink outline-none ring-1 ring-line-2 focus:ring-gold-soft ${rest.className ?? ''}`}
      />
      {hint && <span className="mt-1.5 block text-[12px] text-faint">{hint}</span>}
    </label>
  )
}

export function Card({ children, className = '', glow = false }: { children: ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={`rounded-2xl bg-surface/70 backdrop-blur-sm ${glow ? 'ring-iri' : 'ring-1 ring-line'} ${className}`}>
      {children}
    </div>
  )
}

export type Status = 'pending' | 'approved' | 'changes' | 'declined' | 'live' | 'review'
const PILL: Record<Status, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-gold/15 text-gold-pale ring-1 ring-gold/40' },
  review: { label: 'In review', cls: 'bg-gold/15 text-gold-pale ring-1 ring-gold/40' },
  approved: { label: 'Approved', cls: 'ring-iri text-ink' },
  live: { label: 'Live', cls: 'ring-iri text-ink' },
  changes: { label: 'Needs changes', cls: 'bg-rose/12 text-rose ring-1 ring-rose/40' },
  declined: { label: 'Declined', cls: 'bg-slate/30 text-subtle ring-1 ring-slate' },
}
export function StatusPill({ status }: { status: Status }) {
  const p = PILL[status]
  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-semibold ${p.cls}`}>{p.label}</span>
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[.18em] text-faint">{eyebrow}</p>}
        <h1 className="font-display text-[34px] leading-tight font-medium text-ink sm:text-[40px]">{title}</h1>
      </div>
      {children}
    </header>
  )
}

export function EmptyState({ title, body }: { title: string; body: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl px-6 py-14 text-center ring-1 ring-line ring-dashed">
      <div className="mb-4 size-16 rounded-full bg-portal opacity-80" />
      <p className="font-display text-[24px] text-ink">{title}</p>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-subtle">{body}</p>
    </div>
  )
}

export function Spinner() {
  return <div className="size-6 animate-spin rounded-full border-2 border-line-2 border-t-gold-soft" role="status" aria-label="Loading" />
}

/** A centred card on the aurora, for the sign-in steps */
export function DoorFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="xa-aurora" />
      <div className="xa-page relative z-10 w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Emblem className="w-14" />
          <Wordmark className="w-36 opacity-90" />
          <p className="text-[11.5px] font-semibold uppercase tracking-[.3em] text-faint">Team console</p>
        </div>
        <Card className="p-6 sm:p-7">{children}</Card>
      </div>
    </div>
  )
}
