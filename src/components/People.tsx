import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, inputCls } from './ui'
import { IconSearch } from './icons'
import { placeLabel } from '../data'
import { useGuides, useSpaces, type Guide, type PublicSpace } from '../store'

/**
 * Who's in an experience: the Facilitator leading it and where it's held.
 * A Container picks a Facilitator; a Facilitator picks a Xanadu space or names an outside venue
 * (and can invite that venue to Xanadu). No one has to accept: they're told and can remove themselves.
 */

export type Venue = { spaceId: string | null; name: string; place: string; invite: string }
export const NO_VENUE: Venue = { spaceId: null, name: '', place: '', invite: '' }

const Thumb = ({ src, round = false }: { src?: string; round?: boolean }) => (
  <div className={`h-12 w-12 flex-none overflow-hidden bg-portal ${round ? 'rounded-full' : 'rounded-[12px]'}`}>
    {src && <img decoding="async" loading="lazy" src={src} alt="" className="h-full w-full object-cover" />}
  </div>
)

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex min-h-12 items-center gap-2.5 rounded-[14px] border border-line bg-surface-2 px-4 text-subtle">
      <IconSearch />
      <span className="sr-only">{placeholder}</span>
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-faint" />
    </label>
  )
}

const row = 'flex w-full items-center gap-3 rounded-[16px] bg-surface p-2.5 text-left'

/** Container: add the Facilitator who leads it (approved Facilitators only), or hold it yourself. */
export function GuidePicker({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const guides = useGuides()
  const [q, setQ] = useState('')
  const picked = guides.find((g) => g.id === value)
  const s = q.trim().toLowerCase()
  const list = guides.filter((g) => !s || `${g.name} ${g.town} ${g.practices.join(' ')}`.toLowerCase().includes(s)).slice(0, 8)

  if (value) return (
    <div className={`${row} ring-iri`}>
      <Thumb src={picked?.photo_url} round />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs text-subtle">Led by</span>
        <span className="truncate text-[15px] font-semibold text-ink">{picked?.name ?? 'Your Facilitator'}</span>
        {picked && <span className="truncate text-xs text-subtle">{picked.practices.slice(0, 3).join(' · ')}</span>}
      </div>
      <button type="button" onClick={() => onChange(null)} className="min-h-10 px-2 text-[13px] text-subtle">Remove</button>
    </div>
  )
  return (
    <div className="flex flex-col gap-2">
      <SearchBox value={q} onChange={setQ} placeholder="Search Facilitators on Xanadu" />
      {list.map((g) => (
        <button key={g.id} type="button" onClick={() => onChange(g.id)} className={row}>
          <Thumb src={g.photo_url} round />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-semibold text-ink">{g.name}</span>
            <span className="truncate text-xs text-subtle">{[g.practices.slice(0, 3).join(' · '), g.town].filter(Boolean).join(' · ')}</span>
          </div>
          <span className="text-[13px] font-semibold text-gold-soft">Add</span>
        </button>
      ))}
      {!list.length && <span className="text-[13px] text-subtle">{guides.length ? 'No Facilitator matches that.' : 'Facilitators appear here as they’re welcomed into Xanadu.'}</span>}
      <span className="text-xs leading-normal text-subtle">
        Optional. They’re told they’ve been added and can remove themselves. Leading it yourself? Leave this empty.{' '}
        <a href="mailto:?subject=Co-host%20with%20me%20on%20Xanadu&body=I'd%20love%20to%20host%20an%20offering%20with%20you%20on%20Xanadu%3A%20https%3A%2F%2Fapp.dreamxanadu.com%2F%3Fmode%3Dsignup%26role%3DFacilitator" className="no-underline">Invite one who isn’t on Xanadu yet</a>
      </span>
    </div>
  )
}

/** Facilitator: where it's held. A Xanadu space, or a venue that isn't on Xanadu yet. */
export function VenuePicker({ value, onChange }: { value: Venue; onChange: (v: Venue) => void }) {
  const { spaces } = useSpaces()
  const [q, setQ] = useState('')
  const [outside, setOutside] = useState(!value.spaceId && !!value.name)
  const picked = spaces.find((sp) => sp.id === value.spaceId)
  const s = q.trim().toLowerCase()
  const list = spaces.filter((sp) => !s || `${sp.name} ${placeLabel(sp)} ${sp.country}`.toLowerCase().includes(s)).slice(0, 8)

  if (value.spaceId) return (
    <div className={`${row} ring-iri`}>
      <Thumb src={picked?.photos[0]} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs text-subtle">Held at</span>
        <span className="truncate text-[15px] font-semibold text-ink">{picked?.name ?? 'A Xanadu space'}</span>
        {picked && <span className="truncate text-xs text-subtle">{placeLabel(picked) || picked.country}</span>}
      </div>
      <button type="button" onClick={() => onChange(NO_VENUE)} className="min-h-10 px-2 text-[13px] text-subtle">Change</button>
    </div>
  )

  if (outside) return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-dashed border-slate p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold text-ink">Somewhere not on Xanadu yet</span>
        <button type="button" onClick={() => { setOutside(false); onChange(NO_VENUE) }} className="min-h-10 text-[13px] text-subtle">Pick a Xanadu space</button>
      </div>
      <Field label="Venue name"><input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="e.g. Casa del Mar, or Online" className={inputCls} /></Field>
      <Field label="Town and country"><input value={value.place} onChange={(e) => onChange({ ...value, place: e.target.value })} placeholder="e.g. Santa Teresa, Costa Rica" className={inputCls} /></Field>
      <Field label="Invite them to Xanadu (optional)">
        <input type="email" inputMode="email" autoComplete="off" value={value.invite} onChange={(e) => onChange({ ...value, invite: e.target.value })} placeholder="The venue’s email" className={inputCls} />
      </Field>
      <span className="text-xs leading-normal text-subtle">We’ll send them one email from Xanadu saying you suggested them. Spaces you refer are easier for our team to review.</span>
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      <SearchBox value={q} onChange={setQ} placeholder="Search spaces on Xanadu" />
      {list.map((sp) => (
        <button key={sp.id} type="button" onClick={() => onChange({ ...NO_VENUE, spaceId: sp.id })} className={row}>
          <Thumb src={sp.photos[0]} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-semibold text-ink">{sp.name}</span>
            <span className="truncate text-xs text-subtle">{placeLabel(sp) || sp.country}</span>
          </div>
          <span className="text-[13px] font-semibold text-gold-soft">Choose</span>
        </button>
      ))}
      {!list.length && <span className="text-[13px] text-subtle">{spaces.length ? 'No space matches that.' : 'Spaces appear here as they’re welcomed into Xanadu.'}</span>}
      <button type="button" onClick={() => setOutside(true)} className="flex min-h-12 items-center justify-center rounded-2xl border border-line-2 text-[14px] text-text">
        Somewhere not on Xanadu yet
      </button>
      <span className="text-xs leading-normal text-subtle">The space is told you’ve added an experience there, and can remove their space if it isn’t right.</span>
    </div>
  )
}

/** "Led by" on the experience page: who the Facilitator is, their practice and training. */
export function LedBy({ guide, canMessage, offeringId }: { guide: Guide; canMessage: boolean; offeringId: string }) {
  const [more, setMore] = useState(false)
  const where = placeLabel({ town: guide.town, region: guide.region })
  return (
    <section className="flex flex-col gap-3 rounded-[18px] bg-surface p-3.5">
      <div className="flex items-center gap-3">
        <Thumb src={guide.photo_url} round />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs text-subtle">Led by</span>
          <span className="truncate text-[16px] font-semibold text-ink">{guide.name}</span>
          <span className="truncate text-xs text-subtle">{[guide.practices.slice(0, 3).join(' · '), where].filter(Boolean).join(' · ')}</span>
        </div>
      </div>
      {guide.about && (
        <button type="button" onClick={() => setMore((m) => !m)} className="text-left">
          <p className={`m-0 text-[14px] leading-relaxed whitespace-pre-line text-muted ${more ? '' : 'line-clamp-3'}`}>{guide.about}</p>
          {guide.about.length > 160 && <span className="text-[13px] font-semibold text-gold-soft">{more ? 'Less' : 'More'}</span>}
        </button>
      )}
      {guide.trainings?.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {guide.trainings.slice(0, 3).map((t, i) => (
            <li key={i} className="text-[13px] text-subtle"><span className="text-ink">{t.title}</span>{[t.school, t.year].filter(Boolean).length ? ` · ${[t.school, t.year].filter(Boolean).join(', ')}` : ''}</li>
          ))}
        </ul>
      )}
      {guide.languages && <span className="text-xs text-subtle">{`Speaks ${guide.languages}`}</span>}
      {canMessage && (
        <Link to={`/messages/new?to=${guide.id}&offering=${offeringId}`}
          className="flex min-h-11 items-center justify-center rounded-xl border border-line-2 text-[14px] text-text no-underline">{`Message ${guide.name.split(' ')[0]}`}</Link>
      )}
    </section>
  )
}

/** "Held at" for a venue outside Xanadu. */
export function OutsideVenue({ name, place }: { name: string; place: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-surface p-3">
      <Thumb />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs text-subtle">Held at</span>
        <span className="truncate text-[15px] font-semibold text-ink">{name || 'Venue to be confirmed'}</span>
        {place && <span className="text-xs text-subtle">{place}</span>}
      </div>
    </div>
  )
}

export type { PublicSpace }
