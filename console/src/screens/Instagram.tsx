import { useState } from 'react'
import { POSTS, slideUrl, type SocialPost } from '../social/posts'
import { useToast } from '../parts'
import { Button, Card, PageTitle } from '../ui'

const METRICOOL = 'https://app.metricool.com/planner?blogId=7525297'
const STATUS: Record<SocialPost['status'], { label: string; cls: string }> = {
  draft: { label: 'Draft in Metricool', cls: 'bg-gold/15 text-gold-pale ring-1 ring-gold/40' },
  scheduled: { label: 'Scheduled', cls: 'ring-iri text-ink' },
  posted: { label: 'Posted', cls: 'bg-slate/30 text-subtle ring-1 ring-slate' },
}

function fmt(date: string) {
  return new Date(date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/** Instagram & Facebook posts Claude prepared, waiting for Xan to check and schedule. */
export default function Instagram() {
  const toast = useToast()
  const [open, setOpen] = useState<string | null>(POSTS[0]?.id ?? null)

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); toast.show('Caption copied') } catch { toast.show('Could not copy') }
  }

  return (
    <div className="xa-page">
      <PageTitle eyebrow="Content" title="Instagram">
        <a href={METRICOOL} target="_blank" rel="noreferrer"><Button className="h-10">Open Metricool</Button></a>
      </PageTitle>

      <p className="mb-6 max-w-2xl text-[14px] leading-relaxed text-subtle">
        Each post below is waiting in Metricool as a draft. Check the slides and caption here or there, then schedule it in Metricool.
        Nothing goes live until you do. Images are AI-generated for mood and checked for hands, faces, text and physics.
      </p>

      <div className="space-y-5">
        {POSTS.map((p) => {
          const s = STATUS[p.status]
          const isOpen = open === p.id
          return (
            <Card key={p.id} className="overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : p.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left">
                <img src={slideUrl(p, 1)} alt="" className="size-14 rounded-lg object-cover ring-1 ring-line" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[22px] leading-tight text-ink">{p.title}</p>
                  <p className="text-[12.5px] text-faint">{fmt(p.date)} · {p.format}{p.slides > 1 ? ` · ${p.slides} slides` : ''} · for {p.audience}</p>
                </div>
                <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-semibold ${s.cls}`}>{s.label}</span>
              </button>

              {isOpen && (
                <div className="border-t border-line px-5 py-5">
                  <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-3">
                    {Array.from({ length: p.slides }, (_, i) => (
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
      {toast.node}
    </div>
  )
}
