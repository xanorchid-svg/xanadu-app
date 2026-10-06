import { useLayoutEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { RequireRole } from './auth'
import AuthCallback from './screens/AuthCallback'
import ResetPassword from './screens/ResetPassword'
import Welcome from './screens/Welcome'
import Intro from './screens/Intro'
import Discover from './screens/seeker/Discover'
import Calendar from './screens/seeker/Calendar'
import Experience from './screens/seeker/Experience'
import Saved from './screens/seeker/Saved'
import You from './screens/seeker/You'
import Status from './screens/host/Status'
import Inbox from './screens/host/Inbox'
import ContainerHome from './screens/container/Home'
import NewOffering from './screens/container/NewOffering'
import ManageOffering from './screens/container/ManageOffering'
import SpaceProfile from './screens/container/SpaceProfile'
import FacilitatorHome from './screens/facilitator/Home'
import FindSpaces from './screens/facilitator/FindSpaces'
import FacilitatorProfile from './screens/facilitator/Profile'

/** Every page opens at the top: on navigation, on refresh, and when returning to a page. */
function useScrollToTop() {
  const location = useLocation()
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    document.querySelectorAll('main, form').forEach((el) => { el.scrollTop = 0 })
  }, [location.pathname, location.search])
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
      {/* Phone-width column; fills the screen on mobile, centered on desktop */}
      <div className="relative h-full w-full max-w-[430px] overflow-hidden bg-navy shadow-[0_0_80px_rgba(0,0,0,0.45)]">
        {/* keyed by path so each page mounts fresh, with its own scroll position and state */}
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Intro />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/welcome" element={<Welcome />} />

          <Route path="/discover" element={<RequireRole role="seeker"><Discover /></RequireRole>} />
          <Route path="/calendar" element={<RequireRole role="seeker"><Calendar /></RequireRole>} />
          <Route path="/experience/:id" element={<RequireRole role="any"><Experience /></RequireRole>} />
          <Route path="/saved" element={<RequireRole role="seeker"><Saved /></RequireRole>} />
          <Route path="/you" element={<RequireRole role="seeker"><You /></RequireRole>} />

          {/* applying = creating a host account */}
          <Route path="/apply" element={<ApplyRedirect />} />
          <Route path="/apply/status" element={<RequireRole role="any"><Status /></RequireRole>} />

          <Route path="/container" element={<RequireRole role="container"><ContainerHome /></RequireRole>} />
          <Route path="/container/new" element={<RequireRole role="container"><NewOffering /></RequireRole>} />
          <Route path="/container/offering" element={<RequireRole role="container"><ManageOffering /></RequireRole>} />
          <Route path="/container/space" element={<RequireRole role="container"><SpaceProfile /></RequireRole>} />
          <Route path="/container/inbox" element={<RequireRole role="container"><Inbox role="Container" /></RequireRole>} />

          <Route path="/facilitator" element={<RequireRole role="facilitator"><FacilitatorHome /></RequireRole>} />
          <Route path="/facilitator/spaces" element={<RequireRole role="facilitator"><FindSpaces /></RequireRole>} />
          <Route path="/facilitator/inbox" element={<RequireRole role="facilitator"><Inbox role="Facilitator" /></RequireRole>} />
          <Route path="/facilitator/profile" element={<RequireRole role="facilitator"><FacilitatorProfile /></RequireRole>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}
