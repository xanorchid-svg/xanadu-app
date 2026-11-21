import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { NOSARA_CENTER, type Spot } from '../places'

/** One pin: everything held at the same spot. */
export type Pin = { key: string; spot: Spot; count: number; title: string }

/**
 * Nosara on a dark map, with a pin for every place something is on. Pins with several events show the count.
 * Venues we know sit on their own point; area-only places (private homes, "address on RSVP") get a soft ring instead.
 * Tapping a pin calls onPick so the page can list what's there.
 */
export default function EventMap({ pins, picked, onPick, origin, radius }: {
  pins: Pin[]; picked: string | null; onPick: (key: string | null) => void
  origin?: { lat: number; lng: number; label: string } | null; radius?: number | null
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
    const m = L.map(box.current, { zoomControl: false, attributionControl: true, center: [NOSARA_CENTER.lat, NOSARA_CENTER.lng], zoom: 13 })
    // OpenStreetMap's free tiles, tinted navy in index.css (.xmap .leaflet-tile-pane)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    L.control.zoom({ position: 'bottomright' }).addTo(m)
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
      mk.on('click', (ev) => { L.DomEvent.stopPropagation(ev); pick.current(p.key) })
      mk.addTo(g)
      pts.push([p.spot.lat, p.spot.lng])
    }
    refit.current = () => {
      if (lastFit.current === fitKey || !m.getSize().y) return
      lastFit.current = fitKey
      if (pts.length > 1) m.fitBounds(L.latLngBounds(pts), { padding: [28, 28], maxZoom: 15 })
      else if (pts.length === 1) m.setView(pts[0], 14)
    }
    refit.current()
  }, [pins, picked, origin, radius, fitKey])

  // a picked pin slides into view
  useEffect(() => {
    const p = pins.find((x) => x.key === picked)
    if (p && map.current) map.current.panTo([p.spot.lat, p.spot.lng], { animate: true })
  }, [picked]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={box} className="xmap h-[58vh] min-h-[320px] w-full overflow-hidden rounded-[20px] bg-surface" role="application" aria-label="Map of where events are held" />
}
