import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth'
import { useToReview, type CommunityEvent } from '../events'
import { ReviewSheet } from './EventGoing'

const SNOOZE_DAYS = 3
const key = (id: string) => `xa-review-snooze-${id}`
const snoozed = (id: string) => {
  try { const t = Number(localStorage.getItem(key(id)) ?? 0); return Date.now() - t < SNOOZE_DAYS * 86400000 } catch { return false }
}

/**
 * After a seeker goes to an event, a pop-up asks how it was (once at a time, a little after the screen opens).
 * "Not now" asks again in a few days; it stops asking once they've reviewed or 30 days have passed.
 */
export default function ReviewPrompt() {
  const { profile } = useAuth()
  const { pathname } = useLocation()
  const { toReview, reload } = useToReview()
  const [open, setOpen] = useState<CommunityEvent | null>(null)
  const quietHere = pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/welcome') || pathname.startsWith('/messages') || pathname.startsWith('/community/chat')

  useEffect(() => {
    if (open || quietHere || profile?.role !== 'seeker') return
    const next = toReview.find((e) => !snoozed(e.id))
    if (!next) return
    const t = setTimeout(() => setOpen(next), 1500)
    return () => clearTimeout(t)
  }, [toReview, open, quietHere, profile?.role])

  if (!open) return null
  const later = () => { try { localStorage.setItem(key(open.id), String(Date.now())) } catch { /* private mode */ } setOpen(null) }
  return <ReviewSheet e={open} onClose={later} onDone={() => { setOpen(null); reload() }} />
}
