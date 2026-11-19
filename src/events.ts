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
  "Women's circle", "Men's circle", 'Kirtan', 'Cacao', 'Reiki', 'Bodywork', 'Workshop', 'Retreat', 'Kids & family', 'Nature & adventure', 'Art & creativity'] as const

/**
 * The Calendar's filters. Each groups community-event tags and experience practices/formats,
 * so a seeker can ask for "Sound healing" and see sound baths, kirtan and sound journeys together.
 */
export const CATEGORIES: { label: string; tags: string[]; practices?: string[]; formats?: string[] }[] = [
  { label: 'Yoga', tags: ['Yoga'], practices: ['Yoga'] },
  { label: 'Meditation', tags: ['Meditation'], practices: ['Meditation'] },
  { label: 'Breathwork', tags: ['Breathwork'], practices: ['Breathwork'] },
  { label: 'Sound healing', tags: ['Sound healing', 'Kirtan'], practices: ['Sound', 'Kirtan'] },
  { label: 'Dance & movement', tags: ['Dance', 'Ecstatic dance', 'Embodiment'], practices: ['Ecstatic dance'] },
  { label: 'Cacao & ceremony', tags: ['Cacao'] },
  { label: 'Circles', tags: ["Women's circle", "Men's circle", 'Womb work'], practices: ["Women's", "Men's"] },
  { label: 'Healing & bodywork', tags: ['Healing', 'Bodywork', 'Reiki'], practices: ['Bodywork & therapy'] },
  { label: 'Workshops & trainings', tags: ['Workshop'], practices: ['Trainings'], formats: ['Training'] },
  { label: 'Retreats', tags: ['Retreat'], formats: ['Retreat'] },
  { label: 'Kids & family', tags: ['Kids & family'] },
  { label: 'Nature & adventure', tags: ['Nature & adventure'] },
  { label: 'Art & creativity', tags: ['Art & creativity'] },
]

/** Does a community event or experience belong under this filter? */
export function inCategory(e: { tags?: string[]; practices?: string[]; format?: string }, label: string) {
  const c = CATEGORIES.find((x) => x.label === label)
  if (!c) return true
  return (e.tags ?? []).some((t) => c.tags.includes(t))
    || (e.practices ?? []).some((p) => c.practices?.includes(p))
    || (!!e.format && !!c.formats?.includes(e.format))
}

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

/* ---------- I'm going, who's going ---------- */

export type Attendee = {
  id: string; name: string; photo_url: string; town: string; practices: string[]
  connection_id: string | null; connection_status: 'pending' | 'accepted' | 'declined' | null; incoming: boolean | null
}
export type Attendees = { going: number; me: boolean; visible: boolean; people: Attendee[] }

/** How many members are going to each event in the list. */
export function useGoingCounts(ids: string[]) {
  const key = ids.slice().sort().join(',')
  const [counts, setCounts] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!key) { setCounts({}); return }
    let live = true
    supabase.rpc('event_going_counts', { p_ids: key.split(',') }).then(({ data }) => {
      if (!live) return
      const out: Record<string, number> = {}
      for (const r of (data as { event_id: string; going: number }[] | null) ?? []) out[r.event_id] = r.going
      setCounts(out)
    })
    return () => { live = false }
  }, [key])
  return counts
}

/** Who's going to one event (names only for members who share their profile in Community). */
export function useAttendees(eventId: string | undefined) {
  const [a, setA] = useState<Attendees | null>(null)
  const reload = useCallback(async () => {
    if (!eventId) return
    const { data } = await supabase.rpc('event_attendees', { p_event: eventId })
    setA((data as Attendees | null) ?? { going: 0, me: false, visible: false, people: [] })
  }, [eventId])
  useEffect(() => { reload() }, [reload])
  return { attendees: a, reload }
}

export async function setGoing(userId: string, eventId: string, going: boolean): Promise<string | null> {
  const { error } = going
    ? await supabase.from('event_going').insert({ event_id: eventId, user_id: userId })
    : await supabase.from('event_going').delete().eq('event_id', eventId).eq('user_id', userId)
  return error && error.code !== '23505' ? friendlyError(error.message) : null
}

/* ---------- reviews ---------- */

export type ReviewTarget = 'space' | 'facilitator'
export type MyReview = { event_id: string; target: ReviewTarget; rating: number; comment: string }

/** Events I said I'm going to that have now happened (last 30 days) and I haven't reviewed yet. */
export function useToReview() {
  const { session } = useAuth()
  const [list, setList] = useState<CommunityEvent[]>([])
  const reload = useCallback(async () => {
    if (!session) return
    const today = todayIso()
    const since = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
    const [{ data: going }, { data: mine }] = await Promise.all([
      supabase.from('event_going').select('event_id, community_events(*)').eq('user_id', session.user.id),
      supabase.from('event_reviews').select('event_id').eq('user_id', session.user.id),
    ])
    const done = new Set(((mine as { event_id: string }[] | null) ?? []).map((r) => r.event_id))
    const evs = ((going as unknown as { community_events: CommunityEvent | null }[] | null) ?? [])
      .map((g) => g.community_events).filter((e): e is CommunityEvent => !!e && !!e.start_date && e.start_date <= today && e.start_date >= since && !done.has(e.id))
      .sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''))
    setList(evs)
  }, [session])
  useEffect(() => { reload() }, [reload])
  return { toReview: list, reload }
}

export async function fetchMyReviews(eventId: string): Promise<MyReview[]> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const { data } = await supabase.from('event_reviews').select('event_id, target, rating, comment').eq('event_id', eventId).eq('user_id', session.user.id)
  return (data as MyReview[] | null) ?? []
}

export async function saveReviews(userId: string, eventId: string, reviews: { target: ReviewTarget; rating: number; comment: string }[]): Promise<string | null> {
  const rows = reviews.map((r) => ({ event_id: eventId, user_id: userId, target: r.target, rating: Math.max(0, Math.min(5, Math.round(r.rating))), comment: r.comment.trim().slice(0, 2000), updated_at: new Date().toISOString() }))
  const { error } = await supabase.from('event_reviews').upsert(rows, { onConflict: 'event_id,user_id,target' })
  return error ? friendlyError(error.message) : null
}

export type ReviewSummary = {
  count: number; average: number | null; dist: Record<string, number>
  reviews: { rating: number; comment: string; created_at: string; event_title: string; start_date: string | null; first_name: string; photo_url: string | null }[]
}
/** Reviews for an approved space or Facilitator (empty until they're approved on Xanadu). */
export function useMemberReviews(kind: ReviewTarget, id: string | undefined) {
  const [s, setS] = useState<ReviewSummary | null>(null)
  useEffect(() => {
    if (!id) return
    let live = true
    supabase.rpc('member_reviews', { p_kind: kind, p_id: id }).then(({ data }) => { if (live) setS((data as ReviewSummary | null) ?? null) })
    return () => { live = false }
  }, [kind, id])
  return s
}
