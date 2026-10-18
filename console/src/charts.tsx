import { useState } from 'react'

export type SignupDay = { day: string; seeker: number; container: number; facilitator: number }
export type Heard = { source: string; n: number }

/** One series, so one hue (periwinkle, validated against the card surface) and no legend box. */
const BAR = '#7F8CDB'

/** Daily new members as thin bars, with a tooltip per day and a text summary for screen readers. */
export function SignupChart({ days }: { days: SignupDay[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const totals = days.map((d) => d.seeker + d.container + d.facilitator)
  const max = Math.max(1, ...totals)
  const sum = totals.reduce((a, b) => a + b, 0)
  const W = 600, H = 160, pad = 2
  const bw = W / days.length
  const label = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const h = hover !== null ? days[hover] : null

  return (
    <div>
      <p className="mb-3 font-display text-[30px] leading-none text-ink">{sum} <span className="font-sans text-[13px] text-subtle">joined</span></p>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label={`${sum} new members in the last 30 days`} onMouseLeave={() => setHover(null)}>
          <line x1="0" x2={W} y1={H} y2={H} stroke="var(--color-line)" strokeWidth="1" />
          {days.map((d, i) => {
            const t = totals[i]
            const bh = t ? Math.max(4, (t / max) * (H - 8)) : 0
            const x = i * bw + pad
            const w = Math.max(2, bw - pad * 2)
            return (
              <g key={d.day} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${label(d.day)}: ${t}`}>
                <rect x={i * bw} y="0" width={bw} height={H} fill="transparent" />
                {bh > 0 && <path d={`M${x},${H} v${-(bh - 4)} q0,-4 4,-4 h${w - 8} q4,0 4,4 v${bh - 4} z`} fill={BAR} opacity={hover === null || hover === i ? 1 : 0.45} />}
                {bh === 0 && <rect x={x} y={H - 2} width={w} height="2" fill="var(--color-line-2)" />}
              </g>
            )
          })}
          <text x="0" y={H + 15} fill="var(--color-faint)" fontSize="11">{label(days[0].day)}</text>
          <text x={W} y={H + 15} fill="var(--color-faint)" fontSize="11" textAnchor="end">Today</text>
        </svg>
        {h && (
          <div className="pointer-events-none absolute top-0 rounded-xl bg-navy-deep/95 px-3 py-2 text-[12px] shadow-xl ring-1 ring-line-2"
            style={{ left: `clamp(0px, calc(${((hover! + 0.5) / days.length) * 100}% - 70px), calc(100% - 140px))`, width: 140 }}>
            <p className="font-semibold text-ink">{label(h.day)}</p>
            <p className="text-subtle">{h.seeker} Seekers</p>
            <p className="text-subtle">{h.container} Containers</p>
            <p className="text-subtle">{h.facilitator} Facilitators</p>
          </div>
        )}
      </div>
    </div>
  )
}

/** Answers to "Where did you hear about Xanadu?" as labelled bars (values shown as text, not colour). */
export function HeardFrom({ rows }: { rows: Heard[] }) {
  const answered = rows.filter((r) => r.source !== 'Not answered')
  const none = rows.find((r) => r.source === 'Not answered')?.n ?? 0
  const max = Math.max(1, ...answered.map((r) => r.n))
  if (!answered.length) return (
    <p className="text-[13.5px] leading-relaxed text-subtle">No answers yet. New members are asked this when they set up their account{none ? `; ${none} joined before the question existed` : ''}.</p>
  )
  return (
    <div>
      <ul className="space-y-2.5">
        {answered.map((r) => (
          <li key={r.source}>
            <div className="mb-1 flex justify-between text-[13px]"><span className="text-text">{r.source}</span><span className="font-semibold text-ink">{r.n}</span></div>
            <div className="h-2 rounded-full bg-surface-2"><div className="h-2 rounded-full" style={{ width: `${(r.n / max) * 100}%`, background: BAR }} /></div>
          </li>
        ))}
      </ul>
      {none > 0 && <p className="mt-3 text-[12px] text-faint">{none} didn’t answer (most joined before the question was added).</p>}
    </div>
  )
}
