import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { miles, NOSARA_CENTER, type Spot } from '../places'

/** One pin: everything held at the same spot. */
export type Pin = { key: string; spot: Spot; count: number; title: string }

/**
 * Nosara on a dark map, with a pin for every place something is on. Pins with several events show the count.
 * Venues we know sit on their own point; area-only places (private homes, "address on RSVP") get a soft ring instead.
 * Tapping a pin calls onPick so the page can list what's there.
 */
export default function EventMap({ pins, picked = null, onPick = () => {}, origin, radius, onLocate, locating = false, mode = 'inline', className = '' }: {
  pins: Pin[]; picked?: string | null; onPick?: (key: string | null) => void
  /** inline: in the page (one finger scrolls the page on phones, two fingers move the map) · full: full screen · mini: one place, no gestures */
  mode?: 'inline' | 'full' | 'mini'; className?: string
  origin?: { lat: number; lng: number; label: string } | null; radius?: number | null
  /** "Find me": asks for the location (first time) or centers on it */
  onLocate?: () => void; locating?: boolean
}) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const pick = useRef(onPick)
  pick.current = onPick
  const lastFit = useRef('')
  const refit = useRef<() => void>(() => {})

  useEffect(() => {
    if (!box.current || map.current) return
    const touch = L.Browser.mobile || L.Browser.touch
    const m = L.map(box.current, {
      zoomControl: false, attributionControl: true, center: [NOSARA_CENTER.lat, NOSARA_CENTER.lng], zoom: 13,
      // in the page, a one-finger swipe should scroll the page, not grab the map
      dragging: mode === 'full' || (mode === 'inline' && !touch), scrollWheelZoom: mode === 'full',
      touchZoom: mode !== 'mini', doubleClickZoom: mode !== 'mini', boxZoom: false, keyboard: mode !== 'mini',
    })
    // on phones the in-page map moves with a two-finger pinch; Expand opens it full screen for free roaming
    // OpenStreetMap's free tiles, tinted navy in index.css (.xmap .leaflet-tile-pane)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap', // the credit their terms ask for; plain text so a tap never leaves the app
    }).addTo(m)
    if (mode !== 'mini') L.control.zoom({ position: 'bottomright' }).addTo(m)
    m.attributionControl.setPrefix(false)
    m.on('click', () => pick.current(null))
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    // the map often mounts before its box has its final size; re-measure and re-fit once it does
    const ro = new ResizeObserver(() => { m.invalidateSize(); lastFit.current = '' ; refit.current() })
    ro.observe(box.current)
    return () => { ro.disconnect(); m.remove(); map.current = null }
  }, [])

  // redraw pins, the radius ring and "you" whenever they change; fit the view only when the set of pins changes
  const fitKey = pins.map((p) => p.key).join('|') + `|${origin?.lat},${origin?.lng},${radius ?? ''}`
  useEffect(() => {
    const m = map.current, g = layer.current
    if (!m || !g) return
    g.clearLayers()
    const pts: L.LatLngExpression[] = []
    if (origin && radius) {
      L.circle([origin.lat, origin.lng], { radius: radius * 1609.34, color: '#B89567', weight: 1, opacity: 0.7, fillColor: '#B89567', fillOpacity: 0.06, interactive: false }).addTo(g)
      pts.push([origin.lat + radius / 69, origin.lng], [origin.lat - radius / 69, origin.lng])
    }
    if (origin) {
      L.marker([origin.lat, origin.lng], {
        interactive: false, keyboard: false,
        icon: L.divIcon({ className: '', html: `<div class="xmap-origin" title="${origin.label}"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] }),
      }).addTo(g)
    }
    for (const p of pins) {
      const on = p.key === picked
      const size = p.count > 1 ? 34 : 26
      const mk = L.marker([p.spot.lat, p.spot.lng], {
        title: p.title, riseOnHover: true, zIndexOffset: on ? 1000 : 0,
        icon: L.divIcon({
          className: '',
          html: `<div class="xmap-pin${p.spot.exact ? '' : ' xmap-area'}${on ? ' xmap-on' : ''}" style="width:${size}px;height:${size}px">${p.count > 1 ? p.count : '✦'}</div>`,
          iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        }),
      })
      if (mode !== 'mini') mk.on('click', (ev) => { L.DomEvent.stopPropagation(ev); pick.current(p.key) })
      mk.addTo(g)
      pts.push([p.spot.lat, p.spot.lng])
    }
    refit.current = () => {
      if (lastFit.current === fitKey || !m.getSize().y) return
      lastFit.current = fitKey
      // open on the heart of Nosara (Guiones, Pelada, town); farther pins are a pinch away
      const core = radius ? pts : pts.filter((p) => { const [lat, lng] = p as [number, number]; return miles(NOSARA_CENTER, { lat, lng }) <= 3.5 })
      // include "you" when you're in Nosara, so the first view shows you and what's around
      if (origin && !radius && origin.label === 'You' && miles(NOSARA_CENTER, origin) <= 6) core.push([origin.lat, origin.lng])
      const use = core.length ? core : pts
      if (use.length > 1) m.fitBounds(L.latLngBounds(use), { padding: [28, 28], maxZoom: 15 })
      else if (use.length === 1) m.setView(use[0], mode === 'mini' ? 15 : 14)
    }
    refit.current()
  }, [pins, picked, origin, radius, fitKey])

  // a picked pin slides into view
  useEffect(() => {
    const p = pins.find((x) => x.key === picked)
    if (p && map.current) map.current.panTo([p.spot.lat, p.spot.lng], { animate: true })
  }, [picked]) // eslint-disable-line react-hooks/exhaustive-deps

  const you = origin?.label === 'You' ? origin : null
  const locate = () => {
    if (you && map.current) map.current.setView([you.lat, you.lng], Math.max(map.current.getZoom(), 14), { animate: true })
    else onLocate?.()
  }
  return (
    <div className={`relative ${mode === 'full' ? 'h-full' : ''}`}>
      <div ref={box} className={`xmap w-full overflow-hidden bg-surface ${mode === 'full' ? 'h-full' : 'rounded-[20px]'} ${className}`} role="application" aria-label="Map of where events are held" />
      {onLocate && mode !== 'mini' && (
        <button type="button" onClick={locate} disabled={locating} aria-label={you ? 'Center on you' : 'Use my location'}
          className="absolute bottom-3 left-3 z-[500] flex min-h-10 items-center gap-1.5 rounded-full border border-line-2 bg-navy/90 px-3.5 text-[13px] text-text shadow-lg backdrop-blur disabled:opacity-60">
          <span aria-hidden>📍</span>{locating ? 'Finding you…' : you ? 'You' : 'Use my location'}
        </button>
      )}
    </div>
  )
}
