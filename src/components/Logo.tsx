import { useEffect, useState } from 'react'

/**
 * The Xanadu logo as stacked layers so it can come alive without changing the artwork:
 *  - logo-mark.png: the emblem (stays still)
 *  - an SVG "atom" layer: three hairline gold orbits around the central star, each with
 *    a small four-point star electron travelling along it (brighter in front, dimmer behind)
 *  - logo-nucleus.png: the central star (the nucleus), softly glowing
 *  - logo-wordmark.png: XANADU + tagline (stays still)
 * Coordinates use the emblem layer's own pixel space (900 × 518) so everything lines up.
 */
const VB_W = 900
const VB_H = 518
const CX = 441.7 // nucleus centre, from the original artwork
const CY = 291.5
const NUCLEUS = { left: 45.077, top: 47.995, width: 8.077 } // % of the emblem layer

const ORBITS = [
  { tilt: 0, rx: 250, ry: 62, dur: 3.8, begin: 0 },
  { tilt: 60, rx: 230, ry: 58, dur: 5.2, begin: -1.7 },
  { tilt: -60, rx: 230, ry: 58, dur: 6.6, begin: -3.9 },
]

// A small four-point star, the same shape as the stars in the logo
const STAR = 'M0,-19 C2.2,-4.4 4.4,-2.2 16,0 C4.4,2.2 2.2,4.4 0,19 C-2.2,4.4 -4.4,2.2 -16,0 C-4.4,-2.2 -2.2,-4.4 0,-19 Z'

// Path round the ellipse: starts at the left point, sweeps across the front (lower) half first
const orbitPath = (rx: number, ry: number) => `M ${CX - rx},${CY} a ${rx},${ry} 0 1,0 ${2 * rx},0 a ${rx},${ry} 0 1,0 ${-2 * rx},0`

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export default function Logo({ animated = false, className = '' }: { animated?: boolean; className?: string }) {
  const reduced = usePrefersReducedMotion()
  const live = animated && !reduced

  return (
    <div className={`relative w-full ${className}`} role="img" aria-label="Xanadu — a network for awakening places">
      <div className="relative">
        <img src="/logo-mark.png" alt="" draggable={false} className="block w-full select-none" />

        {animated && (
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`} aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            style={{ animation: 'xa-fade-in 1.2s ease-out .3s both' }}
          >
            <defs>
              <radialGradient id="xa-electron-glow">
                <stop offset="0%" stopColor="#F3D9A8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#B89567" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* the whole atom drifts very slowly, so the orbits never feel mechanical */}
            <g>
              {live && <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="90s" repeatCount="indefinite" />}
              {ORBITS.map((o, i) => {
                const d = orbitPath(o.rx, o.ry)
                return (
                  <g key={i} transform={`rotate(${o.tilt} ${CX} ${CY})`}>
                    <path d={d} fill="none" stroke="#B89567" strokeWidth="1.6" strokeOpacity="0.42" />
                    <g>
                      {live
                        ? <animateMotion dur={`${o.dur}s`} begin={`${o.begin}s`} repeatCount="indefinite" path={d} />
                        : <animateMotion dur="1s" begin="0s" fill="freeze" keyPoints={`${0.25 + i * 0.22};${0.25 + i * 0.22}`} keyTimes="0;1" calcMode="linear" path={d} />}
                      <g>
                        {live && (
                          <>
                            {/* front half (first half of the path) is larger and brighter; back half smaller and dimmer */}
                            <animateTransform attributeName="transform" type="scale" dur={`${o.dur}s`} begin={`${o.begin}s`} repeatCount="indefinite"
                              values="1.05;1.35;1.05;0.7;0.55;0.7;1.05" keyTimes="0;0.25;0.5;0.62;0.75;0.88;1" />
                            <animate attributeName="opacity" dur={`${o.dur}s`} begin={`${o.begin}s`} repeatCount="indefinite"
                              values="1;1;1;0.55;0.4;0.55;1" keyTimes="0;0.25;0.5;0.62;0.75;0.88;1" />
                          </>
                        )}
                        <circle r="38" fill="url(#xa-electron-glow)" />
                        <path d={STAR} fill="#C29A5E" />
                      </g>
                    </g>
                  </g>
                )
              })}
            </g>
          </svg>
        )}

        <img
          src="/logo-nucleus.png" alt="" draggable={false}
          className="absolute select-none"
          style={{ left: `${NUCLEUS.left}%`, top: `${NUCLEUS.top}%`, width: `${NUCLEUS.width}%`, animation: live ? 'xa-glow 4.5s ease-in-out infinite' : 'none' }}
        />
      </div>
      <img src="/logo-wordmark.png" alt="" draggable={false} className="block w-full select-none" />
    </div>
  )
}
