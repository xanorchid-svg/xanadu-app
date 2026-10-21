import { Link } from 'react-router-dom'
import { BackButton, ContainerTabs, FacilitatorTabs, Screen } from '../../components/ui'
import { RolesCard } from '../../components/Roles'
import { SignOutButton } from '../../components/edit'
import { CONTACT_EMAIL } from '../../data'
import { HOME, useAuth } from '../../auth'

const STEPS = [
  { title: 'Application received', body: 'Thank you for applying as a founding member.' },
  { title: 'Review', body: 'We read every application by hand, with reviews and references.' },
  { title: 'Intro call', body: "We'll email you to set up a short conversation so we can meet you and your work." },
  { title: 'Welcome to Xanadu', body: 'Your profile goes live and your founding membership begins.' },
]

/**
 * Where a Container or Facilitator sees where their application stands. Status is set by the Xanadu team.
 * Until they're approved this is their home: the rest of the hosting app stays closed (see RequireRole).
 */
export default function Status() {
  const { profile } = useAuth()
  const status = profile?.status ?? 'pending'
  const home = profile ? HOME[profile.role] : '/'
  const approved = status === 'approved' || status === 'active'
  const editTo = profile?.role === 'facilitator' ? '/facilitator/profile' : '/container/space'
  const idx = status === 'approved' || status === 'active' ? 4 : 1

  const [kicker, headline, lede] =
    status === 'approved' || status === 'active'
      ? ['Founding member', 'Welcome to Xanadu ✦', "You're in. Your profile is live, and we'll help you fill your first offering."]
      : status === 'declined'
        ? ['Application', 'Thank you for applying', "Xanadu isn't the right fit right now. If you have questions, we're happy to talk."]
        : ['In review', "We're reading your application", "Most reviews take a few days. We'll email you either way. Your hosting tools open once you're approved."]

  // approved hosts reach this page from a notification; everyone else lives here with the applicant tab bar
  const footer = approved
    ? (
      <div className="border-t border-[#1F2B3E] bg-navy-deep px-5 pt-3.5 pb-safe">
        <Link to={home} className="flex min-h-[54px] items-center justify-center rounded-2xl bg-iri font-semibold text-navy no-underline hover:text-navy">Go to your home</Link>
      </div>
    )
    : profile?.role === 'facilitator' ? <FacilitatorTabs /> : <ContainerTabs />

  return (
    <Screen footer={footer}>
      <div className="flex flex-col gap-6 px-5 pt-safe pb-6">
        {approved && <BackButton to={home} />}
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[0.2em] text-gold-soft uppercase">{kicker}</span>
          <h1 className="m-0 font-display text-4xl leading-[1.05] font-medium text-ink">{headline}</h1>
          <p className="m-0 text-[15px] leading-relaxed text-muted">{lede}</p>
        </div>

        {status !== 'declined' && (
          <ol className="m-0 flex list-none flex-col p-0">
            {STEPS.map((s, i) => {
              const done = i < idx, now = i === idx, last = i === STEPS.length - 1
              return (
                <li key={s.title} className="flex gap-3.5">
                  <div className="flex w-7 flex-none flex-col items-center">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold ${done ? 'bg-iri text-navy' : now ? 'border-[1.5px] border-gold text-gold-pale' : 'border-[1.5px] border-line-2 text-subtle'}`}>{done ? '✓' : i + 1}</span>
                    <span className={`my-1 w-[1.5px] flex-1 ${last ? 'bg-transparent' : done ? 'bg-iri' : 'bg-line'}`} />
                  </div>
                  <div className="flex flex-col gap-1 pb-[22px]">
                    <span className={`text-[15px] font-semibold ${done || now ? 'text-ink' : 'text-subtle'}`}>{s.title}</span>
                    <span className="text-[13px] leading-normal text-subtle">{s.body}</span>
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        {status === 'pending' && (
          <div className="flex flex-col gap-2.5">
            <Link to={editTo} className="flex min-h-[54px] items-center justify-center rounded-2xl bg-iri font-semibold text-navy no-underline hover:text-navy">
              {profile?.role === 'facilitator' ? 'Edit your profile' : 'Edit your space'}
            </Link>
            <Link to="/messages/team" className="flex min-h-[54px] items-center justify-center rounded-2xl border border-line-2 text-[15px] text-text no-underline">Message the Xanadu team</Link>
          </div>
        )}
        {status === 'declined' && (
          <a href={`mailto:${CONTACT_EMAIL}`} className="flex min-h-[54px] items-center justify-center rounded-2xl border border-line-2 text-[15px] text-text no-underline">Write to us</a>
        )}

        <p className="m-0 rounded-xl bg-plum px-3.5 py-3 text-[13px] leading-normal text-muted">We use AI to help review applications; a person makes every decision.</p>

        {!approved && <RolesCard />}
        {!approved && <SignOutButton />}
      </div>
    </Screen>
  )
}
