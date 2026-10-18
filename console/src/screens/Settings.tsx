import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Factor } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useGate } from '../gate'
import { Icon, NAV } from '../Shell'
import { Button, Card, PageTitle } from '../ui'

export default function Settings() {
  const { me, session, signOut } = useGate()
  const [factors, setFactors] = useState<Factor[]>([])

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
              <li key={n.to}>
                <Link to={n.to} className="flex h-12 items-center gap-3 px-4 text-[15px] text-text no-underline"><Icon d={n.icon} />{n.label}</Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[.16em] text-faint">Your account</h2>
        <Card className="space-y-4 p-5">
          <Row label="Name" value={me?.name || '—'} />
          <Row label="Email" value={session?.user.email ?? '—'} />
          <Row label="Team role" value={me?.role === 'reviewer' ? 'Reviewer' : 'Admin'} />
          <Row label="Two-step verification" value={factors.length ? `On · ${factors.length} authenticator${factors.length > 1 ? 's' : ''}` : 'On'} />
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[.16em] text-faint">Coming next</h2>
        <Card className="p-5 text-[14px] leading-relaxed text-subtle">
          Team members and helpers, and editable message templates for approvals, changes and declines.
        </Card>
      </section>

      <Button variant="quiet" onClick={signOut}>Sign out</Button>
    </div>
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
