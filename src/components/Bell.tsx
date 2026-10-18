import { Link } from 'react-router-dom'
import { useUnreadNotifications } from '../notifications'

/** Bell with an unread count, linking to /notifications. */
export function Bell({ className = '' }: { className?: string }) {
  const n = useUnreadNotifications()
  return (
    <Link to="/notifications" aria-label={n ? `Notifications, ${n} unread` : 'Notifications'}
      className={`relative flex h-11 w-11 flex-none items-center justify-center rounded-full border border-line text-muted no-underline ${className}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" />
      </svg>
      {n > 0 && (
        <span className="bg-iri-strong absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10.5px] font-bold text-navy ring-2 ring-navy">{n > 9 ? '9+' : n}</span>
      )}
    </Link>
  )
}
