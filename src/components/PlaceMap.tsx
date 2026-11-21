import { lazy, Suspense } from 'react'
import type { Spot } from '../places'

const EventMap = lazy(() => import('./EventMap'))

/**
 * A small map of where something is held, on an event or experience page, with directions.
 * Area-only places (private homes, "address on RSVP") show the area, not a spot.
 */
export default function PlaceMap({ spot, name }: { spot: Spot | null; name: string }) {
  if (!spot) return null
  const where = spot.exact ? [name, spot.label].filter(Boolean).join(' · ') : `Around ${spot.label} · the host shares the exact spot`
  return (
    <div className="flex flex-col gap-2">
      <Suspense fallback={<div className="h-[150px] w-full animate-pulse rounded-[18px] bg-surface" />}>
        <EventMap mode="mini" className="h-[150px] !rounded-[18px]" pins={[{ key: 'here', spot, count: 1, title: name }]} />
      </Suspense>
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-[12px] text-subtle">{where}</span>
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`} target="_blank" rel="noreferrer noopener"
          className="flex min-h-9 flex-none items-center rounded-full border border-line-2 px-3 text-[12px] text-text no-underline">Directions</a>
      </div>
    </div>
  )
}
