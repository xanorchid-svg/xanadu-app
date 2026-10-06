import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Field, inputCls } from '../components/ui'
import { HOME, Loading, useAuth } from '../auth'
import { friendlyError, supabase } from '../lib/supabase'

/** Opened from the "reset your password" email. */
export default function ResetPassword() {
  const navigate = useNavigate()
  const { session, profile, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <Loading />
  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-navy px-8 text-center">
        <h1 className="m-0 font-display text-3xl font-medium text-ink">This link has expired</h1>
        <p className="m-0 text-sm text-muted">Go back and tap Forgot? again to get a fresh link.</p>
        <button type="button" onClick={() => navigate('/')} className="min-h-12 rounded-2xl bg-gold px-6 font-semibold text-navy">Back to sign in</button>
      </div>
    )
  }

  const save = async () => {
    setError('')
    if (password.length < 6) { setError('Your password needs at least 6 characters.'); return }
    if (password !== confirm) { setError("Those passwords don't match."); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) { setError(friendlyError(error.message)); return }
    navigate(profile?.onboarded ? HOME[profile.role] : '/welcome', { replace: true })
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save() }} className="flex h-full flex-col gap-4 bg-navy px-6 pt-20">
      <h1 className="m-0 font-display text-[32px] font-medium text-ink">Set a new password</h1>
      <Field label="New password"><input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} /></Field>
      <Field label="Type it again"><input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} /></Field>
      {error && <p role="alert" className="m-0 text-[13px] text-gold-pale">{error}</p>}
      <button type="submit" disabled={busy} className="min-h-[54px] rounded-2xl bg-gold font-semibold text-navy disabled:opacity-70">{busy ? 'Saving…' : 'Save password'}</button>
    </form>
  )
}
