import { useCallback, useEffect, useState } from 'react'
import { supabase, PHOTO_BUCKET, friendlyError } from './lib/supabase'
import { useAuth, type Training } from './auth'
import { refreshMatches } from './matching'

/**
 * Data hooks backed by Supabase. Every save returns null on success, or a friendly error message.
 * Photos chosen on the phone arrive as data URLs; they're uploaded to storage on save
 * and replaced with their public web address.
 */

export type { Training }
export type Reference = { name: string; contact: string }

export type SeekerProfile = { name: string; photo: string; region: string; prefs: string[]; notify: boolean; seeking: string }

export type SpaceProfile = {
  id: string; name: string; town: string; about: string; practices: string[]; photos: string[]
  sleeps: string; rooms: string; mats: string; kitchen: string; gettingHere: string
  volunteerExchange: boolean; volunteerDetails: string
}

export type FacilitatorProfile = {
  name: string; photo: string; town: string; practices: string[]; languages: string; about: string
  trainings: Training[]; references: Reference[]; insurance: string
}

export type Offering = {
  id: string
  title: string
  format: 'Retreat' | 'Training' | 'Drop-in'
  practices: string[]
  description: string
  start_date: string | null
  end_date: string | null
  spots: number
  price_usd: number | null
  included: Record<string, boolean>
  schedule: Record<string, string[]>
  status: 'draft' | 'in_review' | 'live' | 'declined'
  created_at: string
}

export type Message = { id: string; from_team: boolean; body: string; created_at: string }

export const EMPTY_SPACE: SpaceProfile = { id: '', name: '', town: '', about: '', practices: [], photos: [], sleeps: '', rooms: '', mats: '', kitchen: '', gettingHere: '', volunteerExchange: false, volunteerDetails: '' }

/* ---------- photos ---------- */

/** Shrinks a chosen photo (max 1000px, JPEG) so it uploads fast, and returns it as a data URL for preview. */
export function photoFromFile(file: File, max = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as a photo.')) }
    img.src = url
  })
}

/** Uploads any new (data URL) photos to the member's own folder and returns web addresses for all of them. */
export async function uploadPhotos(userId: string, photos: string[]): Promise<string[]> {
  return Promise.all(photos.map(async (p) => {
    if (!p.startsWith('data:')) return p
    const blob = await (await fetch(p)).blob()
    const path = `${userId}/${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
    if (error) throw new Error('A photo could not be uploaded. Please try again.')
    return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
  }))
}

/* ---------- seeker ---------- */

export function useSeekerProfile() {
  const { session, profile, updateProfile } = useAuth()
  const value: SeekerProfile = {
    name: profile?.name ?? '', photo: profile?.photo_url ?? '', region: profile?.region || 'Costa Rica',
    prefs: profile?.prefs ?? [], notify: profile?.notify ?? true, seeking: profile?.seeking ?? '',
  }
  const save = useCallback(async (next: SeekerProfile): Promise<string | null> => {
    if (!session) return 'You are signed out. Please sign in again.'
    try {
      const [photo] = await uploadPhotos(session.user.id, next.photo ? [next.photo] : [])
      const err = await updateProfile({ name: next.name.trim(), photo_url: photo ?? '', region: next.region.trim() || 'Costa Rica', prefs: next.prefs, notify: next.notify, seeking: next.seeking.trim().slice(0, 2000) })
      if (err) return friendlyError(err)
      refreshMatches()
      return null
    } catch (e) { return (e as Error).message }
  }, [session, updateProfile])
  return [value, save] as const
}

/* ---------- container space ---------- */

type SpaceRow = { id: string; name: string; town: string; about: string; practices: string[]; photos: string[]; sleeps: string; rooms: string; mats: string; kitchen: string; getting_here: string; volunteer_exchange: boolean; volunteer_details: string }
const fromSpaceRow = (r: SpaceRow): SpaceProfile => ({ ...r, gettingHere: r.getting_here, volunteerExchange: r.volunteer_exchange, volunteerDetails: r.volunteer_details })

export function useSpaceProfile() {
  const { session } = useAuth()
  const [space, setSpace] = useState<SpaceProfile>(EMPTY_SPACE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    let live = true
    supabase.from('spaces').select('*').eq('owner_id', session.user.id).maybeSingle().then(({ data }) => {
      if (!live) return
      if (data) setSpace(fromSpaceRow(data as SpaceRow))
      setLoading(false)
    })
    return () => { live = false }
  }, [session])

  const save = useCallback(async (next: SpaceProfile): Promise<string | null> => {
    if (!session) return 'You are signed out. Please sign in again.'
    try {
      const photos = await uploadPhotos(session.user.id, next.photos)
      const row = {
        owner_id: session.user.id, name: next.name.trim(), town: next.town.trim(), about: next.about.trim(), practices: next.practices,
        photos, sleeps: next.sleeps.trim(), rooms: next.rooms.trim(), mats: next.mats.trim(), kitchen: next.kitchen.trim(), getting_here: next.gettingHere.trim(),
        volunteer_exchange: next.volunteerExchange, volunteer_details: next.volunteerDetails.trim(),
      }
      const { data, error } = await supabase.from('spaces').upsert(row, { onConflict: 'owner_id' }).select('*').single()
      if (error) return friendlyError(error.message)
      setSpace(fromSpaceRow(data as SpaceRow))
      refreshMatches()
      return null
    } catch (e) { return (e as Error).message }
  }, [session])

  return [space, save, loading] as const
}

/* ---------- facilitator ---------- */

export function useFacilitatorProfile() {
  const { session, profile, updateProfile } = useAuth()
  const [priv, setPriv] = useState<{ references: Reference[]; insurance: string }>({ references: [], insurance: '' })

  useEffect(() => {
    if (!session) return
    let live = true
    supabase.from('private_details').select('references_list, insurance').eq('user_id', session.user.id).maybeSingle().then(({ data }) => {
      if (live && data) setPriv({ references: (data.references_list as Reference[]) ?? [], insurance: data.insurance ?? '' })
    })
    return () => { live = false }
  }, [session])

  const value: FacilitatorProfile = {
    name: profile?.name ?? '', photo: profile?.photo_url ?? '', town: profile?.town ?? '', practices: profile?.practices ?? [],
    languages: profile?.languages ?? '', about: profile?.about ?? '', trainings: profile?.trainings ?? [],
    references: priv.references, insurance: priv.insurance,
  }

  const save = useCallback(async (next: FacilitatorProfile): Promise<string | null> => {
    if (!session) return 'You are signed out. Please sign in again.'
    try {
      const [photo] = await uploadPhotos(session.user.id, next.photo ? [next.photo] : [])
      const err = await updateProfile({
        name: next.name.trim(), photo_url: photo ?? '', town: next.town.trim(), practices: next.practices,
        languages: next.languages.trim(), about: next.about.trim(), trainings: next.trainings,
      })
      if (err) return friendlyError(err)
      const { error } = await supabase.from('private_details').upsert({ user_id: session.user.id, references_list: next.references, insurance: next.insurance.trim() }, { onConflict: 'user_id' })
      if (error) return friendlyError(error.message)
      setPriv({ references: next.references, insurance: next.insurance.trim() })
      return null
    } catch (e) { return (e as Error).message }
  }, [session, updateProfile])

  return [value, save] as const
}

/* ---------- private application details (hosts) ---------- */

export async function savePrivateDetails(userId: string, patch: { proof?: string; phone?: string; agreed_guidelines?: boolean; references_list?: Reference[]; insurance?: string }) {
  const { error } = await supabase.from('private_details').upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
  return error ? friendlyError(error.message) : null
}

/* ---------- offerings ---------- */

export function useOfferings() {
  const { session } = useAuth()
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!session) return
    const { data } = await supabase.from('offerings').select('*').eq('owner_id', session.user.id).order('created_at', { ascending: false })
    setOfferings((data as Offering[]) ?? [])
    setLoading(false)
  }, [session])

  useEffect(() => { reload() }, [reload])

  const create = useCallback(async (o: Omit<Offering, 'id' | 'status' | 'created_at' | 'schedule'>): Promise<{ id?: string; error?: string }> => {
    if (!session) return { error: 'You are signed out. Please sign in again.' }
    const { data, error } = await supabase.from('offerings').insert({ ...o, owner_id: session.user.id }).select('id').single()
    if (error) return { error: friendlyError(error.message) }
    await reload()
    refreshMatches()
    return { id: data.id as string }
  }, [session, reload])

  const update = useCallback(async (id: string, patch: Partial<Offering>): Promise<string | null> => {
    const { error } = await supabase.from('offerings').update(patch).eq('id', id)
    if (error) return friendlyError(error.message)
    await reload()
    if ('title' in patch || 'description' in patch || 'practices' in patch || 'format' in patch) refreshMatches()
    return null
  }, [reload])

  return { offerings, loading, create, update, reload }
}

/* ---------- inbox (thread with the Xanadu team) ---------- */

export function useMessages() {
  const { session } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    let live = true
    supabase.from('messages').select('id, from_team, body, created_at').eq('user_id', session.user.id).order('created_at').then(({ data }) => {
      if (live) { setMessages((data as Message[]) ?? []); setLoading(false) }
    })
    // replies from the Xanadu team arrive live
    const channel = supabase.channel(`inbox-${session.user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${session.user.id}` }, (payload) => {
        const m = payload.new as Message
        setMessages((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, { id: m.id, from_team: m.from_team, body: m.body, created_at: m.created_at }]))
      })
      .subscribe()
    return () => { live = false; supabase.removeChannel(channel) }
  }, [session])

  const send = useCallback(async (body: string): Promise<string | null> => {
    if (!session) return 'You are signed out. Please sign in again.'
    const { data, error } = await supabase.from('messages').insert({ user_id: session.user.id, body }).select('id, from_team, body, created_at').single()
    if (error) return friendlyError(error.message)
    setMessages((m) => (m.some((x) => x.id === (data as Message).id) ? m : [...m, data as Message]))
    return null
  }, [session])

  return { messages, loading, send }
}

/* ---------- what Seekers and Facilitators can browse ---------- */

/** A space as members see it (approved hosts only, enforced by the database). */
export type PublicSpace = {
  id: string; owner_id: string; name: string; town: string; about: string; practices: string[]; photos: string[]
  sleeps: string; kitchen: string; volunteer_exchange: boolean
}

/** A live offering plus the space that hosts it (when that space is approved). */
export type Listing = Offering & { owner_id: string; space: PublicSpace | null }

const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

/** Live offerings that haven't ended yet, soonest first, each with its host space. */
export async function fetchListings(filter?: { ids?: string[]; ownerId?: string; includePast?: boolean }): Promise<Listing[]> {
  let q = supabase.from('offerings').select('*').eq('status', 'live')
  if (filter?.ids) q = q.in('id', filter.ids.length ? filter.ids : ['00000000-0000-0000-0000-000000000000'])
  if (filter?.ownerId) q = q.eq('owner_id', filter.ownerId)
  const { data } = await q.order('start_date', { ascending: true, nullsFirst: false })
  const today = todayIso()
  const rows = ((data as (Offering & { owner_id: string })[]) ?? [])
    .filter((o) => filter?.includePast || !(o.end_date || o.start_date) || (o.end_date || o.start_date)! >= today)
  const owners = Array.from(new Set(rows.map((o) => o.owner_id)))
  const spaces = owners.length ? ((await supabase.from('spaces').select('*').in('owner_id', owners)).data as PublicSpace[] | null) ?? [] : []
  return rows.map((o) => ({ ...o, space: spaces.find((s) => s.owner_id === o.owner_id) ?? null }))
}

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let live = true
    fetchListings().then((l) => { if (live) { setListings(l); setLoading(false) } })
    return () => { live = false }
  }, [])
  return { listings, loading }
}

/** Approved retreat spaces (the database only returns spaces whose host has been welcomed). */
export function useSpaces() {
  const { session } = useAuth()
  const [spaces, setSpaces] = useState<PublicSpace[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let live = true
    supabase.from('spaces').select('*').neq('owner_id', session?.user.id ?? '').order('updated_at', { ascending: false }).then(({ data }) => {
      if (live) { setSpaces(((data as PublicSpace[]) ?? []).filter((s) => s.name.trim())); setLoading(false) }
    })
    return () => { live = false }
  }, [session])
  return { spaces, loading }
}

/* ---------- saved (hearts) ---------- */

export type SavedKind = 'offering' | 'space' | 'facilitator'

/** The member's hearts. toggle() saves or un-saves straight away. */
export function useSaved() {
  const { session } = useAuth()
  const [saved, setSaved] = useState<{ kind: SavedKind; ref_id: string }[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!session) return
    let live = true
    supabase.from('saved_items').select('kind, ref_id').eq('user_id', session.user.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (live) { setSaved((data as { kind: SavedKind; ref_id: string }[]) ?? []); setLoading(false) }
    })
    return () => { live = false }
  }, [session])

  const isSaved = useCallback((kind: SavedKind, id: string) => saved.some((s) => s.kind === kind && s.ref_id === id), [saved])

  const toggle = useCallback(async (kind: SavedKind, id: string): Promise<string | null> => {
    if (!session) return 'You are signed out. Please sign in again.'
    const was = saved.some((s) => s.kind === kind && s.ref_id === id)
    setSaved((xs) => (was ? xs.filter((s) => !(s.kind === kind && s.ref_id === id)) : [{ kind, ref_id: id }, ...xs]))
    const { error } = was
      ? await supabase.from('saved_items').delete().eq('user_id', session.user.id).eq('kind', kind).eq('ref_id', id)
      : await supabase.from('saved_items').insert({ user_id: session.user.id, kind, ref_id: id })
    if (error && error.code !== '23505') {
      setSaved((xs) => (was ? [{ kind, ref_id: id }, ...xs] : xs.filter((s) => !(s.kind === kind && s.ref_id === id))))
      return friendlyError(error.message)
    }
    return null
  }, [session, saved])

  return { saved, loading, isSaved, toggle }
}
