import { useEffect, useRef, useState, type FormEvent } from 'react'
import { friendlyError, supabase } from '../lib/supabase'
import { useGate } from '../gate'
import { Button, DoorFrame, Spinner } from '../ui'

/** Two-step verification with an authenticator app (TOTP). First time: scan and confirm. After that: enter the code. */
export default function TwoStep({ mode }: { mode: 'enrol' | 'verify' }) {
  const { recheck, signOut, session } = useGate()
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    ;(async () => {
      if (mode === 'verify') {
        const { data, error } = await supabase.auth.mfa.listFactors()
        if (error) return setError(friendlyError(error.message))
        const f = data.totp.find((x) => x.status === 'verified')
        if (f) setFactorId(f.id)
        else setError("We couldn't find your authenticator. Sign out and back in to set it up again.")
      } else {
        // a unique name, so an unfinished earlier attempt never blocks a new one
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Xanadu Console ${new Date().toISOString().slice(0, 16)}`, issuer: 'Xanadu Console' })
        if (error) return setError(friendlyError(error.message))
        setFactorId(data.id); setQr(data.totp.qr_code); setSecret(data.totp.secret)
      }
    })()
  }, [mode])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!factorId) return
    setBusy(true); setError(null)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\D/g, '') })
    if (error) { setError(friendlyError(error.message)); setBusy(false); setCode(''); return }
    await recheck()
  }

  return (
    <DoorFrame>
      <h1 className="font-display text-[30px] leading-tight text-ink">
        {mode === 'enrol' ? 'Set up two-step verification' : 'Two-step verification'}
      </h1>
      <p className="mt-2 mb-5 text-[14px] leading-relaxed text-subtle">
        {mode === 'enrol'
          ? 'Scan this with an authenticator app (Google Authenticator, 1Password or the iPhone Passwords app), then enter the 6-digit code it shows. You only do this once.'
          : 'Enter the 6-digit code from your authenticator app.'}
      </p>

      {mode === 'enrol' && (
        <div className="mb-5 flex flex-col items-center">
          {qr ? (
            <>
              <div className="rounded-2xl bg-ivory p-3"><img src={qr} alt="QR code for your authenticator app" className="size-44" /></div>
              {secret && (
                <details className="mt-3 w-full text-center text-[12.5px] text-faint">
                  <summary className="cursor-pointer">Can't scan? Type this key instead</summary>
                  <code className="mt-2 block break-all rounded-lg bg-navy/70 px-3 py-2 font-mono text-[13px] text-text select-all">{secret}</code>
                </details>
              )}
            </>
          ) : !error && <div className="grid size-44 place-items-center"><Spinner /></div>}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <input
          aria-label="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))}
          placeholder="000000"
          className="xa-code h-14 w-full rounded-xl bg-navy/70 text-center font-display text-[30px] text-ink outline-none ring-1 ring-line-2 focus:ring-gold-soft"
        />
        {error && <p role="alert" className="text-[13px] text-rose">{error}</p>}
        <Button className="w-full" disabled={busy || !factorId || code.replace(/\D/g, '').length !== 6}>
          {busy ? 'Checking…' : mode === 'enrol' ? 'Turn on and continue' : 'Continue'}
        </Button>
      </form>

      <p className="mt-5 text-center text-[12.5px] text-faint">
        Signed in as {session?.user.email}. <button className="text-gold-soft underline-offset-2 hover:underline" onClick={signOut}>Sign out</button>
      </p>
    </DoorFrame>
  )
}
