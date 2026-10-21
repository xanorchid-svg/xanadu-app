import { useEffect, useState } from 'react'
import type { Listing, PublicSpace } from './store'

/**
 * Seeker filters for Discover. Kept for the session so they survive opening an experience and coming back.
 * Every section and option always shows in the same place; chips toggle on and off.
 * Choices inside one section widen the results (Retreat or Training); sections narrow them.
 */
export type Kind = 'Retreat' | 'Training' | 'Drop-in'
export type Length = 'day' | 'weekend' | 'weeks' | 'month'
export type Work = 'none' | 'remote' | 'volunteer'

export type Filters = {
  types: Kind[]
  country: string // '' = everywhere (only offered once there are places in more than one country)
  region: string
  when: 'flexible' | 'dates'
  from: string
  to: string
  flex: 0 | 3 | 7 // days either side of the picked dates
  lengths: Length[]
  work: Work
  maxPrice: number | null // null = any price
  land: string // set from the "Your way" row on Discover
  sort: 'match' | 'soon' | 'price'
}

export const NO_FILTERS: Filters = { types: [], country: '', region: '', when: 'flexible', from: '', to: '', flex: 0, lengths: [], work: 'none', maxPrice: null, land: '', sort: 'match' }

export const TYPES: [Kind, string][] = [['Retreat', 'Retreat'], ['Training', 'Training'], ['Drop-in', 'Class or session']]
export const LENGTHS: [Length, string][] = [['day', 'A day'], ['weekend', 'A weekend'], ['weeks', '1–3 weeks'], ['month', 'A month or more']]
export const WORK: [Work, string][] = [['none', 'No, just be'], ['remote', 'Remotely'], ['volunteer', 'Volunteer exchange']]
export const FLEX: [Filters['flex'], string][] = [[0, 'Exact dates'], [3, '± 3 days'], [7, '± 1 week']]
export const SORTS: [Filters['sort'], string][] = [['match', 'Best match'], ['soon', 'Soonest'], ['price', 'Price, low to high']]

const KEY = 'xa-discover-filters-v2'
export function useFilters() {
  const [f, setF] = useState<Filters>(() => {
    try { return { ...NO_FILTERS, ...JSON.parse(sessionStorage.getItem(KEY) ?? '{}') } } catch { return NO_FILTERS }
  })
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(f)) } catch { /* private mode */ } }, [f])
  return [f, setF] as const
}

/** Adds or removes one choice from a multi-choice section. */
export const toggled = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

const datesOn = (f: Filters) => f.when === 'dates' && !!(f.from || f.to)

/** How many filters are switched on (sort doesn't count). */
export const activeCount = (f: Filters) =>
  [f.types.length > 0, !!f.country, !!f.land, datesOn(f), f.lengths.length > 0, f.work !== 'none', f.maxPrice != null].filter(Boolean).length

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const shift = (day: string, n: number) => { const d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d) }
export const dayCount = (e: Pick<Listing, 'start_date' | 'end_date'>) => {
  if (!e.start_date) return 0
  const a = new Date(e.start_date + 'T12:00:00').getTime(), b = new Date((e.end_date || e.start_date) + 'T12:00:00').getTime()
  return Math.round((b - a) / 86400000) + 1
}
export const lengthOf = (e: Pick<Listing, 'start_date' | 'end_date'>): Length | null => {
  const n = dayCount(e)
  return !n ? null : n === 1 ? 'day' : n <= 3 ? 'weekend' : n <= 21 ? 'weeks' : 'month'
}

const inPlace = (s: { country?: string; region?: string } | null | undefined, f: Filters) =>
  !f.country || (!!s && s.country === f.country && (!f.region || (s.region ?? '').trim().toLowerCase() === f.region.toLowerCase()))
const remoteOk = (s: { lifestyle?: string[] | null } | null | undefined) => (s?.lifestyle ?? []).includes('Work remotely')

/** Does an experience pass every filter? */
export function passes(e: Listing, f: Filters) {
  if (f.types.length && !f.types.includes(e.format)) return false
  if (!inPlace(e.space, f)) return false
  if (f.land && !(e.space?.lifestyle ?? []).includes(f.land)) return false
  if (f.work === 'volunteer' && !(e.volunteer_exchange || e.space?.volunteer_exchange)) return false
  if (f.work === 'remote' && !remoteOk(e.space)) return false
  if (datesOn(f)) {
    const start = e.start_date, end = e.end_date || e.start_date
    if (!start || !end) return false
    const a = shift(f.from || f.to, -f.flex), b = shift(f.to || f.from, f.flex)
    if (start > b || end < a) return false
  }
  if (f.lengths.length) { const l = lengthOf(e); if (!l || !f.lengths.includes(l)) return false }
  if (f.maxPrice != null) {
    const p = e.price_usd == null ? null : Number(e.price_usd)
    if (p == null || p > f.maxPrice) return false
  }
  return true
}

/** Spaces shown alongside: only the filters that describe a place apply. */
export function spacePasses(s: PublicSpace, f: Filters) {
  if (!inPlace(s, f)) return false
  if (f.land && !(s.lifestyle ?? []).includes(f.land)) return false
  if (f.work === 'volunteer' && !s.volunteer_exchange) return false
  if (f.work === 'remote' && !remoteOk(s)) return false
  return true
}

/** Best match uses Xanadu's matching scores (my_match_scores); practices the Seeker picked break ties. */
export function sortListings(list: Listing[], f: Filters, prefs: string[], scores: Record<string, number> = {}) {
  const overlap = (e: Listing) => e.practices.filter((p) => prefs.includes(p)).length
  const soon = (a: Listing, b: Listing) => (a.start_date ?? '9999').localeCompare(b.start_date ?? '9999')
  return [...list].sort((a, b) =>
    f.sort === 'price' ? (Number(a.price_usd ?? Infinity) - Number(b.price_usd ?? Infinity)) || soon(a, b)
      : f.sort === 'soon' ? soon(a, b)
        : ((scores[b.id] ?? 0) - (scores[a.id] ?? 0)) || (overlap(b) - overlap(a)) || soon(a, b))
}

/** Highest price to offer on the price scale, rounded up to the next $500 (at least $500). */
export const priceCeiling = (listings: Listing[]) =>
  Math.max(500, Math.ceil(Math.max(0, ...listings.map((e) => Number(e.price_usd ?? 0))) / 500) * 500)

/** Countries (and their regions) that actually have something to show. */
export function destinations(listings: Listing[], spaces: PublicSpace[]) {
  const map = new Map<string, Set<string>>()
  const add = (s: { country: string; region: string } | null | undefined) => {
    if (!s?.country.trim()) return
    if (!map.has(s.country)) map.set(s.country, new Set())
    if (s.region.trim()) map.get(s.country)!.add(s.region.trim())
  }
  listings.forEach((e) => add(e.space)); spaces.forEach(add)
  return Array.from(map, ([country, regions]) => ({ country, regions: Array.from(regions).sort() })).sort((a, b) => a.country.localeCompare(b.country))
}
