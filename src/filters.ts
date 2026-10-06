import { useEffect, useState } from 'react'
import type { Listing, PublicSpace } from './store'

/** Seeker filters for Discover. Kept for the session so they survive opening an experience and coming back. */
export type Filters = {
  type: 'Any' | 'Retreat' | 'Training' | 'Drop-in' | 'Volunteer exchange'
  country: string // '' = everywhere
  region: string // '' = all of the country
  when: 'any' | 'week' | 'month' | 'dates'
  from: string
  to: string
  price: 'any' | 'u500' | 'mid' | 'high'
  length: 'any' | 'day' | 'weekend' | 'week' | 'long'
  sort: 'match' | 'soon' | 'price'
}

export const NO_FILTERS: Filters = { type: 'Any', country: '', region: '', when: 'any', from: '', to: '', price: 'any', length: 'any', sort: 'match' }

export const TYPES: Filters['type'][] = ['Any', 'Retreat', 'Training', 'Drop-in', 'Volunteer exchange']
export const WHEN: [Filters['when'], string][] = [['any', 'Any time'], ['week', 'This week'], ['month', 'This month'], ['dates', 'Pick dates']]
export const PRICES: [Filters['price'], string][] = [['any', 'Any price'], ['u500', 'Under $500'], ['mid', '$500–1,500'], ['high', '$1,500+']]
export const LENGTHS: [Filters['length'], string][] = [['any', 'Any length'], ['day', 'A day'], ['weekend', 'A weekend'], ['week', 'A week or two'], ['long', 'Longer stays']]
export const SORTS: [Filters['sort'], string][] = [['match', 'Best match'], ['soon', 'Soonest'], ['price', 'Price']]

const KEY = 'xa-discover-filters'
export function useFilters() {
  const [f, setF] = useState<Filters>(() => {
    try { return { ...NO_FILTERS, ...JSON.parse(sessionStorage.getItem(KEY) ?? '{}') } } catch { return NO_FILTERS }
  })
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(f)) } catch { /* private mode */ } }, [f])
  return [f, setF] as const
}

/** How many filters are switched on (sort doesn't count). */
export const activeCount = (f: Filters) =>
  [f.type !== 'Any', !!f.country, f.when !== 'any', f.price !== 'any', f.length !== 'any'].filter(Boolean).length

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d) }
const dayCount = (e: Listing) => {
  if (!e.start_date) return 0
  const a = new Date(e.start_date + 'T12:00:00').getTime(), b = new Date((e.end_date || e.start_date) + 'T12:00:00').getTime()
  return Math.round((b - a) / 86400000) + 1
}

const inPlace = (s: { country?: string; region?: string } | null | undefined, f: Filters) =>
  !f.country || (!!s && s.country === f.country && (!f.region || (s.region ?? '').trim().toLowerCase() === f.region.toLowerCase()))

/** Does an experience pass every filter (optionally ignoring one, to count what each option would show)? */
export function passes(e: Listing, f: Filters, ignore?: keyof Filters) {
  if (ignore !== 'type' && f.type !== 'Any' && (f.type === 'Volunteer exchange' || e.format !== f.type)) return false
  if (ignore !== 'country' && ignore !== 'region' && !inPlace(e.space, f)) return false
  if (ignore !== 'when' && f.when !== 'any') {
    const start = e.start_date, end = e.end_date || e.start_date
    if (!start || !end) return false
    const [a, b] = f.when === 'week' ? [iso(new Date()), addDays(7)] : f.when === 'month' ? [iso(new Date()), addDays(31)] : [f.from || '0000-01-01', f.to || f.from || '9999-12-31']
    if (start > b || end < a) return false
  }
  if (ignore !== 'price' && f.price !== 'any') {
    const p = e.price_usd == null ? null : Number(e.price_usd)
    if (p == null) return false
    if (f.price === 'u500' && !(p < 500)) return false
    if (f.price === 'mid' && !(p >= 500 && p <= 1500)) return false
    if (f.price === 'high' && !(p > 1500)) return false
  }
  if (ignore !== 'length' && f.length !== 'any') {
    const n = dayCount(e)
    if (f.length === 'day' && n !== 1) return false
    if (f.length === 'weekend' && !(n >= 2 && n <= 3)) return false
    if (f.length === 'week' && !(n >= 4 && n <= 14)) return false
    if (f.length === 'long' && !(n >= 15)) return false
  }
  return true
}

/** Spaces shown alongside: only where filters apply to places (type Volunteer exchange, and where). */
export function spacePasses(s: PublicSpace, f: Filters, ignore?: keyof Filters) {
  if (ignore !== 'type' && f.type === 'Volunteer exchange' && !s.volunteer_exchange) return false
  if (ignore !== 'type' && f.type !== 'Any' && f.type !== 'Volunteer exchange') return true // experience types don't hide spaces
  if (ignore !== 'country' && ignore !== 'region' && !inPlace(s, f)) return false
  return true
}

export function sortListings(list: Listing[], f: Filters, prefs: string[]) {
  const overlap = (e: Listing) => e.practices.filter((p) => prefs.includes(p)).length
  const soon = (a: Listing, b: Listing) => (a.start_date ?? '9999').localeCompare(b.start_date ?? '9999')
  return [...list].sort((a, b) =>
    f.sort === 'price' ? (Number(a.price_usd ?? Infinity) - Number(b.price_usd ?? Infinity)) || soon(a, b)
      : f.sort === 'soon' ? soon(a, b)
        : (overlap(b) - overlap(a)) || soon(a, b))
}

/** Countries (and their regions) that actually have something to show, so no option leads to an empty screen. */
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
