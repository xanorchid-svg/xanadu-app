import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

/** Shown on host homes while their founding application is in review. */
export default function ApplicationBanner() {
  const { profile } = useAuth()
  if (!profile || profile.role === 'seeker' || profile.status === 'approved' || profile.status === 'active') return null
  const declined = profile.status === 'declined'
  return (
    <Link to="/apply/status" className="flex items-center justify-between gap-3 rounded-[18px] border border-gold/60 bg-plum p-4 text-text no-underline">
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold text-ink">{declined ? 'About your application' : 'Your application is in review'}</span>
        <span className="text-[13px] text-subtle">{declined ? 'Tap to read our note.' : "Your profile goes live once we've welcomed you. Keep building it meanwhile."}</span>
      </span>
      <span className="text-gold-soft" aria-hidden>›</span>
    </Link>
  )
}
