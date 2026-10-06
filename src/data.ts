/**
 * Shared constants. Live data (spaces, offerings, saved items) comes from Supabase via src/store.ts.
 */

/** What a Seeker can say they're seeking (sign-up and profile). */
export const SEEKER_ALIGN = ['Yoga', 'Breathwork', 'Meditation', 'Sound', 'Ecstatic dance', 'Kirtan', 'Trainings', 'Volunteer exchange', "Women's retreats", "Men's retreats", 'Permaculture']

export type Role = 'Seeker' | 'Container' | 'Facilitator'

export const PRACTICES = [
  'Yoga', 'Breathwork', 'Meditation', 'Sound', 'Ecstatic dance', 'Kirtan', 'Trainings', "Women's", "Men's",
] as const

export const REGIONS = ['All of Costa Rica', 'Nosara', 'Santa Teresa', 'Puerto Viejo', 'Uvita'] as const

export const CONTACT_EMAIL = 'networkxanadu@gmail.com'

export const ROLE_HOME: Record<Role, string> = {
  Seeker: '/discover',
  Container: '/container',
  Facilitator: '/facilitator',
}
