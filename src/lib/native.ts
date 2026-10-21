import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { supabase } from './supabase'

/** True inside the iPhone app (Capacitor), false on the website / PWA. */
export const isNative = Capacitor.isNativePlatform()

/**
 * The public web address. Inside the iPhone app the page's own origin is capacitor://localhost,
 * which can't be used in emails or shared links, so those always point at the live site.
 */
export const WEB_ORIGIN = isNative ? 'https://app.dreamxanadu.com' : window.location.origin

/** Custom URL scheme the iPhone app opens on (registered in ios/App/App/Info.plist). */
export const APP_SCHEME = 'dreamxanadu'

/**
 * Google and Apple sign-in inside the iPhone app. Google blocks sign-in inside embedded web views,
 * so we open Supabase's sign-in page in the system browser sheet and come back on
 * dreamxanadu://auth/callback, where the PKCE code is swapped for a session.
 */
export async function nativeOAuth(provider: 'google' | 'apple', role: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${APP_SCHEME}://auth/callback?role=${role}`, skipBrowserRedirect: true },
  })
  if (error || !data?.url) return { error }
  await Browser.open({ url: data.url, presentationStyle: 'popover' })
  return { error: null }
}

/** Listens for dreamxanadu://… links (sign-in returns) and hands the route to the router. */
export function listenForAppLinks(go: (path: string) => void) {
  if (!isNative) return () => {}
  const sub = CapApp.addListener('appUrlOpen', async ({ url }) => {
    let u: URL
    try { u = new URL(url) } catch { return }
    // dreamxanadu://auth/callback?code=… → host "auth", path "/callback"
    const path = '/' + [u.host, u.pathname.replace(/^\//, '')].filter(Boolean).join('/')
    if (path === '/auth/callback') {
      await Browser.close().catch(() => {})
      const code = u.searchParams.get('code')
      const err = u.searchParams.get('error_description')
      if (code) await supabase.auth.exchangeCodeForSession(code)
      const role = u.searchParams.get('role')
      const q = new URLSearchParams()
      if (role) q.set('role', role)
      if (err) q.set('error_description', err)
      go(`/auth/callback${q.toString() ? '?' + q : ''}`)
      return
    }
    go(path + u.search)
  })
  return () => { sub.then((s) => s.remove()) }
}
