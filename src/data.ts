/**
 * Xanadu data layer.
 * The platform launches empty: no spaces, facilitators or experiences until founding members join.
 * Screens read from these lists and show empty states while they're empty.
 * Next step: replace these with Supabase queries (see README).
 */

export type Role = 'Seeker' | 'Container' | 'Facilitator'

export type Experience = {
  id: string
  title: string
  practice: string
  format: 'Retreat' | 'Training' | 'Drop-in'
  town: string
  containerName: string
  facilitatorName?: string
  startDate: string // ISO date
  endDate: string
  spots: number
  priceUsd?: number
  verified?: boolean
}

export type Space = {
  id: string
  name: string
  town: string
  sleeps?: number
  verified?: boolean
}

export const experiences: Experience[] = []
export const spaces: Space[] = []

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
