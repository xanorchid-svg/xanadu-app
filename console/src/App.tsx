import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GateProvider, useGate } from './gate'
import Shell from './Shell'
import SignIn from './screens/SignIn'
import NotAuthorised from './screens/NotAuthorised'
import TwoStep from './screens/TwoStep'
import Today from './screens/Today'
import Settings from './screens/Settings'
import Members from './screens/Members'
import Applications from './screens/Applications'
import Offerings from './screens/Offerings'
import Inbox from './screens/Inbox'
import Spaces from './screens/Spaces'
import Safety from './screens/Safety'
import { Spinner } from './ui'

function Door() {
  const { state } = useGate()
  if (state === 'loading') return <div className="grid min-h-dvh place-items-center"><Spinner /></div>
  if (state === 'signed-out') return <SignIn />
  if (state === 'not-team') return <NotAuthorised />
  if (state === 'enrol' || state === 'verify') return <TwoStep key={state} mode={state} />
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Today />} />
        <Route path="applications" element={<Applications />} />
        <Route path="offerings" element={<Offerings />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="members" element={<Members />} />
        <Route path="spaces" element={<Spaces />} />
        <Route path="safety" element={<Safety />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <GateProvider><Door /></GateProvider>
    </BrowserRouter>
  )
}
