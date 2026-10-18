import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LANDSCAPE, when, type Msg } from './lib/data'
import { Button, Spinner } from './ui'

/** A side drawer on desktop, a full-screen sheet on phones. Rendered above everything. */
export function Drawer({ title, sub, image, onClose, children, footer, label }: {
  title: ReactNode; sub?: ReactNode; image?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; label: string
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !(e.target instanceof HTMLTextAreaElement)) onClose() }
    window.addEventListener('keydown', esc)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = prev }
  }, [onClose])
  return createPortal(
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={label}>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-deep/70 backdrop-blur-[2px]" />
      <aside className="xa-page absolute inset-y-0 right-0 flex w-full max-w-[600px] flex-col border-l border-line bg-navy shadow-2xl">
        <header className="pt-safe flex items-start gap-4 border-b border-line px-5 pb-4 sm:pt-6">
          {image}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[28px] leading-tight text-ink">{title}</h2>
            {sub && <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-subtle">{sub}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-full text-subtle ring-1 ring-line hover:text-text">✕</button>
        </header>
        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="pb-safe border-t border-line bg-navy-deep/80 px-5 pt-4">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  )
}

export function Section({ title, step, children }: { title: string; step?: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 flex items-baseline gap-2 text-[11.5px] font-semibold uppercase tracking-[.16em] text-faint">
        {step && <span className="text-gold-soft">{step}</span>}{title}
      </h3>
      {children}
    </section>
  )
}

/** Question → answer rows, exactly as the member answered. Empty answers say so. */
export function Answers({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-[14px] sm:grid-cols-[150px_1fr]">
      {rows.map(([q, a]) => (
        <div key={q} className="contents">
          <dt className="text-faint">{q}</dt>
          <dd className="-mt-2 whitespace-pre-line break-words text-text sm:mt-0">{isEmpty(a) ? <span className="text-faint italic">Not answered</span> : a}</dd>
        </div>
      ))}
    </dl>
  )
}
const isEmpty = (a: ReactNode) => a === null || a === undefined || a === '' || (Array.isArray(a) && a.length === 0)

export function Avatar({ src, size = 'size-10', square = false }: { src?: string | null; size?: string; square?: boolean }) {
  const r = square ? 'rounded-xl' : 'rounded-full'
  return src ? <img src={src} alt="" className={`${size} ${r} shrink-0 object-cover`} /> : <div className={`${size} ${r} shrink-0 bg-portal`} />
}

export function Tabs<T extends string>({ tabs, value, onChange, counts }: { tabs: readonly { key: T; label: string }[]; value: T; onChange: (v: T) => void; counts?: Partial<Record<T, number>> }) {
  return (
    <div role="tablist" className="flex gap-1.5 overflow-x-auto pb-1">
      {tabs.map((t) => (
        <button key={t.key} role="tab" aria-selected={value === t.key} onClick={() => onChange(t.key)}
          className={`h-9 shrink-0 rounded-full px-4 text-[13.5px] font-semibold ${value === t.key ? 'bg-iri text-navy' : 'bg-surface/70 text-subtle ring-1 ring-line hover:text-text'}`}>
          {t.label}{counts && counts[t.key] !== undefined && <span className={`ml-1.5 ${value === t.key ? 'text-navy/70' : 'text-gold-soft'}`}>{counts[t.key]}</span>}
        </button>
      ))}
    </div>
  )
}

export function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
      className="h-10 w-full rounded-full bg-navy/70 px-4 text-[14px] text-ink outline-none ring-1 ring-line-2 focus:ring-gold-soft sm:w-72" />
  )
}

export function Chips({ items }: { items: string[] | null | undefined }) {
  if (!items?.length) return null
  return <div className="flex flex-wrap gap-1.5">{items.map((p) => <span key={p} className="rounded-full bg-surface px-2.5 py-1 text-[12.5px] text-text ring-1 ring-line-2">{p}</span>)}</div>
}

/** Way of living: stays and work as quiet chips, landscapes in their own colours */
export function LifeChips({ items }: { items: string[] | null | undefined }) {
  if (!items?.length) return null
  const lands = items.filter((l) => LANDSCAPE[l])
  const rest = items.filter((l) => !LANDSCAPE[l])
  return (
    <div className="flex flex-wrap gap-1.5">
      {rest.map((l) => <span key={l} className="rounded-full bg-surface px-2.5 py-1 text-[12.5px] text-text ring-1 ring-line-2">{l}</span>)}
      {lands.map((l) => <span key={l} className="rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-navy" style={{ background: LANDSCAPE[l] }}>{l}</span>)}
    </div>
  )
}

export function Gallery({ photos }: { photos: string[] | null | undefined }) {
  const [open, setOpen] = useState<number | null>(null)
  if (!photos?.length) return null
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <button key={p} onClick={() => setOpen(i)} className="aspect-square overflow-hidden rounded-xl ring-1 ring-line">
            <img src={p} alt={`Photo ${i + 1}`} className="size-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
      {open !== null && createPortal(
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-deep/95 p-4" onClick={() => setOpen(null)} role="dialog" aria-label="Photo">
          <img src={photos[open]} alt="" className="max-h-[85dvh] max-w-full rounded-xl" />
          <div className="absolute inset-x-0 bottom-6 flex justify-center gap-3" onClick={(e) => e.stopPropagation()}>
            <Button variant="quiet" onClick={() => setOpen((open + photos.length - 1) % photos.length)}>Previous</Button>
            <span className="self-center text-[13px] text-subtle">{open + 1} / {photos.length}</span>
            <Button variant="quiet" onClick={() => setOpen((open + 1) % photos.length)}>Next</Button>
          </div>
        </div>, document.body)}
    </>
  )
}

/** A member's thread with the Xanadu team. Never their private Community chats. */
export function ThreadView({ messages, empty = 'No messages yet.' }: { messages: Msg[] | null; empty?: string }) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [messages?.length])
  if (messages === null) return <Spinner />
  if (!messages.length) return <p className="text-[13.5px] text-faint">{empty}</p>
  return (
    <ul className="space-y-2">
      {messages.map((t) => (
        <li key={t.id} className={`flex ${t.from_team ? 'justify-end' : ''}`}>
          <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${t.from_team ? 'bg-plum text-ink ring-1 ring-plum-line' : 'bg-surface-2 text-text ring-1 ring-line'}`}>
            <p className="whitespace-pre-line break-words">{t.body}</p>
            <p className="mt-1 text-[11px] text-faint">{t.from_team ? 'Xanadu team' : 'Member'} · {when(t.created_at)}</p>
          </div>
        </li>
      ))}
      <div ref={end} />
    </ul>
  )
}

/** Message box used for replies and for decision messages (prefilled from a template). */
export function Composer({ initial = '', placeholder = 'Write a message…', sendLabel = 'Send', onSend, onCancel, hint, autoFocus = false }: {
  initial?: string; placeholder?: string; sendLabel: string; onSend: (body: string) => Promise<string | null>; onCancel?: () => void; hint?: ReactNode; autoFocus?: boolean
}) {
  const [body, setBody] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { setBody(initial) }, [initial])
  async function send() {
    setBusy(true); setError(null)
    const err = await onSend(body.trim())
    setBusy(false)
    if (err) setError(err); else setBody('')
  }
  const unfilled = /\{\w+\}/.test(body)
  return (
    <div className="space-y-2.5">
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} rows={4} autoFocus={autoFocus}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && body.trim() && !busy) send() }}
        className="w-full resize-y rounded-xl bg-navy/70 px-3.5 py-3 text-[14px] leading-relaxed text-ink outline-none ring-1 ring-line-2 focus:ring-gold-soft" />
      {unfilled && <p className="text-[12.5px] text-gold-pale">Replace the words in {'{curly brackets}'} before sending.</p>}
      {hint && <p className="text-[12.5px] text-faint">{hint}</p>}
      {error && <p role="alert" className="text-[13px] text-rose">{error}</p>}
      <div className="flex gap-2 pb-1">
        {onCancel && <Button variant="quiet" onClick={onCancel} disabled={busy}>Cancel</Button>}
        <Button className="flex-1" onClick={send} disabled={busy || unfilled || (!body.trim() && !onCancel)}>{busy ? 'Sending…' : sendLabel}</Button>
      </div>
    </div>
  )
}

/** Small confirmation that fades after a few seconds */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 3500); return () => clearTimeout(t) }, [msg])
  const node = msg ? createPortal(
    <div role="status" className="xa-page fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-8">
      <div className="ring-iri rounded-full bg-surface px-5 py-2.5 text-[14px] font-semibold text-ink shadow-xl">{msg}</div>
    </div>, document.body) : null
  return { show: setMsg, node }
}
