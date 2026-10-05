import { Navigate, Route, Routes } from 'react-router-dom'
import Intro from './screens/Intro'
import Discover from './screens/seeker/Discover'
import Calendar from './screens/seeker/Calendar'
import Experience from './screens/seeker/Experience'
import Saved from './screens/seeker/Saved'
import You from './screens/seeker/You'
import Apply from './screens/host/Apply'
import Status from './screens/host/Status'
import Inbox from './screens/host/Inbox'
import ContainerHome from './screens/container/Home'
import NewOffering from './screens/container/NewOffering'
import ManageOffering from './screens/container/ManageOffering'
import SpaceProfile from './screens/container/SpaceProfile'
import FacilitatorHome from './screens/facilitator/Home'
import FindSpaces from './screens/facilitator/FindSpaces'
import FacilitatorProfile from './screens/facilitator/Profile'

export default function App() {
  return (
    <div className="flex h-dvh justify-center bg-navy-deep">
      {/* Phone-width column; fills the screen on mobile, centered on desktop */}
      <div className="relative h-full w-full max-w-[430px] overflow-hidden bg-navy shadow-[0_0_80px_rgba(0,0,0,0.45)]">
        <Routes>
          <Route path="/" element={<Intro />} />

          <Route path="/discover" element={<Discover />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/experience/:id" element={<Experience />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/you" element={<You />} />

          <Route path="/apply" element={<Apply />} />
          <Route path="/apply/status" element={<Status />} />

          <Route path="/container" element={<ContainerHome />} />
          <Route path="/container/new" element={<NewOffering />} />
          <Route path="/container/offering" element={<ManageOffering />} />
          <Route path="/container/space" element={<SpaceProfile />} />
          <Route path="/container/inbox" element={<Inbox role="Container" />} />

          <Route path="/facilitator" element={<FacilitatorHome />} />
          <Route path="/facilitator/spaces" element={<FindSpaces />} />
          <Route path="/facilitator/inbox" element={<Inbox role="Facilitator" />} />
          <Route path="/facilitator/profile" element={<FacilitatorProfile />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}
