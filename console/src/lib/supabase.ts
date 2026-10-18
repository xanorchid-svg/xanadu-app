import { createClient } from '@supabase/supabase-js'

/**
 * The same "xanadu app" Supabase project the members' app uses.
 * Only the publishable key lives here. Every team power is a database function that checks
 * public.is_team() (on the team list AND signed in with two-step verification), so this key
 * on its own can do nothing a member couldn't. Never put the service-role key in this app.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://gutqzqxybcnnpwfbkjsq.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_7jInxBTTLrcqSP_OgCZApA_NlZG8Mpg'

export const supabase = createClient(SUPABASE_URL, KEY, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'xanadu-console-auth' },
})

/** Is Google sign-in switched on in Supabase? */
export async function googleEnabled(): Promise<boolean> {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: KEY } })
    const s = await r.json()
    return !!s?.external?.google
  } catch { return false }
}

export function friendlyError(message: string | undefined): string {
  if (!message) return 'Something went wrong. Please try again.'
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return "That email and password don't match."
  if (m.includes('email not confirmed')) return 'Please confirm your email first.'
  if (m.includes('invalid totp') || m.includes('invalid code') || m.includes('expired')) return "That code didn't work. Codes change every 30 seconds, so try the newest one."
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many tries. Please wait a minute and try again.'
  if (m.includes('failed to fetch') || m.includes('network')) return "Couldn't reach Xanadu. Check your connection."
  return message
}
