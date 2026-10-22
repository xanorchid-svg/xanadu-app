import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { day, ROLE_LABEL, useTeamQuery, when, type Role } from '../lib/data'
import { Search, Tabs, useToast } from '../parts'
import { Button, Card, EmptyState, PageTitle, Spinner } from '../ui'

type EmailRow = {
  id: string; kind: string; type: string | null; subject: string | null; status: 'queued' | 'sent' | 'failed' | 'skipped'
  error: string | null; created_at: string; sent_at: string | null; name: string | null; email: string; role: Role | null
}
type Missing = { id: string; name: string | null; role: Role; email: string; created_at: string }

const TYPE: Record<string, string> = {
  welcome_seeker: 'Waitlist thank-you', application_container: 'Application thank-you', application_facilitator: 'Application thank-you',
  approved: 'Approved', changes: 'Needs changes', declined: 'Declined', offering_live: 'Experience live', offering_changes: 'Experience changes',
  team_message: 'Team message', message: 'New message', community_request: 'Community request', community_accepted: 'Community', match: 'New match',
}
const TONE = { sent: 'text-iri-sage', queued: 'text-gold-pale', failed: 'text-rose', skipped: 'text-faint' } as const

type Tab = 'all' | 'sent' | 'failed'
const TABS = [{ key: 'all', label: 'All' }, { key: 'sent', label: 'Sent' }, { key: 'failed', label: 'Failed' }] as const

/** Every email Xanadu has sent to members, and anyone who never got a welcome email. */
export default function Emails() {
  const log = useTeamQuery<EmailRow[]>('team_email_log', { p_limit: 500 })
  const missing = useTeamQuery<Missing[]>('team_missing_welcome')
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const toast = useToast()

  const counts = useMemo(() => ({
    all: log.data?.length ?? 0,
    sent: log.data?.filter((e) => e.status === 'sent').length ?? 0,
    failed: log.data?.filter((e) => e.status === 'failed').length ?? 0,
  }), [log.data])
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (log.data ?? []).filter((e) => (tab === 'all' || e.status === tab) &&
      (!s || [e.name, e.email, e.subject].some((v) => v?.toLowerCase().includes(s))))
  }, [log.data, tab, q])

  const refresh = () => setTimeout(() => { log.reload(); missing.reload() }, 2500)
  async function sendWelcome(ids: string[]) {
    setBusy(ids.length > 1 ? 'all' : ids[0])
    for (const id of ids) await supabase.rpc('team_send_welcome', { p_member: id })
    setBusy(null)
    toast.show(ids.length > 1 ? `Sending ${ids.length} welcome emails` : 'Welcome email on its way')
    refresh()
  }
  async function retry() {
    setBusy('retry')
    const { data } = await supabase.rpc('team_retry_emails')
    setBusy(null)
    toast.show((data as number) ? `Sending ${data} email${data === 1 ? '' : 's'} again` : 'Nothing to retry')
    refresh()
  }

  return (
    <div className="xa-page">
      <PageTitle title="Emails"><Search value={q} onChange={setQ} placeholder="Search name, email, subject" /></PageTitle>

      {missing.data && missing.data.length > 0 && (
        <Card glow className="mb-6 p-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-[22px] text-ink">No welcome email yet</h2>
              <p className="text-[13px] text-subtle">These members finished setting up before welcome emails existed.</p>
            </div>
            {missing.data.length > 1 && <Button className="h-9" disabled={!!busy} onClick={() => sendWelcome(missing.data!.map((m) => m.id))}>{busy === 'all' ? 'Sending…' : `Send to all ${missing.data.length}`}</Button>}
          </div>
          <ul className="divide-y divide-line">
            {missing.data.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-[14px]">
                <span className="min-w-0 flex-1 truncate text-text">{m.name || m.email} <span className="text-faint">· {m.email}</span></span>
                <span className="text-[12.5px] text-subtle">{ROLE_LABEL[m.role]} · joined {day(m.created_at)}</span>
                <Button variant="quiet" className="h-9" disabled={!!busy} onClick={() => sendWelcome([m.id])}>{busy === m.id ? 'Sending…' : 'Send welcome'}</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} value={tab} onChange={setTab} counts={counts} />
        <div className="flex gap-2">
          <Button variant="quiet" className="h-9" onClick={() => { log.reload(); missing.reload() }}>Refresh</Button>
          {counts.failed > 0 && <Button className="h-9" onClick={retry} disabled={!!busy}>{busy === 'retry' ? 'Retrying…' : `Retry ${counts.failed} failed`}</Button>}
        </div>
      </div>

      {log.error && <p className="text-[14px] text-rose">{log.error}</p>}
      {!log.data && !log.error && <div className="grid place-items-center py-16"><Spinner /></div>}
      {log.data && shown.length === 0 && (
        <EmptyState title={q ? 'Nothing matches' : 'No emails yet'} body="Welcome emails, application decisions, team replies, message alerts and new-match emails will all be listed here." />
      )}
      {log.data && shown.length > 0 && (
        <Card>
          <ul className="divide-y divide-line">
            {shown.map((e) => (
              <li key={e.id} className="grid grid-cols-1 gap-x-4 gap-y-0.5 px-4 py-3 text-[13.5px] sm:grid-cols-[1fr_auto] sm:px-5">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text">{e.subject || '—'}</p>
                  <p className="truncate text-[12.5px] text-faint">To {e.name || e.email} · {e.email}{e.role ? ` · ${ROLE_LABEL[e.role]}` : ''}</p>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11.5px] text-subtle ring-1 ring-line">{TYPE[e.type ?? e.kind] ?? 'Email'}</span>
                  <span className={`font-semibold capitalize ${TONE[e.status]}`}>{e.status}</span>
                  <span className="text-[12px] text-faint">{when(e.sent_at ?? e.created_at)}</span>
                </div>
                {e.error && <p className="text-[12px] text-rose sm:col-span-2">{e.error}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="mt-4 text-[12.5px] leading-relaxed text-faint">
        Sign-in emails (confirm your email, reset password) are sent by Supabase through Resend, so they appear in Resend → Emails rather than here.
        Message alerts show who wrote, never what they wrote.
      </p>
      {toast.node}
    </div>
  )
}
