import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { HOME, Loading, takeReturn, useAuth, type DbRole } from '../auth'

/**
 * Where Google sign-in and email-confirmation links land.
 * Supabase finishes the sign-in from the link automatically; then we send the member
 * to set up their profile (new) or to their home (returning).
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { session, profile, loading, updateProfile } = useAuth()
  const [slow, setSlow] = useState(false)
  const linkError = params.get('error_description')

  useEffect(() => { const t = window.setTimeout(() => setSlow(true), 8000); return () => window.clearTimeout(t) }, [])

  useEffect(() => {
    if (loading || !session || !profile) return
    const wanted = params.get('role') as DbRole | null
    ;(async () => {
      // A brand-new Google account starts as a Seeker; switch it to the role they picked before onboarding
      if (!profile.onboarded && wanted && ['seeker', 'container', 'facilitator'].includes(wanted) && wanted !== profile.role) {
        await updateProfile({ role: wanted })
      }
      navigate(profile.onboarded ? takeReturn(HOME[profile.role]) : '/welcome', { replace: true })
    })()
  }, [loading, session, profile, params, navigate, updateProfile])

  if (linkError || (slow && !session && !loading)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-navy px-8 text-center">
        <h1 className="m-0 font-display text-3xl font-medium text-ink">That link didn't work</h1>
        <p className="m-0 text-sm leading-relaxed text-muted">{linkError ?? 'It may have expired or already been used. Please sign in again.'}</p>
        <Link to="/" className="flex min-h-12 items-center rounded-2xl bg-gold px-6 font-semibold text-navy no-underline hover:text-navy">Back to sign in</Link>
      </div>
    )
  }
  return <Loading label="Signing you in…" />
}
