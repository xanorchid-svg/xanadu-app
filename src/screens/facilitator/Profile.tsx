import { useState } from 'react'
import { AppHeader, FacilitatorTabs, Reviews, Screen } from '../../components/ui'
import { AvatarPicker, EditFooter, PracticePicker, SignOutButton, TextArea, TextField } from '../../components/edit'
import { IconClose } from '../../components/icons'
import { useFacilitatorProfile, type FacilitatorProfile as FP } from '../../store'
import { PRACTICES } from '../../data'

const VIEWS = ['My profile', 'As Seekers see it'] as const
const h2 = 'm-0 font-display text-[22px] font-semibold text-ink'
const FAC_PRACTICES = PRACTICES.filter((p) => p !== 'Trainings')

export default function FacilitatorProfile() {
  const [profile, save] = useFacilitatorProfile()
  const [view, setView] = useState<(typeof VIEWS)[number]>('My profile')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<FP>(profile)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const own = view === 'My profile'

  const startEdit = () => { setDraft(profile); setError(''); setEditing(true) }
  const set = <K extends keyof FP>(k: K, v: FP[K]) => setDraft((d) => ({ ...d, [k]: v }))

  if (editing) {
    const commit = async () => {
      const clean: FP = {
        ...draft,
        trainings: draft.trainings.filter((t) => t.title.trim()),
        references: draft.references.filter((r) => r.name.trim()),
      }
      setBusy(true)
      const err = await save(clean)
      setBusy(false)
      if (err) setError(err)
      else setEditing(false)
    }
    return (
      <Screen footer={<EditFooter onCancel={() => setEditing(false)} onSave={commit} error={error} busy={busy} />}>
        <div className="flex flex-col gap-5 px-5 pt-safe pb-8">
          <h1 className="m-0 font-display text-[32px] font-medium text-ink">Edit profile</h1>
          <AvatarPicker photo={draft.photo} onChange={(p) => set('photo', p)} />
          <TextField label="Your name" value={draft.name} onChange={(v) => set('name', v)} autoComplete="name" />
          <TextField label="Where you're based" value={draft.town} onChange={(v) => set('town', v)} placeholder="e.g. Ubud, Bali" />
          <PracticePicker label="Your practices" options={FAC_PRACTICES} value={draft.practices} onChange={(v) => set('practices', v)} />
          <TextField label="Languages" value={draft.languages} onChange={(v) => set('languages', v)} placeholder="e.g. English, Español" />
          <TextArea label="About" value={draft.about} onChange={(v) => set('about', v)} rows={5}
            placeholder="How you came to this work and what people can expect when they sit with you." />

          <section className="flex flex-col gap-3">
            <h2 className={h2}>Training</h2>
            {draft.trainings.map((t, i) => (
              <div key={i} className="flex flex-col gap-2.5 rounded-2xl border border-line p-3.5">
                <div className="flex items-center justify-between"><span className="text-[13px] text-subtle">{`Training ${i + 1}`}</span>
                  <button type="button" aria-label={`Remove training ${i + 1}`} onClick={() => set('trainings', draft.trainings.filter((_, j) => j !== i))} className="flex h-9 w-9 items-center justify-center rounded-full text-subtle"><IconClose size={16} /></button></div>
                <TextField label="Certification or training" value={t.title} onChange={(v) => set('trainings', draft.trainings.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
                <div className="grid grid-cols-[1fr_90px] gap-2.5">
                  <TextField label="School" value={t.school} onChange={(v) => set('trainings', draft.trainings.map((x, j) => (j === i ? { ...x, school: v } : x)))} />
                  <TextField label="Year" value={t.year} onChange={(v) => set('trainings', draft.trainings.map((x, j) => (j === i ? { ...x, year: v } : x)))} />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => set('trainings', [...draft.trainings, { title: '', school: '', year: '' }])}
              className="min-h-12 rounded-[14px] border border-dashed border-slate text-sm text-gold-pale">+ Add training</button>
          </section>

          <section className="flex flex-col gap-3 rounded-[18px] border border-dashed border-slate p-4">
            <div className="flex items-baseline justify-between"><h2 className={h2}>Private to Xanadu</h2><span className="text-xs text-subtle">Not shown publicly</span></div>
            {draft.references.map((r, i) => (
              <div key={i} className="flex flex-col gap-2.5 border-b border-[#1F2B3E] pb-3">
                <div className="flex items-center justify-between"><span className="text-[13px] text-subtle">{`Reference ${i + 1}`}</span>
                  <button type="button" aria-label={`Remove reference ${i + 1}`} onClick={() => set('references', draft.references.filter((_, j) => j !== i))} className="flex h-9 w-9 items-center justify-center rounded-full text-subtle"><IconClose size={16} /></button></div>
                <TextField label="Name" value={r.name} onChange={(v) => set('references', draft.references.map((x, j) => (j === i ? { ...x, name: v } : x)))} />
                <TextField label="Email or phone" value={r.contact} onChange={(v) => set('references', draft.references.map((x, j) => (j === i ? { ...x, contact: v } : x)))} />
              </div>
            ))}
            {draft.references.length < 3 && (
              <button type="button" onClick={() => set('references', [...draft.references, { name: '', contact: '' }])}
                className="min-h-12 rounded-[14px] border border-dashed border-slate text-sm text-gold-pale">{`+ Add reference (${draft.references.length} of 3)`}</button>
            )}
            <TextField label="Insurance (optional)" value={draft.insurance} onChange={(v) => set('insurance', v)} placeholder="Provider and policy, if you have it" />
          </section>
        </div>
      </Screen>
    )
  }

  const name = profile.name.trim() || '[Your name]'
  const meta = [profile.practices.length ? profile.practices.slice(0, 3).join(' · ') : '[Your practices]', profile.town.trim() || '[Where you\'re based]'].join(' · ')
  const privRow = 'flex min-h-11 items-center justify-between border-b border-[#1F2B3E] text-sm text-text'

  return (
    <Screen header={<AppHeader />} footer={<FacilitatorTabs />}>
      <div className="flex flex-col gap-6 px-5 pt-5 pb-7">
        <div role="tablist" aria-label="View" className="grid w-[300px] grid-cols-2 gap-1 self-center rounded-full bg-surface p-1">
          {VIEWS.map((v) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={`min-h-10 rounded-full text-xs ${view === v ? 'bg-line font-semibold text-ink' : 'text-subtle'}`}>{v}</button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2.5 text-center">
          {own
            ? <AvatarPicker photo={profile.photo} onChange={async (p) => { setError(''); const err = await save({ ...profile, photo: p }); if (err) setError(err) }} />
            : <div className="h-[104px] w-[104px] overflow-hidden rounded-full bg-plum">{profile.photo && <img src={profile.photo} alt="" className="h-full w-full object-cover" />}</div>}
          <h1 className="m-0 font-display text-[32px] font-medium text-ink">{name}</h1>
          <span className="text-sm text-muted">{meta}</span>
          {profile.languages.trim() && <span className="text-[13px] text-subtle">{profile.languages}</span>}
          <a href="#reviews" className="text-[13px] text-subtle no-underline">No reviews yet</a>
          {own
            ? <button type="button" onClick={startEdit} className="min-h-11 rounded-full border border-gold px-[18px] text-[13px] font-semibold text-gold-pale">Edit profile</button>
            : <span className="text-[13px] text-subtle">This is how your profile reads to Seekers.</span>}
          {error && <span role="alert" className="text-xs text-gold-pale">{error}</span>}
        </div>

        <section className="flex flex-col gap-2.5">
          <h2 className={h2}>About</h2>
          <p className={`m-0 text-[15px] leading-relaxed whitespace-pre-line ${profile.about.trim() ? 'text-muted' : 'text-subtle'}`}>
            {profile.about.trim() || '[In your own words: how you came to this work and what people can expect when they sit with you.]'}
          </p>
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className={h2}>Training</h2>
          {profile.trainings.length ? profile.trainings.map((t, i) => (
            <div key={i} className="flex items-center justify-between gap-2.5 rounded-[14px] bg-surface p-3.5">
              <span className="flex flex-col gap-0.5"><span className="text-[15px] font-semibold text-ink">{t.title}</span><span className="text-xs text-subtle">{[t.school, t.year].filter(Boolean).join(' · ')}</span></span>
              <span className="flex-none text-xs text-subtle">In review</span>
            </div>
          )) : (
            <div className="flex items-center justify-between gap-2.5 rounded-[14px] border border-dashed border-line-2 p-3.5">
              <span className="flex flex-col gap-0.5"><span className="text-[15px] font-semibold text-ink">[Certification or training]</span><span className="text-xs text-subtle">[School] · [Year]</span></span>
              <span className="text-xs text-subtle">Not added</span>
            </div>
          )}
        </section>

        {own && (
          <section className="flex flex-col gap-2.5 rounded-[18px] border border-dashed border-slate p-4">
            <div className="flex items-baseline justify-between"><h2 className={h2}>Private to Xanadu</h2><span className="text-xs text-subtle">Not shown publicly</span></div>
            <div className={privRow}>References <span className="text-[13px] text-gold-pale">{`${profile.references.length} of 3 added`}</span></div>
            <div className={privRow}>Insurance <span className="text-[13px] text-subtle">{profile.insurance.trim() ? 'Added' : 'Optional · add later'}</span></div>
            <div className={`${privRow} border-b-0`}>Community guidelines <span className="text-[13px] text-calm-text">Agreed ✓</span></div>
          </section>
        )}

        <Reviews categories={['Guidance', 'Safety & care', 'Presence', 'Clarity']}
          emptyText={own
            ? "Seekers can review you after an experience they booked through Xanadu. You'll be able to reply publicly to each one."
            : 'Reviews from Seekers who booked through Xanadu will appear here.'} />

        <section className="flex flex-col gap-2.5">
          <h2 className={h2}>Holds space at</h2>
          <span className="text-[13px] leading-normal text-subtle">Spaces you co-host with will appear here.</span>
        </section>

        {own && <SignOutButton />}
      </div>
    </Screen>
  )
}
