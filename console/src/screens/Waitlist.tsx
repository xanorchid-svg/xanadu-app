import { useMemo, useState } from 'react'
import { day, useTeamQuery } from '../lib/data'
import { Search, useToast } from '../parts'
import { Button, Card, EmptyState, PageTitle, Spinner } from '../ui'

type Row = {
  id: string; name: string; email: string; intention: string | null; seeking: string[] | null
  stay_length: string | null; stay_work: string | null; stay_where: string[] | null; source: string | null
  invited_at: string | null; created_at: string; has_account: boolean
}

const FROM: Record<string, string> = { 'join-section': 'Website · waitlist section', 'join-modal': 'Website · Join Xanadu', app: 'Signed up in the app' }

/** Seekers who joined the waitlist on dreamxanadu.com. They enter the app once the founding circle is complete. */
export default function Waitlist() {
  const list = useTeamQuery<Row[]>('team_waitlist')
  const [q, setQ] = useState('')
  const toast = useToast()

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (list.data ?? []).filter((r) => !s || [r.name, r.email, r.intention].some((v) => v?.toLowerCase().includes(s)))
  }, [list.data, q])

  async function copyEmails() {
    const emails = shown.map((r) => r.email).join(', ')
    try { await navigator.clipboard.writeText(emails); toast.show(`Copied ${shown.length} email${shown.length === 1 ? '' : 's'}`) }
    catch { toast.show('Copy did not work in this browser') }
  }

  return (
    <div className="xa-page">
      <PageTitle title="Waitlist"><Search value={q} onChange={setQ} placeholder="Search name, email, what they seek" /></PageTitle>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-subtle">
          {list.data ? <><span className="font-semibold text-gold-pale">{list.data.length}</span> Seeker{list.data.length === 1 ? '' : 's'} waiting</> : ' '}
        </p>
        <div className="flex gap-2">
          <Button variant="quiet" className="h-9" onClick={() => list.reload()}>Refresh</Button>
          {shown.length > 0 && <Button variant="quiet" className="h-9" onClick={copyEmails}>Copy emails</Button>}
        </div>
      </div>

      {list.error && <p className="text-[14px] text-rose">{list.error}</p>}
      {!list.data && !list.error && <div className="grid place-items-center py-16"><Spinner /></div>}
      {list.data && shown.length === 0 && (
        <EmptyState title={q ? 'Nothing matches' : 'No one on the waitlist yet'} body="Seekers who join the waitlist on dreamxanadu.com appear here, with the stay they designed." />
      )}
      {list.data && shown.length > 0 && (
        <Card>
          <ul className="divide-y divide-line">
            {shown.map((r) => {
              const stay = [r.stay_length, r.stay_work, r.stay_where?.join(', '), r.seeking?.join(', ')].filter(Boolean).join(' · ')
              return (
                <li key={r.id} className="px-4 py-3.5 text-[13.5px] sm:px-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-text">{r.name}</span>
                    <span className="text-faint">{r.email}</span>
                    {r.has_account && <span className="rounded-full bg-surface px-2 py-0.5 text-[11.5px] text-iri-sage ring-1 ring-line">Has an app account</span>}
                    <span className="ml-auto text-[12px] text-faint">{day(r.created_at)}</span>
                  </div>
                  {stay && <p className="mt-1 text-[12.5px] text-subtle">{stay}</p>}
                  {r.intention && <p className="mt-1 whitespace-pre-line text-[13px] text-text/85">{r.intention}</p>}
                  {r.source && <p className="mt-1 text-[11.5px] text-faint">{FROM[r.source] ?? r.source}</p>}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <p className="mt-4 text-[12.5px] leading-relaxed text-faint">
        Containers and Facilitators don't join the waitlist: the website sends them straight to apply in the app, so they appear in Applications.
      </p>
      {toast.node}
    </div>
  )
}
