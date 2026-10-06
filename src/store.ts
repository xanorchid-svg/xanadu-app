import { useCallback, useEffect, useState } from 'react'
import { supabase, PHOTO_BUCKET, friendlyError } from './lib/supabase'
import { useAuth, type Training } from './auth'

/**
 * Data hooks backed by Supabase. Every save returns null on success, or a friendly error message.
 * Photos chosen on the phone arrive as data URLs; they're uploaded to storage on save
 * and replaced with their public web address.
 */

export type { Training }
export type Reference = { name: string; contact: string }

export type SeekerProfile = { name: string; photo: string; region: string; prefs: string[]; notify: boolean }

export type SpaceProfile = {
  name: string; town: string; about: string; practices: string[]; photos: string[]
  sleeps: string; rooms: string; mats: string; kitchen: string; gettingHere: string
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

export const EMPTY_SPACE: SpaceProfile = { name: '', town: '', about: '', practices: [], photos: [], sleeps: '', rooms: '', mats: '', kitchen: '', gettingHere: '' }

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
    prefs: profile?.prefs ?? [], notify: profile?.notify ?? true,
  }
  const save = useCallback(async (next: SeekerProfile): Promise<string | null> => {
    if (!session) return 'You are signed out. Please sign in again.'
    try {
      const [photo] = await uploadPhotos(session.user.id, next.photo ? [next.photo] : [])
      const err = await updateProfile({ name: next.name.trim(), photo_url: photo ?? '', region: next.region.trim() || 'Costa Rica', prefs: next.prefs, notify: next.notify })
      return err ? friendlyError(err) : null
    } catch (e) { return (e as Error).message }
  }, [session, updateProfile])
  return [value, save] as const
}

/* ---------- container space ---------- */

type SpaceRow = { name: string; town: string; about: string; practices: string[]; photos: string[]; sleeps: string; rooms: string; mats: string; kitchen: string; getting_here: string }
const fromSpaceRow = (r: SpaceRow): SpaceProfile => ({ ...r, gettingHere: r.getting_here })

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
      }
      const { data, error } = await supabase.from('spaces').upsert(row, { onConflict: 'owner_id' }).select('*').single()
      if (error) return friendlyError(error.message)
      setSpace(fromSpaceRow(data as SpaceRow))
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
    return { id: data.id as string }
  }, [session, reload])

  const update = useCallback(async (id: string, patch: Partial<Offering>): Promise<string | null> => {
    const { error } = await supabase.from('offerings').update(patch).eq('id', id)
    if (error) return friendlyError(error.message)
    await reload()
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
    return () => { live = false }
  }, [session])

  const send = useCallback(async (body: string): Promise<string | null> => {
    if (!session) return 'You are signed out. Please sign in again.'
    const { data, error } = await supabase.from('messages').insert({ user_id: session.user.id, body }).select('id, from_team, body, created_at').single()
    if (error) return friendlyError(error.message)
    setMessages((m) => [...m, data as Message])
    return null
  }, [session])

  return { messages, loading, send }
}
