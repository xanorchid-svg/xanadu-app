import { useLayoutEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { RequireRole, useAuth } from './auth'
import AuthCallback from './screens/AuthCallback'
import ResetPassword from './screens/ResetPassword'
import Welcome from './screens/Welcome'
import Intro from './screens/Intro'
import { Privacy, Terms } from './screens/Legal'
import Discover from './screens/seeker/Discover'
import Calendar from './screens/seeker/Calendar'
import Experience from './screens/seeker/Experience'
import Saved from './screens/seeker/Saved'
import You from './screens/seeker/You'
import Space from './screens/seeker/Space'
import Status from './screens/host/Status'
import Inbox from './screens/host/Inbox'
import ContainerHome from './screens/container/Home'
import NewOffering from './screens/container/NewOffering'
import ManageOffering from './screens/container/ManageOffering'
import SpaceProfile from './screens/container/SpaceProfile'
import FacilitatorHome from './screens/facilitator/Home'
import FindSpaces from './screens/facilitator/FindSpaces'
import FacilitatorProfile from './screens/facilitator/Profile'
import Community from './screens/community/Community'
import Chat from './screens/community/Chat'
import Messages from './screens/messages/Messages'
import Thread from './screens/messages/Thread'
import Compose from './screens/messages/Compose'

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
  useScrollToTop()
  return (
    <div className="flex h-dvh justify-center bg-navy-deep">
      {/* Fills every phone edge to edge; a phone-width column only on tablets and desktop */}
      <div className="relative h-full w-full overflow-hidden bg-navy sm:max-w-[430px] sm:shadow-[0_0_80px_rgba(0,0,0,0.45)]">
        {/* a slow aurora in the logo's colours drifts behind every screen */}
        <div className="xa-aurora" aria-hidden />
        <div className="relative z-[1] h-full">
        {/* keyed by path so each page mounts fresh, with its own scroll position and state */}
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
          <Route path="/saved" element={<RequireRole role="seeker"><Saved /></RequireRole>} />
          <Route path="/you" element={<RequireRole role="seeker"><You /></RequireRole>} />
          <Route path="/messages" element={<RequireRole role="any"><Messages /></RequireRole>} />
          <Route path="/messages/team" element={<RequireRole role="any"><TeamThread /></RequireRole>} />
          <Route path="/messages/new" element={<RequireRole role="any"><Compose /></RequireRole>} />
          <Route path="/messages/:id" element={<RequireRole role="any"><Thread /></RequireRole>} />

          {/* Community: Seekers and Facilitators (Containers are sent to their home) */}
          <Route path="/community" element={<RequireRole role="any"><Community /></RequireRole>} />
          <Route path="/community/chat/:id" element={<RequireRole role="any"><Chat /></RequireRole>} />

          {/* applying = creating a host account */}
          <Route path="/apply" element={<ApplyRedirect />} />
          <Route path="/apply/status" element={<RequireRole role="any"><Status /></RequireRole>} />

          <Route path="/container" element={<RequireRole role="container"><ContainerHome /></RequireRole>} />
          <Route path="/container/new" element={<RequireRole role="container"><NewOffering /></RequireRole>} />
          <Route path="/container/offering" element={<RequireRole role="container"><ManageOffering /></RequireRole>} />
          <Route path="/container/space" element={<RequireRole role="container"><SpaceProfile /></RequireRole>} />
          <Route path="/container/inbox" element={<Navigate to="/messages" replace />} />

          <Route path="/facilitator" element={<RequireRole role="facilitator"><FacilitatorHome /></RequireRole>} />
          <Route path="/facilitator/spaces" element={<RequireRole role="facilitator"><FindSpaces /></RequireRole>} />
          <Route path="/facilitator/inbox" element={<Navigate to="/messages" replace />} />
          <Route path="/facilitator/profile" element={<RequireRole role="facilitator"><FacilitatorProfile /></RequireRole>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </div>
    </div>
  )
}
