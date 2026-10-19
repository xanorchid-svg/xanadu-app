/**
 * Instagram & Facebook posts prepared by Claude (the content role).
 * Slides live in /public/social/<id>/NN.jpg, so each one has a stable public link
 * (backend.dreamxanadu.com/social/<id>/NN.jpg) that Metricool can fetch.
 * Every post goes to Metricool as a DRAFT. Xan checks it there and schedules it herself.
 * To add a post: render the slides, drop them in public/social/<id>/, add an entry here.
 */
export type SocialPost = {
  id: string
  title: string
  /** planned publish time, America/Chicago */
  date: string
  format: 'Single image' | 'Carousel' | 'Reel'
  audience: 'Seekers' | 'Spaces & guides' | 'Everyone'
  slides: number
  caption: string
  /** AI imagery is mood only, never a real place or member (see claude/CONTENT-RULES.md) */
  aiImagery: boolean
  status: 'draft' | 'scheduled' | 'posted'
}

export const POSTS: SocialPost[] = [
  {
    id: '01-begins',
    title: 'Xanadu begins with you',
    date: '2026-10-21T10:00',
    format: 'Single image',
    audience: 'Everyone',
    slides: 1,
    aiImagery: true,
    status: 'draft',
    caption: `Xanadu begins with you.

Some of us aren't looking for a holiday. We're looking for a place to live differently for a while: a week, a month, a season.

Xanadu is a network for awakening places. We match you with spaces and guides we've personally reviewed, starting in Nosara, Costa Rica.

The doors open soon. Join the waitlist (link in bio).

#xanadu #nosara #costarica #wellnesstravel #slowtravel`,
  },
  {
    id: '02-what-is-xanadu',
    title: 'What is Xanadu',
    date: '2026-10-22T10:00',
    format: 'Carousel',
    audience: 'Seekers',
    slides: 6,
    aiImagery: true,
    status: 'draft',
    caption: `A network for awakening places.

You tell us how long you want to stay, how you want to spend your days and the kind of land that calls you. We introduce you to retreats, classes, trainings, volunteer exchanges and long stays, with places and guides we've personally reviewed.

We're beginning in Nosara, Costa Rica. Join the waitlist (link in bio).

#xanadu #nosara #costarica #yogaretreat #volunteerabroad #slowtravel #retreat`,
  },
  {
    id: '03-why-join',
    title: 'Why join the founding circle',
    date: '2026-10-23T10:00',
    format: 'Carousel',
    audience: 'Spaces & guides',
    slides: 5,
    aiImagery: true,
    status: 'draft',
    caption: `For the spaces and guides of Nosara.

We're inviting 15 spaces and 15 guides to be Xanadu's founding circle. It's free, with no commission. You get guests and collaborators matched to what you hold, a personally reviewed ✦ profile, and our storytelling behind you.

I'll be in Nosara in early November to meet each of you in person.

Apply to the founding circle (link in bio), or send me a message.

#nosara #nosaracostarica #guanacaste #retreatcenter #retreatleader #yogateacher #foundingmember`,
  },
  {
    id: '04-some-places',
    title: 'Some places call you back (reel)',
    date: '2026-10-24T10:00',
    format: 'Reel',
    audience: 'Seekers',
    slides: 1,
    aiImagery: true,
    status: 'draft',
    caption: `Some places call you back.

Xanadu is being built for the people who answer. Starting in Nosara, Costa Rica.

Join the waitlist (link in bio).

#nosara #costarica #puravida #guanacaste #slowtravel`,
  },
  {
    id: '05-barely-a-season',
    title: "You've BARELY done a season (reel)",
    date: '2026-10-25T10:00',
    format: 'Reel',
    audience: 'Seekers',
    slides: 1,
    aiImagery: true,
    status: 'draft',
    caption: `You've done a retreat. You've barely done a season. 🌊

Week 1, you sleep. Week 2, your phone forgets you. By week 4, you're not leaving.

Xanadu matches you with places and guides we've personally reviewed, for a week, a month or a season. Starting in Nosara, Costa Rica.

Send this to the friend who needs a month, not a week. Join the waitlist (link in bio).

#slowtravel #longstay #nosara #costarica #digitalnomad`,
  },
  {
    id: '06-a-day',
    title: 'A day in a season-long stay',
    date: '2026-10-26T10:00',
    format: 'Carousel',
    audience: 'Seekers',
    slides: 6,
    aiImagery: true,
    status: 'draft',
    caption: `A day in a season-long stay.

When you stay a month or longer, the days find their own rhythm. You're not squeezing everything in. You're living somewhere.

That's what Xanadu is for. Join the waitlist (link in bio).

#slowtravel #remotework #nosara #yogalife #costarica #digitalnomad`,
  },
  {
    id: '07-reviewed',
    title: 'Every space is personally reviewed ✦',
    date: '2026-10-27T10:00',
    format: 'Carousel',
    audience: 'Seekers',
    slides: 5,
    aiImagery: true,
    status: 'draft',
    caption: `Every space is personally reviewed ✦

Before a space or guide joins Xanadu, we meet them. We learn how they work and who they're for. That's how we can match you with care, and why the network will grow slowly.

Join the waitlist (link in bio).

#xanadu #retreat #wellnesstravel #nosara #consciousliving`,
  },
  {
    id: '08-who',
    title: "Who we're looking for",
    date: '2026-10-28T10:00',
    format: 'Carousel',
    audience: 'Spaces & guides',
    slides: 6,
    aiImagery: true,
    status: 'draft',
    caption: `Who we're looking for.

Xanadu's founding circle in Nosara is 15 spaces and 15 guides. We're looking for retreat centres, eco-lodges, studios and land that hold people well, and for the teachers and guides who hold the room.

If that's you, apply (link in bio). I'll be in Nosara in early November to meet you.

#nosara #guanacaste #retreatcenter #ecolodge #retreatleader #yogateacher #breathwork`,
  },
  {
    id: '09-circle',
    title: 'The founding circle is forming in Nosara',
    date: '2026-10-29T10:00',
    format: 'Single image',
    audience: 'Spaces & guides',
    slides: 1,
    aiImagery: false,
    status: 'draft',
    caption: `The founding circle is forming in Nosara.

We're welcoming 15 spaces and 15 guides as Xanadu's first members. I'll be in Nosara from early November to meet each one in person.

Spaces and guides: apply (link in bio), or send me a message.
Seekers: join the waitlist.

#nosara #nosaracostarica #guanacaste #retreatcenter #retreatleader #foundingmember`,
  },
]

export const slideUrl = (p: SocialPost, n: number) => `/social/${p.id}/${String(n).padStart(2, '0')}.jpg`
/** Reels: the video lives next to its cover (01.jpg) as reel.mp4 */
export const videoUrl = (p: SocialPost) => `/social/${p.id}/reel.mp4`
