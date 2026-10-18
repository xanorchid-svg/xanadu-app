import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { BackButton, Screen } from '../../components/ui'
import { Loading, useAuth } from '../../auth'
import { supabase } from '../../lib/supabase'
import { roleName, startThread, useThreads } from '../../threads'
import { Avatar } from '../community/Community'

type Who = { name: string; photo: string; role: string; about: string }

/**
 * /messages/new?to=<member>&space=<space>&offering=<offering>&draft=<text>
 * Write the first message to a space or guide. If you already have a conversation with them,
 * it opens that one instead, with your message started.
 */
export default function Compose() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { threads, loading } = useThreads()
  const to = params.get('to') ?? ''
  const spaceId = params.get('space')
  const offeringId = params.get('offering')
  const [who, setWho] = useState<Who | null | undefined>(undefined)
  const [text, setText] = useState(params.get('draft') ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    ;(async () => {
      const { data: p } = await supabase.from('profiles').select('name, photo_url, role, status').eq('id', to).maybeSingle()
      const { data: s } = spaceId ? await supabase.from('spaces').select('name, photos, about').eq('id', spaceId).maybeSingle() : { data: null }
      const { data: o } = offeringId ? await supabase.from('offerings').select('title').eq('id', offeringId).maybeSingle() : { data: null }
      if (!live) return
      if (!p) { setWho(null); return }
      setWho({
        name: (p.role === 'container' && s?.name) || p.name || 'Xanadu member',
        photo: (p.role === 'container' && s?.photos?.[0]) || p.photo_url || '',
        role: roleName(p.role),
        about: o?.title ? `About ${o.title}` : s?.name ? `About ${s.name}` : '',
      })
    })()
    return () => { live = false }
  }, [to, spaceId, offeringId])

  if (!to || to === session?.user.id) return <Navigate to="/messages" replace />
  if (loading || who === undefined) return <Loading label="Opening…" />

  const existing = threads.find((t) => t.other_id === to)
  if (existing) return <Navigate to={`/messages/${existing.id}`} replace state={{ draft: text }} />

  if (!who) {
    return (
      <Screen>
        <div className="flex flex-col gap-4 px-5 pt-safe">
          <BackButton />
          <p className="m-0 text-[15px] text-muted">This member isn’t taking messages yet.</p>
        </div>
      </Screen>
    )
  }

  const send = async () => {
    const body = text.trim()
    if (!body || busy) return
    setBusy(true); setError('')
    const { id, error } = await startThread(to, body, { spaceId, offeringId })
    setBusy(false)
    if (error || !id) { setError(error ?? 'Something went wrong. Please try again.'); return }
    navigate(`/messages/${id}`, { replace: true })
  }

  const header = (
    <div className="flex items-center gap-3 border-b border-[#1F2B3E] bg-navy px-4 pt-safe pb-3">
      <BackButton />
      <Avatar name={who.name} photo={who.photo} size={40} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[16px] font-semibold text-ink">{who.name}</span>
        <span className="truncate text-xs text-subtle">{who.role}{who.about ? ` · ${who.about}` : ''}</span>
      </div>
    </div>
  )

  return (
    <Screen header={header}>
      <div className="flex flex-col gap-4 px-5 py-6">
        <h1 className="m-0 font-display text-[28px] font-medium text-ink">{`Write to ${who.name}`}</h1>
        <p className="m-0 text-[14px] leading-relaxed text-muted">Your message goes straight to them, and their reply comes back to your Messages. It’s private between the two of you.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} maxLength={4000} autoFocus
          placeholder="Introduce yourself and what you’d love to know: dates, how long you’d stay, what you’re hoping for."
          className="rounded-2xl border border-line bg-surface-2 p-4 text-[15px] leading-relaxed text-text outline-none placeholder:text-faint focus:border-gold" />
        {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
        <button type="button" onClick={send} disabled={busy || !text.trim()} className="min-h-[54px] rounded-2xl bg-iri text-[15px] font-semibold text-navy disabled:opacity-60">{busy ? 'Sending…' : 'Send message'}</button>
        <p className="m-0 text-center text-[12px] text-faint">Be kind. You can report or block anyone from inside the conversation.</p>
      </div>
    </Screen>
  )
}
