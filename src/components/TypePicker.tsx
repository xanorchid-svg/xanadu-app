import { useState } from 'react'
import { Chip } from './ui'
import { FAMILIES } from '../events'

/**
 * "I'm looking for": six families in one short row (Move, Still & heal, Inner work, Gather, Create & learn,
 * Family & nature). Tapping a family chooses all of it and opens its types underneath, so a seeker can keep the
 * whole family or narrow to one or two. Several families and types can be on at once; "All" clears.
 * The value is always the list of chosen types.
 */
export default function TypePicker({ value, onChange, has, inset = true }: {
  value: string[]; onChange: (v: string[]) => void; has?: (type: string) => boolean; inset?: boolean
}) {
  const [open, setOpen] = useState<string | null>(() => FAMILIES.find((f) => f.types.some((t) => value.includes(t)))?.label ?? null)
  const fam = FAMILIES.find((f) => f.label === open)
  const row = inset ? '-mx-5 flex gap-2 overflow-x-auto px-5 pb-0.5' : 'flex flex-wrap gap-2'

  const tapFamily = (label: string) => {
    const f = FAMILIES.find((x) => x.label === label)!
    const chosen = f.types.filter((t) => value.includes(t))
    if (open !== label) {
      setOpen(label)
      if (!chosen.length) onChange([...value, ...f.types]) // first tap: the whole family
      return
    }
    // already open: all chosen → clear it and close; some chosen → choose all
    if (chosen.length === f.types.length) { onChange(value.filter((t) => !f.types.includes(t))); setOpen(null) }
    else onChange([...value.filter((t) => !f.types.includes(t)), ...f.types])
  }
  const tapType = (t: string) => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t])

  return (
    <div className="flex flex-col gap-2">
      <div className={row} role="group" aria-label="What you're looking for">
        <Chip on={!value.length} onClick={() => { onChange([]); setOpen(null) }}>All</Chip>
        {FAMILIES.map((f) => {
          const n = f.types.filter((t) => value.includes(t)).length
          return (
            <Chip key={f.label} on={n > 0} dim={!!has && !f.types.some(has)} onClick={() => tapFamily(f.label)}>
              {n > 0 && n < f.types.length ? `${f.label} · ${n}` : f.label}
              <span aria-hidden className="ml-1 opacity-60">{open === f.label ? '▴' : '▾'}</span>
            </Chip>
          )
        })}
      </div>
      {fam && (
        <div className={`${row} rounded-2xl`} role="group" aria-label={`${fam.label} types`}>
          {fam.types.map((t) => <Chip key={t} solid on={value.includes(t)} dim={!!has && !has(t)} onClick={() => tapType(t)}>{t}</Chip>)}
        </div>
      )}
    </div>
  )
}
