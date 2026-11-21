import { useCallback, useEffect, useState } from 'react'

/**
 * Where things are held, for the distance filter and the map.
 * Events and experiences only carry a venue name and a town in words, so this reads those words
 * and places them: first a known venue, then the area of Nosara (Guiones, Pelada, Garza…), then the town.
 * Private addresses ("shared when you RSVP") only ever get the area, never a precise point.
 * Add a venue below when a new regular place starts hosting.
 */
export type Spot = { lat: number; lng: number; label: string; exact: boolean }

type Area = { lat: number; lng: number; label: string }
// area centers from Google Maps (Nov 2026)
const AREAS: Record<string, Area> = {
  guionesNorte: { lat: 9.9465, lng: -85.6685, label: 'Guiones Norte' },
  guiones: { lat: 9.9361, lng: -85.6639, label: 'Playa Guiones' },
  kSection: { lat: 9.9385, lng: -85.6592, label: 'Section K, Guiones' },
  guionesSur: { lat: 9.9300, lng: -85.6600, label: 'South Guiones' },
  pelada: { lat: 9.9575, lng: -85.6731, label: 'Playa Pelada' },
  town: { lat: 9.9800, lng: -85.6530, label: 'Nosara town' },
  garza: { lat: 9.9096, lng: -85.6432, label: 'Garza' },
  sanJuanillo: { lat: 10.0346, lng: -85.7391, label: 'San Juanillo' },
  rioMontana: { lat: 9.9867, lng: -85.6666, label: 'Río Montaña' },
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

/** Regular venues with their own point on the map, from Google Maps (Nov 2026). Most specific first. */
const VENUES: [RegExp, { lat: number; lng: number }][] = [
  [/\bharmony co-?op\b|\bla ventanita\b/, { lat: 9.9411, lng: -85.6646 }], // Harmony Co-Op Playground, behind La Ventanita
  [/\bharmony hotel\b|\bthe harmony\b/, { lat: 9.9430, lng: -85.6666 }],
  [/\bwild ?child\b/, { lat: 9.9829, lng: -85.6585 }], // Wild Child Playgarden & Wildschooling
  [/\bnosara retreat center\b/, { lat: 9.9867, lng: -85.6666 }],
  [/\bbodhi tree\b/, { lat: 9.9409, lng: -85.6603 }],
  [/\bcasa pacifico\b/, { lat: 9.9378, lng: -85.6586 }],
  [/\bcasa de las estrellas\b/, { lat: 9.9049, lng: -85.6539 }],
  [/\bnalu\b/, { lat: 9.9471, lng: -85.6665 }],
  [/^ norte /, { lat: 9.9487, lng: -85.6704 }], // Norte Nosara
  [/\bnorte nosara\b/, { lat: 9.9487, lng: -85.6704 }],
  [/\bnanku\b/, { lat: 9.9923, lng: -85.6451 }],
  [/\bnosara blue\b/, { lat: 9.9572, lng: -85.6716 }],
  [/\bhamaca\b/, { lat: 9.9553, lng: -85.6721 }],
  [/\bolga'?s\b/, { lat: 9.9532, lng: -85.6741 }],
  [/\bpacha ?mama\b/, { lat: 10.0348, lng: -85.7064 }],
  [/\beterna\b/, { lat: 10.0388, lng: -85.7364 }],
  [/\bbakers?'? beach\b/, { lat: 9.9367, lng: -85.6654 }],
  [/\bnorth guiones beach\b/, { lat: 9.9445, lng: -85.6700 }],
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
    if (hit) return { ...hit[1], label: area && area !== 'nosara' ? areaLabel : 'Nosara', exact: true }
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

const OK_KEY = 'xanadu.location.ok'      // they said yes once: find them again quietly next time
const SKIP_KEY = 'xanadu.location.skip'  // they tapped "Not now": don't show the ask again
const store = { get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch { /* private mode */ } } }

function getPosition() {
  return new Promise<GeolocationPosition | GeolocationPositionError>((res) =>
    navigator.geolocation.getCurrentPosition(res, res, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }))
}

/**
 * The phone's location, for distances and the "you" dot on the map.
 * The phone only asks for permission when the seeker taps "Use my location" (after we've said why).
 * It stays on the phone (never saved to Xanadu) and is rounded to about 100 m.
 * Once they've said yes, later visits find them again without asking.
 */
export function useMyLocation() {
  const [me, setMe] = useState<Origin | null>(null)
  const [state, setState] = useState<'idle' | 'asking' | 'denied' | 'error'>('idle')
  const [skipped, setSkipped] = useState(() => store.get(SKIP_KEY) === '1')
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const ask = useCallback(async () => {
    if (!supported) { setState('error'); return null }
    setState('asking')
    const pos = await getPosition()
    if (!('coords' in pos)) {
      if (pos.code === 1) { setState('denied'); store.set(OK_KEY, null) } else setState('error')
      return null
    }
    const o: Origin = { key: 'me', label: 'You', lat: Math.round(pos.coords.latitude * 1000) / 1000, lng: Math.round(pos.coords.longitude * 1000) / 1000 }
    setMe(o); setState('idle'); store.set(OK_KEY, '1'); store.set(SKIP_KEY, null); setSkipped(false)
    return o
  }, [supported])

  // said yes before: find them again, but only if the phone still allows it (never pop the prompt by surprise)
  useEffect(() => {
    if (!supported || store.get(OK_KEY) !== '1') return
    let live = true
    const go = () => getPosition().then((pos) => {
      if (!live || !('coords' in pos)) return
      setMe({ key: 'me', label: 'You', lat: Math.round(pos.coords.latitude * 1000) / 1000, lng: Math.round(pos.coords.longitude * 1000) / 1000 })
    })
    const perms = (navigator as Navigator & { permissions?: Permissions }).permissions
    if (perms?.query) perms.query({ name: 'geolocation' as PermissionName }).then((r) => { if (r.state === 'granted') go() }).catch(go)
    else go()
    return () => { live = false }
  }, [supported])

  const skip = useCallback(() => { store.set(SKIP_KEY, '1'); setSkipped(true) }, [])
  const forget = useCallback(() => { store.set(OK_KEY, null); setMe(null) }, [])
  return { me, state, ask, skip, skipped, supported, forget }
}
