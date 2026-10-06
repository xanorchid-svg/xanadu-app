import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CONTACT_EMAIL } from '../data'

const UPDATED = 'October 5, 2026'

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="xa-page h-full overflow-y-auto bg-navy">
      <div className="flex flex-col gap-5 px-5 pt-safe pb-12">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} className="min-h-10 self-start text-[13px] text-gold-soft">‹ Back</button>
        <div className="flex flex-col gap-1">
          <h1 className="m-0 font-display text-[34px] leading-[1.05] font-medium text-ink">{title}</h1>
          <span className="text-xs text-subtle">{`Last updated ${UPDATED}`}</span>
        </div>
        <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-muted [&_h2]:m-0 [&_h2]:mt-2 [&_h2]:font-display [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:text-ink [&_p]:m-0 [&_ul]:m-0 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
          {children}
        </div>
        <p className="m-0 text-[13px] text-subtle">Questions? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
      </div>
    </div>
  )
}

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>Xanadu ("we") connects Seekers with retreat spaces (Containers) and guides (Facilitators). This policy explains what we collect, why, and the choices you have.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Account details:</b> your email address and, if you sign in with Google or Apple, your name (and, with Google, your profile photo) from that account. With Apple you can choose to hide your email; we then receive a private relay address.</li>
        <li><b>Profile details you add:</b> name, photo, region, practices, what you're seeking, and for hosts, space or practice details, trainings, references and offerings.</li>
        <li><b>Messages</b> you send to other members or to the Xanadu team.</li>
        <li><b>Approximate location</b>, only if you join Community. It's rounded to about 1 km on your phone before it's sent, and other members only see a distance in miles, never your location.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To run your account and show your profile to other members as you've chosen.</li>
        <li>To match Seekers with spaces and experiences. An AI model reads what you write about what you're seeking and finds the best fits. This runs on our own systems; your words are not sold or used to advertise to you.</li>
        <li>To review host applications. AI may help, but a person makes every decision.</li>
        <li>To keep Xanadu safe, including acting on reports and blocks.</li>
      </ul>
      <h2>Who we share it with</h2>
      <p>We don't sell your information. We use trusted providers to run the app: Supabase (database, sign-in and storage), Vercel (hosting), and Google or Apple if you choose to sign in with them. They process data only to provide their service to us.</p>
      <h2>Your choices</h2>
      <ul>
        <li>Edit your profile at any time from the app.</li>
        <li>Hide yourself from Community and delete your saved location with one switch.</li>
        <li>Block or report any member.</li>
        <li>Delete your account and all your data yourself, any time, from your profile (Delete my account). It happens straight away and can't be undone. You can also email us and we'll do it for you.</li>
      </ul>
      <h2>Changes</h2>
      <p>If we change this policy, we'll update the date above and tell you in the app when the change matters.</p>
    </LegalPage>
  )
}

export function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>By creating a Xanadu account you agree to these terms.</p>
      <h2>Who can use Xanadu</h2>
      <p>You must be 18 or older and give accurate information about yourself, your space or your practice.</p>
      <h2>Hosts</h2>
      <ul>
        <li>Containers and Facilitators are independent. They are responsible for their spaces, offerings, safety, permits and insurance.</li>
        <li>Hosts agree to hold space with care and honesty and to make no medical claims or guaranteed outcomes.</li>
        <li>Xanadu reviews hosts before they're listed but does not guarantee any space, offering or person.</li>
      </ul>
      <h2>Community and messages</h2>
      <ul>
        <li>Be kind. No harassment, hate, spam, or pressure of any kind.</li>
        <li>Meet in public and use your own judgment when meeting people from the app.</li>
        <li>We may remove content or accounts that break these terms.</li>
      </ul>
      <h2>Volunteer exchanges and bookings</h2>
      <p>Arrangements are between you and the host. Agree on hours, stay and expectations in writing before you travel.</p>
      <h2>Wellbeing</h2>
      <p>Nothing on Xanadu is medical advice. Talk to a doctor before any practice that could affect your health.</p>
      <h2>Liability</h2>
      <p>Xanadu is provided "as is". To the extent the law allows, we aren't liable for what happens at spaces or experiences found through the app.</p>
      <h2>Changes</h2>
      <p>We may update these terms. If you keep using Xanadu after a change, you accept the new terms.</p>
    </LegalPage>
  )
}
