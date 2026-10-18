import { useCallback, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { action, day, fill, firstName, place, ROLE_LABEL, useTeamQuery, useTemplates, when, type Person, type Report } from '../lib/data'
import { Answers, Avatar, Composer, Drawer, Section, Tabs, useToast } from '../parts'
import { Button, Card, EmptyState, PageTitle, Spinner } from '../ui'

type Tab = 'open' | 'resolved' | 'all'
const TABS = [{ key: 'open', label: 'Open' }, { key: 'resolved', label: 'Resolved' }, { key: 'all', label: 'All' }] as const

/**
 * Community reports. Shows who reported whom and why, and both profiles.
 * Members' private Community chats are never shown, here or anywhere in the console.
 */
export default function Safety() {
  const { data, error, reload } = useTeamQuery<Report[]>('team_list_reports')
  const [tab, setTab] = useState<Tab>('open')
  const [openId, setOpenId] = useState<string | null>(null)
  const close = useCallback(() => setOpenId(null), [])
  const toast = useToast()

  const counts = useMemo(() => ({
    open: data?.filter((r) => !r.resolved).length ?? 0,
    resolved: data?.filter((r) => r.resolved).length ?? 0,
    all: data?.length ?? 0,
  }), [data])
  const shown = (data ?? []).filter((r) => tab === 'all' || (tab === 'open' ? !r.resolved : !!r.resolved))
  const open = data?.find((r) => r.id === openId) ?? null

  return (
    <div className="xa-page">
      <PageTitle title="Safety" />
      <div className="mb-5"><Tabs tabs={TABS} value={tab} onChange={setTab} counts={counts} /></div>

      {error && <p className="text-[14px] text-rose">{error}</p>}
      {!data && !error && <div className="grid place-items-center py-16"><Spinner /></div>}
      {data && shown.length === 0 && (
        <EmptyState title={tab === 'open' ? 'No open reports' : 'Nothing here yet'}
          body="When a member reports someone in Community, it appears here with both profiles, so you can dismiss it, send a warning, or remove them from Community." />
      )}

      {data && shown.length > 0 && (
        <Card>
          <ul className="divide-y divide-line">
            {shown.map((r) => (
              <li key={r.id}>
                <button onClick={() => setOpenId(r.id)} className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left hover:bg-surface/60 sm:px-5">
                  <Avatar src={r.reported.photo_url} size="size-11" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold text-text">
                      {r.reported.name || 'No name'} <span className="font-normal text-faint">reported by {r.reporter.name || 'No name'}</span>
                    </p>
                    <p className="truncate text-[13px] text-subtle">{r.reason || 'No reason given'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[12px] text-faint">{day(r.created_at)}</p>
                    {r.resolved
                      ? <p className="text-[11.5px] text-iri-sage">{action(r.resolved.action).replace(/^report /, '')}</p>
                      : <p className="text-[11.5px] font-semibold text-rose">Open</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {open && <ReportDrawer key={open.id} r={open} onClose={close} onDone={(label) => { toast.show(label); reload() }} />}
      {toast.node}
    </div>
  )
}

type Act = 'dismiss' | 'warn' | 'remove'
const ACT: Record<Act, { label: string; send: string; done: string; tpl?: string }> = {
  dismiss: { label: 'Dismiss', send: 'Dismiss report', done: 'Report dismissed' },
  warn: { label: 'Send a warning', send: 'Send warning', done: 'Warning sent', tpl: 'warn' },
  remove: { label: 'Remove from Community', send: 'Remove and send', done: 'Removed from Community', tpl: 'removed' },
}

function ReportDrawer({ r, onClose, onDone }: { r: Report; onClose: () => void; onDone: (label: string) => void }) {
  const [act, setAct] = useState<Act | null>(null)
  const tpl = useTemplates()
  const initial = act && ACT[act].tpl ? fill(tpl.get(ACT[act].tpl!), { name: firstName(r.reported.name) }) : ''

  async function run(body: string) {
    if (!act) return null
    const { error } = await supabase.rpc('team_resolve_report', { p_report: r.id, p_action: act, p_message: body })
    if (error) return error.message
    onDone(ACT[act].done); setAct(null)
    return null
  }
  async function restore() {
    const { error } = await supabase.rpc('team_restore_community', { p_member: r.reported.id })
    if (!error) onDone('Allowed back into Community')
  }

  const removed = r.reported.community_removed
  const footer = act ? (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-text">{ACT[act].label}{act !== 'dismiss' ? `: this message goes to ${firstName(r.reported.name)}'s Xanadu inbox` : ''}</p>
      {act === 'dismiss'
        ? <div className="flex gap-2 pb-1"><Button variant="quiet" onClick={() => setAct(null)}>Cancel</Button><Button className="flex-1" onClick={() => run('')}>Dismiss report</Button></div>
        : <Composer key={act + initial} initial={initial} sendLabel={ACT[act].send} onSend={run} onCancel={() => setAct(null)} autoFocus
            hint={act === 'remove' ? 'They disappear from Community and can’t rejoin it themselves. The rest of Xanadu stays open to them.' : undefined} />}
    </div>
  ) : (
    <div className="flex flex-wrap gap-2 pb-1">
      <Button variant="quiet" onClick={() => setAct('dismiss')}>Dismiss</Button>
      <Button variant="quiet" onClick={() => setAct('warn')}>Send a warning</Button>
      {removed
        ? <Button variant="quiet" onClick={restore} className="flex-1">Allow back into Community</Button>
        : <Button onClick={() => setAct('remove')} className="flex-1">Remove from Community</Button>}
    </div>
  )

  return (
    <Drawer label="Report" onClose={onClose} footer={footer} title="Community report"
      sub={<>{when(r.created_at)}{r.resolved ? <span className="text-iri-sage">Resolved: {action(r.resolved.action).replace(/^report /, '')}</span> : <span className="font-semibold text-rose">Open</span>}</>}>
      <Section title="Reason">
        <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-text">{r.reason || 'No reason given'}</p>
      </Section>
      <PersonBlock title="Reported" p={r.reported} extra={[
        ['Reports against them', String(r.reported.reports_against)],
        ['In Community', removed ? 'Removed by the team' : r.reported.community_visible ? 'Yes' : 'Not visible'],
        ['Blocked by reporter', r.blocked ? 'Yes' : 'No'],
      ]} />
      <PersonBlock title="Reported by" p={r.reporter} />
      <p className="text-[12.5px] text-faint">Their private Community chats are never shown in the console.</p>
    </Drawer>
  )
}

function PersonBlock({ title, p, extra = [] }: { title: string; p: Person; extra?: [string, string][] }) {
  return (
    <Section title={title}>
      <div className="mb-3 flex items-center gap-3">
        <Avatar src={p.photo_url} size="size-12" />
        <div><p className="text-[15px] font-semibold text-text">{p.name || 'No name'}</p><p className="text-[12.5px] text-faint">{ROLE_LABEL[p.role]}</p></div>
      </div>
      <Answers rows={[['Email', p.email && <span className="select-all">{p.email}</span>], ['Location', place(p.town, p.region)], ...extra]} />
    </Section>
  )
}
