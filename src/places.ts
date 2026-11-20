import { useCallback, useState } from 'react'

/**
 * Where things are held, for the distance filter and the map.
 * Events and experiences only carry a venue name and a town in words, so this reads those words
 * and places them: first a known venue, then the area of Nosara (Guiones, Pelada, Garza…), then the town.
 * Private addresses ("shared when you RSVP") only ever get the area, never a precise point.
 * Add a venue below when a new regular place starts hosting.
 */
export type Spot = { lat: number; lng: number; label: string; exact: boolean }

type Area = { lat: number; lng: number; label: string }
const AREAS: Record<string, Area> = {
  guionesNorte: { lat: 9.9452, lng: -85.6688, label: 'Guiones Norte' },
  guiones: { lat: 9.9393, lng: -85.6640, label: 'Playa Guiones' },
  kSection: { lat: 9.9404, lng: -85.6584, label: 'Section K, Guiones' },
  guionesSur: { lat: 9.9318, lng: -85.6566, label: 'South Guiones' },
  pelada: { lat: 9.9543, lng: -85.6733, label: 'Playa Pelada' },
  town: { lat: 9.9772, lng: -85.6522, label: 'Nosara town' },
  garza: { lat: 9.9152, lng: -85.6302, label: 'Garza' },
  sanJuanillo: { lat: 10.0336, lng: -85.7289, label: 'San Juanillo' },
  rioMontana: { lat: 9.9873, lng: -85.6659, label: 'Río Montaña' },
  ostional: { lat: 10.0004, lng: -85.7015, label: 'Ostional' },
  nosara: { lat: 9.9560, lng: -85.6620, label: 'Nosara (spot not listed)' },
  samara: { lat: 9.8818, lng: -85.5289, label: 'Sámara' },
  santaTeresa: { lat: 9.6440, lng: -85.1690, label: 'Santa Teresa' },
}

/** Words in the town or venue that name an area. Most specific first. */
const AREA_WORDS: [RegExp, keyof typeof AREAS][] = [
  [/\bsan juanillo\b/, 'sanJuanillo'],
  [/\bostional\b/, 'ostional'],
  [/\brio montana\b/, 'rioMontana'],
  [/\b(k section|section k|seccion k)\b/, 'kSection'],
  [/\b(guiones norte|north guiones|guiones north)\b/, 'guionesNorte'],
  [/\b(south guiones|guiones sur|bakers)\b/, 'guionesSur'],
  [/\bpelada\b/, 'pelada'],
  [/\bgarza\b/, 'garza'],
  [/\bguiones\b/, 'guiones'],
  [/\b(nosara town|town of nosara|bocas de nosara|airport|downtown nosara)\b/, 'town'],
  [/\bsamara\b/, 'samara'],
  [/\b(santa teresa|mal pais)\b/, 'santaTeresa'],
  [/\bnosara\b/, 'nosara'],
]

/** Regular venues with their own point on the map. */
const VENUES: [RegExp, { lat: number; lng: number }][] = [
  [/\bnosara retreat center\b/, { lat: 9.98731, lng: -85.66591 }],
  [/\bbodhi tree\b/, { lat: 9.9426, lng: -85.6583 }],
  [/\bpacha ?mama\b/, { lat: 10.0205, lng: -85.7085 }],
  [/\bnanku\b/, { lat: 9.9726, lng: -85.6402 }],
  [/\bharmony hotel\b/, { lat: 9.9447, lng: -85.6690 }],
  [/\bolga'?s\b/, { lat: 9.9549, lng: -85.6748 }],
  [/\bnorth guiones beach\b/, { lat: 9.9457, lng: -85.6712 }],
  [/\bbakers beach\b/, { lat: 9.9316, lng: -85.6583 }],
]

const PRIVATE = /(shared when|address shared|private (home|space|house)|\bon rsvp\b|when you (book|register|rsvp))/

const norm = (s: string) => ` ${s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’‘]/g, "'")} `

/** Places a venue and town. Returns null when the words don't name anywhere we know. */
export function locate(venue = '', town = ''): Spot | null {
  const v = norm(venue), t = norm(town), both = `${v} ${t}`
  const area = AREA_WORDS.find(([re]) => re.test(both))?.[1]
  const areaLabel = area ? AREAS[area].label : ''
  if (!PRIVATE.test(v)) {
    const hit = VENUES.find(([re]) => re.test(v))
    if (hit) return { ...hit[1], label: areaLabel || 'Nosara', exact: true }
  }
  return area ? { ...AREAS[area], exact: false } : null
}

/** Something on the Calendar: a community event (venue, town) or an experience (space or outside venue). */
type Placeable = { venue?: string; town?: string; venue_name?: string; venue_place?: string; space?: { name?: string; town?: string; region?: string; country?: string } | null }
export function spotOf(e: Placeable): Spot | null {
  if ('town' in e && e.town !== undefined) return locate(e.venue ?? '', e.town)
  if (e.space) return locate(e.space.name ?? '', [e.space.town, e.space.region].filter(Boolean).join(' '))
  return locate(e.venue_name ?? '', e.venue_place ?? '')
}

/** Miles between two points. */
export function miles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(h))
}

export const fmtMiles = (m: number) => (m < 0.15 ? 'Right here' : m < 10 ? `${m.toFixed(1)} mi` : `${Math.round(m)} mi`)

/** Where distances are measured from: the seeker's phone, or a part of Nosara they pick. */
export type Origin = { key: string; label: string; lat: number; lng: number }
export const ORIGINS: Origin[] = [
  { key: 'guiones', ...AREAS.guiones },
  { key: 'pelada', ...AREAS.pelada },
  { key: 'town', ...AREAS.town },
  { key: 'garza', ...AREAS.garza },
]
export const NOSARA_CENTER = { lat: 9.9600, lng: -85.6650 }

/**
 * The phone's location, asked for only when the seeker taps "Near me".
 * It stays on the phone (not saved anywhere) and is rounded to about 100 m.
 */
export function useMyLocation() {
  const [me, setMe] = useState<Origin | null>(null)
  const [state, setState] = useState<'idle' | 'asking' | 'denied' | 'error'>('idle')
  const ask = useCallback(async () => {
    if (!('geolocation' in navigator)) { setState('error'); return null }
    setState('asking')
    const pos = await new Promise<GeolocationPosition | GeolocationPositionError>((res) =>
      navigator.geolocation.getCurrentPosition(res, res, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }))
    if (!('coords' in pos)) { setState(pos.code === 1 ? 'denied' : 'error'); return null }
    const o: Origin = { key: 'me', label: 'You', lat: Math.round(pos.coords.latitude * 1000) / 1000, lng: Math.round(pos.coords.longitude * 1000) / 1000 }
    setMe(o); setState('idle')
    return o
  }, [])
  return { me, state, ask }
}
