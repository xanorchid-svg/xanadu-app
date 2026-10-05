import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ContainerTabs, Reviews, Screen } from '../../components/ui'
import { AddPhotosButton, EditFooter, PhotoGallery, PracticePicker, SignOutButton, STORAGE_FULL, TextArea, TextField } from '../../components/edit'
import { IconPhoto } from '../../components/icons'
import { useSpaceProfile, type SpaceProfile as SP } from '../../store'
import { PRACTICES } from '../../data'

const h2 = 'm-0 font-display text-[22px] font-semibold text-ink'

/** The Container's public space page, seen and edited by its owner. */
export default function SpaceProfile() {
  const [space, save] = useSpaceProfile()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<SP>(space)
  const [error, setError] = useState('')
  const [shared, setShared] = useState(false)
  const set = <K extends keyof SP>(k: K, v: SP[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const startEdit = () => { setDraft(space); setError(''); setEditing(true) }

  if (editing) {
    const commit = () => { if (save(draft)) setEditing(false); else setError(STORAGE_FULL) }
    return (
      <Screen footer={<EditFooter onCancel={() => setEditing(false)} onSave={commit} error={error} />}>
        <div className="flex flex-col gap-5 px-5 pt-[52px] pb-8">
          <h1 className="m-0 font-display text-[32px] font-medium text-ink">Edit space</h1>
          <PhotoGallery photos={draft.photos} onChange={(p) => set('photos', p)} />
          <TextField label="Space name" value={draft.name} onChange={(v) => set('name', v)} />
          <TextField label="Town" value={draft.town} onChange={(v) => set('town', v)} placeholder="e.g. Nosara" />
          <TextArea label="About your space" value={draft.about} onChange={(v) => set('about', v)} rows={5}
            placeholder="The land, the spirit of the place and who it's for." />
          <PracticePicker label="Practices you host" options={PRACTICES} value={draft.practices} onChange={(v) => set('practices', v)} />
          <section className="flex flex-col gap-3.5">
            <h2 className={h2}>The details</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <TextField label="Sleeps" value={draft.sleeps} onChange={(v) => set('sleeps', v)} placeholder="e.g. 16" />
              <TextField label="Practice space holds" value={draft.mats} onChange={(v) => set('mats', v)} placeholder="e.g. 20 mats" />
            </div>
            <TextField label="Room types" value={draft.rooms} onChange={(v) => set('rooms', v)} placeholder="e.g. Private rooms and shared dorms" />
            <TextField label="Kitchen and meals" value={draft.kitchen} onChange={(v) => set('kitchen', v)} placeholder="e.g. Plant-based, on-site chef" />
            <TextField label="Getting here" value={draft.gettingHere} onChange={(v) => set('gettingHere', v)} placeholder="e.g. 5 min walk to the beach" />
          </section>
        </div>
      </Screen>
    )
  }

  const addPhotos = (urls: string[]) => { if (!save({ ...space, photos: [...space.photos, ...urls].slice(0, 8) })) setError(STORAGE_FULL) }
  const facts: [string, string][] = [
    [space.sleeps.trim() ? `Sleeps ${space.sleeps.trim()}` : 'Sleeps [N]', space.rooms.trim() || '[Room types]'],
    ['Practice space', space.mats.trim() ? `Holds ${space.mats.trim()}` : 'Holds [N] mats'],
    ['Kitchen', space.kitchen.trim() || '[Meal style]'],
    ['Getting here', space.gettingHere.trim() || '[Nearest airport or beach]'],
  ]
  const cover = space.photos[0]

  return (
    <Screen footer={<ContainerTabs />}>
      <div className={`relative flex h-[260px] flex-col justify-between px-4 pt-[52px] pb-4 ${cover ? '' : 'border-b border-dashed border-line-2 bg-surface-2'}`}>
        {cover && <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="relative flex justify-end gap-2">
          <button type="button" onClick={() => setShared(true)} className="min-h-10 rounded-full bg-navy/75 px-3.5 text-[13px] text-text">{shared ? 'Link coming soon' : 'Share'}</button>
          <button type="button" onClick={startEdit} className="min-h-10 rounded-full bg-gold px-3.5 text-[13px] font-semibold text-navy">Edit space</button>
        </div>
        <AddPhotosButton onAdd={addPhotos}
          className={`relative flex min-h-11 items-center gap-2 self-center rounded-full px-4 text-sm ${cover ? 'bg-navy/75 text-text' : 'border border-slate text-muted'}`}>
          <IconPhoto />{cover ? `Add photos (${space.photos.length} of 8)` : 'Add photos'}
        </AddPhotosButton>
        <span />
      </div>
      {space.photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-5 pt-3">
          {space.photos.slice(1).map((p, i) => <img key={i} src={p} alt={`Space photo ${i + 2}`} className="h-16 w-16 flex-none rounded-xl object-cover" />)}
        </div>
      )}

      <div className="flex flex-col gap-6 px-5 pt-5 pb-7">
        {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 font-display text-[32px] font-medium text-ink">{space.name.trim() || '[Your space name]'}</h1>
            <span className="rounded-full border border-gold px-2 py-1 text-xs text-gold-pale">Founding member</span>
          </div>
          <span className="text-sm text-muted">{`Retreat space · ${space.town.trim() || '[Town]'}, Costa Rica`}</span>
          <a href="#reviews" className="text-[13px] text-subtle no-underline">No reviews yet</a>
        </div>
        <p className={`m-0 text-[15px] leading-relaxed whitespace-pre-line ${space.about.trim() ? 'text-muted' : 'text-subtle'}`}>
          {space.about.trim() || "[In your own words: the land, the spirit of the space and who it's for.]"}
        </p>

        <section className="flex flex-col gap-2.5">
          <h2 className={h2}>We host</h2>
          {space.practices.length
            ? <div className="flex flex-wrap gap-2">{space.practices.map((p) => <span key={p} className="rounded-full border border-line-2 px-3 py-1.5 text-[13px] text-text">{p}</span>)}</div>
            : <span className="text-[13px] text-subtle">[Practices you host, e.g. yoga, breathwork, sound]</span>}
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className={h2}>The space</h2>
          <div className="grid grid-cols-2 gap-2">
            {facts.map(([k, v]) => <div key={k} className="flex flex-col gap-0.5 rounded-[14px] bg-surface p-3.5"><span className="text-sm font-semibold text-ink">{k}</span><span className="text-xs text-subtle">{v}</span></div>)}
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

        <SignOutButton />
      </div>
    </Screen>
  )
}
