import { EmptyState, PageTitle } from '../ui'

/** Sections that are planned but not built yet. Each says what it will do. */
const PLANNED: Record<string, { title: string; body: string }> = {
  applications: { title: 'Applications', body: 'Review Containers and Facilitators here: everything they submitted in one drawer, then Approve, Ask for changes or Decline with a ready-made message. Until then, approve in Supabase as before.' },
  offerings: { title: 'Offerings', body: 'Retreats, trainings and drop-ins waiting for review. Approve to go live, or ask the host for changes with a note.' },
  inbox: { title: 'Inbox', body: "Every member's thread with the team, unanswered first, with spot requests flagged. Replies arrive live in their app." },
  members: { title: 'Members', body: 'One directory of Seekers, Containers and Facilitators, with each person’s profile, messages and history.' },
  spaces: { title: 'Spaces', body: 'Every retreat space as a card, with location, Life here, volunteer exchange and live offerings.' },
  safety: { title: 'Safety', body: 'Community reports, with both profiles side by side and actions to dismiss, warn, or remove someone from Community.' },
}

export default function Soon({ section }: { section: keyof typeof PLANNED }) {
  const p = PLANNED[section]
  return (
    <div className="xa-page">
      <PageTitle title={p.title} />
      <EmptyState title="Coming next" body={p.body} />
    </div>
  )
}
