import { useCallback, useEffect, useState } from 'react'
import { friendlyError, supabase } from './lib/supabase'
import { useAuth } from './auth'

/**
 * Community events: local gatherings members saw on a poster or in a group chat and shared with Xanadu.
 * The team approves them in the console; they show on the Calendar and Discover labelled "not verified".
 * Separate from offerings, which are reviewed listings from spaces and Facilitators.
 */
export type CommunityEvent = {
  id: string; submitted_by: string | null
  title: string; description: string
  start_date: string | null; end_date: string | null; start_time: string; end_time: string
  venue: string; town: string; price_note: string; contact: string; link: string
  tags: string[]; photo_url: string; aligned: boolean | null
  status: 'pending' | 'live' | 'declined'; created_at: string
}
export type EventDraft = Omit<CommunityEvent, 'id' | 'submitted_by' | 'status' | 'created_at'>
export const EMPTY_EVENT: EventDraft = {
  title: '', description: '', start_date: null, end_date: null, start_time: '', end_time: '',
  venue: '', town: '', price_note: '', contact: '', link: '', tags: [], photo_url: '', aligned: null,
}

/** What the community calendar is for (the same list the poster reader uses). */
export const EVENT_TAGS = ['Yoga', 'Breathwork', 'Meditation', 'Sound healing', 'Dance', 'Ecstatic dance', 'Healing', 'Embodiment', 'Womb work',
  "Women's circle", "Men's circle", 'Kirtan', 'Cacao', 'Reiki', 'Bodywork', 'Workshop', 'Retreat'] as const

const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

/** Approved community events that haven't ended. */
export function useCommunityEvents() {
  const { session } = useAuth()
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!session) return
    let live = true
    supabase.from('community_events').select('*').eq('status', 'live').order('start_date', { ascending: true, nullsFirst: false }).limit(300)
      .then(({ data }) => {
        if (!live) return
        const today = todayIso()
        setEvents(((data as CommunityEvent[]) ?? []).filter((e) => !e.start_date || (e.end_date || e.start_date) >= today))
        setLoading(false)
      })
    return () => { live = false }
  }, [session])
  return { events, loading }
}

/** The events I shared (any status), newest first. */
export function useMySharedEvents() {
  const { session } = useAuth()
  const [mine, setMine] = useState<CommunityEvent[]>([])
  const reload = useCallback(async () => {
    if (!session) return
    const { data } = await supabase.from('community_events').select('*').eq('submitted_by', session.user.id).order('created_at', { ascending: false }).limit(20)
    setMine((data as CommunityEvent[]) ?? [])
  }, [session])
  useEffect(() => { reload() }, [reload])
  return { mine, reload }
}

export async function fetchCommunityEvent(id: string): Promise<CommunityEvent | null> {
  const { data } = await supabase.from('community_events').select('*').eq('id', id).maybeSingle()
  return (data as CommunityEvent | null) ?? null
}

export async function shareEvent(userId: string, e: EventDraft): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase.from('community_events').insert({ ...e, submitted_by: userId }).select('id').single()
  return error ? { error: friendlyError(error.message) } : { id: data.id as string }
}

export async function deleteSharedEvent(id: string): Promise<string | null> {
  const { error } = await supabase.from('community_events').delete().eq('id', id)
  return error ? friendlyError(error.message) : null
}

/** "Sat, Nov 15 · 6:30 pm" */
export function whenLabel(e: Pick<CommunityEvent, 'start_date' | 'end_date' | 'start_time' | 'end_time'>) {
  if (!e.start_date) return 'Date to be confirmed'
  const f = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const days = e.end_date && e.end_date !== e.start_date ? `${f(e.start_date)} – ${f(e.end_date)}` : f(e.start_date)
  const time = [e.start_time, e.end_time].filter(Boolean).join(' – ')
  return time ? `${days} · ${time}` : days
}

/** Turns a contact into something tappable: a WhatsApp number, an email or an Instagram handle. */
export function contactLink(contact: string): string | null {
  const c = contact.trim()
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(c)) return `mailto:${c}`
  if (/^@[\w.]{2,30}$/.test(c)) return `https://instagram.com/${c.slice(1)}`
  const digits = c.replace(/[^\d+]/g, '')
  if (/^\+?\d{8,15}$/.test(digits)) {
    // Costa Rican numbers are often written without the country code
    const n = digits.startsWith('+') ? digits.slice(1) : digits.length === 8 ? `506${digits}` : digits
    return `https://wa.me/${n}`
  }
  return null
}
export const safeLink = (raw: string) => {
  try { const u = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u.href : null } catch { return null }
}
