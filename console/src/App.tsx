import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GateProvider, useGate } from './gate'
import Shell from './Shell'
import SignIn from './screens/SignIn'
import NotAuthorised from './screens/NotAuthorised'
import TwoStep from './screens/TwoStep'
import Today from './screens/Today'
import Soon from './screens/Soon'
import Settings from './screens/Settings'
import Members from './screens/Members'
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
        <Route path="applications" element={<Soon section="applications" />} />
        <Route path="offerings" element={<Soon section="offerings" />} />
        <Route path="inbox" element={<Soon section="inbox" />} />
        <Route path="members" element={<Members />} />
        <Route path="spaces" element={<Soon section="spaces" />} />
        <Route path="safety" element={<Soon section="safety" />} />
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
