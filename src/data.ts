/**
 * Shared constants. Live data (spaces, offerings, saved items) comes from Supabase via src/store.ts.
 */

/** What a Seeker can say they're seeking (sign-up and profile). */
export const SEEKER_ALIGN = ['Yoga', 'Breathwork', 'Meditation', 'Sound', 'Ecstatic dance', 'Kirtan', 'Trainings', "Women's retreats", "Men's retreats", 'Permaculture', 'Plant medicine', 'Residencies', 'Recovery programs']

/**
 * Way of living. Seekers say how they want to live; spaces say what they offer.
 * The same words are stored on both sides (profiles.lifestyle, spaces.lifestyle) so matching can pair them up.
 */
export const STAYS = ['A weekend', 'A week or two', 'A month or more', 'A season', 'To live there'] as const
export const WORK_STYLES = ['Work remotely', 'Volunteer exchange', 'Just be, no work'] as const
export const LANDSCAPES = ['Beach', 'Ocean', 'Jungle', 'Mountains', 'Desert', 'Forest', 'Countryside', 'Town', 'City'] as const

/** Each landscape picks up one colour from the logo's iridescence. */
export const LANDSCAPE_HUE: Record<string, string> = {
  Beach: '#E6CDA6', Ocean: '#7FB3C2', Jungle: '#86A06A', Mountains: '#8C95C9', Desert: '#D9A67E',
  Forest: '#6E9A7E', Countryside: '#B7B470', Town: '#C8A0C4', City: '#A58BD6',
}

export type Role = 'Seeker' | 'Container' | 'Facilitator'

export const PRACTICES = [
  'Yoga', 'Breathwork', 'Meditation', 'Sound', 'Ecstatic dance', 'Kirtan', 'Trainings', "Women's", "Men's",
  'Plant medicine', 'Residencies', 'Recovery programs',
] as const

/**
 * Destinations hosts choose from (they can also type another country).
 * Regions are suggestions for the state, province or island field; hosts can type any.
 */
export const DESTINATIONS: { country: string; regions: string[] }[] = [
  { country: 'Costa Rica', regions: ['Guanacaste', 'Puntarenas', 'Limón', 'San José'] },
  { country: 'United States', regions: ['California', 'Colorado', 'Hawaii', 'New Mexico'] },
  { country: 'Indonesia', regions: ['Bali'] },
  { country: 'Peru', regions: ['Sacred Valley', 'Cusco', 'Lima'] },
  { country: 'Argentina', regions: ['Buenos Aires', 'Patagonia', 'Mendoza'] },
  { country: 'Portugal', regions: ['Lisbon', 'Algarve', 'Sintra', 'Madeira'] },
  { country: 'Mexico', regions: ['Oaxaca', 'Tulum', 'Baja California Sur'] },
]

/** "Ubud, Bali, Indonesia" · "Boulder, Colorado" (US states stand on their own) · "Nosara, Costa Rica" */
export function placeLabel(p: { town?: string; region?: string; country?: string }) {
  const town = p.town?.trim(), region = p.region?.trim(), country = p.country?.trim()
  const parts = [town, region, region && country === 'United States' ? '' : country].filter(Boolean) as string[]
  return parts.filter((x, i) => parts.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i).join(', ')
}

export const CONTACT_EMAIL = 'networkxanadu@gmail.com'

export const ROLE_HOME: Record<Role, string> = {
  Seeker: '/discover',
  Container: '/container',
  Facilitator: '/facilitator',
}
