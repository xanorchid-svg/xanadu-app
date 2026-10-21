import { lazy, Suspense, useEffect, useLayoutEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Loading, RequireRole, useAuth } from './auth'
import AuthCallback from './screens/AuthCallback'
import Intro from './screens/Intro'
import { listenForAppLinks } from './lib/native'
import PhoneOnly from './components/PhoneOnly'

// Each screen is its own small file, loaded the first time it's opened (and kept offline by the app's service worker)
const ResetPassword = lazy(() => import('./screens/ResetPassword'))
const Welcome = lazy(() => import('./screens/Welcome'))
const ApplicationUpdate = lazy(() => import('./screens/Welcome').then((m) => ({ default: m.ApplicationUpdate })))
const WelcomeIn = lazy(() => import('./screens/host/WelcomeIn'))
const Privacy = lazy(() => import('./screens/Legal').then((m) => ({ default: m.Privacy })))
const Terms = lazy(() => import('./screens/Legal').then((m) => ({ default: m.Terms })))
const Discover = lazy(() => import('./screens/seeker/Discover'))
const Calendar = lazy(() => import('./screens/seeker/Calendar'))
const ShareEvent = lazy(() => import('./screens/events/ShareEvent'))
const EventPage = lazy(() => import('./screens/events/EventPage'))
const Experience = lazy(() => import('./screens/seeker/Experience'))
const Saved = lazy(() => import('./screens/seeker/Saved'))
const You = lazy(() => import('./screens/seeker/You'))
const Space = lazy(() => import('./screens/seeker/Space'))
const Status = lazy(() => import('./screens/host/Status'))
const Inbox = lazy(() => import('./screens/host/Inbox'))
const ContainerHome = lazy(() => import('./screens/container/Home'))
const NewOffering = lazy(() => import('./screens/container/NewOffering'))
const ManageOffering = lazy(() => import('./screens/container/ManageOffering'))
const SpaceProfile = lazy(() => import('./screens/container/SpaceProfile'))
const FacilitatorHome = lazy(() => import('./screens/facilitator/Home'))
const FindSpaces = lazy(() => import('./screens/facilitator/FindSpaces'))
const FacilitatorProfile = lazy(() => import('./screens/facilitator/Profile'))
const Community = lazy(() => import('./screens/community/Community'))
const Chat = lazy(() => import('./screens/community/Chat'))
const Messages = lazy(() => import('./screens/messages/Messages'))
const Thread = lazy(() => import('./screens/messages/Thread'))
const Compose = lazy(() => import('./screens/messages/Compose'))
const Notifications = lazy(() => import('./screens/Notifications'))

/** Once signed in, quietly fetch the screens this member is most likely to open next, so tabs open instantly. */
function usePrefetch() {
  const { profile } = useAuth()
  const role = profile?.role
  useEffect(() => {
    if (!role) return
    const common = [() => import('./screens/messages/Messages'), () => import('./screens/Notifications'), () => import('./screens/seeker/Space'), () => import('./screens/seeker/Experience')]
    const byRole = role === 'container'
      ? [() => import('./screens/container/Home'), () => import('./screens/container/ManageOffering'), () => import('./screens/container/SpaceProfile'), () => import('./screens/container/NewOffering')]
      : role === 'facilitator'
        ? [() => import('./screens/facilitator/Home'), () => import('./screens/facilitator/FindSpaces'), () => import('./screens/facilitator/Profile'), () => import('./screens/community/Community')]
        : [() => import('./screens/seeker/Discover'), () => import('./screens/seeker/Calendar'), () => import('./screens/seeker/You'), () => import('./screens/community/Community'), () => import('./screens/seeker/Saved')]
    const idle = (cb: () => void) => ('requestIdleCallback' in window ? (window as Window & { requestIdleCallback: (f: () => void) => number }).requestIdleCallback(cb) : setTimeout(cb, 800))
    idle(() => { [...byRole, ...common].forEach((load) => load().catch(() => {})) })
  }, [role])
}

/** Every page opens at the top: on navigation, on refresh, and when returning to a page. */
function useScrollToTop() {
  const location = useLocation()
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    document.querySelectorAll('main, form').forEach((el) => { el.scrollTop = 0 })
  }, [location.pathname, location.search])
}

/** /messages/team: the member's thread with the Xanadu team. */
function TeamThread() {
  const { profile } = useAuth()
  return <Inbox standalone role={profile?.role === 'container' ? 'Container' : profile?.role === 'facilitator' ? 'Facilitator' : 'Seeker'} />
}

function ApplyRedirect() {
  const [params] = useSearchParams()
  const role = params.get('role') === 'Facilitator' ? 'Facilitator' : 'Container'
  return <Navigate to={`/?mode=signup&role=${role}`} replace />
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  useScrollToTop()
  usePrefetch()
  // iPhone app: sign-in returns and other dreamxanadu:// links open the right screen
  useEffect(() => listenForAppLinks((path) => navigate(path, { replace: true })), [navigate])
  return (
    <div className="flex h-dvh justify-center bg-navy-deep">
      {/* Fills every phone edge to edge; a phone-width column only on tablets and desktop */}
      <div className="relative h-full w-full overflow-hidden bg-navy sm:max-w-[430px] sm:shadow-[0_0_80px_rgba(0,0,0,0.45)]">
        {/* a slow aurora in the logo's colours drifts behind every screen */}
        <div className="xa-aurora" aria-hidden />
        <PhoneOnly>
        <div className="relative z-[1] h-full">
        {/* keyed by path so each page mounts fresh, with its own scroll position and state */}
        <Suspense fallback={<Loading />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Intro />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/welcome" element={<Welcome />} />

          <Route path="/discover" element={<RequireRole role="seeker"><Discover /></RequireRole>} />
          <Route path="/calendar" element={<RequireRole role="seeker"><Calendar /></RequireRole>} />
          <Route path="/experience/:id" element={<RequireRole role="any"><Experience /></RequireRole>} />
          <Route path="/space/:id" element={<RequireRole role="any"><Space /></RequireRole>} />
          <Route path="/event/:id" element={<RequireRole role="any"><EventPage /></RequireRole>} />
          <Route path="/events/new" element={<RequireRole role="any"><ShareEvent /></RequireRole>} />
          <Route path="/saved" element={<RequireRole role="seeker"><Saved /></RequireRole>} />
          <Route path="/you" element={<RequireRole role="seeker"><You /></RequireRole>} />
          <Route path="/messages" element={<RequireRole role="any"><Messages /></RequireRole>} />
          <Route path="/messages/team" element={<RequireRole role="any"><TeamThread /></RequireRole>} />
          <Route path="/messages/new" element={<RequireRole role="any"><Compose /></RequireRole>} />
          <Route path="/messages/:id" element={<RequireRole role="any"><Thread /></RequireRole>} />
          <Route path="/notifications" element={<RequireRole role="any"><Notifications /></RequireRole>} />

          {/* Community: Seekers and Facilitators (Containers are sent to their home) */}
          <Route path="/community" element={<RequireRole role="any"><Community /></RequireRole>} />
          <Route path="/community/chat/:id" element={<RequireRole role="any"><Chat /></RequireRole>} />

          {/* applying = creating a host account */}
          <Route path="/apply" element={<ApplyRedirect />} />
          <Route path="/apply/status" element={<RequireRole role="any"><Status /></RequireRole>} />
          <Route path="/apply/update" element={<RequireRole role="any"><ApplicationUpdate /></RequireRole>} />
          <Route path="/welcome-in" element={<RequireRole role="any"><WelcomeIn /></RequireRole>} />

          <Route path="/container" element={<RequireRole role="container"><ContainerHome /></RequireRole>} />
          <Route path="/container/new" element={<RequireRole role="container"><NewOffering /></RequireRole>} />
          <Route path="/container/offering" element={<RequireRole role="container"><ManageOffering /></RequireRole>} />
          <Route path="/container/space" element={<RequireRole role="container"><SpaceProfile /></RequireRole>} />
          <Route path="/container/inbox" element={<Navigate to="/messages" replace />} />

          <Route path="/facilitator" element={<RequireRole role="facilitator"><FacilitatorHome /></RequireRole>} />
          <Route path="/facilitator/spaces" element={<RequireRole role="facilitator"><FindSpaces /></RequireRole>} />
          <Route path="/facilitator/new" element={<RequireRole role="facilitator"><NewOffering /></RequireRole>} />
          <Route path="/facilitator/offering" element={<RequireRole role="facilitator"><ManageOffering /></RequireRole>} />
          <Route path="/facilitator/inbox" element={<Navigate to="/messages" replace />} />
          <Route path="/facilitator/profile" element={<RequireRole role="facilitator"><FacilitatorProfile /></RequireRole>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </div>
        </PhoneOnly>
      </div>
    </div>
  )
}
