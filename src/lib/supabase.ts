import { createClient } from '@supabase/supabase-js'

/**
 * Supabase connection. The URL and publishable key are safe to ship in the app:
 * they only allow what the database's row-level security rules allow.
 * Override them with VITE_SUPABASE_URL / VITE_SUPABASE_KEY if the project ever changes.
 */
const URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://nmstrfmxflwgbgkiyeyq.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_qLZukMIEQ7vpCfYhxaTCkw_EQUXINXS'

export const supabase = createClient(URL, KEY, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export const PHOTO_BUCKET = 'photos'

/** Whether Google sign-in is switched on in Supabase (Authentication → Providers). */
export async function enabledProviders(): Promise<{ google: boolean }> {
  try {
    const r = await fetch(`${URL}/auth/v1/settings`, { headers: { apikey: KEY } })
    const s = await r.json()
    return { google: !!s?.external?.google }
  } catch { return { google: false } }
}

/** Turns Supabase's error messages into friendly ones. */
export function friendlyError(message: string | undefined): string {
  if (!message) return 'Something went wrong. Please try again.'
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return "That email and password don't match. Try again, or reset your password."
  if (m.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox for the link from Xanadu.'
  if (m.includes('user already registered')) return 'There is already an account with this email. Sign in instead.'
  if (m.includes('password should be at least')) return 'Your password needs at least 6 characters.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many tries in a short time. Please wait a minute and try again.'
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) return "That sign-in option isn't switched on yet. Please use email for now."
  if (m.includes('failed to fetch') || m.includes('network')) return "We couldn't reach Xanadu. Check your connection and try again."
  return message
}
