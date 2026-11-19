import { useCallback, useEffect, useState } from 'react'
import { friendlyError, supabase } from './lib/supabase'
import { useAuth } from './auth'

/**
 * Sessions: one-on-one services approved Facilitators offer — a massage, a reading, coaching,
 * a private class, a private chef for a retreat. Not on the Calendar. Seekers (and hosts planning
 * retreats) find them under Sessions and tap "I'm interested"; the Facilitator is told.
 */

export const SERVICE_CATEGORIES: { label: string; blurb: string; kinds: string[] }[] = [
  { label: 'Bodywork', blurb: 'Massage, chiropractic, acupuncture and more',
    kinds: ['Massage', 'Deep tissue', 'Thai massage', 'Craniosacral', 'Lymphatic drainage', 'Myofascial release', 'Chiropractic', 'Osteopathy', 'Acupuncture', 'Physiotherapy'] },
  { label: 'Energy & sound', blurb: 'Reiki, private sound healing, energy work',
    kinds: ['Reiki', 'Sound healing', 'Energy healing', 'Private breathwork'] },
  { label: 'Inner work', blurb: 'Coaching, therapy, constellations, somatic work',
    kinds: ['Coaching', 'Therapy & counseling', 'Family constellations', 'Somatic therapy', 'Shadow work', 'Hypnotherapy'] },
  { label: 'Guidance', blurb: 'Astrology, human design, akashic records',
    kinds: ['Astrology', 'Human design', 'Akashic records', 'Tarot', 'Numerology'] },
  { label: 'Private classes', blurb: 'Private yoga, surf, aerial, Spanish, music',
    kinds: ['Private yoga', 'Pilates', 'Surf lessons', 'Aerial & acro', 'Martial arts', 'Spanish', 'Music lessons'] },
  { label: "Women's health", blurb: 'Doulas, birth and postpartum support',
    kinds: ['Doula', 'Birth support', 'Postpartum care', 'Womb healing', 'Fertility support'] },
  { label: 'Retreat support', blurb: 'Private chefs, photo & video, transport',
    kinds: ['Private chef', 'Catering', 'Photo & video', 'Transport & transfers', 'Retreat assistant', 'Space holding'] },
]
export const WHERE_OPTIONS = ['At my space', 'I come to you', 'Online'] as const

export type Service = {
  id: string; owner_id: string; category: string; kinds: string[]
  title: string; description: string; duration: string; price_note: string; where_options: string[]
  town: string; contact: string; link: string; photo_url: string
  status: 'live' | 'paused' | 'removed'; created_at: string; updated_at: string
}
export type ServiceDraft = Omit<Service, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
export const EMPTY_SERVICE: ServiceDraft = {
  category: '', kinds: [], title: '', description: '', duration: '', price_note: '', where_options: [],
  town: '', contact: '', link: '', photo_url: '', status: 'live',
}
export type Provider = { id: string; name: string; photo_url: string; town: string; about: string; reviews?: number; rating?: number | null }

const COLS = 'id, owner_id, category, kinds, title, description, duration, price_note, where_options, town, contact, link, photo_url, status, created_at, updated_at'

/** "Massage deep tissue Nosara …" — what a search reads. */
export const serviceText = (s: Service, p?: Provider) =>
  `${s.title} ${s.category} ${s.kinds.join(' ')} ${s.description} ${s.town} ${p?.name ?? ''}`.toLowerCase()

/** Every live service, with who offers it. */
export function useServices() {
  const { session } = useAuth()
  const [state, setState] = useState<{ services: Service[]; providers: Record<string, Provider>; loading: boolean }>({ services: [], providers: {}, loading: true })
  useEffect(() => {
    if (!session) return
    let live = true
    ;(async () => {
      const { data } = await supabase.from('services').select(COLS).eq('status', 'live').order('updated_at', { ascending: false }).limit(300)
      const services = (data as Service[] | null) ?? []
      const ids = [...new Set(services.map((s) => s.owner_id))]
      const [{ data: ps }, { data: trust }] = ids.length
        ? await Promise.all([supabase.from('profiles').select('id, name, photo_url, town, about').in('id', ids), supabase.rpc('facilitator_trust', { p_ids: ids })])
        : [{ data: [] }, { data: {} }]
      if (!live) return
      const t = (trust ?? {}) as Record<string, { count: number; average: number | null }>
      const providers = Object.fromEntries(((ps as Provider[] | null) ?? []).map((p) => [p.id, { ...p, reviews: t[p.id]?.count ?? 0, rating: t[p.id]?.average ?? null }]))
      // most trusted first: well-reviewed practitioners, then more reviews, then the newest
      const score = (s: Service) => { const p = providers[s.owner_id]; return (p?.reviews ? 1000 : 0) + (p?.rating ?? 0) * 100 + Math.min(p?.reviews ?? 0, 99) }
      setState({ services: services.filter((s) => providers[s.owner_id]).sort((a, b) => score(b) - score(a)), providers, loading: false })
    })()
    return () => { live = false }
  }, [session])
  return state
}

export async function fetchService(id: string): Promise<{ service: Service; provider: Provider | null } | null> {
  const { data } = await supabase.from('services').select(COLS).eq('id', id).maybeSingle()
  if (!data) return null
  const service = data as Service
  const { data: p } = await supabase.from('profiles').select('id, name, photo_url, town, about').eq('id', service.owner_id).maybeSingle()
  return { service, provider: (p as Provider | null) ?? null }
}

/** A Facilitator's own services, and who's interested in each. */
export function useMyServices() {
  const { session } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [interest, setInterest] = useState<{ service_id: string; name: string; photo_url: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    if (!session) return
    const [{ data }, { data: i }] = await Promise.all([
      supabase.from('services').select(COLS).eq('owner_id', session.user.id).order('created_at', { ascending: false }),
      supabase.rpc('my_service_interest'),
    ])
    setServices((data as Service[] | null) ?? [])
    setInterest((i as typeof interest | null) ?? [])
    setLoading(false)
  }, [session])
  useEffect(() => { reload() }, [reload])
  return { services, interest, loading, reload }
}

export async function saveService(userId: string, id: string | null, d: ServiceDraft): Promise<{ id?: string; error?: string }> {
  const row = {
    ...d, title: d.title.trim(), description: d.description.trim(), duration: d.duration.trim(), price_note: d.price_note.trim(),
    town: d.town.trim(), contact: d.contact.trim(), link: d.link.trim(),
  }
  const res = id
    ? await supabase.from('services').update(row).eq('id', id).select('id').single()
    : await supabase.from('services').insert({ ...row, owner_id: userId }).select('id').single()
  return res.error ? { error: friendlyError(res.error.message) } : { id: res.data.id as string }
}

export async function deleteService(id: string): Promise<string | null> {
  const { error } = await supabase.from('services').delete().eq('id', id)
  return error ? friendlyError(error.message) : null
}

/** How many are interested in a service, and whether I am; tapping toggles it. */
export function useServiceInterest(serviceId: string) {
  const { session } = useAuth()
  const [info, setInfo] = useState<{ count: number; me: boolean }>({ count: 0, me: false })
  const reload = useCallback(async () => {
    if (!session || !serviceId) return
    const { data } = await supabase.rpc('service_interest_info', { p_service: serviceId })
    if (data) setInfo(data as { count: number; me: boolean })
  }, [session, serviceId])
  useEffect(() => { reload() }, [reload])
  const toggle = async (): Promise<string | null> => {
    if (!session) return 'Please sign in again.'
    const { error } = info.me
      ? await supabase.from('service_interest').delete().eq('service_id', serviceId).eq('user_id', session.user.id)
      : await supabase.from('service_interest').insert({ service_id: serviceId, user_id: session.user.id })
    if (error) return friendlyError(error.message)
    await reload()
    return null
  }
  return { ...info, toggle }
}
