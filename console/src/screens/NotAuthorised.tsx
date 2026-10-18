import { useGate } from '../gate'
import { Button, DoorFrame } from '../ui'

export default function NotAuthorised() {
  const { deniedEmail, signOut } = useGate()
  return (
    <DoorFrame>
      <h1 className="font-display text-[30px] leading-tight text-ink">Not authorised</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-subtle">
        {deniedEmail ? <><span className="text-text">{deniedEmail}</span> isn't on the Xanadu team.</> : "This account isn't on the Xanadu team."}{' '}
        You've been signed out. If you're looking for the Xanadu app, it's at{' '}
        <a href="https://app.dreamxanadu.com">app.dreamxanadu.com</a>.
      </p>
      <Button variant="quiet" className="mt-6 w-full" onClick={signOut}>Try another account</Button>
    </DoorFrame>
  )
}
