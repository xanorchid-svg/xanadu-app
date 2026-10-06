import { useCallback, useEffect, useState } from 'react'
import { supabase, friendlyError } from './lib/supabase'
import { useAuth } from './auth'

/**
 * Community: opt-in, nearby members (rounded distance only), connections, chat, block and report.
 * Locations are rounded to 2 decimals (~1 km) on the phone before they're ever sent.
 */

export type NearbyMember = {
  id: string; name: string; photo_url: string; role: 'seeker' | 'facilitator'; practices: string[]; town: string
  miles: number; connection_id: string | null; connection_status: 'pending' | 'accepted' | 'declined' | null; incoming: boolean | null
}

export type Connection = {
  connection_id: string; other_id: string; name: string; photo_url: string; role: 'seeker' | 'facilitator'; town: string
  status: 'pending' | 'accepted'; incoming: boolean; last_body: string | null; last_at: string
}

export type DirectMessage = { id: string; connection_id: string; sender: string; body: string; created_at: string }

/** Asks the phone for its location, rounds it to about 1 km, and saves it. */
export async function shareApproxLocation(userId: string): Promise<string | null> {
  if (!('geolocation' in navigator)) return "This device can't share a location."
  const pos = await new Promise<GeolocationPosition | GeolocationPositionError>((resolve) =>
    navigator.geolocation.getCurrentPosition(resolve, resolve, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }))
  if (!('coords' in pos)) {
    return pos.code === 1
      ? 'Location is turned off for Xanadu. Allow it in your phone settings to see who is nearby.'
      : "We couldn't get your location. Please try again."
  }
  const lat = Math.round(pos.coords.latitude * 100) / 100
  const lng = Math.round(pos.coords.longitude * 100) / 100
  const { error } = await supabase.from('member_locations').upsert({ user_id: userId, lat, lng }, { onConflict: 'user_id' })
  return error ? friendlyError(error.message) : null
}

export async function hasLocation(userId: string) {
  const { data } = await supabase.from('member_locations').select('updated_at').eq('user_id', userId).maybeSingle()
  return !!data
}

export async function forgetLocation(userId: string) {
  await supabase.from('member_locations').delete().eq('user_id', userId)
}

export function useNearby(radius: number, enabled: boolean) {
  const [members, setMembers] = useState<NearbyMember[]>([])
  const [loading, setLoading] = useState(false)
  const reload = useCallback(async () => {
    if (!enabled) { setMembers([]); return }
    setLoading(true)
    const { data } = await supabase.rpc('nearby_members', { radius_miles: radius })
    setMembers((data as NearbyMember[]) ?? [])
    setLoading(false)
  }, [radius, enabled])
  useEffect(() => { reload() }, [reload])
  return { members, loading, reload }
}

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    const { data } = await supabase.rpc('my_connections')
    setConnections((data as Connection[]) ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { reload() }, [reload])
  return { connections, loading, reload }
}

export async function requestConnection(me: string, other: string) {
  const { error } = await supabase.from('connections').insert({ requester: me, addressee: other })
  return error ? (error.code === '23505' ? 'You already have a request with this person.' : friendlyError(error.message)) : null
}
export async function respondToConnection(id: string, accept: boolean) {
  const { error } = await supabase.from('connections').update({ status: accept ? 'accepted' : 'declined' }).eq('id', id)
  return error ? friendlyError(error.message) : null
}
export async function removeConnection(id: string) {
  const { error } = await supabase.from('connections').delete().eq('id', id)
  return error ? friendlyError(error.message) : null
}
export async function blockMember(me: string, other: string) {
  const { error } = await supabase.from('blocks').insert({ blocker: me, blocked: other })
  return error && error.code !== '23505' ? friendlyError(error.message) : null
}
export async function reportMember(me: string, other: string, reason: string) {
  const { error } = await supabase.from('reports').insert({ reporter: me, reported: other, reason: reason.slice(0, 2000) })
  return error ? friendlyError(error.message) : null
}

/** One chat thread, with new messages arriving live. */
export function useChat(connectionId: string | undefined) {
  const { session } = useAuth()
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!connectionId || !session) return
    let live = true
    supabase.from('direct_messages').select('*').eq('connection_id', connectionId).order('created_at').then(({ data }) => {
      if (live) { setMessages((data as DirectMessage[]) ?? []); setLoading(false) }
    })
    const channel = supabase.channel(`dm-${connectionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `connection_id=eq.${connectionId}` }, (payload) => {
        const m = payload.new as DirectMessage
        setMessages((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, m]))
      })
      .subscribe()
    return () => { live = false; supabase.removeChannel(channel) }
  }, [connectionId, session])

  const send = useCallback(async (body: string) => {
    if (!connectionId || !session) return 'You are signed out. Please sign in again.'
    const { data, error } = await supabase.from('direct_messages').insert({ connection_id: connectionId, sender: session.user.id, body }).select('*').single()
    if (error) return friendlyError(error.message)
    setMessages((ms) => (ms.some((x) => x.id === data.id) ? ms : [...ms, data as DirectMessage]))
    return null
  }, [connectionId, session])

  return { messages, loading, send }
}
