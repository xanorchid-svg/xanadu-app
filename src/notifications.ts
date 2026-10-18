import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './auth'

/**
 * Notifications: approvals and decisions, an experience going live, new messages, Community requests
 * and new matches. Created in the database (notify_member); shown in the app (bell + /notifications),
 * pushed to phones that turned them on, and emailed when it matters.
 */
export type AppNotification = { id: string; kind: string; title: string; body: string; link: string; read_at: string | null; created_at: string }

export function useNotifications() {
  const { session } = useAuth()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    const { data } = await supabase.from('notifications').select('id, kind, title, body, link, read_at, created_at').order('created_at', { ascending: false }).limit(60)
    setItems((data as AppNotification[]) ?? [])
    setLoading(false)
  }, [])
  useEffect(() => {
    if (!session) return
    reload()
    const ch = supabase.channel(`notifications-${session.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => { reload() })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [session, reload])
  const markRead = useCallback(async (ids?: string[]) => {
    setItems((list) => list.map((n) => (!ids || ids.includes(n.id) ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n)))
    await supabase.rpc('mark_notifications_read', { p_ids: ids ?? null })
    clearBadge()
  }, [])
  return { items, loading, reload, markRead, unread: items.filter((n) => !n.read_at).length }
}

/** How many unread notifications (for the bell). */
export function useUnreadNotifications() {
  const { session } = useAuth()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!session) return
    let live = true
    const load = () => supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null)
      .then(({ count }) => { if (live) setN(count ?? 0) })
    load()
    const ch = supabase.channel(`bell-${session.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, load)
      .subscribe()
    return () => { live = false; supabase.removeChannel(ch) }
  }, [session])
  return n
}

/* ---------- Phone notifications (web push) ---------- */

export type PushState = 'unsupported' | 'install-first' | 'off' | 'on' | 'blocked'

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export async function pushState(): Promise<PushState> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    // iPhone only allows notifications once Xanadu is added to the Home Screen
    return isIOS() && !isStandalone() ? 'install-first' : 'unsupported'
  }
  if (Notification.permission === 'denied') return 'blocked'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

const b64ToBytes = (b64: string) => {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}

/** Asks for permission (must be called from a tap) and saves this phone's subscription. */
export async function turnOnPush(userId: string): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return permission === 'denied' ? 'Notifications are blocked for Xanadu. Turn them on in your phone’s Settings.' : 'Notifications weren’t turned on.'
    const { data: key } = await supabase.rpc('push_public_key')
    if (!key) return 'Notifications aren’t ready yet. Please try again in a minute.'
    const reg = await navigator.serviceWorker.ready
    const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key as string) })
    const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
    const { error } = await supabase.from('push_subscriptions').upsert(
      { user_id: userId, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent.slice(0, 200) },
      { onConflict: 'endpoint' })
    return error ? 'We couldn’t save this phone. Please try again.' : null
  } catch {
    return 'This browser couldn’t turn on notifications.'
  }
}

export async function turnOffPush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

function clearBadge() {
  try { (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.() } catch { /* not supported */ }
}
