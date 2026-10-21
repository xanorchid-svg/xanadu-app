import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AvatarPicker, LocationFields, PhotoGallery, PracticePicker, TextArea, TextField } from '../components/edit'
import { IconClose } from '../components/icons'
import { Chip, Field, Glow, inputCls } from '../components/ui'
import { LifestylePicker } from '../components/Lifestyle'
import { cancelAddRole } from '../components/Roles'
import { ImportCard, mergeSpace, type SpaceImport } from '../components/Import'
import { HOME, Loading, hostState, takeReturn, useAuth, type DbRole } from '../auth'
import { PRACTICES, SEEKER_ALIGN } from '../data'
import { refreshMatches } from '../matching'
import { EMPTY_SPACE, savePrivateDetails, uploadPhotos, useSpaceProfile, type Reference, type SpaceProfile, type Training } from '../store'
import { friendlyError, supabase } from '../lib/supabase'

const HOST_PRACTICES = PRACTICES.filter((p) => p !== 'Trainings')

/** Shared frame for every setup flow: progress, a scrolling step, Back / Continue. */
function Wizard({ steps, step, setStep, onFinish, finishLabel, busy, error, children, onSignOut, onCancel }: {
  steps: string[]; step: number; setStep: (n: number) => void; onFinish: () => void; finishLabel: string
  busy: boolean; error: string; children: ReactNode; onSignOut: () => void; onCancel?: () => void
}) {
  const last = step === steps.length - 1
  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-col gap-3 border-b border-[#1F2B3E] px-5 pt-safe pb-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-subtle">{`Step ${step + 1} of ${steps.length} · ${steps[step]}`}</span>
          {onCancel
            ? <button type="button" onClick={onCancel} className="min-h-10 text-[13px] text-subtle">Cancel</button>
            : <button type="button" onClick={onSignOut} className="min-h-10 text-[13px] text-subtle">Sign out</button>}
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((s, i) => <span key={s} className={`h-1 rounded-full transition-colors duration-500 ${i <= step ? 'bg-iri-strong' : 'bg-line'}`} />)}
        </div>
      </header>
      <main key={step} className="xa-page flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">{children}</main>
      <footer className="border-t border-[#1F2B3E] bg-navy-deep px-5 pt-3.5 pb-safe">
        {error && <p role="alert" className="m-0 mb-2.5 text-center text-[13px] text-gold-pale">{error}</p>}
        <div className="flex gap-2.5">
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="min-h-[54px] rounded-2xl border border-line-2 px-5 text-[15px] text-text">Back</button>}
          <button type="button" disabled={busy} onClick={last ? onFinish : () => setStep(step + 1)}
            className="min-h-[54px] flex-1 rounded-2xl bg-iri text-[15px] font-semibold text-navy disabled:opacity-70">
            {busy ? 'Saving…' : last ? finishLabel : 'Continue'}
          </button>
        </div>
      </footer>
    </div>
  )
}

const Title = ({ children, sub }: { children: ReactNode; sub?: string }) => (
  <div className="flex flex-col gap-2">
    <h1 className="m-0 font-display text-[32px] leading-[1.05] font-medium text-ink">{children}</h1>
    {sub && <p className="m-0 text-[15px] leading-relaxed text-muted">{sub}</p>}
  </div>
)

function Agreement({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-surface p-4 text-sm leading-relaxed text-text">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-[#B89567]" />
      <span>I agree to hold space with care and honesty, to make no medical or guaranteed-outcome claims, and to keep everyone safe, including people in altered states.</span>
    </label>
  )
}

const AiNotice = () => (
  <p className="m-0 rounded-xl bg-plum px-3.5 py-3 text-[13px] leading-normal text-muted">We use AI to help review applications; a person makes every decision.</p>
)

/** "Where did you hear about us?" Stored on the profile as e.g. "Instagram" or "Other: a podcast". */
const HEARD_OPTIONS = ['Friend or family', 'Instagram', 'Facebook', 'Google', 'TikTok', 'Other'] as const
function useHeardFrom(initial = '') {
  const isOther = initial.startsWith('Other')
  const [pick, setPick] = useState(isOther ? 'Other' : initial)
  const [other, setOther] = useState(isOther ? initial.replace(/^Other:?\s*/, '') : '')
  const value = pick === 'Other' ? (other.trim() ? `Other: ${other.trim().slice(0, 120)}` : 'Other') : pick
  return { pick, setPick, other, setOther, value }
}
function HeardFrom({ h, optional = false }: { h: ReturnType<typeof useHeardFrom>; optional?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] text-muted">{`Where did you hear about Xanadu?${optional ? ' (optional)' : ''}`}</span>
      <div className="flex flex-wrap gap-2">
        {HEARD_OPTIONS.map((o) => <Chip key={o} on={h.pick === o} onClick={() => h.setPick(h.pick === o ? '' : o)}>{o}</Chip>)}
      </div>
      {h.pick === 'Other' && (
        <input value={h.other} onChange={(e) => h.setOther(e.target.value)} placeholder="Tell us where" aria-label="Where you heard about Xanadu" className={inputCls} />
      )}
    </div>
  )
}

/** Adding a second role to an existing account: Cancel goes back to how things were. */
function useAdding() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const adding = !!profile?.prev_role
  const cancel = async () => {
    const { error } = await cancelAddRole()
    if (error) return
    const p = await refreshProfile()
    navigate(p ? HOME[p.role] : '/', { replace: true })
  }
  return { adding, cancel: adding ? cancel : undefined }
}

/** What the applicant already sent us (private to them and the team), to fill the form when they update or reapply. */
type Private = { proof: string; phone: string; references_list: Reference[]; insurance: string; agreed_guidelines: boolean }
function usePrivate(onLoad: (p: Private) => void) {
  const { session } = useAuth()
  useEffect(() => {
    if (!session) return
    supabase.from('private_details').select('proof, phone, references_list, insurance, agreed_guidelines').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => { if (data) onLoad(data as Private) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])
}

/**
 * After an application is sent the member waits on the Seeker side (or a side they're already approved for).
 * The hosting side they applied for opens only once the Xanadu team approves it.
 */
function useAfterSubmit() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const back = profile?.prev_role
  return async (role: 'container' | 'facilitator', update: boolean) => {
    if (update) {
      const { error } = await supabase.rpc('resubmit_application', { p_role: role })
      if (error) return friendlyError(error.message)
    } else {
      const p = profile
      const to: DbRole = back && back !== role && (back === 'seeker' || (p && hostState(p, back as 'container' | 'facilitator').status === 'approved')) ? back : 'seeker'
      await supabase.rpc('switch_role', { p_role: to })
    }
    await refreshProfile()
    navigate(`/apply/status?role=${role}${update ? '&updated=1' : '&sent=1'}`, { replace: true })
    return null
  }
}

/* ---------------- Seeker ---------------- */

function SeekerWelcome() {
  const navigate = useNavigate()
  const { session, profile, updateProfile, signOut } = useAuth()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(profile?.name ?? '')
  const [photo, setPhoto] = useState(profile?.photo_url ?? '')
  const [region, setRegion] = useState(profile?.region ?? '')
  const [prefs, setPrefs] = useState<string[]>(profile?.prefs ?? [])
  const [seeking, setSeeking] = useState(profile?.seeking ?? '')
  const [lifestyle, setLifestyle] = useState<string[]>(profile?.lifestyle ?? [])
  const heard = useHeardFrom(profile?.heard_from ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const go = (n: number) => {
    if (n > step && step === 0 && !name.trim()) { setError('Please add your name.'); return }
    setError(''); setStep(n)
  }
  const finish = async () => {
    setBusy(true); setError('')
    try {
      const [photoUrl] = await uploadPhotos(session!.user.id, photo ? [photo] : [])
      const err = await updateProfile({ name: name.trim(), photo_url: photoUrl ?? '', region: region.trim(), prefs, seeking: seeking.trim().slice(0, 2000), lifestyle, heard_from: heard.value, onboarded: true })
      if (err) { setError(friendlyError(err)); setBusy(false); return }
      await refreshMatches()
      navigate(takeReturn('/discover'), { replace: true })
    } catch (e) { setError((e as Error).message); setBusy(false) }
  }

  return (
    <Wizard steps={['You', 'Your way', 'Your alignment']} step={step} setStep={go} onFinish={finish} finishLabel="Enter Xanadu" busy={busy} error={error} onSignOut={signOut}>
      {step === 0 && (
        <>
          <Title sub="A few details so Xanadu feels like yours.">Welcome, Seeker</Title>
          <AvatarPicker photo={photo} onChange={setPhoto} label="Add a photo (optional)" />
          <TextField label="Your name" value={name} onChange={setName} autoComplete="name" />
          <TextField label="Where you live (optional)" value={region} onChange={setRegion} placeholder="e.g. Denver, Colorado" />
          <HeardFrom h={heard} optional />
        </>
      )}
      {step === 1 && (
        <>
          <Title sub="Tell us the life you want and Xanadu will match you with the places that hold it.">What do <Glow>you</Glow> want?</Title>
          <LifestylePicker value={lifestyle} onChange={setLifestyle} />
        </>
      )}
      {step === 2 && (
        <>
          <Title sub="Tap everything that calls to you. Discover will show what's aligned first.">What are you <Glow>seeking</Glow>?</Title>
          <PracticePicker label="Practices" options={SEEKER_ALIGN} value={prefs} onChange={setPrefs} />
          <TextArea label="In your own words (optional)" value={seeking} onChange={setSeeking} rows={5}
            placeholder="e.g. I'd love a month-long volunteer exchange near the ocean, helping in the garden or kitchen, with daily yoga and time to surf." />
          <p className="m-0 rounded-xl bg-plum px-3.5 py-3 text-[13px] leading-normal text-muted">Xanadu's AI reads what you write and matches you with the spaces and experiences that fit best. You can change it any time from your profile.</p>
        </>
      )}
    </Wizard>
  )
}

/* ---------------- Container ---------------- */

function ContainerWelcome({ update = false }: { update?: boolean }) {
  const navigate = useNavigate()
  const { session, profile, updateProfile, signOut } = useAuth()
  const [existing, saveSpace, spaceLoading] = useSpaceProfile()
  const [step, setStep] = useState(0)
  const { adding, cancel } = useAdding()
  const after = useAfterSubmit()
  const [space, setSpace] = useState<SpaceProfile>({ ...EMPTY_SPACE, name: adding ? '' : profile?.name ?? '' })
  const [phone, setPhone] = useState('')
  const [proof, setProof] = useState('')
  const [agreed, setAgreed] = useState(false)
  // updating or reapplying: start from what they already sent
  useEffect(() => { if (!spaceLoading && existing.name) setSpace(existing) }, [spaceLoading]) // eslint-disable-line react-hooks/exhaustive-deps
  usePrivate((p) => { setProof(p.proof ?? ''); setPhone(p.phone ?? ''); setAgreed(!!p.agreed_guidelines) })
  const note = profile ? hostState(profile, 'container').note : null
  const heard = useHeardFrom(profile?.heard_from ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = <K extends keyof SpaceProfile>(k: K, v: SpaceProfile[K]) => setSpace((s) => ({ ...s, [k]: v }))

  const go = (n: number) => {
    if (n > step && step === 0 && (!space.name.trim() || !space.country.trim() || !space.town.trim())) { setError('Please add your space name, country and town.'); return }
    if (n > step && step === 0 && !adding && !update && !heard.pick) { setError('Please tell us where you heard about Xanadu.'); return }
    if (n > step && step === 1 && !space.about.trim()) { setError('Please describe your space in a few sentences.'); return }
    setError(''); setStep(n)
  }
  const finish = async () => {
    if (!proof.trim()) { setError('Please share reviews or referrals so we can welcome you.'); return }
    if (!agreed) { setError('Please agree to the community guidelines.'); return }
    setBusy(true); setError('')
    const e1 = await saveSpace(space)
    const e2 = e1 ?? await savePrivateDetails(session!.user.id, { proof: proof.trim(), phone: phone.trim(), agreed_guidelines: true })
    // a member adding a space keeps their own name and about; the space has its own
    const e3 = e2 ?? (update ? null : await updateProfile(adding ? { onboarded: true }
      : { name: space.name.trim(), town: space.town.trim(), practices: space.practices, about: space.about.trim(), heard_from: heard.value, onboarded: true }))
    const e4 = e3 ?? await after('container', update)
    if (e4) { setError(friendlyError(e4)); setBusy(false) }
  }

  return (
    <Wizard steps={['Your space', 'The spirit', 'Photos & details', 'Trust']} step={step} setStep={go} onFinish={finish} finishLabel={update ? 'Send my update' : 'Submit for review'} busy={busy} error={error} onSignOut={signOut} onCancel={update ? () => navigate('/apply/status') : cancel}>
      {step === 0 && (
        <>
          {update
            ? <UpdateTitle note={note} />
            : adding
            ? <Title sub="Your space gets its own personal review. Your Container side opens once you’re verified; everything else on your account stays as it is.">Add your space</Title>
            : <Title sub="Founding Containers join free. Every space is personally reviewed before it joins; while we review, you’ll explore Xanadu as a Seeker.">Welcome, Container</Title>}
          <ImportCard<SpaceImport> kind="space" onFilled={(f) => setSpace((s) => mergeSpace(s, f))} onPhotos={(u) => setSpace((s) => ({ ...s, photos: [...s.photos, ...u] }))} />
          <TextField label="Space name" value={space.name} onChange={(v) => set('name', v)} />
          <LocationFields value={space} onChange={(v) => setSpace((s) => ({ ...s, ...v }))} />
          <TextField label="Phone (private, for your intro call)" value={phone} onChange={setPhone} type="tel" autoComplete="tel" />
          {!adding && !update && <HeardFrom h={heard} />}
        </>
      )}
      {step === 1 && (
        <>
          <Title sub="This is what Seekers and facilitators will read first.">The spirit of the place</Title>
          <TextArea label="About your space" value={space.about} onChange={(v) => set('about', v)} rows={6} placeholder="The land, the spirit of the place and who it's for." />
          <PracticePicker label="Practices you host" options={HOST_PRACTICES} value={space.practices} onChange={(v) => set('practices', v)} />
          <LifestylePicker host value={space.lifestyle} onChange={(v) => set('lifestyle', v)} />
        </>
      )}
      {step === 2 && (
        <>
          <Title sub="Photos can be added or changed anytime from your profile.">Photos & details</Title>
          <PhotoGallery photos={space.photos} onChange={(p) => set('photos', p)} />
          <div className="grid grid-cols-2 gap-2.5">
            <TextField label="Sleeps" value={space.sleeps} onChange={(v) => set('sleeps', v)} placeholder="e.g. 16" />
            <TextField label="Practice space holds" value={space.mats} onChange={(v) => set('mats', v)} placeholder="e.g. 20 mats" />
          </div>
          <TextField label="Room types" value={space.rooms} onChange={(v) => set('rooms', v)} placeholder="e.g. Private rooms and shared dorms" />
          <TextField label="Kitchen and meals" value={space.kitchen} onChange={(v) => set('kitchen', v)} placeholder="e.g. Plant-based, on-site chef" />
          <TextField label="Getting here" value={space.gettingHere} onChange={(v) => set('gettingHere', v)} placeholder="e.g. 5 min walk to the beach" />
        </>
      )}
      {step === 3 && (
        <>
          <Title sub="Every member is welcomed personally. This stays private to the Xanadu team.">Trust & safety</Title>
          <TextArea label="Reviews or referrals (links welcome)" value={proof} onChange={setProof} rows={4} placeholder="e.g. Google or Airbnb reviews, or people who can speak to your space" />
          <Agreement checked={agreed} onChange={setAgreed} />
          <AiNotice />
        </>
      )}
    </Wizard>
  )
}

/* ---------------- Facilitator ---------------- */

function FacilitatorWelcome({ update = false }: { update?: boolean }) {
  const navigate = useNavigate()
  const { session, profile, updateProfile, signOut } = useAuth()
  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState(profile?.photo_url ?? '')
  const [name, setName] = useState(profile?.name ?? '')
  const { adding, cancel } = useAdding()
  const after = useAfterSubmit()
  // updating or reapplying: start from what they already sent (a brand-new application starts empty)
  const applied = !!profile?.facilitator_status && (update || !!profile.about)
  const [town, setTown] = useState(adding || applied ? profile?.town || profile?.region || '' : '')
  const [practices, setPractices] = useState<string[]>(applied ? profile?.practices ?? [] : [])
  const [languages, setLanguages] = useState(applied ? profile?.languages ?? '' : '')
  const [about, setAbout] = useState(applied ? profile?.about ?? '' : '')
  const [trainings, setTrainings] = useState<Training[]>(applied && profile?.trainings?.length ? profile.trainings : [{ title: '', school: '', year: '' }])
  const [refs, setRefs] = useState<Reference[]>([{ name: '', contact: '' }])
  const [insurance, setInsurance] = useState('')
  const heard = useHeardFrom(profile?.heard_from ?? '')
  const [agreed, setAgreed] = useState(false)
  usePrivate((p) => { if (p.references_list?.length) setRefs(p.references_list); setInsurance(p.insurance ?? ''); setAgreed(!!p.agreed_guidelines) })
  const note = profile ? hostState(profile, 'facilitator').note : null
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const go = (n: number) => {
    if (n > step && step === 0 && (!name.trim() || !town.trim())) { setError("Please add your name and where you're based."); return }
    if (n > step && step === 0 && !adding && !update && !heard.pick) { setError('Please tell us where you heard about Xanadu.'); return }
    if (n > step && step === 1 && (!practices.length || !about.trim())) { setError('Please choose your practices and write a few words about your work.'); return }
    setError(''); setStep(n)
  }
  const finish = async () => {
    const cleanRefs = refs.filter((r) => r.name.trim() && r.contact.trim())
    if (!cleanRefs.length) { setError('Please add at least one reference.'); return }
    if (!agreed) { setError('Please agree to the community guidelines.'); return }
    setBusy(true); setError('')
    try {
      const [photoUrl] = await uploadPhotos(session!.user.id, photo ? [photo] : [])
      const e1 = await updateProfile({
        name: name.trim(), photo_url: photoUrl ?? '', town: town.trim(), practices, languages: languages.trim(), about: about.trim(), heard_from: heard.value,
        trainings: trainings.filter((t) => t.title.trim()),
      })
      const e2 = e1 ?? await savePrivateDetails(session!.user.id, { references_list: cleanRefs, insurance: insurance.trim(), agreed_guidelines: true })
      const e3 = e2 ?? (update ? null : await updateProfile({ onboarded: true }))
      const e4 = e3 ?? await after('facilitator', update)
      if (e4) { setError(friendlyError(e4)); setBusy(false) }
    } catch (e) { setError((e as Error).message); setBusy(false) }
  }

  const ref = (i: number, k: keyof Reference, v: string) => setRefs((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  const tr = (i: number, k: keyof Training, v: string) => setTrainings((ts) => ts.map((t, j) => (j === i ? { ...t, [k]: v } : t)))

  return (
    <Wizard steps={['You', 'Your practice', 'Training', 'Trust']} step={step} setStep={go} onFinish={finish} finishLabel={update ? 'Send my update' : 'Submit for review'} busy={busy} error={error} onSignOut={signOut} onCancel={update ? () => navigate('/apply/status') : cancel}>
      {step === 0 && (
        <>
          {update
            ? <UpdateTitle note={note} />
            : adding
            ? <Title sub="Your Facilitator profile gets its own personal review. Your Facilitator side opens once you’re verified; everything else on your account stays as it is.">Guide as a Facilitator</Title>
            : <Title sub="Founding Facilitators join free. Every guide is personally reviewed before joining; while we review, you’ll explore Xanadu as a Seeker.">Welcome, Facilitator</Title>}
          <AvatarPicker photo={photo} onChange={setPhoto} />
          <TextField label="Your name" value={name} onChange={setName} autoComplete="name" />
          <TextField label="Where you're based" value={town} onChange={setTown} placeholder="e.g. Ubud, Bali" />
          {!adding && !update && <HeardFrom h={heard} />}
        </>
      )}
      {step === 1 && (
        <>
          <Title sub="Seekers find you by what you hold.">Your practice</Title>
          <PracticePicker label="What you offer" options={HOST_PRACTICES.filter((p) => p !== 'Residencies')} value={practices} onChange={setPractices} />
          <TextField label="Languages" value={languages} onChange={setLanguages} placeholder="e.g. English, Español" />
          <TextArea label="About you" value={about} onChange={setAbout} rows={6} placeholder="How you came to this work and what people can expect when they sit with you." />
        </>
      )}
      {step === 2 && (
        <>
          <Title sub="Add what you've trained in. You can add more later.">Training</Title>
          {trainings.map((t, i) => (
            <div key={i} className="flex flex-col gap-2.5 rounded-2xl border border-line p-3.5">
              <div className="flex items-center justify-between"><span className="text-[13px] text-subtle">{`Training ${i + 1}`}</span>
                {trainings.length > 1 && <button type="button" aria-label={`Remove training ${i + 1}`} onClick={() => setTrainings((ts) => ts.filter((_, j) => j !== i))} className="flex h-9 w-9 items-center justify-center rounded-full text-subtle"><IconClose size={16} /></button>}</div>
              <TextField label="Certification or training" value={t.title} onChange={(v) => tr(i, 'title', v)} />
              <div className="grid grid-cols-[1fr_90px] gap-2.5">
                <TextField label="School" value={t.school} onChange={(v) => tr(i, 'school', v)} />
                <TextField label="Year" value={t.year} onChange={(v) => tr(i, 'year', v)} />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setTrainings((ts) => [...ts, { title: '', school: '', year: '' }])} className="min-h-12 rounded-[14px] border border-dashed border-slate text-sm text-gold-pale">+ Add another training</button>
        </>
      )}
      {step === 3 && (
        <>
          <Title sub="Private to the Xanadu team, never shown on your profile.">Trust & safety</Title>
          {refs.map((r, i) => (
            <div key={i} className="flex flex-col gap-2.5 rounded-2xl border border-line p-3.5">
              <div className="flex items-center justify-between"><span className="text-[13px] text-subtle">{`Reference ${i + 1}`}</span>
                {refs.length > 1 && <button type="button" aria-label={`Remove reference ${i + 1}`} onClick={() => setRefs((rs) => rs.filter((_, j) => j !== i))} className="flex h-9 w-9 items-center justify-center rounded-full text-subtle"><IconClose size={16} /></button>}</div>
              <TextField label="Name" value={r.name} onChange={(v) => ref(i, 'name', v)} />
              <TextField label="Email or phone" value={r.contact} onChange={(v) => ref(i, 'contact', v)} />
            </div>
          ))}
          {refs.length < 3 && <button type="button" onClick={() => setRefs((rs) => [...rs, { name: '', contact: '' }])} className="min-h-12 rounded-[14px] border border-dashed border-slate text-sm text-gold-pale">{`+ Add reference (${refs.length} of 3)`}</button>}
          <Field label="Insurance (optional)"><input value={insurance} onChange={(e) => setInsurance(e.target.value)} placeholder="Provider and policy, if you have it" className={inputCls} /></Field>
          <Agreement checked={agreed} onChange={setAgreed} />
          <AiNotice />
        </>
      )}
    </Wizard>
  )
}

/** Top of the form when the team has asked for changes: their note, then the form as they left it. */
function UpdateTitle({ note }: { note: string | null }) {
  return (
    <>
      <Title sub="Everything you sent is here. Change what the team asked for, then send it back.">Update your application</Title>
      {note && (
        <div className="ring-iri flex flex-col gap-1 rounded-2xl bg-plum/50 px-4 py-3.5">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-gold-soft uppercase">A note from the Xanadu team</span>
          <p className="selectable m-0 text-[15px] leading-relaxed whitespace-pre-line text-text">{note}</p>
        </div>
      )}
    </>
  )
}

/** /apply/update: the application form, filled in, for answering the team's change request. */
export function ApplicationUpdate() {
  const { profile } = useAuth()
  const [params] = useSearchParams()
  if (!profile) return <Loading />
  const asked = params.get('role')
  const role = asked === 'container' || asked === 'facilitator' ? asked
    : profile.container_status === 'pending' && (profile.container_changes || profile.facilitator_status !== 'pending') ? 'container' : 'facilitator'
  if (hostState(profile, role).status !== 'pending') return <Navigate to="/apply/status" replace />
  return role === 'container' ? <ContainerWelcome update /> : <FacilitatorWelcome update />
}

/** /welcome: the right setup flow for the member's role. */
export default function Welcome() {
  const { session, profile, loading } = useAuth()
  if (loading) return <Loading />
  if (!session) return <Navigate to="/" replace />
  if (!profile) return <Loading label="Setting up your account…" />
  if (profile.onboarded) return <Navigate to={HOME[profile.role]} replace />
  return profile.role === 'container' ? <ContainerWelcome /> : profile.role === 'facilitator' ? <FacilitatorWelcome /> : <SeekerWelcome />
}

