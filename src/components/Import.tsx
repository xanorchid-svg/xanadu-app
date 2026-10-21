import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { inputCls } from './ui'

/**
 * "Fill this in for me": paste a website or choose a photo of a flyer, and Xanadu's AI reads it and fills in the form.
 * The member checks every field before submitting, and the Xanadu team still reviews it.
 * Runs in the import-listing edge function (Claude), which also keeps a monthly spend limit.
 */

export type SpaceImport = {
  name?: string; country?: string; region?: string; town?: string; about?: string; practices?: string[]
  takes_part?: string[]; landscapes?: string[]; remote_work?: boolean; sleeps?: string; rooms?: string; mats?: string
  kitchen?: string; getting_here?: string; volunteer_exchange?: boolean; volunteer_details?: string
}
export type OfferingImport = {
  title?: string; format?: 'Retreat' | 'Training' | 'Drop-in'; practices?: string[]; description?: string
  start_date?: string; end_date?: string; spots?: number; price_usd?: number; price_note?: string
  included?: Partial<Record<'stay' | 'meals' | 'schedule' | 'outings' | 'transport', boolean>>
  volunteer_exchange?: boolean; volunteer_details?: string
}
type Result<F> = { fields: F; photos: string[]; notes: string }

/** Turns a chosen flyer photo into a small JPEG for the AI to read (keeps uploads quick on phones). */
export function flyerFromFile(file: File, max = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.85).split(',')[1])
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as a photo.')) }
    img.src = url
  })
}

export async function call<T>(body: object): Promise<{ data?: T; error?: string }> {
  const { data, error } = await supabase.functions.invoke('import-listing', { body })
  if (!error) return { data: data as T }
  // the function explains what went wrong in plain words
  const ctx = (error as { context?: Response }).context
  const msg = ctx && typeof ctx.json === 'function' ? (await ctx.json().catch(() => null))?.error : null
  return { error: msg || "We couldn't read that just now. Please try again, or fill this in by hand." }
}

export function ImportCard<F extends SpaceImport | OfferingImport>({ kind, onFilled, onPhotos }: {
  kind: 'space' | 'offering'
  onFilled: (fields: F) => void
  /** spaces only: photos from the website the member chose to add */
  onPhotos?: (urls: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState<'' | 'read' | 'photos'>('')
  const [error, setError] = useState('')
  const [done, setDone] = useState<Result<F> | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [own, setOwn] = useState(false)
  const [added, setAdded] = useState(0)
  const file = useRef<HTMLInputElement>(null)

  const read = async (input: { url?: string; image?: { data: string; media_type: string } }) => {
    setBusy('read'); setError(''); setDone(null); setAdded(0)
    const { data, error: err } = await call<Result<F>>({ kind, ...input })
    setBusy('')
    if (err || !data) { setError(err ?? 'Please try again.'); return }
    onFilled(data.fields)
    setDone(data)
    setPicked(data.photos)
  }
  const fromFlyer = async (f?: File) => {
    if (!f) return
    try { read({ image: { data: await flyerFromFile(f), media_type: 'image/jpeg' } }) } catch (e) { setError((e as Error).message) }
  }
  const addPhotos = async () => {
    if (!picked.length || !onPhotos) return
    setBusy('photos'); setError('')
    const { data, error: err } = await call<{ photos: string[] }>({ action: 'photos', urls: picked })
    setBusy('')
    if (err || !data) { setError(err ?? 'The photos could not be added.'); return }
    if (!data.photos.length) { setError("Those photos couldn't be copied. You can add photos from your phone instead."); return }
    onPhotos(data.photos)
    setAdded(data.photos.length)
  }

  const what = kind === 'space' ? 'your space' : 'your event'
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="ring-iri flex min-h-[64px] items-center gap-3 rounded-2xl bg-plum/50 px-4 py-3 text-left">
        <span aria-hidden className="text-iri text-xl">✦</span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-ink">Fill this in for me</span>
          <span className="text-[13px] leading-snug text-subtle">{`Paste your website or upload a flyer. Xanadu reads it and fills in ${what} for you to check.`}</span>
        </span>
        <span aria-hidden className="text-gold-pale">›</span>
      </button>
    )
  }

  return (
    <section className="ring-iri flex flex-col gap-3 rounded-2xl bg-plum/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-ink">Fill this in for me</span>
          <span className="text-[13px] leading-snug text-subtle">Xanadu's AI reads it and fills in the form. Check every field before you submit.</span>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="min-h-9 text-[13px] text-subtle">Close</button>
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (url.trim()) read({ url: url.trim() }) }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" autoCapitalize="off" autoCorrect="off" aria-label="Your website"
          placeholder={kind === 'space' ? 'yourspace.com' : 'Link to the event page'} className={`${inputCls} min-w-0 flex-1`} />
        <button type="submit" disabled={!!busy || !url.trim()} className="min-h-12 flex-none rounded-xl bg-iri px-4 text-[14px] font-semibold text-navy disabled:opacity-60">
          {busy === 'read' ? 'Reading…' : 'Read it'}
        </button>
      </form>
      <button type="button" disabled={!!busy} onClick={() => file.current?.click()} className="min-h-11 rounded-xl border border-dashed border-slate text-[14px] text-gold-pale">
        {kind === 'space' ? 'Or upload a flyer or screenshot' : 'Or upload the flyer'}
      </button>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { fromFlyer(e.target.files?.[0]); e.target.value = '' }} />
      {busy === 'read' && <p className="m-0 text-[13px] text-muted">Reading it now. This takes about 15 seconds.</p>}
      {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}

      {done && (
        <div className="flex flex-col gap-2.5">
          <p className="m-0 rounded-xl bg-surface px-3.5 py-3 text-[13px] leading-normal text-text">
            Done. We filled in what we found. Please read through and fix anything that isn't quite right.
            {done.notes && <span className="mt-1 block text-subtle">{done.notes}</span>}
            {kind === 'offering' && (done.fields as OfferingImport).price_note && <span className="mt-1 block text-subtle">{`Price on the flyer: ${(done.fields as OfferingImport).price_note}`}</span>}
          </p>
          {onPhotos && done.photos.length > 0 && !added && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] text-muted">Photos from your website. Tap to choose.</span>
              <div className="grid grid-cols-4 gap-1.5">
                {done.photos.map((p) => {
                  const on = picked.includes(p)
                  return (
                    <button key={p} type="button" aria-pressed={on} onClick={() => setPicked((xs) => (on ? xs.filter((x) => x !== p) : [...xs, p]))}
                      className={`relative aspect-square overflow-hidden rounded-lg ${on ? 'ring-2 ring-gold' : 'opacity-50'}`}>
                      <img src={p} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    </button>
                  )
                })}
              </div>
              <label className="flex items-start gap-2.5 text-[13px] leading-snug text-text">
                <input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-[#B89567]" />
                <span>These are my photos, or I have permission to use them.</span>
              </label>
              <button type="button" disabled={!own || !picked.length || !!busy} onClick={addPhotos}
                className="min-h-11 rounded-xl bg-iri text-[14px] font-semibold text-navy disabled:opacity-50">
                {busy === 'photos' ? 'Adding photos…' : `Add ${picked.length} photo${picked.length === 1 ? '' : 's'}`}
              </button>
            </div>
          )}
          {added > 0 && <p className="m-0 text-[13px] text-muted">{`${added} photo${added === 1 ? '' : 's'} added. You'll see them with your photos.`}</p>}
        </div>
      )}
    </section>
  )
}

/** Merges what was read from a website into a space form: filled values win, lists are combined. */
export function mergeSpace<S extends {
  name: string; country: string; region: string; town: string; about: string; practices: string[]; lifestyle: string[]
  sleeps: string; rooms: string; mats: string; kitchen: string; gettingHere: string; volunteerExchange: boolean; volunteerDetails: string
}>(s: S, f: SpaceImport): S {
  const t = (v: string | undefined, old: string) => (v && v.trim() ? v.trim() : old)
  const life = [...(f.takes_part ?? []), ...(f.landscapes ?? []), ...(f.remote_work ? ['Work remotely'] : [])]
  return {
    ...s,
    name: t(f.name, s.name), country: t(f.country, s.country), region: t(f.region, s.region), town: t(f.town, s.town),
    about: t(f.about, s.about), sleeps: t(f.sleeps, s.sleeps), rooms: t(f.rooms, s.rooms), mats: t(f.mats, s.mats),
    kitchen: t(f.kitchen, s.kitchen), gettingHere: t(f.getting_here, s.gettingHere),
    practices: [...new Set([...s.practices, ...(f.practices ?? [])])],
    lifestyle: [...new Set([...s.lifestyle, ...life])],
    volunteerExchange: s.volunteerExchange || !!f.volunteer_exchange,
    volunteerDetails: t(f.volunteer_details, s.volunteerDetails),
  }
}
