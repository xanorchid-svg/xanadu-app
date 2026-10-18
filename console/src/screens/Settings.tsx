import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Factor } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { day, useTeamQuery, useTemplates } from '../lib/data'
import { useGate } from '../gate'
import { Icon, NAV } from '../Shell'
import { Avatar, useToast } from '../parts'
import { Button, Card, PageTitle } from '../ui'

type TeamRow = { user_id: string; role: 'admin' | 'reviewer'; added_at: string; email: string; name: string | null; photo_url: string | null }

export default function Settings() {
  const { me, session, signOut } = useGate()
  const [factors, setFactors] = useState<Factor[]>([])
  const team = useTeamQuery<TeamRow[]>('team_list_team')
  const tpl = useTemplates()
  const toast = useToast()
  const isAdmin = me?.role !== 'reviewer'

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => setFactors(data?.totp.filter((f) => f.status === 'verified') ?? []))
  }, [])

  return (
    <div className="xa-page">
      <PageTitle title="Settings" />

      {/* On phones, the sections that don't fit in the bottom bar */}
      <section className="mb-8 md:hidden">
        <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[.16em] text-faint">More</h2>
        <Card>
          <ul className="divide-y divide-line">
            {NAV.filter((n) => !n.phone).map((n) => (
              <li key={n.to}><Link to={n.to} className="flex h-12 items-center gap-3 px-4 text-[15px] text-text no-underline"><Icon d={n.icon} />{n.label}</Link></li>
            ))}
          </ul>
        </Card>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[.16em] text-faint">Your account</h2>
          <Card className="space-y-4 p-5">
            <Row label="Name" value={me?.name || '—'} />
            <Row label="Email" value={session?.user.email ?? '—'} />
            <Row label="Team role" value={isAdmin ? 'Admin' : 'Reviewer'} />
            <Row label="Two-step verification" value={`On${factors.length ? ` · ${factors.length} authenticator${factors.length > 1 ? 's' : ''}` : ''}`} />
            <Button variant="quiet" onClick={signOut}>Sign out</Button>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[.16em] text-faint">The team</h2>
          <Card className="p-5">
            <ul className="mb-4 space-y-3">
              {(team.data ?? []).map((t) => (
                <li key={t.user_id} className="flex items-center gap-3">
                  <Avatar src={t.photo_url} size="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-text">{t.name || t.email}</p>
                    <p className="truncate text-[12px] text-faint">{t.email} · added {day(t.added_at)}</p>
                  </div>
                  <span className="text-[12px] font-semibold text-gold-pale">{t.role === 'admin' ? 'Admin' : 'Reviewer'}</span>
                </li>
              ))}
            </ul>
            {isAdmin && <AddMember onAdded={(e) => { team.reload(); toast.show(`${e} added to the team`) }} />}
          </Card>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-1 text-[12px] font-semibold uppercase tracking-[.16em] text-faint">Message templates</h2>
        <p className="mb-3 text-[13px] text-subtle">Used when you approve, ask for changes, decline or reply. Words in {'{curly brackets}'} are filled in for you ({'{name}'}, {'{space}'}, {'{title}'}); {'{change}'} is yours to write each time.</p>
        <div className="grid gap-3 lg:grid-cols-2">
          {tpl.list.map((t) => <TemplateCard key={t.key} k={t.key} label={t.label} body={t.body} onSaved={() => { tpl.reload(); toast.show('Template saved') }} />)}
        </div>
      </section>
      {toast.node}
    </div>
  )
}

function AddMember({ onAdded }: { onAdded: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'reviewer' | 'admin'>('reviewer')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    const { error } = await supabase.rpc('team_add_member', { p_email: email, p_role: role })
    setBusy(false)
    if (error) setError(error.message.replace(/^.*?: /, '').replace(/^no account/, 'No account'))
    else { onAdded(email.trim()); setEmail('') }
  }
  return (
    <form onSubmit={submit} className="space-y-2.5 border-t border-line pt-4">
      <p className="text-[13px] text-subtle">Add a helper. They need a Xanadu account first, then they sign in here and set up two-step verification.</p>
      <div className="flex flex-wrap gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Their email"
          className="h-10 min-w-0 flex-1 rounded-xl bg-navy/70 px-3.5 text-[14px] text-ink outline-none ring-1 ring-line-2 focus:ring-gold-soft" />
        <select value={role} onChange={(e) => setRole(e.target.value as 'reviewer' | 'admin')} aria-label="Role"
          className="h-10 rounded-xl bg-navy/70 px-3 text-[14px] text-ink ring-1 ring-line-2">
          <option value="reviewer">Reviewer</option><option value="admin">Admin</option>
        </select>
        <Button disabled={busy} className="h-10">{busy ? 'Adding…' : 'Add'}</Button>
      </div>
      <p className="text-[12px] text-faint">Admins can also add team members. Otherwise both roles can do everything.</p>
      {error && <p role="alert" className="text-[13px] text-rose">{error}</p>}
    </form>
  )
}

function TemplateCard({ k, label, body, onSaved }: { k: string; label: string; body: string; onSaved: () => void }) {
  const [text, setText] = useState(body)
  const [busy, setBusy] = useState(false)
  useEffect(() => setText(body), [body])
  const dirty = text.trim() !== body.trim()
  async function save() {
    setBusy(true)
    const { error } = await supabase.rpc('team_set_template', { p_key: k, p_body: text.trim() })
    setBusy(false)
    if (!error) onSaved()
  }
  return (
    <Card className="p-4">
      <p className="mb-2 text-[13.5px] font-semibold text-text">{label}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} aria-label={label}
        className="w-full resize-y rounded-xl bg-navy/70 px-3.5 py-3 text-[13.5px] leading-relaxed text-ink outline-none ring-1 ring-line-2 focus:ring-gold-soft" />
      {dirty && <div className="mt-2 flex justify-end gap-2"><Button variant="ghost" onClick={() => setText(body)}>Undo</Button><Button onClick={save} disabled={busy || !text.trim()} className="h-9">{busy ? 'Saving…' : 'Save'}</Button></div>}
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <span className="text-[13px] text-faint">{label}</span>
      <span className="text-[14px] text-text">{value}</span>
    </div>
  )
}
