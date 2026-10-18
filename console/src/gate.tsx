import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

/**
 * The console's front door. In order:
 *   1. signed out            → sign-in screen
 *   2. signed in, not team   → "Not authorised", then signed out
 *   3. team, no 2-step yet   → set up an authenticator app
 *   4. team, 2-step set up   → enter today's code
 *   5. team + code verified  → the console
 * The database enforces the same rule: public.is_team() is only true at step 5.
 */
export type GateState = 'loading' | 'signed-out' | 'not-team' | 'enrol' | 'verify' | 'ready'

export type TeamMe = { user_id: string; role: 'admin' | 'reviewer'; name: string | null; photo_url: string | null }

type Gate = {
  state: GateState
  session: Session | null
  me: TeamMe | null
  deniedEmail: string | null
  recheck: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<Gate | null>(null)

export function GateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [me, setMe] = useState<TeamMe | null>(null)
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null)
  const denied = useRef(false)

  const evaluate = useCallback(async (s: Session | null) => {
    setSession(s)
    if (!s) { setMe(null); setState('signed-out'); return }

    const { data: member, error } = await supabase.rpc('am_team_member')
    if (error || member !== true) {
      denied.current = true
      setDeniedEmail(s.user.email ?? null)
      setState('not-team')
      await supabase.auth.signOut({ scope: 'local' })
      return
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.currentLevel === 'aal2') {
      const { data } = await supabase.rpc('team_me')
      setMe((data as TeamMe) ?? null)
      setState('ready')
    } else if (aal?.nextLevel === 'aal2') {
      setState('verify')
    } else {
      setState('enrol')
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => evaluate(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'MFA_CHALLENGE_VERIFIED' || event === 'USER_UPDATED') {
        // run outside the auth callback, as Supabase recommends
        // keep the "Not authorised" screen up after we sign a non-team account out
        if (event === 'SIGNED_OUT' && denied.current) { setSession(null); return }
        if (event === 'SIGNED_IN') denied.current = false
        setTimeout(() => evaluate(s), 0)
      } else setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [evaluate])

  const recheck = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    await evaluate(data.session)
  }, [evaluate])

  const signOut = useCallback(async () => {
    denied.current = false
    setDeniedEmail(null)
    await supabase.auth.signOut()
    setState('signed-out')
  }, [])

  return <Ctx.Provider value={{ state, session, me, deniedEmail, recheck, signOut }}>{children}</Ctx.Provider>
}

export function useGate() {
  const g = useContext(Ctx)
  if (!g) throw new Error('useGate outside GateProvider')
  return g
}
