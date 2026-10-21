import { useCallback, useEffect, useState } from 'react'
import { friendlyError, supabase } from './lib/supabase'
import { useAuth } from './auth'

/**
 * Private messages between members: a Seeker and a space or guide, or a Facilitator and a space.
 * One conversation per pair of members. Only the two of them can read it; the Xanadu team can't.
 * Who may start one is checked in the database (start_thread): Seekers can message approved hosts,
 * and approved Facilitators and Containers can message each other. Hosts can't cold-message Seekers.
 */

export type ThreadRole = 'seeker' | 'container' | 'facilitator'
export type ThreadSummary = {
  id: string; other_id: string; name: string; photo_url: string; role: ThreadRole; status: string
  space_id: string | null; space_name: string | null; offering_title: string | null
  last_body: string | null; last_sender: string | null; last_at: string; unread: boolean; blocked: boolean
}
export type ThreadMessage = { id: string; thread_id: string; sender: string; body: string; created_at: string }

export const roleName = (r: string) => (r === 'container' ? 'Retreat space' : r === 'facilitator' ? 'Facilitator' : 'Seeker')

export function useThreads() {
  const { session } = useAuth()
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    const { data } = await supabase.rpc('my_threads')
    setThreads((data as ThreadSummary[]) ?? [])
    setLoading(false)
  }, [])
  useEffect(() => {
    if (!session) return
    reload()
    // a new message in any of my conversations refreshes the list (RLS only delivers my own)
    const ch = supabase.channel(`threads-${session.user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'thread_messages' }, () => { reload() })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [session, reload])
  return { threads, loading, reload }
}

/** One conversation, with new messages arriving live. Opening it marks it read. */
export function useThread(threadId: string | undefined) {
  const { session } = useAuth()
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!threadId || !session) return
    let live = true
    supabase.from('thread_messages').select('*').eq('thread_id', threadId).order('created_at').then(({ data }) => {
      if (live) { setMessages((data as ThreadMessage[]) ?? []); setLoading(false) }
    })
    supabase.rpc('mark_thread_read', { p_thread: threadId })
    const ch = supabase.channel(`thread-${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'thread_messages', filter: `thread_id=eq.${threadId}` }, (p) => {
        const m = p.new as ThreadMessage
        setMessages((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, m]))
        supabase.rpc('mark_thread_read', { p_thread: threadId })
      })
      .subscribe()
    return () => { live = false; supabase.removeChannel(ch) }
  }, [threadId, session])

  const send = useCallback(async (body: string) => {
    if (!threadId || !session) return 'You are signed out. Please sign in again.'
    const { data, error } = await supabase.from('thread_messages').insert({ thread_id: threadId, sender: session.user.id, body }).select('*').single()
    if (error) return error.message.includes('row-level security') ? "This conversation is closed." : friendlyError(error.message)
    setMessages((ms) => (ms.some((x) => x.id === data.id) ? ms : [...ms, data as ThreadMessage]))
    return null
  }, [threadId, session])

  return { messages, loading, send }
}

/** Starts a conversation (or adds to the existing one with this member) and returns its id. */
export async function startThread(recipient: string, body: string, ctx: { spaceId?: string | null; offeringId?: string | null } = {}) {
  const { data, error } = await supabase.rpc('start_thread', { p_recipient: recipient, p_body: body, p_space: ctx.spaceId ?? null, p_offering: ctx.offeringId ?? null })
  if (error) return { id: null, error: error.message.startsWith('Failed to fetch') ? friendlyError(error.message) : error.message }
  return { id: data as string, error: null }
}

/** Is anything unread across member conversations? Used for the dot on the Messages tab. */
export function useUnreadDot() {
  const { session } = useAuth()
  const [dot, setDot] = useState(false)
  useEffect(() => {
    if (!session) return
    let live = true
    supabase.rpc('my_threads').then(({ data }) => { if (live) setDot(((data as ThreadSummary[]) ?? []).some((t) => t.unread && !t.blocked)) })
    return () => { live = false }
  }, [session])
  return dot
}

export async function reportMember(reporter: string, reported: string, reason: string, context: 'community' | 'message' | 'space' | 'offering' | 'profile' | 'community_event', contextId?: string | null) {
  const { error } = await supabase.from('reports').insert({ reporter, reported, reason: reason.slice(0, 2000), context, context_id: contextId ?? null })
  return error ? friendlyError(error.message) : null
}
