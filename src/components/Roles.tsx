import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HOME, useAuth, type DbRole } from '../auth'
import { supabase, friendlyError } from '../lib/supabase'

/**
 * One account, several roles. Everyone can be a Seeker; Container and Facilitator are applications
 * the Xanadu team reviews one by one. The member switches hats here; the tabs change to match.
 */

const LABEL: Record<DbRole, string> = { seeker: 'Seeker', container: 'Container', facilitator: 'Facilitator' }
const ADD: Record<'container' | 'facilitator', { title: string; sub: string }> = {
  container: { title: 'Host a space', sub: 'Add your retreat space, studio or land as a Container.' },
  facilitator: { title: 'Guide as a Facilitator', sub: 'Hold classes, circles or retreats in spaces on Xanadu.' },
}

const statusOf = (p: { container_status: string | null; facilitator_status: string | null }, r: DbRole) =>
  r === 'container' ? p.container_status : r === 'facilitator' ? p.facilitator_status : 'active'

const NOTE: Record<string, string> = { pending: 'In review', declined: 'Not approved', approved: '' }

export function RolesCard() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  if (!profile) return null

  const mine: DbRole[] = ['seeker', ...(['container', 'facilitator'] as const).filter((r) => statusOf(profile, r))]
  const canAdd = (['container', 'facilitator'] as const).filter((r) => !statusOf(profile, r) || statusOf(profile, r) === 'declined')
  const approvedElsewhere = profile.container_status === 'approved' || profile.facilitator_status === 'approved'

  const run = async (key: string, fn: () => Promise<{ data: unknown; error: { message: string } | null }>) => {
    setBusy(key); setError('')
    const { data, error: err } = await fn()
    if (err) { setError(friendlyError(err.message)); setBusy(''); return null }
    const p = await refreshProfile()
    setBusy('')
    return { data, profile: p }
  }

  const switchTo = async (r: DbRole) => {
    if (r === profile.role) return
    const res = await run(r, async () => await supabase.rpc('switch_role', { p_role: r }))
    if (res?.profile) navigate(HOME[res.profile.role], { replace: true })
  }

  const add = async (r: 'container' | 'facilitator') => {
    const res = await run(`add-${r}`, async () => await supabase.rpc('add_role', { p_role: r }))
    if (!res) return
    navigate(res.data === 'setup' ? '/welcome' : HOME[r], { replace: true })
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="m-0 font-display text-[22px] font-semibold text-ink">Your roles</h2>
        <span className="text-xs text-subtle">One account for everything you do on Xanadu.</span>
      </div>

      {mine.length > 1 && (
        <div role="radiogroup" aria-label="Use Xanadu as" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${mine.length}, minmax(0, 1fr))` }}>
          {mine.map((r) => {
            const on = profile.role === r
            const note = NOTE[statusOf(profile, r) ?? ''] ?? ''
            return (
              <button key={r} type="button" role="radio" aria-checked={on} disabled={!!busy} onClick={() => switchTo(r)}
                className={`flex min-h-[54px] flex-col items-center justify-center rounded-2xl px-2 text-[14px] transition-colors ${on ? 'bg-iri font-semibold text-navy' : 'border border-line text-muted'}`}>
                <span>{busy === r ? 'Switching…' : LABEL[r]}</span>
                {note && <span className={`text-[11px] ${on ? 'text-navy/70' : 'text-subtle'}`}>{note}</span>}
              </button>
            )
          })}
        </div>
      )}

      {canAdd.map((r) => (
        <button key={r} type="button" disabled={!!busy} onClick={() => add(r)}
          className="ring-iri flex min-h-[64px] items-center justify-between gap-3 rounded-2xl bg-plum/50 px-4 py-3 text-left">
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold text-ink">{busy === `add-${r}` ? 'Opening…' : statusOf(profile, r) === 'declined' ? `${ADD[r].title}: apply again` : ADD[r].title}</span>
            <span className="text-[13px] leading-snug text-subtle">
              {ADD[r].sub}{approvedElsewhere ? ' Already reviewed members get a faster review.' : ' The Xanadu team reviews it personally.'}
            </span>
          </span>
          <span aria-hidden className="text-gold-pale">›</span>
        </button>
      ))}

      {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
    </section>
  )
}

/** While adding a role: go back to how things were. */
export async function cancelAddRole() {
  const { data, error } = await supabase.rpc('cancel_add_role')
  return { role: (data as DbRole | null) ?? 'seeker', error: error ? friendlyError(error.message) : '' }
}
