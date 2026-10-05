import { Link } from 'react-router-dom'
import { ContainerTabs, Reviews, Screen } from '../../components/ui'
import { IconPhoto } from '../../components/icons'

const FACTS = [
  ['Sleeps [N]', '[Room types]'],
  ['Practice space', 'Holds [N] mats'],
  ['Kitchen', '[Meal style]'],
  ['Getting here', '[Nearest airport or beach]'],
]

const h2 = 'm-0 font-display text-[22px] font-semibold text-ink'

/** The Container's public space page, seen by its owner. */
export default function SpaceProfile() {
  return (
    <Screen footer={<ContainerTabs />}>
      <div className="flex h-[230px] flex-col justify-between border-b border-dashed border-line-2 bg-surface-2 px-4 pt-[52px] pb-4">
        <div className="flex justify-end gap-2">
          <button type="button" className="min-h-10 rounded-full bg-navy/70 px-3.5 text-[13px] text-text">Share</button>
          <button type="button" className="min-h-10 rounded-full bg-gold px-3.5 text-[13px] font-semibold text-navy">Edit space</button>
        </div>
        <button type="button" className="flex min-h-11 items-center gap-2 self-center rounded-full border border-slate px-4 text-sm text-muted"><IconPhoto />Add photos</button>
        <span />
      </div>

      <div className="flex flex-col gap-6 px-5 pt-5 pb-7">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 font-display text-[32px] font-medium text-ink">[Your space name]</h1>
            <span className="rounded-full border border-gold px-2 py-1 text-xs text-gold-pale">Founding member</span>
          </div>
          <span className="text-sm text-muted">Retreat space · [Town], Costa Rica</span>
          <a href="#reviews" className="text-[13px] text-subtle no-underline">No reviews yet</a>
        </div>
        <p className="m-0 text-[15px] leading-relaxed text-subtle">[In your own words: the land, the spirit of the space and who it's for.]</p>

        <section className="flex flex-col gap-2.5">
          <h2 className={h2}>We host</h2>
          <span className="text-[13px] text-subtle">[Practices you host, e.g. yoga, breathwork, sound]</span>
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className={h2}>The space</h2>
          <div className="grid grid-cols-2 gap-2">
            {FACTS.map(([k, v]) => <div key={k} className="flex flex-col gap-0.5 rounded-[14px] bg-surface p-3.5"><span className="text-sm font-semibold text-ink">{k}</span><span className="text-xs text-subtle">{v}</span></div>)}
          </div>
        </section>

        <Reviews categories={['Space', 'Food', 'Hospitality', 'Location']}
          emptyText="Guests can review your space after an experience they booked through Xanadu. You'll be able to reply publicly to each one." />

        <section className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between"><h2 className={h2}>Aligned facilitators</h2><span className="text-xs text-subtle">Only you see this</span></div>
          <span className="text-[13px] leading-normal text-subtle">As facilitators join Xanadu, we'll suggest those aligned with your space so you can request an intro.</span>
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className={h2}>Upcoming here</h2>
          <Link to="/container/new" className="flex items-center justify-between rounded-[14px] border border-dashed border-line-2 p-3.5 text-text no-underline">
            <span className="text-sm text-muted">No offerings yet · Create one</span><span className="text-gold-soft">›</span>
          </Link>
        </section>
      </div>
    </Screen>
  )
}
