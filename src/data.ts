/**
 * Shared constants. Live data (spaces, offerings, saved items) comes from Supabase via src/store.ts.
 */

/** What a Seeker can say they're seeking (sign-up and profile). */
export const SEEKER_ALIGN = ['Yoga', 'Breathwork', 'Meditation', 'Sound', 'Ecstatic dance', 'Kirtan', 'Trainings', 'Volunteer exchange', "Women's retreats", "Men's retreats", 'Permaculture']

export type Role = 'Seeker' | 'Container' | 'Facilitator'

export const PRACTICES = [
  'Yoga', 'Breathwork', 'Meditation', 'Sound', 'Ecstatic dance', 'Kirtan', 'Trainings', "Women's", "Men's",
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
