/**
 * The Xanadu logo, built from aligned layers cut from the original artwork:
 *  - logo-static.png: petals, stars and the vertical needle (never move)
 *  - logo-orbit-outer.png: the outer fine lines (large rings and side curves)
 *  - logo-orbit-inner.png: the inner fine lines (the diamond around the star)
 *  - logo-nucleus.png: the central star, softly glowing
 *  - logo-wordmark.png: XANADU + tagline (never moves)
 * When animated, the two sets of lines turn around the central star at different speeds,
 * in opposite directions and on slightly different tilts, like electrons around a nucleus.
 * Each full turn returns to the exact logo, so the design is unchanged at rest.
 */
const NUCLEUS = { left: 45.077, top: 47.995, width: 8.077 } // % of the emblem layer
const ORIGIN = '49.077% 56.283%' // the nucleus centre

export default function Logo({ animated = false, className = '' }: { animated?: boolean; className?: string }) {
  const img = 'absolute inset-0 block w-full select-none'
  return (
    <div className={`relative w-full ${className}`} role="img" aria-label="Xanadu — a network for awakening places">
      <div className="relative" style={{ perspective: '1000px', aspectRatio: '900 / 518' }}>
        <img src="/logo-static.png" alt="" draggable={false} className={img} />
        <img src="/logo-orbit-outer.png" alt="" draggable={false} className={img}
          style={{ transformOrigin: ORIGIN, animation: animated ? 'xa-orbit-outer 12s linear .4s infinite' : 'none' }} />
        <img src="/logo-orbit-inner.png" alt="" draggable={false} className={img}
          style={{ transformOrigin: ORIGIN, animation: animated ? 'xa-orbit-inner 7s linear .4s infinite' : 'none' }} />
        <img src="/logo-nucleus.png" alt="" draggable={false} className="absolute select-none"
          style={{ left: `${NUCLEUS.left}%`, top: `${NUCLEUS.top}%`, width: `${NUCLEUS.width}%`, animation: animated ? 'xa-glow 4.5s ease-in-out infinite' : 'none' }} />
      </div>
      <img src="/logo-wordmark.png" alt="" draggable={false} className="block w-full select-none" />
    </div>
  )
}
