import type { ReactNode } from 'react'
import { Chip } from './ui'
import { LANDSCAPES, LANDSCAPE_HUE, STAYS, WORK_STYLES } from '../data'

/** A landscape chip carries its own colour from the logo's iridescence. */
export function LandChip({ name, on, onClick }: { name: string; on: boolean; onClick?: () => void }) {
  const hue = LANDSCAPE_HUE[name] ?? '#B89567'
  const style = on
    ? { background: `${hue}33`, borderColor: hue, color: '#F3ECDF', boxShadow: `0 0 16px -4px ${hue}` }
    : { borderColor: `${hue}55` }
  const inner = (<><span aria-hidden className="h-2 w-2 flex-none rounded-full" style={{ background: hue, boxShadow: on ? `0 0 8px ${hue}` : 'none' }} />{name}</>)
  if (!onClick) return <span className="flex min-h-8 items-center gap-2 rounded-full border px-3 text-[13px] text-text" style={style}>{inner}</span>
  return (
    <button type="button" aria-pressed={on} onClick={onClick} style={style}
      className={`flex min-h-9 flex-none items-center gap-2 rounded-full border px-3.5 text-[13px] transition-[background,box-shadow,border-color] duration-300 ${on ? 'font-semibold' : 'text-muted'}`}>
      {inner}
    </button>
  )
}

const Group = ({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2.5">
    <div className="flex flex-col gap-0.5">
      <span className="text-[15px] font-semibold text-ink">{title}</span>
      {sub && <span className="text-xs text-subtle">{sub}</span>}
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
)

/**
 * How someone wants to take part (a class, regular sessions, a stay, community living), whether to work, which landscapes.
 * Seekers answer for themselves; hosts answer for their space ("host" wording). Both save the same words.
 */
export function LifestylePicker({ value, onChange, host = false }: { value: string[]; onChange: (v: string[]) => void; host?: boolean }) {
  const toggle = (x: string) => onChange(value.includes(x) ? value.filter((v) => v !== x) : [...value, x])
  // hosts mark remote work only; volunteer exchange has its own switch on the space profile
  const work = host ? (['Work remotely'] as const) : WORK_STYLES
  return (
    <div className="flex flex-col gap-5">
      <Group title={host ? 'What you welcome' : 'How would you like to take part?'}
        sub={host ? 'From drop-in classes to people who live here. Pick all that fit' : 'From a single class to making it home. Pick all that fit'}>
        {STAYS.map((s) => <Chip key={s} on={value.includes(s)} onClick={() => toggle(s)}>{s}</Chip>)}
      </Group>
      <Group title={host ? 'Good for remote work?' : 'Work while you’re there?'} sub={host ? 'Reliable Wi-Fi and a place to work' : undefined}>
        {work.map((w) => <Chip key={w} on={value.includes(w)} onClick={() => toggle(w)}>{host ? 'Yes, guests can work remotely' : w}</Chip>)}
      </Group>
      <Group title={host ? 'Your landscape' : 'Where do you feel most alive?'} sub={host ? 'What surrounds your space' : 'Beach, desert, mountains, jungle, city…'}>
        {LANDSCAPES.map((l) => <LandChip key={l} name={l} on={value.includes(l)} onClick={() => toggle(l)} />)}
      </Group>
    </div>
  )
}
