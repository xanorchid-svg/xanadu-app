import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Chip, Field, inputCls } from '../../components/ui'
import { IconClose } from '../../components/icons'
import { call } from '../../components/Import'
import { useAuth } from '../../auth'
import { photoFromFile, uploadPhotos } from '../../store'
import { EMPTY_EVENT, EVENT_TAGS, shareEvent, useMySharedEvents, whenLabel, type EventDraft } from '../../events'

type Read = { fields: Partial<EventDraft> & { aligned?: boolean }; notes: string }
const STATUS: Record<string, [string, string]> = {
  pending: ['With the team', 'border-gold/60 text-gold-pale'],
  live: ['On the calendar', 'border-calm/60 text-calm-text'],
  declined: ['Not added', 'border-line-2 text-subtle'],
}

/**
 * Share an event you saw: choose a photo of the poster or paste the message, and Xanadu reads it and fills in the details.
 * You check them, send it, and after a quick look from the team it appears on the Calendar as a community event.
 * Without the AI reader switched on, the same form is filled in by hand.
 */
export default function ShareEvent() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const file = useRef<HTMLInputElement>(null)
  const { mine, reload } = useMySharedEvents()
  const [poster, setPoster] = useState('') // data URL until it's uploaded
  const [text, setText] = useState('')
  const [d, setD] = useState<EventDraft>(EMPTY_EVENT)
  const [form, setForm] = useState(false)
  const [reading, setReading] = useState(false)
  const [note, setNote] = useState('')
  const [aligned, setAligned] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const set = <K extends keyof EventDraft>(k: K, v: EventDraft[K]) => setD((x) => ({ ...x, [k]: v }))

  const pickPoster = async (f?: File) => {
    if (!f) return
    try { setError(''); setPoster(await photoFromFile(f, 1600)) } catch (e) { setError((e as Error).message) }
  }

  const read = async () => {
    if (!poster && !text.trim()) { setError('Choose a poster photo or paste the message first.'); return }
    setReading(true); setError(''); setNote('')
    const { data, error: err } = await call<Read>({ kind: 'event', text: text.trim() || undefined, image: poster ? { data: poster.split(',')[1], media_type: 'image/jpeg' } : undefined })
    setReading(false)
    setForm(true)
    if (err || !data) {
      setNote(/switched on/i.test(err ?? '') ? 'Reading posters isn’t switched on yet, so please fill in the details below.' : `${err ?? 'We couldn’t read that.'} You can fill in the details below.`)
      if (text.trim() && !d.description) set('description', text.trim().slice(0, 2000))
      return
    }
    const f = data.fields
    const date = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null)
    setD((x) => ({
      ...x,
      title: f.title?.trim() || x.title, description: f.description?.trim() || x.description,
      start_date: date(f.start_date ?? undefined) ?? x.start_date, end_date: date(f.end_date ?? undefined) ?? x.end_date,
      start_time: f.start_time?.trim() || x.start_time, end_time: f.end_time?.trim() || x.end_time,
      venue: f.venue?.trim() || x.venue, town: f.town?.trim() || x.town, price_note: f.price_note?.trim() || x.price_note,
      contact: f.contact?.trim() || x.contact, link: f.link?.trim() || x.link,
      tags: (f.tags ?? []).filter((t) => (EVENT_TAGS as readonly string[]).includes(t)),
    }))
    setAligned(typeof f.aligned === 'boolean' ? f.aligned : null)
    setNote(data.notes ? `Check the details below. ${data.notes}` : 'Check the details below, then share it.')
  }

  const submit = async () => {
    setError('')
    if (!d.title.trim()) { setError('Please add the name of the event.'); return }
    if (!d.start_date) { setError('Please add the date.'); return }
    if (!d.venue.trim() && !d.town.trim()) { setError('Please add where it is.'); return }
    setBusy(true)
    let photo = ''
    try { if (poster) [photo] = await uploadPhotos(session!.user.id, [poster]) } catch { setBusy(false); setError('We couldn’t upload the poster. Please try again.'); return }
    const { error: err } = await shareEvent(session!.user.id, {
      ...d, title: d.title.trim(), description: d.description.trim(), venue: d.venue.trim(), town: d.town.trim(),
      price_note: d.price_note.trim(), contact: d.contact.trim(), link: d.link.trim(), photo_url: photo, aligned,
      end_date: d.end_date && d.start_date && d.end_date >= d.start_date ? d.end_date : null,
    })
    setBusy(false)
    if (err) { setError(err); return }
    setSent(true); reload()
  }

  const again = () => { setPoster(''); setText(''); setD(EMPTY_EVENT); setForm(false); setNote(''); setAligned(null); setSent(false); setError('') }
  const close = () => (window.history.length > 1 ? navigate(-1) : navigate('/calendar'))
  const h1 = 'm-0 font-display text-[32px] leading-[1.05] font-medium text-ink'

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-[#1F2B3E] px-5 pt-safe pb-3.5">
        <button type="button" aria-label="Close" onClick={close} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text"><IconClose /></button>
        <span className="text-[13px] text-subtle">Community event</span>
        <span className="w-11" />
      </header>

      <main className="xa-page flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 py-[22px]">
        {sent ? (
          <div className="flex flex-col gap-4">
            <h1 className={h1}>Thank you ✦</h1>
            <p className="m-0 text-[15px] leading-relaxed text-muted">The Xanadu team takes a quick look, then it appears on the Calendar for members nearby as a community event. We’ll let you know when it’s up.</p>
            <button type="button" onClick={again} className="min-h-[52px] rounded-2xl bg-iri text-[15px] font-semibold text-navy">Share another event</button>
            <Link to="/calendar" className="flex min-h-[52px] items-center justify-center rounded-2xl border border-line-2 text-[15px] text-text no-underline">Back to the calendar</Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h1 className={h1}>Share an event</h1>
              <p className="m-0 text-[14px] leading-relaxed text-muted">Saw a poster or a message about a gathering nearby? Share it here. Yoga, breathwork, sound healing, dance, circles, embodiment and the like.</p>
            </div>

            {/* 1. the poster or the message */}
            <button type="button" onClick={() => file.current?.click()}
              className="relative flex min-h-[150px] items-center justify-center overflow-hidden rounded-[18px] border border-dashed border-slate bg-surface/50 text-[14px] text-subtle">
              {poster ? <img decoding="async" src={poster} alt="The poster" className="max-h-[320px] w-full object-contain" /> : <span className="flex flex-col items-center gap-1"><span className="text-2xl">＋</span>Choose a photo or screenshot of the poster</span>}
              {poster && <span className="absolute right-2 bottom-2 rounded-full bg-navy/80 px-3 py-1 text-[12px] text-text">Change</span>}
            </button>
            <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { pickPoster(e.target.files?.[0]); e.target.value = '' }} />
            <Field label="Or paste the message">
              <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the text from the group chat" className={`${inputCls} resize-none py-3`} />
            </Field>
            {!form && (
              <div className="flex flex-col gap-2">
                <button type="button" disabled={reading} onClick={read} className="min-h-[52px] rounded-2xl bg-iri text-[15px] font-semibold text-navy disabled:opacity-70">{reading ? 'Reading it…' : 'Read it for me'}</button>
                <button type="button" onClick={() => { setForm(true); if (text.trim()) set('description', text.trim().slice(0, 2000)) }} className="min-h-11 text-[13px] text-subtle">Fill it in myself</button>
              </div>
            )}

            {/* 2. the details, checked by the member */}
            {form && (
              <>
                {note && <p className="m-0 rounded-xl bg-surface px-3.5 py-3 text-[13px] leading-normal text-muted">{note}</p>}
                {aligned === false && (
                  <p className="m-0 rounded-xl border border-gold/50 px-3.5 py-3 text-[13px] leading-normal text-gold-pale">
                    This doesn’t look like a wellness, healing or movement gathering. Xanadu’s community calendar is for things like yoga, breathwork, sound healing, dance and circles. You can still send it, and the team will decide.
                  </p>
                )}
                <Field label="Name of the event"><input value={d.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Full Moon Sound Bath" className={inputCls} /></Field>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Date"><input type="date" value={d.start_date ?? ''} onChange={(e) => set('start_date', e.target.value || null)} className={`${inputCls} px-3 text-sm [color-scheme:dark]`} /></Field>
                  <Field label="Ends (optional)"><input type="date" value={d.end_date ?? ''} min={d.start_date ?? undefined} onChange={(e) => set('end_date', e.target.value || null)} className={`${inputCls} px-3 text-sm [color-scheme:dark]`} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Starts"><input value={d.start_time} onChange={(e) => set('start_time', e.target.value)} placeholder="6:30 pm" className={inputCls} /></Field>
                  <Field label="Ends"><input value={d.end_time} onChange={(e) => set('end_time', e.target.value)} placeholder="8:00 pm" className={inputCls} /></Field>
                </div>
                <Field label="Where"><input value={d.venue} onChange={(e) => set('venue', e.target.value)} placeholder="Venue, e.g. Bodhi Tree" className={inputCls} /></Field>
                <Field label="Town"><input value={d.town} onChange={(e) => set('town', e.target.value)} placeholder="e.g. Nosara" className={inputCls} /></Field>
                <Field label="Price"><input value={d.price_note} onChange={(e) => set('price_note', e.target.value)} placeholder="e.g. ₡10,000 or by donation" className={inputCls} /></Field>
                <Field label="How to book or ask"><input value={d.contact} onChange={(e) => set('contact', e.target.value)} placeholder="WhatsApp number, email or @handle" className={inputCls} /></Field>
                <Field label="Link (optional)"><input inputMode="url" value={d.link} onChange={(e) => set('link', e.target.value)} placeholder="Booking or info page" className={inputCls} /></Field>
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] text-muted">What kind of gathering</span>
                  <div className="flex flex-wrap gap-2">{EVENT_TAGS.map((t) => <Chip key={t} on={d.tags.includes(t)} onClick={() => set('tags', d.tags.includes(t) ? d.tags.filter((x) => x !== t) : [...d.tags, t])}>{t}</Chip>)}</div>
                </div>
                <Field label="About it"><textarea rows={4} value={d.description} onChange={(e) => set('description', e.target.value)} placeholder="What happens, who it’s for" className={`${inputCls} resize-none py-3`} /></Field>
                <p className="m-0 text-[12px] leading-normal text-subtle">Community events show on Xanadu as shared by a member and not verified by Xanadu. Please only share events that are public.</p>
              </>
            )}

            {mine.length > 0 && (
              <section className="mt-2 flex flex-col gap-2">
                <span className="text-xs tracking-[0.14em] text-subtle uppercase">Events you’ve shared</span>
                {mine.map((e) => (
                  <Link key={e.id} to={`/event/${e.id}`} className="flex items-center justify-between gap-3 rounded-[14px] bg-surface p-3 text-text no-underline">
                    <div className="flex min-w-0 flex-col"><span className="truncate text-[14px] font-semibold text-ink">{e.title}</span><span className="truncate text-[12px] text-subtle">{whenLabel(e)}</span></div>
                    <span className={`flex-none rounded-full border px-2.5 py-1 text-xs ${STATUS[e.status][1]}`}>{STATUS[e.status][0]}</span>
                  </Link>
                ))}
              </section>
            )}
          </>
        )}
      </main>

      {form && !sent && (
        <footer className="flex flex-col gap-2 border-t border-[#1F2B3E] bg-navy-deep px-5 pt-3.5 pb-safe">
          {error && <p role="alert" className="m-0 text-center text-[13px] text-gold-pale">{error}</p>}
          <button type="button" disabled={busy} onClick={submit} className="min-h-[54px] rounded-2xl bg-iri text-[15px] font-semibold text-navy disabled:opacity-70">{busy ? 'Sending…' : 'Share with the Xanadu team'}</button>
        </footer>
      )}
      {!form && error && <p role="alert" className="m-0 px-5 pb-safe text-center text-[13px] text-gold-pale">{error}</p>}
    </div>
  )
}
