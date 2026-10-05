import { useState } from 'react'
import { EmptyState, H1, Page, PrimaryLink, Screen, SeekerTabs, Segmented } from '../../components/ui'
import { IconHeart } from '../../components/icons'

const TABS = ['Experiences', 'Places', 'Guides'] as const
const COPY: Record<(typeof TABS)[number], [string, string]> = {
  Experiences: ['No saved experiences yet', 'Tap the heart on any retreat, training or drop-in to keep it here.'],
  Places: ['No saved places yet', 'Save the retreat spaces you want to return to or visit one day.'],
  Guides: ['No saved guides yet', 'Save the facilitators whose work speaks to you.'],
}

export default function Saved() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Experiences')
  const [title, body] = COPY[tab]
  return (
    <Screen footer={<SeekerTabs />}>
      <Page className="gap-5">
        <H1>Saved</H1>
        <Segmented label="Saved" options={TABS} value={tab} onChange={setTab} />
        <EmptyState icon={<IconHeart size={36} />} title={title} action={<PrimaryLink to="/discover" className="mt-1">Explore Discover</PrimaryLink>}>{body}</EmptyState>
      </Page>
    </Screen>
  )
}
