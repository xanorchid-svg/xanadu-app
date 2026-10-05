import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Checklist, ContainerTabs, EmptyState, H2, Page, PrimaryLink, Screen } from '../../components/ui'
import { IconPeople } from '../../components/icons'

const SETUP = [
  { id: 'account', title: 'Create your account', sub: 'Done when you were accepted', to: '/container' },
  { id: 'photos', title: 'Add photos of your space', sub: 'At least 5, including the main practice area', to: '/container/space' },
  { id: 'about', title: 'Describe your space', sub: 'The land, the spirit of the place, what you host', to: '/container/space' },
  { id: 'details', title: 'Add the practical details', sub: 'Beds, practice space, kitchen, distance to the beach', to: '/container/space' },
  { id: 'offering', title: 'Create your first offering', sub: 'A retreat, training or drop-in', to: '/container/new' },
]

export default function ContainerHome() {
  const [done, setDone] = useState<string[]>(['account'])
  const toggle = (id: string) => setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))

  return (
    <Screen footer={<ContainerTabs />}>
      <Page>
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-subtle">Welcome</span>
            <h1 className="m-0 font-display text-[32px] font-medium text-ink">[Your space name]</h1>
            <div className="mt-1"><Badge>Founding Container</Badge></div>
          </div>
          <Link to="/container/space" aria-label="Your space profile" className="flex h-12 w-12 flex-none items-center justify-center rounded-[14px] border border-dashed border-slate text-xl text-subtle no-underline">+</Link>
        </div>

        <Checklist title="Set up your space" items={SETUP} done={done} onToggle={toggle} />

        <section className="flex flex-col gap-3">
          <H2>Your offerings</H2>
          <EmptyState title="No offerings yet" action={<PrimaryLink to="/container/new" className="mt-1 min-h-[46px] text-sm">Create your first offering</PrimaryLink>}>
            Create a retreat, training or drop-in. Guests, schedules, meals and outings will all live here.
          </EmptyState>
        </section>

        <section className="flex items-center gap-3.5 rounded-[18px] border border-line-2 p-4">
          <IconPeople size={28} className="flex-none text-gold-soft" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold text-ink">Facilitator matches</span>
            <span className="text-[13px] leading-snug text-subtle">As facilitators join, we'll introduce you to those aligned with your space.</span>
          </div>
        </section>
      </Page>
    </Screen>
  )
}
