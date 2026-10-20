import { useEffect, useMemo, useState } from 'react'
import { POSTS, slideUrl, videoUrl, type SocialPost } from '../social/posts'
import { useToast } from '../parts'
import { Button, Card, PageTitle } from '../ui'

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
  { key: 'imagery', label: 'Imagery', get: (p) => p.imagery, options: [{ value: 'AI', label: 'AI photos' }, { value: 'Stock footage', label: 'Real footage' }, { value: 'Graphic only', label: 'Type only' }] },
  {
    key: 'month', label: 'Month', get: month,
    options: uniq([...POSTS].sort((a, b) => a.date.localeCompare(b.date)).map(month)).map((m) => ({ value: m, label: m })),
  },
]
type Filters = Record<string, string[]>
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

  const matches = (p: SocialPost, skip?: string) => GROUPS.every((g) => g.key === skip || !filters[g.key]?.length || filters[g.key].includes(g.get(p)))
  const shown = useMemo(() => [...POSTS].sort((a, b) => a.date.localeCompare(b.date)).filter((p) => matches(p)), [filters]) // eslint-disable-line react-hooks/exhaustive-deps
  const active = Object.values(filters).some((v) => v.length)

  function toggle(key: string, value: string) {
    setFilters((f) => { const cur = f[key] || []; return { ...f, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] } })
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); toast.show('Caption copied') } catch { toast.show('Could not copy') }
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
        Photos are either AI-generated for mood (checked for hands, faces, text and physics) or free licensed stock footage (Mixkit).
      </p>

      <Card className="mb-6 px-5 py-4">
        <div className="space-y-3">
          {GROUPS.map((g) => (
            <div key={g.key} className="flex flex-wrap items-center gap-2">
              <span className="w-full shrink-0 text-[11.5px] sm:w-24 font-semibold uppercase tracking-[0.14em] text-faint">{g.label}</span>
              {g.options.map((o) => {
                const on = filters[g.key]?.includes(o.value)
                const n = POSTS.filter((p) => g.get(p) === o.value && matches(p, g.key)).length
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
            Showing {shown.length} of {POSTS.length} posts
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
              <img src={slideUrl(p, 1)} alt={p.title} loading="lazy" className="size-full object-cover" />
              <span className="absolute right-1.5 top-1 text-[12px] text-white [text-shadow:0_1px_4px_rgba(0,0,0,.6)]">{p.format === 'Reel' ? '▶' : p.slides > 1 ? '❐' : ''}</span>
              <span className="absolute bottom-1 left-1 rounded-md bg-navy/60 px-1.5 text-[10.5px] font-semibold text-white">{new Date(p.date).toLocaleString('en-US', { month: 'short', day: 'numeric' })}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {!shown.length && <p className="text-[14px] text-subtle">No posts match these filters.</p>}
          {shown.map((p) => {
            const s = STATUS[p.status]
            const isOpen = open === p.id
            return (
              <Card key={p.id} className="overflow-hidden">
                <button id={'post-' + p.id} onClick={() => setOpen(isOpen ? null : p.id)} className="flex w-full scroll-mt-6 flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left">
                  <img src={slideUrl(p, 1)} alt="" className="size-14 rounded-lg object-cover ring-1 ring-line" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[22px] leading-tight text-ink">{p.title}</p>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-faint">
                      <span className={`inline-block size-2.5 rounded-full ${COVER_DOT[p.cover]}`} title={`${p.cover} grid tile`} />
                      {fmt(p.date)} · {p.format}{p.slides > 1 ? ` · ${p.slides} slides` : ''} · for {p.audience} · {p.imagery === 'Stock footage' ? 'real footage' : p.imagery === 'AI' ? 'AI photos' : 'type only'}
                    </p>
                  </div>
                  <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-semibold ${s.cls}`}>{s.label}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-line px-5 py-5">
                    <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-3">
                      {p.format === 'Reel' && (
                        <video src={videoUrl(p)} poster={slideUrl(p, 1)} controls playsInline preload="none"
                          className="h-[427px] w-[240px] shrink-0 snap-start rounded-xl bg-navy object-cover ring-1 ring-line sm:h-[533px] sm:w-[300px]" />
                      )}
                      {p.format !== 'Reel' && Array.from({ length: p.slides }, (_, i) => (
                        <a key={i} href={slideUrl(p, i + 1)} target="_blank" rel="noreferrer" className="shrink-0 snap-start">
                          <img src={slideUrl(p, i + 1)} alt={`${p.title}, slide ${i + 1}`} loading="lazy"
                            className="h-[300px] w-[240px] rounded-xl object-cover ring-1 ring-line sm:h-[375px] sm:w-[300px]" />
                        </a>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto]">
                      <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-navy/70 p-4 font-sans text-[13.5px] leading-relaxed text-text ring-1 ring-line">{p.caption}</pre>
                      <div className="flex flex-row flex-wrap gap-2 md:flex-col">
                        <Button variant="quiet" className="h-10" onClick={() => copy(p.caption)}>Copy caption</Button>
                        {p.format === 'Reel' && (
                          <a href={videoUrl(p)} download className="text-[12.5px] text-subtle underline-offset-2 hover:text-text">Download reel (MP4)</a>
                        )}
                        {Array.from({ length: p.slides }, (_, i) => (
                          <a key={i} href={slideUrl(p, i + 1)} download className="text-[12.5px] text-subtle underline-offset-2 hover:text-text">Download slide {i + 1}</a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
      {toast.node}
    </div>
  )
}
