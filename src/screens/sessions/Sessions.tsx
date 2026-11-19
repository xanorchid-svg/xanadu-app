import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BackButton, Chip, EmptyState, H1, Page, Screen, SeekerTabs } from '../../components/ui'
import { IconSearch } from '../../components/icons'
import ServiceCard from '../../components/ServiceCard'
import FoundingInvite from '../../components/FoundingInvite'
import { useAuth } from '../../auth'
import { SERVICE_CATEGORIES, serviceText, useServices } from '../../sessions'

/**
 * /sessions: one-on-one with practitioners. Seven kinds (Bodywork, Energy & sound, Inner work, Guidance,
 * Private classes, Women's health, Retreat support); pick one to see its services, then narrow by what it is.
 * Not dated, so not on the Calendar.
 */
export default function Sessions() {
  const [params, setParams] = useSearchParams()
  const { profile } = useAuth()
  const cat = SERVICE_CATEGORIES.find((c) => c.label === params.get('cat'))?.label ?? ''
  const [kind, setKind] = useState('')
  const [query, setQuery] = useState('')
  const { services, providers, loading } = useServices()
  const setCat = (c: string) => { setKind(''); setParams(c ? { cat: c } : {}, { replace: true }) }

  const q = query.trim().toLowerCase()
  const shown = services.filter((s) => (!cat || s.category === cat) && (!kind || s.kinds.includes(kind))
    && (!q || serviceText(s, providers[s.owner_id]).includes(q)))
  const count = (c: string) => services.filter((s) => s.category === c).length
  const kinds = SERVICE_CATEGORIES.find((c) => c.label === cat)?.kinds ?? []
  const seeker = profile?.role === 'seeker'

  return (
    <Screen footer={seeker ? <SeekerTabs /> : undefined}>
      <Page className="gap-4">
        {!seeker && <BackButton />}
        <div className="flex flex-col gap-1">
          <H1>Sessions</H1>
          <p className="m-0 text-[14px] leading-relaxed text-muted">One-on-one with practitioners Xanadu has personally welcomed: bodywork, guidance, private classes, and support for your retreat. As the community reviews them, the most trusted rise to the top.</p>
        </div>

        <label className="flex min-h-12 items-center gap-2.5 rounded-[14px] border border-line bg-surface-2 px-4 text-subtle">
          <IconSearch />
          <span className="sr-only">Search sessions</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Massage, astrology, private chef…"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-faint" />
        </label>

        <div className="flex flex-col gap-2">
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-0.5" role="group" aria-label="Kinds of sessions">
            <Chip on={!cat} onClick={() => setCat('')}>All</Chip>
            {SERVICE_CATEGORIES.map((c) => <Chip key={c.label} on={cat === c.label} dim={!loading && !count(c.label)} onClick={() => setCat(cat === c.label ? '' : c.label)}>{c.label}</Chip>)}
          </div>
          {cat && (
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-0.5" role="group" aria-label={`${cat} types`}>
              {kinds.map((k) => <Chip key={k} solid on={kind === k} dim={!services.some((s) => s.category === cat && s.kinds.includes(k))} onClick={() => setKind(kind === k ? '' : k)}>{k}</Chip>)}
            </div>
          )}
        </div>

        {loading ? <span className="text-[13px] text-subtle">Finding practitioners…</span>
          : shown.length ? (
            <div className="flex flex-col gap-2.5">
              <span className="text-xs tracking-[0.14em] text-subtle uppercase">{`${shown.length} ${shown.length === 1 ? 'session' : 'sessions'}${cat ? ` · ${kind || cat}` : ''}`}</span>
              {shown.map((s) => <ServiceCard key={s.id} s={s} p={providers[s.owner_id]} />)}
            </div>
          ) : !cat && !q && !services.length ? (
            <div className="flex flex-col gap-2.5">
              <span className="text-xs tracking-[0.14em] text-subtle uppercase">Coming soon</span>
              {SERVICE_CATEGORIES.map((c) => (
                <div key={c.label} className="flex flex-col gap-0.5 rounded-[16px] bg-surface px-4 py-3">
                  <span className="text-[15px] font-semibold text-ink">{c.label}</span>
                  <span className="text-[13px] text-subtle">{c.blurb}</span>
                </div>
              ))}
              <p className="m-0 text-[13px] leading-relaxed text-subtle">Founding practitioners are joining Xanadu now. Their sessions will show up here.</p>
            </div>
          ) : (
            <EmptyState title={q ? `No sessions match "${query.trim()}" yet` : `No ${(kind || cat).toLowerCase()} sessions yet`}
              action={<button type="button" onClick={() => { setQuery(''); setCat('') }} className="flex min-h-11 items-center text-sm font-semibold text-gold-soft">See all sessions</button>}>
              Practitioners are joining Xanadu now. Know someone wonderful? Invite them to join as a Facilitator.
            </EmptyState>
          )}

        {!loading && profile?.facilitator_status === 'approved' && (
          <Link to="/facilitator/sessions" className="flex min-h-11 items-center text-[14px] no-underline">Offer your own sessions ›</Link>
        )}
        {!loading && <FoundingInvite />}
      </Page>
    </Screen>
  )
}
