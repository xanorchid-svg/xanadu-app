import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { Role } from './data'

export type DbRole = 'seeker' | 'container' | 'facilitator'
export type Training = { title: string; school: string; year: string }

/** One row of public.profiles */
export type Profile = {
  id: string
  role: DbRole
  status: 'active' | 'pending' | 'approved' | 'declined'
  onboarded: boolean
  name: string
  photo_url: string
  town: string
  region: string
  practices: string[]
  about: string
  languages: string
  trainings: Training[]
  prefs: string[]
  notify: boolean
  launch_notify: boolean
  chart_early: boolean
  open_to_spaces: boolean
  community_visible: boolean
  seeking: string
}

export const toDbRole = (r: Role): DbRole => r.toLowerCase() as DbRole
export const toRole = (r: DbRole): Role => (r === 'seeker' ? 'Seeker' : r === 'container' ? 'Container' : 'Facilitator')
export const HOME: Record<DbRole, string> = { seeker: '/discover', container: '/container', facilitator: '/facilitator' }

type AuthState = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<Profile | null>
  updateProfile: (patch: Partial<Profile>) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function fetchProfile(userId: string): Promise<Profile | null> {
  // the profile row is created by a database trigger at sign-up; retry briefly in case it's a moment behind
  for (let i = 0; i < 4; i++) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (data) return data as Profile
    await new Promise((r) => setTimeout(r, 400))
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (s: Session | null) => {
    setSession(s)
    setProfile(s ? await fetchProfile(s.user.id) : null)
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') { setLoading(true); load(s) }
      else setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [load])

  const refreshProfile = useCallback(async () => {
    if (!session) return null
    const p = await fetchProfile(session.user.id)
    setProfile(p)
    return p
  }, [session])

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!session) return 'You are signed out. Please sign in again.'
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', session.user.id).select('*').single()
    if (error) return error.message
    setProfile(data as Profile)
    return null
  }, [session])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  return <AuthContext.Provider value={{ session, profile, loading, refreshProfile, updateProfile, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function Loading({ label = 'Opening Xanadu…' }: { label?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-navy">
      <img src="/xanadu-mark.png" alt="" className="h-20 w-auto animate-pulse opacity-80" />
      <span className="text-sm text-subtle">{label}</span>
    </div>
  )
}

/** Guards a page: must be signed in, set up, and the right kind of member. */
export function RequireRole({ role, children }: { role: DbRole | 'any'; children: ReactNode }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!session) return <Navigate to="/" replace state={{ from: location.pathname }} />
  if (!profile) return <Loading label="Setting up your account…" />
  if (!profile.onboarded) return <Navigate to="/welcome" replace />
  if (role !== 'any' && profile.role !== role) return <Navigate to={HOME[profile.role]} replace />
  return <>{children}</>
}
