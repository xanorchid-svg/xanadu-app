import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GateProvider, useGate } from './gate'
import Shell from './Shell'
import SignIn from './screens/SignIn'
import NotAuthorised from './screens/NotAuthorised'
import TwoStep from './screens/TwoStep'
import Today from './screens/Today'
import { Spinner } from './ui'

// screens load the first time they're opened
const Settings = lazy(() => import('./screens/Settings'))
const Members = lazy(() => import('./screens/Members'))
const Applications = lazy(() => import('./screens/Applications'))
const Offerings = lazy(() => import('./screens/Offerings'))
const Inbox = lazy(() => import('./screens/Inbox'))
const Spaces = lazy(() => import('./screens/Spaces'))
const Safety = lazy(() => import('./screens/Safety'))
const Emails = lazy(() => import('./screens/Emails'))
const Instagram = lazy(() => import('./screens/Instagram'))
const Waitlist = lazy(() => import('./screens/Waitlist'))
const CommunityEvents = lazy(() => import('./screens/CommunityEvents'))
const Brand = lazy(() => import('./screens/Brand'))

function Door() {
  const { state } = useGate()
  if (state === 'loading') return <div className="grid min-h-dvh place-items-center"><Spinner /></div>
  if (state === 'signed-out') return <SignIn />
  if (state === 'not-team') return <NotAuthorised />
  if (state === 'enrol' || state === 'verify') return <TwoStep key={state} mode={state} />
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center"><Spinner /></div>}>
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Today />} />
        <Route path="applications" element={<Applications />} />
        <Route path="offerings" element={<Offerings />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="members" element={<Members />} />
        <Route path="waitlist" element={<Waitlist />} />
        <Route path="events" element={<CommunityEvents />} />
        <Route path="spaces" element={<Spaces />} />
        <Route path="safety" element={<Safety />} />
        <Route path="emails" element={<Emails />} />
        <Route path="instagram" element={<Instagram />} />
        <Route path="brand" element={<Brand />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <GateProvider><Door /></GateProvider>
    </BrowserRouter>
  )
}
