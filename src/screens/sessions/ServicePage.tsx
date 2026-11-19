import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../../components/ui'
import { IconBack } from '../../components/icons'
import { Loading, useAuth } from '../../auth'
import { contactLink, safeLink, useMemberReviews } from '../../events'
import { fetchService, useServiceInterest, type Provider, type Service } from '../../sessions'

/**
 * A one-on-one session from a Facilitator Xanadu has welcomed: what it is, who offers it and what the
 * community says about them. "I'm interested" tells the practitioner; "Message" starts the conversation.
 */
export default function ServicePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [data, setData] = useState<{ service: Service; provider: Provider | null } | null | undefined>(undefined)
  const interest = useServiceInterest(id)
  const rev = useMemberReviews('facilitator', data?.service.owner_id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [more, setMore] = useState(false)

  useEffect(() => { fetchService(id).then(setData) }, [id])
  if (data === undefined) return <Loading label="Opening…" />

  const back = (
    <button type="button" aria-label="Back" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/sessions'))}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/70 text-text"><IconBack /></button>
  )
  if (!data || data.service.status !== 'live' && data.service.owner_id !== session?.user.id) return (
    <Screen>
      <div className="flex flex-col gap-4 px-5 pt-safe">
        {back}
        <h1 className="m-0 font-display text-3xl font-medium text-ink">This session isn’t available</h1>
        <p className="m-0 text-[15px] leading-relaxed text-muted">The practitioner may have paused it.</p>
        <Link to="/sessions" className="flex min-h-12 items-center justify-center rounded-2xl bg-iri font-semibold text-navy no-underline hover:text-navy">See all sessions</Link>
      </div>
    </Screen>
  )

  const { service: s, provider: p } = data
  const mine = s.owner_id === session?.user.id
  const first = p?.name?.trim().split(' ')[0] || 'them'
  const contact = s.contact ? contactLink(s.contact) : null
  const link = s.link ? safeLink(s.link) : null
  const rows = ([
    ['Kind', [s.category, ...s.kinds].join(' · ')],
    ['How long', s.duration],
    ['Price', s.price_note],
    ['Where', [s.where_options.join(' · '), s.town].filter(Boolean).join(' · ')],
    ['To book or ask', s.contact],
  ] as [string, string][]).filter(([, v]) => v)
  const draft = `Hi ${first}, I’m interested in your session “${s.title}”. `

  const tap = async () => {
    setBusy(true); setError('')
    const err = await interest.toggle()
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <Screen>
      <div className="relative flex min-h-[240px] flex-col bg-portal px-4 pt-safe pb-4">
        {(s.photo_url || p?.photo_url) && <img decoding="async" src={s.photo_url || p?.photo_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="relative flex">{back}</div>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-[22px] pb-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[0.06em] text-gold-soft">{['Session', s.category].join(' · ')}</span>
          <h1 className="m-0 font-display text-[34px] leading-[1.05] font-medium text-ink">{s.title}</h1>
          {mine && s.status === 'paused' && <span className="text-[13px] text-subtle">Paused: only you can see this.</span>}
        </div>

        {p && (
          <section className="flex flex-col gap-3 rounded-[18px] bg-surface p-3.5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 flex-none overflow-hidden rounded-full bg-portal">{p.photo_url && <img decoding="async" src={p.photo_url} alt="" className="h-full w-full object-cover" />}</div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-xs text-subtle">Offered by</span>
                <span className="truncate text-[16px] font-semibold text-ink">{p.name}</span>
                <span className="text-xs text-iri-teal">✦ Welcomed by Xanadu{rev && rev.count > 0 && rev.average !== null ? <span className="text-gold-soft">{` · ★ ${Number(rev.average).toFixed(1)} · ${rev.count} ${rev.count === 1 ? 'review' : 'reviews'}`}</span> : null}</span>
              </div>
            </div>
            {rev && rev.reviews[0]?.comment && <p className="m-0 rounded-[12px] bg-surface-2 px-3 py-2 text-[13px] leading-relaxed text-muted">{`“${rev.reviews[0].comment.slice(0, 180)}${rev.reviews[0].comment.length > 180 ? '…' : ''}” · ${rev.reviews[0].first_name}`}</p>}
            {p.about && (
              <button type="button" onClick={() => setMore((m) => !m)} className="text-left">
                <p className={`m-0 text-[14px] leading-relaxed whitespace-pre-line text-muted ${more ? '' : 'line-clamp-3'}`}>{p.about}</p>
                {p.about.length > 160 && <span className="text-[13px] font-semibold text-gold-soft">{more ? 'Less' : 'More'}</span>}
              </button>
            )}
          </section>
        )}

        {s.description && <p className="m-0 text-[15px] leading-relaxed whitespace-pre-line text-muted">{s.description}</p>}

        <dl className="m-0 flex flex-col gap-3">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5">
              <dt className="text-xs tracking-[0.1em] text-subtle uppercase">{k}</dt>
              <dd className="m-0 text-[15px] text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        {mine ? (
          <Link to={`/facilitator/sessions/edit?id=${s.id}`} className="flex min-h-12 items-center justify-center rounded-2xl bg-iri text-[15px] font-semibold text-navy no-underline hover:text-navy">Edit this session</Link>
        ) : (
          <div className="flex flex-col gap-2.5">
            <button type="button" disabled={busy} onClick={tap} aria-pressed={interest.me}
              className={`flex min-h-12 items-center justify-center rounded-2xl text-[15px] ${interest.me ? 'border border-line-2 text-text' : 'bg-iri font-semibold text-navy'}`}>
              {busy ? '…' : interest.me ? 'You’re interested ✓  ·  Tap to change' : 'I’m interested'}
            </button>
            <span className="text-center text-[12px] text-subtle">{interest.me ? `${first} has been told. Message them to find a time.` : `${first} will see your first name. Nothing is booked until you agree.`}</span>
            <Link to={`/messages/new?to=${s.owner_id}&draft=${encodeURIComponent(draft)}`}
              className="flex min-h-12 items-center justify-center rounded-2xl border border-line-2 text-[15px] text-text no-underline">{`Message ${first}`}</Link>
            {link && <a href={link} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center text-[14px] no-underline">Book on their website ›</a>}
            {!link && contact && <a href={contact} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center text-[14px] no-underline">{`Contact ${first} directly ›`}</a>}
            {error && <span className="text-center text-[13px] text-gold-pale">{error}</span>}
          </div>
        )}
      </div>
    </Screen>
  )
}
