import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BackButton, Chip, EmptyState, FacilitatorTabs, H1, H2, Page, Screen, Switch } from '../../components/ui'
import { EditFooter, PhotoGallery, TextArea, TextField } from '../../components/edit'
import { Loading, useAuth } from '../../auth'
import { uploadPhotos } from '../../store'
import { deleteService, EMPTY_SERVICE, saveService, SERVICE_CATEGORIES, useMyServices, WHERE_OPTIONS, type ServiceDraft } from '../../sessions'

/** /facilitator/sessions: the one-on-one sessions you offer, and who's interested in each. */
export default function MySessions() {
  const { profile } = useAuth()
  const { services, interest, loading } = useMyServices()
  const approved = profile?.facilitator_status === 'approved'
  if (loading) return <Loading label="Opening your sessions…" />
  return (
    <Screen footer={<FacilitatorTabs />}>
      <Page className="gap-5">
        <BackButton to="/facilitator" />
        <div className="flex flex-col gap-1">
          <H1>Your sessions</H1>
          <p className="m-0 text-[14px] leading-relaxed text-muted">One-on-one work you offer: a massage, a reading, coaching, a private class, cooking for a retreat. Seekers and retreat hosts find these under Sessions and tap “I’m interested”, and you’re told right away.</p>
        </div>
        {!approved ? (
          <EmptyState title="Sessions open once you’re welcomed">
            Xanadu is built on trust: only Facilitators the team has personally welcomed can offer sessions. You’ll be able to add yours as soon as your profile is approved.
          </EmptyState>
        ) : (
          <>
            <Link to="/facilitator/sessions/edit" className="flex min-h-12 items-center justify-center rounded-2xl bg-iri text-[15px] font-semibold text-navy no-underline hover:text-navy">+ Add a session</Link>
            {services.length === 0 ? (
              <EmptyState title="No sessions yet">Add what you offer one-on-one. Seekers see it with your profile and your reviews from the community.</EmptyState>
            ) : (
              <div className="flex flex-col gap-3">
                {services.map((s) => {
                  const who = interest.filter((i) => i.service_id === s.id)
                  return (
                    <section key={s.id} className="flex flex-col gap-2 rounded-[18px] bg-surface p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-xs text-gold-soft">{[s.category, s.status === 'live' ? 'Live' : s.status === 'paused' ? 'Paused' : 'Taken down by Xanadu'].join(' · ')}</span>
                          <span className="text-[16px] font-semibold text-ink">{s.title}</span>
                          <span className="text-[13px] text-subtle">{[s.duration, s.price_note].filter(Boolean).join(' · ')}</span>
                        </div>
                        <Link to={`/facilitator/sessions/edit?id=${s.id}`} className="flex min-h-10 flex-none items-center text-[13px] no-underline">Edit</Link>
                      </div>
                      <span className="text-[13px] text-text">{who.length ? `${who.length} interested: ${who.slice(0, 6).map((w) => w.name || 'A member').join(', ')}${who.length > 6 ? '…' : ''}` : 'No one interested yet'}</span>
                      {who.length > 0 && <span className="text-[12px] text-subtle">When they write to you, you’ll find them in Messages.</span>}
                      <Link to={`/service/${s.id}`} className="text-[13px] no-underline">See it as Seekers do ›</Link>
                    </section>
                  )
                })}
              </div>
            )}
          </>
        )}
      </Page>
    </Screen>
  )
}

/** /facilitator/sessions/edit(?id=…): add or change a session. */
export function EditSession() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const { services, loading } = useMyServices()
  const [d, setD] = useState<ServiceDraft | null>(id ? null : { ...EMPTY_SERVICE, town: profile?.town ?? '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id || loading) return
    const s = services.find((x) => x.id === id)
    if (s) { const { id: _i, owner_id: _o, created_at: _c, updated_at: _u, ...rest } = s; void _i; void _o; void _c; void _u; setD(rest) }
    else navigate('/facilitator/sessions', { replace: true })
  }, [id, loading, services, navigate])

  if (!d) return <Loading label="Opening…" />
  const set = <K extends keyof ServiceDraft>(k: K, v: ServiceDraft[K]) => setD((x) => (x ? { ...x, [k]: v } : x))
  const cat = SERVICE_CATEGORIES.find((c) => c.label === d.category)
  const toggle = (k: 'kinds' | 'where_options', v: string) => set(k, d[k].includes(v) ? d[k].filter((x) => x !== v) : [...d[k], v])

  const save = async () => {
    if (!session) return
    if (!d.category) { setError('Choose what kind of session this is.'); return }
    if (d.title.trim().length < 2) { setError('Give your session a name.'); return }
    if (!d.price_note.trim()) { setError('Add a price, or “Ask me” if it varies.'); return }
    if (!d.contact.trim() && !d.link.trim()) { setError('Add how to book: a WhatsApp number, email, or booking link.'); return }
    setBusy(true); setError('')
    try {
      const [photo] = d.photo_url ? await uploadPhotos(session.user.id, [d.photo_url]) : ['']
      const res = await saveService(session.user.id, id, { ...d, photo_url: photo })
      setBusy(false)
      if (res.error) { setError(res.error); return }
      navigate('/facilitator/sessions', { replace: true })
    } catch (e) { setBusy(false); setError((e as Error).message) }
  }
  const remove = async () => {
    if (!id || !window.confirm('Delete this session? People who were interested won’t see it any more.')) return
    const err = await deleteService(id)
    if (err) setError(err); else navigate('/facilitator/sessions', { replace: true })
  }

  return (
    <Screen footer={<EditFooter onCancel={() => navigate(-1)} onSave={save} error={error} busy={busy} />}>
      <div className="flex flex-col gap-5 px-5 pt-safe pb-8">
        <h1 className="m-0 font-display text-[32px] font-medium text-ink">{id ? 'Edit session' : 'Add a session'}</h1>

        <div className="flex flex-col gap-2">
          <H2 className="text-[18px]">What kind of session?</H2>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((c) => <Chip key={c.label} on={d.category === c.label} onClick={() => setD((x) => x && ({ ...x, category: c.label, kinds: x.category === c.label ? x.kinds : [] }))}>{c.label}</Chip>)}
          </div>
          {cat && (
            <>
              <span className="pt-1 text-[13px] text-muted">What exactly? Pick all that fit</span>
              <div className="flex flex-wrap gap-2">{cat.kinds.map((k) => <Chip key={k} solid on={d.kinds.includes(k)} onClick={() => toggle('kinds', k)}>{k}</Chip>)}</div>
            </>
          )}
        </div>

        <TextField label="Name of your session" value={d.title} onChange={(v) => set('title', v)} placeholder="e.g. Deep tissue massage, Plant-based retreat chef" />
        <TextArea label="What happens, and who it’s for" value={d.description} onChange={(v) => set('description', v)} rows={5}
          placeholder="How you work, what someone can expect, your experience." />
        <TextField label="How long" value={d.duration} onChange={(v) => set('duration', v)} placeholder="e.g. 60 or 90 minutes, Full-day retreats" />
        <TextField label="Price" value={d.price_note} onChange={(v) => set('price_note', v)} placeholder="e.g. $80 / 60 min, From $45 per guest per day" />

        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-muted">Where</span>
          <div className="flex flex-wrap gap-2">{WHERE_OPTIONS.map((w) => <Chip key={w} on={d.where_options.includes(w)} onClick={() => toggle('where_options', w)}>{w}</Chip>)}</div>
        </div>
        <TextField label="Town or area" value={d.town} onChange={(v) => set('town', v)} placeholder="e.g. Guiones, Nosara" />
        <TextField label="How to book (WhatsApp, email or @handle)" value={d.contact} onChange={(v) => set('contact', v)} placeholder="e.g. +506 8888 8888" />
        <TextField label="Booking link (optional)" value={d.link} onChange={(v) => set('link', v)} placeholder="Your website or booking page" />

        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-muted">A photo (optional: your profile photo is used otherwise)</span>
          <PhotoGallery photos={d.photo_url ? [d.photo_url] : []} onChange={(ps) => set('photo_url', ps[ps.length - 1] ?? '')} max={1} />
        </div>

        {d.status !== 'removed' && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold text-ink">Live</span>
              <span className="text-xs text-subtle">{d.status === 'live' ? 'Seekers can find it' : 'Paused: hidden until you turn it back on'}</span>
            </div>
            <Switch on={d.status === 'live'} onChange={(v) => set('status', v ? 'live' : 'paused')} label="Live" />
          </div>
        )}
        {id && <button type="button" onClick={remove} className="min-h-11 self-start text-[14px] text-subtle">Delete this session</button>}
      </div>
    </Screen>
  )
}
