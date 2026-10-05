import { useState } from 'react'
import { Chip, EmptyState, FacilitatorTabs, H1, Page, RowLink, Screen } from '../../components/ui'
import { IconPin } from '../../components/icons'
import { CONTACT_EMAIL, spaces } from '../../data'

const FILTERS = ['Practice space', 'Ocean view', 'Sleeps 10+', 'Meals included', 'Jungle', 'Available dates']

export default function FindSpaces() {
  const [filters, setFilters] = useState<string[]>([])
  const toggle = (f: string) => setFilters((xs) => (xs.includes(f) ? xs.filter((x) => x !== f) : [...xs, f]))

  return (
    <Screen footer={<FacilitatorTabs />}>
      <Page className="gap-[18px]">
        <div className="flex flex-col gap-1">
          <H1>Spaces to hold in</H1>
          <span className="text-sm text-muted">Retreat spaces across Costa Rica</span>
        </div>
        <div className="flex flex-wrap gap-2">{FILTERS.map((f) => <Chip key={f} on={filters.includes(f)} onClick={() => toggle(f)}>{f}</Chip>)}</div>

        {spaces.length ? spaces.map((s) => (
          <div key={s.id} className="flex flex-col gap-1 rounded-[20px] bg-surface p-4">
            <span className="text-base font-semibold text-ink">{s.name}</span>
            <span className="text-[13px] text-subtle">{s.town}</span>
          </div>
        )) : (
          <EmptyState icon={<IconPin size={36} />} title="Spaces are joining now">
            We're welcoming our founding retreat spaces. When they go live, you'll find them here and can propose an offering to any of them.
          </EmptyState>
        )}

        <RowLink href={`mailto:${CONTACT_EMAIL}?subject=A%20retreat%20space%20for%20Xanadu`} title="Know a space that belongs here?" sub="Recommend it and we'll reach out." />
      </Page>
    </Screen>
  )
}
