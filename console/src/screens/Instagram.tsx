import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { POSTS, previewUrl, slideUrl, thumbUrl, videoUrl, type SocialPost } from '../social/posts'
import { useToast } from '../parts'
import { Button, Card, PageTitle } from '../ui'
import { makeZip } from '../lib/zip'

const METRICOOL = 'https://app.metricool.com/planner?blogId=7525297'
const STATUS: Record<SocialPost['status'], { label: string; cls: string }> = {
  draft: { label: 'Draft in Metricool', cls: 'bg-gold/15 text-gold-pale ring-1 ring-gold/40' },
  scheduled: { label: 'Scheduled', cls: 'ring-iri text-ink' },
  manual: { label: 'Post manually', cls: 'bg-iri-teal/15 text-text ring-1 ring-iri-teal/50' },
  posted: { label: 'Posted', cls: 'bg-slate/30 text-subtle ring-1 ring-slate' },
}
const COVER_DOT: Record<SocialPost['cover'], string> = {
  white: 'bg-[#F6F1E8]',
  navy: 'bg-[#101B2C] ring-1 ring-gold/50',
  photo: 'bg-[linear-gradient(135deg,#9DBB7A,#6FB7BF,#8F9BE6,#E09AC4)]',
}
const month = (p: SocialPost) => new Date(p.date).toLocaleString('en-US', { month: 'long' })

type Group = { key: string; label: string; get: (p: SocialPost) => string; options: { value: string; label: string }[] }
const uniq = (xs: string[]) => [...new Set(xs)]
const GROUPS: Group[] = [
  { key: 'cover', label: 'Grid tile', get: (p) => p.cover, options: [{ value: 'white', label: 'White' }, { value: 'photo', label: 'Photo' }, { value: 'navy', label: 'Navy' }] },
  { key: 'format', label: 'Format', get: (p) => p.format, options: [{ value: 'Reel', label: 'Reels' }, { value: 'Carousel', label: 'Carousels' }, { value: 'Single image', label: 'Single posts' }] },
  { key: 'audience', label: 'For', get: (p) => p.audience, options: [{ value: 'Seekers', label: 'Seekers' }, { value: 'Spaces & guides', label: 'Spaces & guides' }, { value: 'Everyone', label: 'Everyone' }] },
  { key: 'imagery', label: 'Imagery', get: (p) => p.imagery, options: [{ value: 'Stock photos', label: 'Stock photos' }, { value: 'AI', label: 'AI photos' }, { value: 'Stock footage', label: 'Real footage' }, { value: 'Graphic only', label: 'Type only' }] },
  {
    key: 'month', label: 'Month', get: month,
    options: uniq([...POSTS].sort((a, b) => a.date.localeCompare(b.date)).map(month)).map((m) => ({ value: m, label: m })),
  },
]
type Filters = Record<string, string[]>
type Req = { id: string; post_id: string; note: string; status: 'open' | 'in_progress' | 'done' | 'wont_do'; reply: string | null; created_at: string }
const REQ_STATUS: Record<Req['status'], { label: string; cls: string }> = {
  open: { label: 'Waiting for Claude', cls: 'bg-gold/15 text-gold-pale ring-1 ring-gold/40' },
  in_progress: { label: 'Claude is on it', cls: 'bg-iri-teal/15 text-text ring-1 ring-iri-teal/50' },
  done: { label: 'Done', cls: 'bg-slate/30 text-subtle ring-1 ring-slate' },
  wont_do: { label: 'Not changed', cls: 'bg-slate/30 text-subtle ring-1 ring-slate' },
}
const ago = (d: string) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

/** Change requests for one post (or 'general'): Xan writes, Claude reads open ones, edits, and replies. */
function Requests({ postId, reqs, reload, placeholder }: { postId: string; reqs: Req[]; reload: () => void; placeholder: string }) {
  const toast = useToast()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const mine = reqs.filter((r) => r.post_id === postId)
  async function send() {
    if (!note.trim()) return
    setBusy(true)
    const { error } = await supabase.from('social_requests').insert({ post_id: postId, note: note.trim() })
    setBusy(false)
    if (error) { toast.show('Could not save. Try again.'); return }
    setNote(''); toast.show('Sent to Claude'); reload()
  }
  async function remove(id: string) {
    const { error } = await supabase.from('social_requests').delete().eq('id', id)
    if (error) toast.show('Could not remove'); else reload()
  }
  return (
    <div className="mt-5 rounded-xl bg-navy/50 p-4 ring-1 ring-line">
      <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-faint">Changes for Claude</p>
      {mine.length > 0 && (
        <ul className="mb-3 space-y-2">
          {mine.map((r) => (
            <li key={r.id} className="rounded-lg bg-navy/70 p-3 ring-1 ring-line">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold ${REQ_STATUS[r.status].cls}`}>{REQ_STATUS[r.status].label}</span>
                <span className="text-[11.5px] text-faint">{ago(r.created_at)}</span>
                {r.status === 'open' && <button onClick={() => remove(r.id)} className="ml-auto text-[11.5px] text-faint hover:text-text">Remove</button>}
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-text">{r.note}</p>
              {r.reply && <p className="mt-2 whitespace-pre-wrap border-l-2 border-gold/50 pl-3 text-[13px] leading-relaxed text-subtle"><span className="font-semibold text-gold-pale">Claude: </span>{r.reply}</p>}
            </li>
          ))}
        </ul>
      )}
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={placeholder}
        className="w-full resize-y rounded-lg bg-navy/80 p-3 text-[13.5px] text-text ring-1 ring-line placeholder:text-faint focus:outline-none focus:ring-gold/60" />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11.5px] text-faint">Claude picks these up when you say “check the console requests.”</p>
        <Button className="h-9" onClick={send} disabled={busy || !note.trim()}>{busy ? 'Sending…' : 'Send to Claude'}</Button>
      </div>
    </div>
  )
}
const STORE = 'xa-ig-filters'

function fmt(date: string) {
  return new Date(date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/** Instagram & Facebook posts Claude prepared, waiting for Xan to check and schedule. */
export default function Instagram() {
  const toast = useToast()
  const [open, setOpen] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'grid'>(() => { try { return (localStorage.getItem(STORE + '-view') as 'list' | 'grid') || 'list' } catch { return 'list' } })
  const [filters, setFilters] = useState<Filters>(() => { try { return JSON.parse(localStorage.getItem(STORE) || '{}') } catch { return {} } })
  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(filters)); localStorage.setItem(STORE + '-view', view) } catch { /* private mode */ } }, [filters, view])

  const [reqs, setReqs] = useState<Req[]>([])
  const loadReqs = useCallback(async () => {
    const { data } = await supabase.from('social_requests').select('id, post_id, note, status, reply, created_at').order('created_at')
    setReqs((data as Req[]) || [])
  }, [])
  useEffect(() => { loadReqs() }, [loadReqs])
  // Posts cleared from this list: marked as already posted, or deleted
  const [cleared, setCleared] = useState<Record<string, 'posted' | 'deleted'>>({})
  const loadCleared = useCallback(async () => {
    const { data } = await supabase.from('social_post_state').select('post_id, state')
    setCleared(Object.fromEntries(((data as { post_id: string; state: 'posted' | 'deleted' }[]) || []).map((r) => [r.post_id, r.state])))
  }, [])
  useEffect(() => { loadCleared() }, [loadCleared])
  const live = useMemo(() => POSTS.filter((p) => !cleared[p.id]), [cleared])
  const clearedPosts = useMemo(() => POSTS.filter((p) => cleared[p.id]).sort((a, b) => b.date.localeCompare(a.date)), [cleared])
  const [showCleared, setShowCleared] = useState(false)

  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const pick = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  async function clearPicked(state: 'posted' | 'deleted') {
    const ids = [...picked]
    setBusy(true)
    const { error } = await supabase.from('social_post_state').upsert(ids.map((post_id) => ({ post_id, state, updated_at: new Date().toISOString() })))
    setBusy(false)
    if (error) { toast.show('Couldn’t update those posts'); return }
    setCleared((c) => ({ ...c, ...Object.fromEntries(ids.map((id) => [id, state])) }))
    setPicked(new Set()); setConfirmDelete(false); setOpen(null)
    toast.show(`${ids.length} post${ids.length > 1 ? 's' : ''} ${state === 'posted' ? 'marked as posted' : 'deleted'}`)
  }
  async function restore(id: string) {
    const { error } = await supabase.from('social_post_state').delete().eq('post_id', id)
    if (error) { toast.show('Couldn’t restore it'); return }
    setCleared((c) => { const n = { ...c }; delete n[id]; return n })
    toast.show('Back in the list')
  }

  const openCount = (id: string) => reqs.filter((r) => r.post_id === id && (r.status === 'open' || r.status === 'in_progress')).length

  const matches = (p: SocialPost, skip?: string) => GROUPS.every((g) => g.key === skip || !filters[g.key]?.length || filters[g.key].includes(g.get(p)))
  const shown = useMemo(() => [...live].sort((a, b) => a.date.localeCompare(b.date)).filter((p) => matches(p)), [filters, live]) // eslint-disable-line react-hooks/exhaustive-deps
  const allPicked = shown.length > 0 && shown.every((p) => picked.has(p.id))
  const active = Object.values(filters).some((v) => v.length)

  function toggle(key: string, value: string) {
    setFilters((f) => { const cur = f[key] || []; return { ...f, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] } })
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); toast.show('Caption copied') } catch { toast.show('Could not copy') }
  }
  const [zipping, setZipping] = useState<string | null>(null)
  /** All slides of one post at once: share sheet on phones (Save to Photos), one zip elsewhere. */
  async function downloadAll(p: SocialPost) {
    setZipping(p.id)
    try {
      const files = await Promise.all(Array.from({ length: p.slides }, async (_, i) => {
        const res = await fetch(slideUrl(p, i + 1))
        if (!res.ok) throw new Error('fetch')
        const name = `${p.id}-${String(i + 1).padStart(2, '0')}.jpg`
        return { name, data: await res.blob() }
      }))
      const asFiles = files.map((f) => new File([f.data], f.name, { type: 'image/jpeg' }))
      const touch = window.matchMedia('(pointer: coarse)').matches
      if (touch && navigator.canShare?.({ files: asFiles })) {
        try { await navigator.share({ files: asFiles }); return } catch (e) { if ((e as Error).name === 'AbortError') return }
      }
      const url = URL.createObjectURL(await makeZip(files))
      const a = document.createElement('a')
      a.href = url; a.download = `${p.id}.zip`; document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      toast.show(`${p.slides} slides downloaded`)
    } catch {
      toast.show('Couldn’t download the slides. Try again.')
    } finally {
      setZipping(null)
    }
  }
  function jump(id: string) {
    setView('list'); setOpen(id)
    setTimeout(() => document.getElementById('post-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  return (
    <div className="xa-page">
      <PageTitle eyebrow="Content" title="Instagram">
        <a href={METRICOOL} target="_blank" rel="noreferrer"><Button className="h-10">Open Metricool</Button></a>
      </PageTitle>

      <p className="mb-6 max-w-2xl text-[14px] leading-relaxed text-subtle">
        Every post is waiting in Metricool as a draft for you to schedule: one reel a week, never two reels in a row, and the grid rotates white → photo → navy → photo.
        Reels are phone-reminder posts, so Metricool pings you and you add a trending sound in Instagram. Nothing goes live until you do.
        Feed photos are AI-generated for mood (checked for hands, faces, text and physics) and upscaled for sharpness; video reels use free licensed footage (Mixkit).
      </p>

      <Card className="mb-6 px-5 pb-5 pt-1">
        <Requests postId="general" reqs={reqs} reload={loadReqs} placeholder="Anything not tied to one post: new post ideas, moving dates, the grid, captions in general…" />
      </Card>

      <Card className="mb-6 px-5 py-4">
        <div className="space-y-3">
          {GROUPS.map((g) => (
            <div key={g.key} className="flex flex-wrap items-center gap-2">
              <span className="w-full shrink-0 text-[11.5px] sm:w-24 font-semibold uppercase tracking-[0.14em] text-faint">{g.label}</span>
              {g.options.map((o) => {
                const on = filters[g.key]?.includes(o.value)
                const n = live.filter((p) => g.get(p) === o.value && matches(p, g.key)).length
                return (
                  <button key={o.value} onClick={() => toggle(g.key, o.value)} disabled={!n && !on}
                    className={`inline-flex h-8 items-center gap-2 rounded-full px-3 text-[12.5px] font-semibold transition disabled:opacity-35 ${on ? 'bg-gold/20 text-gold-pale ring-1 ring-gold/60' : 'bg-navy/60 text-subtle ring-1 ring-line hover:text-text'}`}>
                    {g.key === 'cover' && <span className={`size-3 rounded-full ${COVER_DOT[o.value as SocialPost['cover']]}`} />}
                    {o.label}<span className="text-faint">{n}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <p className="text-[12.5px] text-faint">
            Showing {shown.length} of {live.length} posts
            {active && <> · <button className="text-subtle underline-offset-2 hover:text-text hover:underline" onClick={() => setFilters({})}>Clear filters</button></>}
          </p>
          <div className="inline-flex rounded-full bg-navy/60 p-1 ring-1 ring-line">
            {(['list', 'grid'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`h-7 rounded-full px-3 text-[12px] font-semibold capitalize ${view === v ? 'bg-gold/20 text-gold-pale' : 'text-subtle hover:text-text'}`}>
                {v === 'grid' ? 'Grid preview' : 'List'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {view === 'grid' ? (
        <div className="mx-auto grid max-w-[560px] grid-cols-3 gap-[2px]">
          {[...shown].reverse().map((p) => (
            <button key={p.id} onClick={() => jump(p.id)} className="relative aspect-[3/4] overflow-hidden bg-navy" title={p.title}>
              <img src={previewUrl(p, 1)} alt={p.title} loading="lazy" className="size-full object-cover" />
              <span className="absolute right-1.5 top-1 text-[12px] text-white [text-shadow:0_1px_4px_rgba(0,0,0,.6)]">{p.format === 'Reel' ? '▶' : p.slides > 1 ? '❐' : ''}</span>
              {openCount(p.id) > 0 && <span className="absolute left-1.5 top-1.5 size-2.5 rounded-full bg-iri-teal ring-2 ring-navy" title="Changes requested" />}
              <span className="absolute bottom-1 left-1 rounded-md bg-navy/60 px-1.5 text-[10.5px] font-semibold text-white">{new Date(p.date).toLocaleString('en-US', { month: 'short', day: 'numeric' })}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {!shown.length && <p className="text-[14px] text-subtle">{live.length ? 'No posts match these filters.' : 'Every post is cleared. Nice work.'}</p>}
          {shown.length > 0 && (
            <div className="flex items-center gap-3 px-1">
              <Check on={allPicked} onClick={() => setPicked(allPicked ? new Set() : new Set(shown.map((p) => p.id)))} label="Select all" />
              <span className="text-[12.5px] font-semibold text-subtle">{picked.size ? `${picked.size} selected` : 'Select posts to mark as posted or delete'}</span>
            </div>
          )}
          {shown.map((p) => {
            const s = STATUS[p.status]
            const isOpen = open === p.id
            return (
              <Card key={p.id} className="overflow-hidden">
                <div className="flex items-center">
                <div className="shrink-0 pl-5"><Check on={picked.has(p.id)} onClick={() => pick(p.id)} label={`Select ${p.title}`} /></div>
                <button id={'post-' + p.id} onClick={() => setOpen(isOpen ? null : p.id)} className="flex min-w-0 flex-1 scroll-mt-6 flex-wrap items-center gap-x-4 gap-y-2 py-4 pl-4 pr-5 text-left">
                  <img src={thumbUrl(p)} alt="" loading="lazy" className="size-14 rounded-lg object-cover ring-1 ring-line" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[22px] leading-tight text-ink">{p.title}</p>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-faint">
                      <span className={`inline-block size-2.5 rounded-full ${COVER_DOT[p.cover]}`} title={`${p.cover} grid tile`} />
                      {fmt(p.date)} · {p.format}{p.slides > 1 ? ` · ${p.slides} slides` : ''} · for {p.audience} · {p.imagery === 'Stock footage' ? 'real footage' : p.imagery === 'Stock photos' ? 'stock photos' : p.imagery === 'AI' ? 'AI photos' : 'type only'}
                    </p>
                  </div>
                  {openCount(p.id) > 0 && <span className="inline-flex h-6 items-center rounded-full bg-iri-teal/15 px-2.5 text-[11.5px] font-semibold text-text ring-1 ring-iri-teal/50">{openCount(p.id)} change{openCount(p.id) > 1 ? 's' : ''} requested</span>}
                  <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-semibold ${s.cls}`}>{s.label}</span>
                </button>
                </div>

                {isOpen && (
                  <div className="border-t border-line px-5 py-5">
                    <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-3">
                      {p.format === 'Reel' && (
                        <video src={videoUrl(p)} poster={previewUrl(p, 1)} controls playsInline preload="none"
                          className="h-[427px] w-[240px] shrink-0 snap-start rounded-xl bg-navy object-cover ring-1 ring-line sm:h-[533px] sm:w-[300px]" />
                      )}
                      {p.format !== 'Reel' && Array.from({ length: p.slides }, (_, i) => (
                        <a key={i} href={slideUrl(p, i + 1)} target="_blank" rel="noreferrer" className="shrink-0 snap-start">
                          <img src={previewUrl(p, i + 1)} alt={`${p.title}, slide ${i + 1}`} loading="lazy"
                            className="h-[300px] w-[240px] rounded-xl object-cover ring-1 ring-line sm:h-[375px] sm:w-[300px]" />
                        </a>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto]">
                      <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-navy/70 p-4 font-sans text-[13.5px] leading-relaxed text-text ring-1 ring-line">{p.caption}</pre>
                      <div className="flex flex-row flex-wrap gap-2 md:flex-col">
                        <Button variant="quiet" className="h-10" onClick={() => copy(p.caption)}>Copy caption</Button>
                        {p.format !== 'Reel' && p.slides > 1 && (
                          <Button variant="quiet" className="h-10" onClick={() => downloadAll(p)} disabled={zipping === p.id}>
                            {zipping === p.id ? 'Preparing…' : `Download all ${p.slides} slides`}
                          </Button>
                        )}
                        {p.format === 'Reel' && (
                          <a href={videoUrl(p)} download className="text-[12.5px] text-subtle underline-offset-2 hover:text-text">Download reel (MP4)</a>
                        )}
                        {Array.from({ length: p.slides }, (_, i) => (
                          <a key={i} href={slideUrl(p, i + 1)} download className="text-[12.5px] text-subtle underline-offset-2 hover:text-text">Download slide {i + 1}</a>
                        ))}
                      </div>
                    </div>
                    <Requests postId={p.id} reqs={reqs} reload={loadReqs} placeholder="What should change? e.g. “Swap slide 3 for a beach photo”, “Shorter caption”, “Move to Nov 5”." />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
      {clearedPosts.length > 0 && (
        <section className="mt-8">
          <button onClick={() => setShowCleared((v) => !v)} className="text-[13px] font-semibold text-subtle hover:text-text">
            {showCleared ? 'Hide' : 'Show'} cleared posts ({clearedPosts.length})
          </button>
          {showCleared && (
            <Card className="mt-3">
              <ul className="divide-y divide-line">
                {clearedPosts.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <img src={thumbUrl(p)} alt="" loading="lazy" className="size-10 rounded-md object-cover opacity-70 ring-1 ring-line" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-text">{p.title}</p>
                      <p className="text-[12px] text-faint">{fmt(p.date)} · {cleared[p.id] === 'posted' ? 'Already posted' : 'Deleted'}</p>
                    </div>
                    <Button variant="ghost" onClick={() => restore(p.id)}>Restore</Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}

      {picked.size > 0 && createPortal(
        <div className="xa-page fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-6 md:pl-60">
          <div className="ring-iri w-full max-w-xl rounded-2xl bg-surface p-3.5 shadow-2xl">
            {confirmDelete ? (
              <>
                <p className="text-[14px] font-semibold text-text">Delete {picked.size} post{picked.size > 1 ? 's' : ''}?</p>
                <p className="mt-0.5 text-[12.5px] text-faint">They leave this list (you can restore them at the bottom of the page). If a draft is waiting in Metricool, delete it there too.</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="quiet" onClick={() => setConfirmDelete(false)} disabled={busy}>Back</Button>
                  <Button className="flex-1" onClick={() => clearPicked('deleted')} disabled={busy}>{busy ? 'Deleting…' : `Delete ${picked.size}`}</Button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex-1 pl-1.5 text-[14px] font-semibold text-text">{picked.size} selected</span>
                <Button variant="ghost" onClick={() => setPicked(new Set())}>Clear</Button>
                <Button variant="quiet" onClick={() => setConfirmDelete(true)} disabled={busy}>Delete</Button>
                <Button onClick={() => clearPicked('posted')} disabled={busy}>{busy ? 'Saving…' : 'Already posted'}</Button>
              </div>
            )}
          </div>
        </div>, document.body,
      )}
      {toast.node}
    </div>
  )
}

function Check({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick}
      className={`grid size-5 shrink-0 place-items-center rounded-md text-[12px] font-bold ${on ? 'bg-iri-strong text-navy' : 'ring-1 ring-line-2 hover:ring-gold/60'}`}>
      {on ? '✓' : ''}
    </button>
  )
}
