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

/** What the community calendar is for (the same list the poster reader and the WhatsApp scan use). */
export const EVENT_TAGS = ['Yoga', 'Acro', 'Breathwork', 'Meditation', 'Sound healing', 'Music', 'Dance', 'Ecstatic dance', 'Healing', 'Embodiment', 'Womb work',
  "Women's circle", "Men's circle", 'Family constellations', 'Inner work', 'Kirtan', 'Cacao', 'Reiki', 'Bodywork', 'Workshop', 'Retreat', 'Community gathering',
  'Kids & family', 'Nature & adventure', 'Art & creativity'] as const

/**
 * The Calendar's and Discover's types. Each groups community-event tags and experience practices/formats,
 * so a seeker can ask for "Sound healing" and see sound baths and sound journeys together.
 * Seekers can pick several at once; an event shows if it fits any of them.
 */
export const CATEGORIES: { label: string; tags: string[]; practices?: string[]; formats?: string[] }[] = [
  { label: 'Yoga', tags: ['Yoga'], practices: ['Yoga'] },
  { label: 'Ecstatic dance', tags: ['Ecstatic dance'], practices: ['Ecstatic dance'] },
  { label: 'Music', tags: ['Music', 'Kirtan'], practices: ['Kirtan'] },
  { label: 'Sound healing', tags: ['Sound healing'], practices: ['Sound'] },
  { label: 'Meditation', tags: ['Meditation'], practices: ['Meditation'] },
  { label: 'Breathwork', tags: ['Breathwork'], practices: ['Breathwork'] },
  { label: 'Dance & movement', tags: ['Dance', 'Ecstatic dance'], practices: ['Ecstatic dance'] },
  { label: 'Acro', tags: ['Acro'] },
  { label: "Women's", tags: ["Women's circle", 'Womb work'], practices: ["Women's"] },
  { label: "Men's", tags: ["Men's circle"], practices: ["Men's"] },
  { label: 'Cacao & ceremony', tags: ['Cacao'] },
  { label: 'Inner work', tags: ['Inner work', 'Family constellations', 'Embodiment'] },
  { label: 'Family constellations', tags: ['Family constellations'] },
  { label: 'Healing & bodywork', tags: ['Healing', 'Bodywork', 'Reiki'], practices: ['Bodywork & therapy'] },
  { label: 'Community gatherings', tags: ['Community gathering'] },
  { label: 'Workshops & trainings', tags: ['Workshop'], practices: ['Trainings'], formats: ['Training'] },
  { label: 'Retreats', tags: ['Retreat'], formats: ['Retreat'] },
  { label: 'Kids & family', tags: ['Kids & family'] },
  { label: 'Nature & adventure', tags: ['Nature & adventure'] },
  { label: 'Art & creativity', tags: ['Art & creativity'] },
]

/**
 * The words that put an event under each type. The same list reads a seeker's own words
 * ("I want yoga and sound baths by the ocean"), so what they ask for and what's on speak one language.
 * Tags set by the importer or the team still count; these words catch anything the tags missed.
 */
const KEYWORDS: Record<string, RegExp> = {
  'Yoga': /\b(yoga|yin|vinyasa|hatha|ashtanga|asanas?|nidra|kundalini|acro ?yoga)\b/,
  'Ecstatic dance': /\b(ecstatic)\b/,
  'Music': /\b(music|musical|musicians?|drums?|drumming|drum circles?|music jams?|jam sessions?|concerts?|live (band|set|music)|dj|djs|kirtan|songs?|singing|sing-?along|guitar|bands?)\b/,
  'Meditation': /\b(meditat\w*|mindful\w*|vipassana|silent|silence|stillness|contemplat\w*|koans?|nidra)\b/,
  'Breathwork': /\b(breath\w*|pranayama|holotropic|wim hof)\b/,
  'Sound healing': /\b(sound|sound ?baths?|singing bowls?|bowls|gongs?|mantras?|chant\w*|voices?|frequenc\w*|cymatic\w*)\b/,
  'Dance & movement': /\b(danc\w*|ecstatic|embodi\w*|somatic\w*|5 ?rhythms|contact improv|qi ?gong|tai chi|(conscious|free|authentic) movement|movement (practice|medicine))\b/,
  'Acro': /\b(acro|acroyoga|acro ?yoga|partner yoga|acrobatic\w*|aerial\w*|silks|trapeze|circus|handstands?|contact improv)\b/,
  "Women's": /\b(women'?s|womens|woman|sisterhood|sisters|goddess\w*|feminine|womb|red tent|red temple|moon ?time|menstrua\w*)\b/,
  "Men's": /\b(men'?s|mens|brotherhood|brothers|masculine)\b/,
  'Cacao & ceremony': /\b(cacao|ceremon\w*|rituals?|full moon|new moon|temazcal|plant medicine)\b/,
  'Inner work': /\b(inner work|shadow ?work|shadow|inner child|constellations?|somatic\w*|embodied healing|trauma\w*|internal family systems|ifs|parts work|archetypes?|rage|grief|self-?love|tantra\w*|circling|authentic relating|relational|drama therapy|psychodrama|enneagram|inquiry|koans?|death|die|dying|release|integration)\b/,
  'Family constellations': /\b(constellations?|systemic)\b/,
  'Healing & bodywork': /\b(heal\w*|bodywork|massage|reiki|acupuncture|craniosacral|chiropract\w*|osteopath\w*|myofascial|lymphatic|thai massage|cupping|therap\w*|detox|cleanse|water ?fast\w*|fasting|recovery)\b/,
  'Community gatherings': /\b(potlucks?|dinners?|suppers?|brunch|feasts?|community (gathering|meal|party|night|celebration)|(community|social) gatherings?|part(y|ies)|socials?|meet-?ups?|mixers?|bonfires?|fire circles?|drum circles?|open mic)\b/,
  'Workshops & trainings': /\b(workshops?|trainings?|teacher training|certifications?|courses?|masterclass|ytt)\b/,
  'Retreats': /\b(retreats?|residenc\w*|residential|(four|five|six|seven|eight|nine|ten|[4-9]|[1-9]\d)[- ]day)\b/,
  'Kids & family': /\b(kids?|children|families|parents?|all ages|ages \d+|toddlers?|teens?|family (day|workshop|yoga|friendly))\b/,
  'Nature & adventure': /\b(hikes?|hiking|trails?|surf\w*|swim\w*|ocean|jungle|rivers?|riverbanks?|waterfalls?|snorkel\w*|kayak\w*|paddle\w*|plant walk|nature|outdoors?|permaculture|garden\w*)\b/,
  'Art & creativity': /\b(art|arts|artist\w*|paint\w*|pottery|ceramic\w*|clay|craft\w*|drawing|creativ\w*|writing|drama|theatre|theater|photograph\w*)\b/,
}

/** Lower-case text with "sound healing" read as sound, not general healing. */
const prep = (s: string) => ` ${s.toLowerCase().replace(/’/g, "'").replace(/sound[ -]heal\w*/g, 'sound bath').replace(/singing bowls?/g, 'sound bowls').replace(/\bthe art of\b/g, 'the way of')} `

/** Every filter a piece of text speaks to. */
export function categoriesIn(text: string): string[] {
  const t = prep(text)
  return CATEGORIES.map((c) => c.label).filter((l) => KEYWORDS[l]?.test(t))
}

type Sortable = { tags?: string[]; practices?: string[]; format?: string; title?: string; description?: string }
const cache = new WeakMap<object, Set<string>>()

/** The filters an event or experience belongs to: its tags, practices and format, plus what its title and description say. */
export function categoriesOf(e: Sortable): Set<string> {
  const hit = cache.get(e)
  if (hit) return hit
  const out = new Set<string>()
  for (const c of CATEGORIES) {
    if ((e.tags ?? []).some((t) => c.tags.includes(t)) || (e.practices ?? []).some((p) => c.practices?.includes(p))
      || (!!e.format && !!c.formats?.includes(e.format))) out.add(c.label)
  }
  for (const l of categoriesIn(`${e.title ?? ''}. ${e.description ?? ''}`)) out.add(l)
  cache.set(e, out)
  return out
}

/** Does a community event or experience belong under this filter? */
export function inCategory(e: Sortable, label: string) {
  if (!CATEGORIES.some((x) => x.label === label)) return true
  return categoriesOf(e).has(label)
}

/** Events that repeat (a weekly sound bath) show once in rails and lists of picks: the next one. */
export function nextOfEach<T extends { title: string; start_date: string | null }>(list: T[]): T[] {
  const seen = new Set<string>()
  return list.filter((e) => { const k = e.title.trim().toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
}

/** How long an event runs, in the words of "Your way of living" (how they'd like to take part). */
function lengthFits(e: CommunityEvent, lifestyle: string[]): string {
  if (!e.start_date) return ''
  const days = Math.round((new Date((e.end_date || e.start_date) + 'T12:00:00').getTime() - new Date(e.start_date + 'T12:00:00').getTime()) / 86400000) + 1
  if (days === 1 && lifestyle.some((l) => l === 'A class or session' || l === 'Weekly or monthly sessions')) return 'A class or session'
  if (days >= 2 && days <= 4 && lifestyle.includes('A weekend')) return 'A weekend'
  if (days >= 5 && lifestyle.some((l) => ['1–3 weeks', 'A month or more', 'A season'].includes(l))) return 'A longer stay'
  return ''
}

/**
 * Xanadu's match between a seeker and the events on. Led by their way of living (how they'd like to take part:
 * a class, a weekend, a longer stay), together with their practices, their own words and the keywords picked up
 * from them, read through the same types as the events.
 * Returns upcoming events that fit, best fit first, with why ("Yoga, A weekend").
 */
export function matchEvents(events: CommunityEvent[], seeker: { lifestyle?: string[]; prefs?: string[]; seeking?: string; keywords?: string[] }) {
  const lifestyle = seeker.lifestyle ?? []
  const wants = new Set(categoriesIn([...(seeker.prefs ?? []), seeker.seeking ?? '', ...(seeker.keywords ?? [])].join('. ')))
  if (!wants.size && !lifestyle.length) return { wants: [] as string[], picks: [] as { e: CommunityEvent; shared: string[] }[] }
  const picks = events
    .map((e) => {
      const types = [...categoriesOf(e)].filter((l) => wants.has(l))
      const length = lengthFits(e, lifestyle)
      // with practices chosen, a type must match; the way of living then lifts what fits how they take part
      const ok = wants.size ? types.length > 0 : !!length
      return { e, ok, score: types.length * 2 + (length ? 1 : 0), shared: [...types, ...(length ? [length] : [])] }
    })
    .filter((x) => x.ok)
    .sort((a, b) => b.score - a.score || (a.e.start_date ?? '').localeCompare(b.e.start_date ?? ''))
  const seen = new Set<string>()
  return {
    wants: [...wants],
    picks: picks.filter(({ e }) => { const k = e.title.trim().toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
      .map(({ e, shared }) => ({ e, shared })),
  }
}

/** Events I said I'm going to: what's ahead, and what's happened (newest first). */
export function useMyGoing() {
  const { session } = useAuth()
  const [state, setState] = useState<{ upcoming: CommunityEvent[]; past: CommunityEvent[]; loading: boolean }>({ upcoming: [], past: [], loading: true })
  useEffect(() => {
    if (!session) return
    let live = true
    supabase.from('event_going').select('event_id, community_events(*)').eq('user_id', session.user.id).then(({ data }) => {
      if (!live) return
      const today = todayIso()
      const evs = ((data as unknown as { community_events: CommunityEvent | null }[] | null) ?? [])
        .map((g) => g.community_events).filter((e): e is CommunityEvent => !!e && !!e.start_date)
      setState({
        upcoming: evs.filter((e) => (e.end_date || e.start_date)! >= today).sort((a, b) => a.start_date!.localeCompare(b.start_date!)),
        past: evs.filter((e) => (e.end_date || e.start_date)! < today).sort((a, b) => b.start_date!.localeCompare(a.start_date!)),
        loading: false,
      })
    })
    return () => { live = false }
  }, [session])
  return state
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
