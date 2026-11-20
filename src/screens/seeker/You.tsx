import { useState } from 'react'
import { RolesCard } from '../../components/Roles'
import { Link } from 'react-router-dom'
import { EmptyState, H2, Page, Screen, SeekerTabs, Segmented } from '../../components/ui'
import { IconSettings } from '../../components/icons'
import { CONTACT_EMAIL } from '../../data'
import TypePicker from '../../components/TypePicker'
import { refreshMatches, useMyKeywords } from '../../matching'
import { AvatarPicker, EditFooter, SignOutButton, TextArea, TextField } from '../../components/edit'
import { useAuth } from '../../auth'
import { useSeekerProfile, type SeekerProfile } from '../../store'
import { LifestylePicker } from '../../components/Lifestyle'
import CommunityEventCard from '../../components/CommunityEventCard'
import { alignedTypes, useMyGoing, whenLabel } from '../../events'

const JOURNEY_TABS = ['Upcoming', 'Past'] as const

export default function You() {
  const [me, save] = useSeekerProfile()
  const [tab, setTab] = useState<(typeof JOURNEY_TABS)[number]>('Upcoming')
  const going = useMyGoing()
  const { session } = useAuth()
  const joined = new Date(session?.user.created_at ?? Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<SeekerProfile>(me)
  const [error, setError] = useState('')
  const [keywords, setKeywords] = useMyKeywords()
  const [words, setWords] = useState(me.seeking)
  const [wordsState, setWordsState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const prefs = alignedTypes(me.prefs)
  const saveWords = async () => {
    setWordsState('saving'); setError('')
    const err = await save({ ...me, seeking: words })
    if (err) { setError(err); setWordsState('idle'); return }
    const kw = await refreshMatches()
    if (kw) setKeywords(kw)
    setWordsState('saved')
  }
  const set = <K extends keyof SeekerProfile>(k: K, v: SeekerProfile[K]) => setDraft((d) => ({ ...d, [k]: v }))

  if (editing) {
    const commit = async () => { setBusy(true); const err = await save(draft); setBusy(false); if (err) setError(err); else setEditing(false) }
    return (
      <Screen footer={<EditFooter onCancel={() => setEditing(false)} onSave={commit} error={error} busy={busy} />}>
        <div className="flex flex-col gap-5 px-5 pt-safe pb-8">
          <h1 className="m-0 font-display text-[32px] font-medium text-ink">Edit profile</h1>
          <AvatarPicker photo={draft.photo} onChange={(p) => set('photo', p)} />
          <TextField label="Your name" value={draft.name} onChange={(v) => set('name', v)} autoComplete="name" />
          <TextField label="Where you live" value={draft.region} onChange={(v) => set('region', v)} placeholder="e.g. Denver, Colorado" />
        </div>
      </Screen>
    )
  }

  const row = 'flex min-h-[52px] items-center justify-between border-b border-[#1F2B3E] text-[15px] text-text no-underline'

  return (
    <Screen footer={<SeekerTabs />}>
      <Page className="gap-6 pb-7">
        <div className="flex items-center gap-4">
          <div className="ring-iri flex h-[72px] w-[72px] flex-none items-center justify-center rounded-full bg-plum font-display text-3xl text-gold-pale shadow-[0_0_28px_-6px_rgba(181,139,224,.6)]">
            {me.photo ? <img decoding="async" src={me.photo} alt="" className="h-full w-full rounded-full object-cover p-[2px]" /> : (me.name.trim()[0] ?? 'X').toUpperCase()}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <h1 className="m-0 font-display text-3xl font-medium text-ink">{me.name.trim() || '[Your name]'}</h1>
            <span className="text-[13px] text-subtle">{`Seeker · Joined ${joined}`}</span>
          </div>
          <button type="button" aria-label="Edit profile" onClick={() => { setDraft(me); setError(''); setEditing(true) }} className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted"><IconSettings /></button>
        </div>


        <section className="flex flex-col gap-3">
          <H2 className="text-[22px]">Your journeys</H2>
          <Segmented label="Journeys" options={JOURNEY_TABS} value={tab} onChange={setTab} />
          {tab === 'Upcoming' ? (
            going.upcoming.length ? (
              <div className="flex flex-col gap-2.5">
                {going.upcoming.map((e) => <CommunityEventCard key={e.id} e={e} note={`You're going · ${whenLabel(e)}`} />)}
              </div>
            ) : (
              <EmptyState title="No upcoming journeys" action={<Link to="/calendar" className="flex min-h-11 items-center text-sm font-semibold no-underline">See what’s on</Link>}>
                Tap “I’m going” on any event and it will appear here, with who else is going.
              </EmptyState>
            )
          ) : going.past.length ? (
            <div className="flex flex-col gap-2.5">
              {going.past.map((e) => <CommunityEventCard key={e.id} e={e} note={`You went · ${whenLabel(e)}`} />)}
            </div>
          ) : (
            <EmptyState title="No past journeys yet">
              After each gathering you can leave a review of the space and the facilitator. Reviews help the community choose well.
            </EmptyState>
          )}
        </section>

        <section className="ring-iri flex flex-col gap-4 rounded-[22px] bg-plum/60 p-[18px]">
          <div className="flex flex-col gap-0.5"><H2 className="text-[22px]">Your way of living</H2><span className="text-xs text-subtle">How you'd like to take part and how you spend your days. Xanadu matches you to the gatherings and places that fit.</span></div>
          <LifestylePicker value={me.lifestyle} onChange={(v) => save({ ...me, lifestyle: v })} />
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between"><H2 className="text-[22px]">Your alignment</H2><span className="text-xs text-subtle">Tap all that call to you</span></div>
          <TypePicker value={prefs} onChange={(v) => save({ ...me, prefs: v })} inset={false} showAll={false} />
          <p className="m-0 text-[13px] text-subtle">{prefs.length ? 'Xanadu will match you with events and places for these.' : 'Pick a few practices and Xanadu will match you with what fits.'}</p>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5"><H2 className="text-[22px]">What you're looking for</H2><span className="text-xs text-subtle">In your own words. Xanadu will match you with the events and places that fit.</span></div>
          <TextArea label="Your words" value={words} onChange={(v) => { setWords(v); setWordsState('idle') }} rows={4}
            placeholder="e.g. A volunteer exchange near the ocean where I can help in the garden, practice yoga daily and meet like-minded people." />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-subtle">{wordsState === 'saved' ? 'Saved. Your matches are updated.' : ''}</span>
            <button type="button" onClick={saveWords} disabled={wordsState === 'saving'}
              className="min-h-10 rounded-xl bg-iri px-4 text-[13px] font-semibold text-navy disabled:opacity-60">{wordsState === 'saving' ? 'Matching…' : 'Save and match'}</button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-subtle">We picked up on</span>
              <div className="flex flex-wrap gap-1.5">{keywords.map((k) => <span key={k} className="ring-iri rounded-full bg-plum px-2.5 py-1 text-xs text-gold-pale">{k}</span>)}</div>
            </div>
          )}
        </section>


        <section className="flex flex-col">
          <H2 className="mb-1.5 text-[22px]">Account</H2>
          <Link to="/saved" className={row}>Saved <span className="text-[13px] text-gold-soft">Experiences and places you’ve hearted ›</span></Link>
          <div className={row}>Membership <span className="text-[13px] text-gold-soft">Founding Seeker · Free</span></div>
          <button type="button" onClick={() => { setDraft(me); setError(''); setEditing(true) }} className={`${row} w-full text-left`}>Profile <span className="text-[13px] text-gold-soft">Edit name, photo, region</span></button>
          <div className={row}>Where you live <span className="text-[13px] text-subtle">{me.region.trim() || 'Not added'}</span></div>
          <Link to="/notifications" className={row}>Notifications <span className="text-[13px] text-gold-soft">Phone, email and what you hear about ›</span></Link>
          <Link to="/privacy" className={row}>Privacy &amp; data <span className="text-[13px] text-subtle">Read our policy ›</span></Link>
          <Link to="/terms" className={row}>Terms &amp; guidelines <span className="text-[13px] text-subtle">Read the terms ›</span></Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className={`${row} border-b-0`}>Help <span className="text-[13px] text-subtle">{CONTACT_EMAIL}</span></a>
        </section>

        <RolesCard />
        <SignOutButton />
      </Page>
    </Screen>
  )
}
