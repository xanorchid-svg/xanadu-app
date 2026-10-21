import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { isNative } from '../lib/native'
import { Glow } from './ui'

// Xanadu is phone-only for now (Xan, Oct 20): on a laptop or desktop, the app shows a QR code instead.
// These pages stay open everywhere, because email links, Apple and the website point at them.
const OPEN_ANYWHERE = ['/privacy', '/terms', '/auth/callback', '/reset-password']

/** A computer: a mouse or trackpad as the main pointer and no touch screen. Phones and tablets pass. */
function isComputer() {
  if (isNative || import.meta.env.DEV) return false
  if (['localhost', '127.0.0.1'].includes(location.hostname)) return false
  const touch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window
  return !touch && window.matchMedia('(pointer: fine)').matches
}

export default function PhoneOnly({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation()
  const [computer] = useState(isComputer)
  const [qr, setQr] = useState('')
  const blocked = computer && !OPEN_ANYWHERE.some((p) => pathname.startsWith(p))

  useEffect(() => {
    if (!blocked) return
    // the code opens this same page on the phone, so a shared space link still lands on that space
    const url = `https://app.dreamxanadu.com${pathname}${search}`
    import('qrcode').then((QR) => QR.toDataURL(url, { margin: 1, width: 440, color: { dark: '#101B2C', light: '#F6F1E8' } })).then(setQr).catch(() => {})
  }, [blocked, pathname, search])

  if (!blocked) return <>{children}</>
  return (
    <div className="relative z-[1] flex h-full flex-col items-center justify-center px-8 text-center">
      <img src="/logo-emblem-light.png" alt="" className="mb-8 w-40 opacity-90" />
      <h1 className="font-display text-[34px] leading-tight text-ink">Xanadu lives on <Glow>your phone</Glow>.</h1>
      <p className="mt-3 max-w-[300px] text-[15px] leading-relaxed text-subtle">Scan the code with your phone's camera to open it there.</p>
      <div className="mt-8 rounded-2xl bg-[#F6F1E8] p-3 ring-iri">
        {qr ? <img src={qr} alt="QR code to open Xanadu on your phone" className="h-[200px] w-[200px]" /> : <div className="h-[200px] w-[200px]" />}
      </div>
      <p className="mt-8 text-[13px] text-faint">Or visit <span className="text-subtle">app.dreamxanadu.com</span> on your phone.</p>
      <a href="https://dreamxanadu.com" className="mt-2 text-[13px] text-faint underline underline-offset-4 hover:text-subtle">Back to dreamxanadu.com</a>
    </div>
  )
}
