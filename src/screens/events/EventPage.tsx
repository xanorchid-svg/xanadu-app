import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../../components/ui'
import { IconBack } from '../../components/icons'
import { Loading, useAuth } from '../../auth'
import { ReportSheet } from '../../components/Report'
import { contactLink, deleteSharedEvent, fetchCommunityEvent, safeLink, whenLabel, type CommunityEvent } from '../../events'

/** A community event: what a member shared, clearly marked as not verified by Xanadu. */
export default function EventPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [e, setE] = useState<CommunityEvent | null | undefined>(undefined)
  const [reporting, setReporting] = useState(false)
  const [reported, setReported] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchCommunityEvent(id ?? '').then(setE) }, [id])
  if (e === undefined) return <Loading label="Opening event…" />

  const back = (
    <button type="button" aria-label="Back" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/calendar'))}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/70 text-text"><IconBack /></button>
  )
  if (!e) return (
    <Screen>
      <div className="flex flex-col gap-4 px-5 pt-safe">
        {back}
        <h1 className="m-0 font-display text-3xl font-medium text-ink">This event isn’t available</h1>
        <p className="m-0 text-[15px] leading-relaxed text-muted">It may have passed, or been taken off the calendar.</p>
        <Link to="/calendar" className="flex min-h-12 items-center justify-center rounded-2xl bg-iri font-semibold text-navy no-underline hover:text-navy">Open the calendar</Link>
      </div>
    </Screen>
  )

  const mine = e.submitted_by === session?.user.id
  const contact = e.contact ? contactLink(e.contact) : null
  const link = e.link ? safeLink(e.link) : null
  const rows: [string, string][] = [
    ['When', whenLabel(e)],
    ['Where', [e.venue, e.town].filter(Boolean).join(', ')],
    ['Price', e.price_note],
    ['To book or ask', e.contact],
  ].filter(([, v]) => v) as [string, string][]

  const remove = async () => {
    if (!window.confirm('Remove this event you shared?')) return
    const err = await deleteSharedEvent(e.id)
    if (err) setError(err); else navigate('/calendar', { replace: true })
  }

  return (
    <Screen>
      <div className="relative flex min-h-[260px] flex-col bg-portal px-4 pt-safe pb-4">
        {e.photo_url && <img decoding="async" src={e.photo_url} alt={`Poster for ${e.title}`} className="absolute inset-0 h-full w-full object-cover" />}
        <div className="relative flex">{back}</div>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-[22px] pb-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[0.06em] text-iri-teal">{['Community event', ...e.tags.slice(0, 2)].join(' · ')}</span>
          <h1 className="m-0 font-display text-[34px] leading-[1.05] font-medium text-ink">{e.title}</h1>
        </div>

        <div className="rounded-xl border border-dashed border-line-2 px-3.5 py-3 text-[13px] leading-normal text-subtle">
          {mine && e.status !== 'live'
            ? e.status === 'pending' ? 'You shared this. It’s with the Xanadu team and not on the calendar yet.' : 'You shared this. The team didn’t add it to the calendar.'
            : 'Shared by a member of the community. Not verified by Xanadu: check the details with the organizer before you go.'}
        </div>

        <dl className="m-0 flex flex-col gap-3">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5">
              <dt className="text-xs tracking-[0.1em] text-subtle uppercase">{k}</dt>
              <dd className="m-0 text-[15px] text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        {(contact || link) && (
          <div className="flex flex-col gap-2">
            {contact && <a href={contact} target="_blank" rel="noreferrer noopener" className="flex min-h-[52px] items-center justify-center rounded-2xl bg-iri text-[15px] font-semibold text-navy no-underline hover:text-navy">
              {contact.includes('wa.me') ? 'Message the organizer on WhatsApp' : contact.startsWith('mailto:') ? 'Email the organizer' : 'Contact the organizer'}</a>}
            {link && <a href={link} target="_blank" rel="noreferrer noopener" className="flex min-h-[52px] items-center justify-center rounded-2xl border border-line-2 text-[15px] text-text no-underline">More info</a>}
          </div>
        )}

        {e.description && <p className="m-0 text-[15px] leading-relaxed whitespace-pre-line text-muted">{e.description}</p>}

        {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
        {mine
          ? <button type="button" onClick={remove} className="min-h-11 self-center text-[13px] text-subtle">Remove this event</button>
          : reported ? <p className="m-0 text-center text-[13px] text-subtle">Thank you. Our team will look into it.</p>
            : e.submitted_by && <button type="button" onClick={() => setReporting(true)} className="min-h-11 self-center text-[13px] text-subtle underline-offset-2 hover:underline">Report this event</button>}
      </div>
      {reporting && e.submitted_by && <ReportSheet memberId={e.submitted_by} name={e.title} context="community_event" contextId={e.id} onClose={() => setReporting(false)}
        onDone={() => { setReporting(false); setReported(true) }} />}
    </Screen>
  )
}
