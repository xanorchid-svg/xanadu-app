/**
 * The Xanadu logo as three stacked layers so the emblem can move on its own:
 *  - logo-mark.png: the emblem, which spins in 3D around its central star like an orbit around a nucleus
 *  - logo-nucleus.png: the central star, which stays still and glows softly
 *  - logo-wordmark.png: XANADU + tagline, which stays still
 * Percentages below come from the original artwork so the layers line up exactly.
 */
const NUCLEUS = { left: 45.077, top: 47.995, width: 8.077 } // % of the emblem layer
const ORIGIN = '49.077% 56.283%' // the nucleus centre: the axis the emblem turns around

export default function Logo({ spinning = false, className = '' }: { spinning?: boolean; className?: string }) {
  return (
    <div className={`relative w-full ${className}`} role="img" aria-label="Xanadu — a network for awakening places">
      <div className="relative" style={{ perspective: '1100px' }}>
        <img
          src="/logo-mark.png" alt="" draggable={false}
          className="block w-full select-none"
          style={{ transformOrigin: ORIGIN, animation: spinning ? 'xa-orbit 9s linear .6s infinite' : 'none' }}
        />
        <img
          src="/logo-nucleus.png" alt="" draggable={false}
          className="absolute select-none"
          style={{ left: `${NUCLEUS.left}%`, top: `${NUCLEUS.top}%`, width: `${NUCLEUS.width}%`, animation: spinning ? 'xa-glow 4.5s ease-in-out infinite' : 'none' }}
        />
      </div>
      <img src="/logo-wordmark.png" alt="" draggable={false} className="block w-full select-none" />
    </div>
  )
}
