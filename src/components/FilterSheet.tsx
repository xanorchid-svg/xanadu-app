import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Chip, Field, inputCls } from './ui'
import { IconClose } from './icons'
import { LENGTHS, NO_FILTERS, PRICES, SORTS, TYPES, WHEN, passes, spacePasses, type Filters } from '../filters'
import type { Listing, PublicSpace } from '../store'

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2.5">
    <h3 className="m-0 text-[13px] font-semibold tracking-[0.08em] text-subtle uppercase">{title}</h3>
    <div className="flex flex-wrap gap-2">{children}</div>
  </section>
)

/**
 * Bottom sheet with every Discover filter. Options that would show nothing are hidden
 * (the selected one always stays), and the button says how many results the choice gives.
 */
export default function FilterSheet({ value, onApply, onClose, listings, spaces, places }: {
  value: Filters; onApply: (f: Filters) => void; onClose: () => void
  listings: Listing[]; spaces: PublicSpace[]; places: { country: string; regions: string[] }[]
}) {
  const [f, setF] = useState<Filters>(value)
  const set = (patch: Partial<Filters>) => setF((x) => ({ ...x, ...patch }))

  // what a choice would show, given every other filter
  const count = (patch: Partial<Filters>, ignore: keyof Filters) => {
    const g = { ...f, ...patch }
    return g.type === 'Volunteer exchange'
      ? spaces.filter((s) => spacePasses(s, g, ignore === 'type' ? undefined : ignore)).length
      : listings.filter((e) => passes(e, g, undefined)).length
  }
  const show = (selected: boolean, n: number) => selected || n > 0

  const results = f.type === 'Volunteer exchange' ? spaces.filter((s) => spacePasses(s, f)).length : listings.filter((e) => passes(e, f)).length
  const experiencesOnly = f.type !== 'Volunteer exchange'
  const regions = places.find((p) => p.country === f.country)?.regions ?? []
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  // rendered above the whole app (not inside the scrolling page), over the phone-width column
  return createPortal(
    <div className="fixed inset-y-0 left-1/2 z-50 flex w-full -translate-x-1/2 sm:max-w-[430px] flex-col justify-end bg-navy-deep/70" role="dialog" aria-modal="true" aria-label="Filters" onClick={onClose}>
      <div className="xa-page flex max-h-[88%] flex-col rounded-t-[26px] bg-navy" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#1F2B3E] px-5 pt-4 pb-3">
          <button type="button" aria-label="Close filters" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text"><IconClose size={18} /></button>
          <span className="text-[16px] font-semibold text-ink">Filters</span>
          <button type="button" onClick={() => setF({ ...NO_FILTERS, sort: f.sort })} className="min-h-10 px-1 text-[13px] text-gold-soft">Clear all</button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5">
          <Section title="Type">
            {TYPES.map((t) => {
              const n = count({ type: t }, 'type')
              return show(f.type === t, t === 'Any' ? 1 : n) && <Chip key={t} solid on={f.type === t} onClick={() => set({ type: t })}>{t}</Chip>
            })}
          </Section>

          <Section title="Where">
            <Chip solid on={!f.country} onClick={() => set({ country: '', region: '' })}>Everywhere</Chip>
            {places.map((p) => <Chip key={p.country} solid on={f.country === p.country} onClick={() => set({ country: p.country, region: '' })}>{p.country}</Chip>)}
            {!places.length && <span className="text-[13px] text-subtle">Destinations appear here as spaces around the world join.</span>}
          </Section>
          {f.country && regions.length > 0 && (
            <Section title={`In ${f.country}`}>
              <Chip on={!f.region} onClick={() => set({ region: '' })}>{`All of ${f.country}`}</Chip>
              {regions.map((r) => <Chip key={r} on={f.region.toLowerCase() === r.toLowerCase()} onClick={() => set({ region: r })}>{r}</Chip>)}
            </Section>
          )}

          {experiencesOnly && (
            <>
              <Section title="When">
                {WHEN.map(([k, label]) => show(f.when === k, k === 'any' || k === 'dates' ? 1 : count({ when: k }, 'when')) &&
                  <Chip key={k} solid on={f.when === k} onClick={() => set({ when: k })}>{label}</Chip>)}
              </Section>
              {f.when === 'dates' && (
                <div className="-mt-3 grid grid-cols-2 gap-2.5">
                  <Field label="From"><input type="date" value={f.from} onChange={(e) => set({ from: e.target.value })} className={`${inputCls} px-3 text-sm [color-scheme:dark]`} /></Field>
                  <Field label="To"><input type="date" value={f.to} min={f.from || undefined} onChange={(e) => set({ to: e.target.value })} className={`${inputCls} px-3 text-sm [color-scheme:dark]`} /></Field>
                </div>
              )}
              <Section title="Price per person">
                {PRICES.map(([k, label]) => show(f.price === k, k === 'any' ? 1 : count({ price: k }, 'price')) &&
                  <Chip key={k} solid on={f.price === k} onClick={() => set({ price: k })}>{label}</Chip>)}
              </Section>
              <Section title="Length">
                {LENGTHS.map(([k, label]) => show(f.length === k, k === 'any' ? 1 : count({ length: k }, 'length')) &&
                  <Chip key={k} solid on={f.length === k} onClick={() => set({ length: k })}>{label}</Chip>)}
              </Section>
              <Section title="Sort by">
                {SORTS.map(([k, label]) => <Chip key={k} on={f.sort === k} onClick={() => set({ sort: k })}>{label}</Chip>)}
              </Section>
            </>
          )}
        </div>

        <div className="border-t border-[#1F2B3E] bg-navy-deep px-5 pt-3.5 pb-safe">
          <button type="button" onClick={() => onApply(f)} className="min-h-[54px] w-full rounded-2xl bg-gold text-[15px] font-semibold text-navy">
            {results === 0 ? 'Show results (none yet)' : `Show ${results} ${f.type === 'Volunteer exchange' ? (results === 1 ? 'space' : 'spaces') : results === 1 ? 'experience' : 'experiences'}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
