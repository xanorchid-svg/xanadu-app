import { Link } from 'react-router-dom'
import type { Experience } from '../data'

const fmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export default function ExperienceCard({ e }: { e: Experience }) {
  return (
    <Link to={`/experience/${e.id}`} className="flex items-center gap-3.5 rounded-[18px] bg-surface p-2.5 text-text no-underline">
      <div className="h-[76px] w-[76px] flex-none rounded-[14px] bg-sage" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-gold-soft">{`${e.practice} · ${e.format}`}</span>
        <span className="text-[15px] font-semibold text-ink">{e.title}</span>
        <span className="text-[13px] text-subtle">{`${e.containerName} · ${fmt(e.startDate)}`}</span>
      </div>
    </Link>
  )
}
