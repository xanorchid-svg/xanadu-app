import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AvatarPicker, LocationFields, PhotoGallery, PracticePicker, TextArea, TextField } from '../components/edit'
import { IconClose } from '../components/icons'
import { Field, inputCls } from '../components/ui'
import { HOME, Loading, takeReturn, useAuth } from '../auth'
import { PRACTICES, SEEKER_ALIGN } from '../data'
import { refreshMatches } from '../matching'
import { EMPTY_SPACE, savePrivateDetails, uploadPhotos, useSpaceProfile, type Reference, type SpaceProfile, type Training } from '../store'
import { friendlyError } from '../lib/supabase'

const HOST_PRACTICES = PRACTICES.filter((p) => p !== 'Trainings')

/** Shared frame for every setup flow: progress, a scrolling step, Back / Continue. */
function Wizard({ steps, step, setStep, onFinish, finishLabel, busy, error, children, onSignOut }: {
  steps: string[]; step: number; setStep: (n: number) => void; onFinish: () => void; finishLabel: string
  busy: boolean; error: string; children: ReactNode; onSignOut: () => void
}) {
  const last = step === steps.length - 1
  return (
    <div className="flex h-full flex-col bg-navy">
      <header className="flex flex-col gap-3 border-b border-[#1F2B3E] px-5 pt-safe pb-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-subtle">{`Step ${step + 1} of ${steps.length} · ${steps[step]}`}</span>
          <button type="button" onClick={onSignOut} className="min-h-10 text-[13px] text-subtle">Sign out</button>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((s, i) => <span key={s} className={`h-1 rounded-full ${i <= step ? 'bg-gold' : 'bg-line'}`} />)}
        </div>
      </header>
      <main key={step} className="xa-page flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">{children}</main>
      <footer className="border-t border-[#1F2B3E] bg-navy-deep px-5 pt-3.5 pb-safe">
        {error && <p role="alert" className="m-0 mb-2.5 text-center text-[13px] text-gold-pale">{error}</p>}
        <div className="flex gap-2.5">
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="min-h-[54px] rounded-2xl border border-line-2 px-5 text-[15px] text-text">Back</button>}
          <button type="button" disabled={busy} onClick={last ? onFinish : () => setStep(step + 1)}
            className="min-h-[54px] flex-1 rounded-2xl bg-gold text-[15px] font-semibold text-navy disabled:opacity-70">
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
      const err = await updateProfile({ name: name.trim(), photo_url: photoUrl ?? '', region: region.trim(), prefs, seeking: seeking.trim().slice(0, 2000), onboarded: true })
      if (err) { setError(friendlyError(err)); setBusy(false); return }
      await refreshMatches()
      navigate(takeReturn('/discover'), { replace: true })
    } catch (e) { setError((e as Error).message); setBusy(false) }
  }

  return (
    <Wizard steps={['You', 'Your alignment']} step={step} setStep={go} onFinish={finish} finishLabel="Enter Xanadu" busy={busy} error={error} onSignOut={signOut}>
      {step === 0 && (
        <>
          <Title sub="A few details so Xanadu feels like yours.">Welcome, Seeker</Title>
          <AvatarPicker photo={photo} onChange={setPhoto} label="Add a photo (optional)" />
          <TextField label="Your name" value={name} onChange={setName} autoComplete="name" />
          <TextField label="Where you live (optional)" value={region} onChange={setRegion} placeholder="e.g. Denver, Colorado" />
        </>
      )}
      {step === 1 && (
        <>
          <Title sub="Tap everything that calls to you. Discover will show what's aligned first.">What are you seeking?</Title>
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

function ContainerWelcome() {
  const navigate = useNavigate()
  const { session, profile, updateProfile, signOut } = useAuth()
  const [, saveSpace] = useSpaceProfile()
  const [step, setStep] = useState(0)
  const [space, setSpace] = useState<SpaceProfile>({ ...EMPTY_SPACE, name: profile?.name ?? '' })
  const [phone, setPhone] = useState('')
  const [proof, setProof] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = <K extends keyof SpaceProfile>(k: K, v: SpaceProfile[K]) => setSpace((s) => ({ ...s, [k]: v }))

  const go = (n: number) => {
    if (n > step && step === 0 && (!space.name.trim() || !space.country.trim() || !space.town.trim())) { setError('Please add your space name, country and town.'); return }
    if (n > step && step === 1 && !space.about.trim()) { setError('Please describe your space in a few sentences.'); return }
    setError(''); setStep(n)
  }
  const finish = async () => {
    if (!proof.trim()) { setError('Please share reviews or referrals so we can welcome you.'); return }
    if (!agreed) { setError('Please agree to the community guidelines.'); return }
    setBusy(true); setError('')
    const e1 = await saveSpace(space)
    const e2 = e1 ?? await savePrivateDetails(session!.user.id, { proof: proof.trim(), phone: phone.trim(), agreed_guidelines: true })
    const e3 = e2 ?? await updateProfile({ name: space.name.trim(), town: space.town.trim(), practices: space.practices, about: space.about.trim(), onboarded: true })
    if (e3) { setError(friendlyError(e3)); setBusy(false); return }
    navigate('/container', { replace: true })
  }

  return (
    <Wizard steps={['Your space', 'The spirit', 'Photos & details', 'Trust']} step={step} setStep={go} onFinish={finish} finishLabel="Submit for review" busy={busy} error={error} onSignOut={signOut}>
      {step === 0 && (
        <>
          <Title sub="Founding Containers join free. Let's set up your space.">Welcome, Container</Title>
          <TextField label="Space name" value={space.name} onChange={(v) => set('name', v)} />
          <LocationFields value={space} onChange={(v) => setSpace((s) => ({ ...s, ...v }))} />
          <TextField label="Phone (private, for your intro call)" value={phone} onChange={setPhone} type="tel" autoComplete="tel" />
        </>
      )}
      {step === 1 && (
        <>
          <Title sub="This is what Seekers and facilitators will read first.">The spirit of the place</Title>
          <TextArea label="About your space" value={space.about} onChange={(v) => set('about', v)} rows={6} placeholder="The land, the spirit of the place and who it's for." />
          <PracticePicker label="Practices you host" options={HOST_PRACTICES} value={space.practices} onChange={(v) => set('practices', v)} />
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

function FacilitatorWelcome() {
  const navigate = useNavigate()
  const { session, profile, updateProfile, signOut } = useAuth()
  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState(profile?.photo_url ?? '')
  const [name, setName] = useState(profile?.name ?? '')
  const [town, setTown] = useState('')
  const [practices, setPractices] = useState<string[]>([])
  const [languages, setLanguages] = useState('')
  const [about, setAbout] = useState('')
  const [trainings, setTrainings] = useState<Training[]>([{ title: '', school: '', year: '' }])
  const [refs, setRefs] = useState<Reference[]>([{ name: '', contact: '' }])
  const [insurance, setInsurance] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const go = (n: number) => {
    if (n > step && step === 0 && (!name.trim() || !town.trim())) { setError("Please add your name and where you're based."); return }
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
        name: name.trim(), photo_url: photoUrl ?? '', town: town.trim(), practices, languages: languages.trim(), about: about.trim(),
        trainings: trainings.filter((t) => t.title.trim()),
      })
      const e2 = e1 ?? await savePrivateDetails(session!.user.id, { references_list: cleanRefs, insurance: insurance.trim(), agreed_guidelines: true })
      const e3 = e2 ?? await updateProfile({ onboarded: true })
      if (e3) { setError(friendlyError(e3)); setBusy(false); return }
      navigate('/facilitator', { replace: true })
    } catch (e) { setError((e as Error).message); setBusy(false) }
  }

  const ref = (i: number, k: keyof Reference, v: string) => setRefs((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  const tr = (i: number, k: keyof Training, v: string) => setTrainings((ts) => ts.map((t, j) => (j === i ? { ...t, [k]: v } : t)))

  return (
    <Wizard steps={['You', 'Your practice', 'Training', 'Trust']} step={step} setStep={go} onFinish={finish} finishLabel="Submit for review" busy={busy} error={error} onSignOut={signOut}>
      {step === 0 && (
        <>
          <Title sub="Founding Facilitators join free. Let's introduce you.">Welcome, Facilitator</Title>
          <AvatarPicker photo={photo} onChange={setPhoto} />
          <TextField label="Your name" value={name} onChange={setName} autoComplete="name" />
          <TextField label="Where you're based" value={town} onChange={setTown} placeholder="e.g. Ubud, Bali" />
        </>
      )}
      {step === 1 && (
        <>
          <Title sub="Seekers find you by what you hold.">Your practice</Title>
          <PracticePicker label="What you offer" options={HOST_PRACTICES} value={practices} onChange={setPractices} />
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

/** /welcome: the right setup flow for the member's role. */
export default function Welcome() {
  const { session, profile, loading } = useAuth()
  if (loading) return <Loading />
  if (!session) return <Navigate to="/" replace />
  if (!profile) return <Loading label="Setting up your account…" />
  if (profile.onboarded) return <Navigate to={HOME[profile.role]} replace />
  return profile.role === 'container' ? <ContainerWelcome /> : profile.role === 'facilitator' ? <FacilitatorWelcome /> : <SeekerWelcome />
}

