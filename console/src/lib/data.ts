import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

/* ---------- Shapes returned by the team_* database functions ---------- */

export type Role = 'seeker' | 'container' | 'facilitator'
export type Training = { title: string; school: string; year: string }
export type Reference = { name: string; contact: string }

export type SpaceForm = {
  id: string; name: string; country: string | null; region: string | null; town: string | null; about: string | null
  practices: string[] | null; lifestyle: string[] | null; photos: string[] | null
  sleeps: string | null; rooms: string | null; mats: string | null; kitchen: string | null; getting_here: string | null
  volunteer_exchange: boolean | null; volunteer_details: string | null
}

export type Application = {
  /** one row per member per role they applied for: key = `${id}:${role}` */
  key: string; fast_track: boolean; other_status: 'pending' | 'approved' | 'declined' | null
  /** a Facilitator invited this venue by email before it applied */
  referred_by?: { name: string | null; id: string; facilitator_approved: boolean; venue: string; at: string } | null
  id: string; role: 'container' | 'facilitator'; status: 'pending' | 'approved' | 'declined' | 'active'; onboarded: boolean
  name: string | null; email: string | null; photo_url: string | null; town: string | null; region: string | null
  practices: string[] | null; about: string | null; languages: string | null; trainings: Training[] | null
  lifestyle: string[] | null; heard_from: string | null; created_at: string; submitted: string | null; last_sign_in_at: string | null
  phone: string | null; proof: string | null; references_list: Reference[] | null; insurance: string | null; agreed_guidelines: boolean
  space: SpaceForm | null; offerings: number; last_message: { at: string; from_team: boolean } | null
}

export type Offering = {
  id: string; owner_id: string; title: string; format: string; practices: string[] | null; description: string | null
  start_date: string | null; end_date: string | null; spots: number | null; price_usd: number | null
  included: Record<string, boolean> | null; schedule: Record<string, string[]> | null
  status: 'draft' | 'in_review' | 'live' | 'declined'; created_at: string; updated_at: string
  host_name: string | null; host_status: string; host_email: string | null; host_photo: string | null
  space_name: string | null; space_country: string | null; space_region: string | null; space_town: string | null; cover: string | null
  created_as?: 'container' | 'facilitator'; facilitator_name?: string | null; venue_name?: string; venue_place?: string
}

export type Thread = {
  id: string; name: string | null; role: Role; status: string; photo_url: string | null; email: string | null
  last_body: string; last_at: string; last_from_team: boolean; awaiting: boolean; from_member: number; has_request: boolean
}
export type Msg = { id: string; user_id?: string; from_team: boolean; body: string; created_at: string }

export type Space = SpaceForm & {
  owner_id: string; created_at: string; owner_status: string; owner_name: string | null; owner_email: string | null; live_offerings: number
}

export type Person = { id: string; name: string | null; role: Role; photo_url: string | null; email: string | null; town: string | null; region: string | null }
export type Report = {
  id: string; reason: string | null; created_at: string; blocked: boolean
  context: 'community' | 'message' | 'space' | 'offering' | 'profile'; context_label: string | null
  reporter: Person
  reported: Person & { status: string; community_visible: boolean; community_removed: boolean; reports_against: number; space_name: string | null }
  resolved: { action: string; note: string | null; at: string } | null
}

export type Template = { key: string; label: string; body: string }

/* ---------- Helpers ---------- */

export const ROLE_LABEL: Record<Role, string> = { seeker: 'Seeker', container: 'Container', facilitator: 'Facilitator' }

/** Each landscape's own colour, as in the app */
export const LANDSCAPE: Record<string, string> = {
  Beach: '#E6CDA6', Ocean: '#7FB3C2', Jungle: '#86A06A', Mountains: '#8C95C9', Desert: '#D9A67E',
  Forest: '#6E9A7E', Countryside: '#B7B470', Town: '#C8A0C4', City: '#A58BD6',
}

export const place = (...p: (string | null | undefined)[]) => p.filter((x) => x && x.trim()).join(', ')
export const day = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—')
export const when = (d: string) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
export const ago = (d: string) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const dd = Math.round(h / 24)
  return dd < 30 ? `${dd}d ago` : day(d)
}
export const dateOnly = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '')
export const dateRange = (a: string | null, b: string | null) => (a && b && a !== b ? `${dateOnly(a)} – ${dateOnly(b)}` : dateOnly(a) || dateOnly(b) || 'No dates yet')
export const money = (n: number | null) => (n == null ? 'No price' : n === 0 ? 'Free' : `$${Number(n).toLocaleString()}`)
export const action = (a: string) => a.replace(/_/g, ' ')

/** Replaces {name}, {space}, {title}… in a template. Unknown placeholders stay, so they're easy to spot and edit. */
export function fill(body: string, vars: Record<string, string | null | undefined>) {
  return body.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ? String(vars[k]) : m))
}
export const firstName = (n: string | null | undefined) => (n ?? '').trim().split(/\s+/)[0] || 'there'

/** Loads one team_* function that returns JSON, with a reload. */
export function useTeamQuery<T>(fn: string, args?: Record<string, unknown>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const key = JSON.stringify(args ?? {})
  const reload = useCallback(async () => {
    const { data, error } = await supabase.rpc(fn, args)
    if (error) setError("Couldn't load this. Refresh to try again.")
    else { setError(null); setData(data as T) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, key])
  useEffect(() => { reload() }, [reload])
  return { data, error, reload, setData }
}

let templateCache: Template[] | null = null
export function useTemplates() {
  const [list, setList] = useState<Template[]>(templateCache ?? [])
  const reload = useCallback(async () => {
    const { data } = await supabase.from('team_templates').select('key, label, body').order('key')
    templateCache = (data as Template[]) ?? []
    setList(templateCache)
  }, [])
  useEffect(() => { if (!templateCache) reload() }, [reload])
  const get = (key: string) => list.find((t) => t.key === key)?.body ?? ''
  return { list, get, reload }
}
