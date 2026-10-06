import { useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chip, Field, inputCls } from './ui'
import { IconClose, IconPhoto } from './icons'
import { photoFromFile } from '../store'
import { supabase } from '../lib/supabase'
import { DESTINATIONS } from '../data'
import { useAuth } from '../auth'

export function TextField({ label, value, onChange, placeholder, type = 'text', autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoComplete?: string
}) {
  return <Field label={label}><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} className={inputCls} /></Field>
}

export function TextArea({ label, value, onChange, placeholder, rows = 4 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return <Field label={label}><textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} resize-none py-3 leading-relaxed`} /></Field>
}

export function PracticePicker({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (p: string) => onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value, p])
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">{options.map((p) => <Chip key={p} on={value.includes(p)} onClick={() => toggle(p)}>{p}</Chip>)}</div>
    </div>
  )
}

/** Hidden file input + a function that opens the phone's photo picker. */
function usePhotoInput(onPick: (dataUrls: string[]) => void, multiple = false) {
  const ref = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const input = (
    <input ref={ref} type="file" accept="image/*" multiple={multiple} className="hidden"
      onChange={async (e) => {
        const files = Array.from(e.target.files ?? [])
        e.target.value = ''
        if (!files.length) return
        try { setError(''); onPick(await Promise.all(files.map((f) => photoFromFile(f)))) }
        catch (err) { setError((err as Error).message) }
      }} />
  )
  return { open: () => ref.current?.click(), input, error }
}

/** Round profile photo that opens the photo picker when tapped. */
export function AvatarPicker({ photo, onChange, size = 104, label = 'Add photo' }: { photo: string; onChange: (p: string) => void; size?: number; label?: string }) {
  const { open, input, error } = usePhotoInput((urls) => onChange(urls[0]))
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button type="button" onClick={open} aria-label={photo ? 'Change photo' : label}
        className="relative flex items-center justify-center overflow-hidden rounded-full border border-dashed border-slate text-[13px] text-subtle"
        style={{ width: size, height: size }}>
        {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : label}
        {photo && <span className="absolute inset-x-0 bottom-0 bg-navy/70 py-1 text-[11px] text-text">Change</span>}
      </button>
      {input}
      {error && <span className="text-xs text-gold-pale">{error}</span>}
    </div>
  )
}

/** Grid of photos with add and remove, for a space. */
export function PhotoGallery({ photos, onChange, max = 8 }: { photos: string[]; onChange: (p: string[]) => void; max?: number }) {
  const { open, input, error } = usePhotoInput((urls) => onChange([...photos, ...urls].slice(0, max)), true)
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] text-muted">{`Photos (${photos.length} of ${max})`}</span>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-surface">
            <img src={p} alt={`Space photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute top-1.5 left-1.5 rounded-full bg-navy/75 px-2 py-0.5 text-[10px] text-text">Cover</span>}
            <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-navy/80 text-text"><IconClose size={14} /></button>
          </div>
        ))}
        {photos.length < max && (
          <button type="button" onClick={open} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate text-xs text-subtle">
            <IconPhoto />Add
          </button>
        )}
      </div>
      {input}
      {error && <span className="text-xs text-gold-pale">{error}</span>}
    </div>
  )
}

/** Opens the photo picker and adds photos straight to the profile (used on the view screens). */
export function AddPhotosButton({ onAdd, children, className = '' }: { onAdd: (urls: string[]) => void; children: ReactNode; className?: string }) {
  const { open, input } = usePhotoInput(onAdd, true)
  return <><button type="button" onClick={open} className={className}>{children}</button>{input}</>
}

/** Fixed footer used while editing a profile. */
export function EditFooter({ onCancel, onSave, error, busy = false }: { onCancel: () => void; onSave: () => void; error?: string; busy?: boolean }) {
  return (
    <div className="border-t border-[#1F2B3E] bg-navy-deep px-5 pt-3.5 pb-[max(30px,env(safe-area-inset-bottom))]">
      {error && <p role="alert" className="m-0 mb-2 text-center text-[13px] text-gold-pale">{error}</p>}
      <div className="flex gap-2.5">
        <button type="button" onClick={onCancel} className="min-h-[54px] rounded-2xl border border-line-2 px-5 text-[15px] text-text">Cancel</button>
        <button type="button" disabled={busy} onClick={onSave} className="min-h-[54px] flex-1 rounded-2xl bg-gold text-[15px] font-semibold text-navy disabled:opacity-70">{busy ? 'Saving…' : 'Save changes'}</button>
      </div>
    </div>
  )
}


/** Sign out and Delete my account, shown at the bottom of every profile page. */
export function SignOutButton() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [step, setStep] = useState<'idle' | 'confirm' | 'deleting'>('idle')
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')

  const remove = async () => {
    setStep('deleting'); setError('')
    const { error } = await supabase.functions.invoke('delete-account', { body: { confirm: 'DELETE' } })
    if (error) { setError("We couldn't delete your account. Please try again, or write to us and we'll do it for you."); setStep('confirm'); return }
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={async () => { await signOut(); navigate('/', { replace: true }) }}
        className="min-h-12 w-full rounded-2xl border border-line-2 text-[15px] text-muted">Sign out</button>
      {step === 'idle' ? (
        <button type="button" onClick={() => setStep('confirm')} className="min-h-10 self-center text-[13px] text-subtle">Delete my account</button>
      ) : (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-gold/50 p-4">
          <span className="text-[15px] font-semibold text-ink">Delete your account?</span>
          <span className="text-[13px] leading-normal text-muted">This permanently removes your profile, photos, messages, saved items and connections, and any space or offerings you host. It can't be undone.</span>
          <label className="flex flex-col gap-1.5 text-[13px] text-muted">Type DELETE to confirm
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="characters" autoComplete="off" className={inputCls} />
          </label>
          {error && <span role="alert" className="text-[13px] text-gold-pale">{error}</span>}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setStep('idle'); setTyped(''); setError('') }} className="min-h-11 flex-1 rounded-xl border border-line-2 text-[13px] text-muted">Keep my account</button>
            <button type="button" disabled={typed.trim().toUpperCase() !== 'DELETE' || step === 'deleting'} onClick={remove}
              className="min-h-11 flex-1 rounded-xl bg-gold text-[13px] font-semibold text-navy disabled:opacity-50">{step === 'deleting' ? 'Deleting…' : 'Delete forever'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Where a space is: country (from the destinations list, or typed), region and town. */
export function LocationFields({ value, onChange }: { value: { country: string; region: string; town: string }; onChange: (v: { country: string; region: string; town: string }) => void }) {
  const known = DESTINATIONS.find((d) => d.country === value.country)
  const [other, setOther] = useState(!!value.country && !known)
  const regions = known?.regions ?? []
  const listId = `regions-${(value.country || 'other').replace(/\s+/g, '-')}`
  return (
    <div className="flex flex-col gap-3">
      <Field label="Country">
        <select value={other ? '__other' : value.country}
          onChange={(e) => { const v = e.target.value; if (v === '__other') { setOther(true); onChange({ ...value, country: '' }) } else { setOther(false); onChange({ ...value, country: v }) } }}
          className={`${inputCls} [color-scheme:dark]`}>
          <option value="" disabled>Choose a country</option>
          {DESTINATIONS.map((d) => <option key={d.country} value={d.country}>{d.country}</option>)}
          <option value="__other">Another country…</option>
        </select>
      </Field>
      {other && <TextField label="Which country?" value={value.country} onChange={(v) => onChange({ ...value, country: v })} placeholder="e.g. Thailand" />}
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="State, province or island">
          <input list={listId} value={value.region} onChange={(e) => onChange({ ...value, region: e.target.value })} placeholder={regions[0] ? `e.g. ${regions[0]}` : 'e.g. Bali'} className={inputCls} />
          <datalist id={listId}>{regions.map((r) => <option key={r} value={r} />)}</datalist>
        </Field>
        <TextField label="Town" value={value.town} onChange={(v) => onChange({ ...value, town: v })} placeholder="e.g. Nosara" />
      </div>
    </div>
  )
}
