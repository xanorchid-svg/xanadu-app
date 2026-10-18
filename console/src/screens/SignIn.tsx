import { useEffect, useState, type FormEvent } from 'react'
import { friendlyError, googleEnabled, supabase } from '../lib/supabase'
import { Button, DoorFrame, Field } from '../ui'

/** Sign in only. There is no sign-up here: the team list lives in the database. */
export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [google, setGoogle] = useState(false)

  useEffect(() => { googleEnabled().then(setGoogle) }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError(friendlyError(error.message))
    setBusy(false)
  }

  async function withGoogle() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
    // (a path is needed: Supabase's "https://backend.dreamxanadu.com/**" rule doesn't match the bare origin)
    if (error) setError(friendlyError(error.message))
  }

  return (
    <DoorFrame>
      <h1 className="font-display text-[30px] leading-tight text-ink">Welcome back</h1>
      <p className="mt-1 mb-6 text-[14px] text-subtle">For the Xanadu team only.</p>

      {google && (
        <>
          <Button variant="quiet" className="w-full" onClick={withGoogle} type="button">
            <GoogleMark /> Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-[12px] text-faint">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="text-[13px] text-rose">{error}</p>}
        <Button className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
    </DoorFrame>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z" />
    </svg>
  )
}
