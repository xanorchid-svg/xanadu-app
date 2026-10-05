import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Checklist, EmptyState, FacilitatorTabs, H2, Page, Screen, Switch } from '../../components/ui'

const SETUP = [
  { id: 'account', title: 'Create your account', sub: 'Done when you were accepted', to: '/facilitator' },
  { id: 'photo', title: 'Add a profile photo', sub: 'A clear photo of you helps Seekers feel safe', to: '/facilitator/profile' },
  { id: 'about', title: 'Write your story', sub: 'How you came to this work and what people can expect', to: '/facilitator/profile' },
  { id: 'training', title: 'Add your training', sub: 'Certifications and where you trained', to: '/facilitator/profile' },
  { id: 'refs', title: 'Add references', sub: 'Shared privately with the Xanadu team', to: '/facilitator/profile' },
]

export default function FacilitatorHome() {
  const [open, setOpen] = useState(true)
  const [done, setDone] = useState<string[]>(['account'])
  const toggle = (id: string) => setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))

  return (
    <Screen footer={<FacilitatorTabs />}>
      <Page className="gap-[22px]">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-subtle">Pura vida</span>
            <h1 className="m-0 font-display text-[32px] font-medium text-ink">[Your name]</h1>
            <div className="mt-1"><Badge>Founding Facilitator</Badge></div>
          </div>
          <Link to="/facilitator/profile" aria-label="Your profile" className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-dashed border-slate text-xl text-subtle no-underline">+</Link>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold text-ink">Open to new spaces</span>
            <span className="text-xs text-subtle">{open ? 'Spaces can see you and request intros' : 'Hidden from new intro suggestions'}</span>
          </div>
          <Switch on={open} onChange={setOpen} label="Open to new spaces" />
        </div>

        <Checklist title="Complete your profile" items={SETUP} done={done} onToggle={toggle} />

        <section className="flex flex-col gap-2.5">
          <H2>Intros</H2>
          <EmptyState title="No intros yet" action={<Link to="/facilitator/spaces" className="flex min-h-11 items-center text-sm font-semibold no-underline">Browse spaces</Link>}>
            As retreat spaces join, Xanadu will introduce you to the ones aligned with your practice.
          </EmptyState>
        </section>

        <section className="flex flex-col gap-2.5 rounded-[20px] border border-plum-line p-[18px]">
          <div className="flex items-baseline justify-between"><span className="text-[15px] font-semibold text-ink">Path to ✦ Verified</span><span className="text-[13px] text-subtle">0 of [N] vouches</span></div>
          <div className="grid grid-cols-5 gap-1.5">{Array.from({ length: 5 }, (_, i) => <span key={i} className="h-1.5 rounded-full bg-line" />)}</div>
          <span className="text-[13px] leading-normal text-subtle">After each experience, Seekers who sat with you can vouch for you.</span>
        </section>

        <section className="flex flex-col gap-2.5">
          <H2>Your offerings</H2>
          <span className="text-[13px] leading-normal text-subtle">Offerings you co-host with a space will appear here.</span>
        </section>
      </Page>
    </Screen>
  )
}
