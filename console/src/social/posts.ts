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
  status: 'draft' | 'scheduled' | 'posted' | 'manual'
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

Some of us aren't looking for a vacation. We're looking for a place to live differently for a while: a week, a month, a season.

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
    id: '05-a-season',
    title: 'A season is a way of living (reel)',
    date: '2026-10-25T10:00',
    format: 'Reel',
    audience: 'Seekers',
    slides: 1,
    aiImagery: true,
    status: 'draft',
    caption: `A week is a vacation. A season is a way of living. 🌊

Week one, you finally sleep. Week two, you stop checking your phone. By week four, it starts to feel like home.

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

Xanadu's founding circle in Nosara is 15 spaces and 15 guides. We're looking for retreat centers, eco-lodges, studios and land that hold people well, and for the teachers and guides who hold the room.

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
  {
    id: '10-just-one-week',
    title: 'POV: you said "just one week" (reel)',
    date: '2026-10-30T10:00',
    format: 'Reel',
    audience: 'Seekers',
    slides: 1,
    aiImagery: true,
    status: 'draft',
    caption: `POV: you said “just one week.” 😅

Week six. You know the tides, you have a favorite café, and you're extending. Again.

Xanadu is for the stays that turn into seasons: places and guides we've personally reviewed, starting in Nosara, Costa Rica.

Tag the friend who always extends. Join the waitlist (link in bio).

#slowtravel #longstay #nosara #costarica #digitalnomad`,
  },
  {
    id: '11-which-stay',
    title: 'Quiz: which stay are you?',
    date: '2026-11-01T10:00',
    format: 'Carousel',
    audience: 'Seekers',
    slides: 5,
    aiImagery: true,
    status: 'draft',
    caption: `Which stay are you? 👇

A · The sunrise shala
B · The surf month
C · The slow remote season

Tell us in the comments. When the doors open, we'll match you with places and guides we've personally reviewed, starting in Nosara, Costa Rica.

Join the waitlist (link in bio).

#nosara #yogaretreat #surftrip #remotework #slowtravel`,
  },
  {
    id: '12-signs',
    title: 'Signs you need a season, not a vacation',
    date: '2026-10-31T10:00',
    format: 'Carousel',
    audience: 'Seekers',
    slides: 7,
    aiImagery: false,
    status: 'draft',
    caption: `Signs you need a season, not a vacation.

Which one is you? Be honest. 👀

A week is a vacation. A season is a way of living. Xanadu matches you with places and guides we've personally reviewed, for a week, a month or a season.

Send this to the friend who needs one. Join the waitlist (link in bio).

#slowtravel #longstay #nosara #costarica #worklifebalance`,
  },
  {
    id: '13-week-vs-season',
    title: 'A week vs a season',
    date: '2026-10-26T18:00',
    format: 'Carousel',
    audience: 'Seekers',
    slides: 7,
    aiImagery: true,
    status: 'draft',
    caption: `A week vs a season. 🌊

Save this for the next time someone asks why you're staying so long.

Xanadu matches you with places and guides we've personally reviewed, for a week, a month or a season. Starting in Nosara, Costa Rica.

Which one are you planning? Tell us below. Join the waitlist (link in bio).

#slowtravel #longstay #nosara #costarica #digitalnomad`,
  },
  {
    id: '14-three-ways-in',
    title: 'Three ways into Xanadu (reel)',
    date: '2026-11-02T10:00',
    format: 'Reel',
    audience: 'Everyone',
    slides: 1,
    aiImagery: false,
    status: 'draft',
    caption: `Three ways into Xanadu. ✦

Seekers come to stay, looking for a place and people that fit how they want to live.
Containers are the places that hold the stay: retreat centers, eco-lodges, studios and land.
Facilitators are the guides who hold the room: teachers, breathworkers, sound and movement guides.

Xanadu brings them together, with every place and guide personally reviewed.

Which one are you? Tell us below. Seekers: join the waitlist. Spaces and guides: apply (link in bio).

#xanadu #nosara #retreatcenter #retreatleader #slowtravel`,
  },
  {
    id: '15-grows-together',
    title: 'What grows here grows together (reel)',
    date: '2026-11-03T10:00',
    format: 'Reel',
    audience: 'Spaces & guides',
    slides: 1,
    aiImagery: true,
    status: 'draft',
    caption: `What grows here grows together. 🌿

You hold the space. We bring the people: guests looking for exactly what your place or practice holds.

Xanadu is a marketplace for retreat centers, studios and guides. Fill your classes, fill your retreats and find your next room, with every member personally reviewed.

Founding circle in Nosara: free to join, no commission. Spaces and guides, apply (link in bio).

#nosara #retreatcenter #yogateacher #retreatleader #guanacaste`,
  },
  {
    id: '16-pace-of-nature',
    title: 'Adopt the pace of nature (4 ways)',
    date: '2026-10-21T18:00',
    format: 'Carousel',
    audience: 'Everyone',
    slides: 6,
    aiImagery: false,
    status: 'manual',
    caption: `“Adopt the pace of nature: her secret is patience.” Ralph Waldo Emerson

Where in your life could you slow down this week? 🌿

#slowliving #nature #mindfulness #wellness`,
  },
  {
    id: '17-rest-is-rhythm',
    title: 'Rest is part of the rhythm (kinds of rest)',
    date: '2026-10-23T18:00',
    format: 'Carousel',
    audience: 'Everyone',
    slides: 7,
    aiImagery: false,
    status: 'manual',
    caption: `Rest is not a reward. It's part of the rhythm. ✦

Save this for the week you need the reminder.

#rest #slowliving #wellbeing #selfcare`,
  },
  {
    id: '18-morning-light',
    title: 'A morning-light ritual',
    date: '2026-10-25T18:00',
    format: 'Carousel',
    audience: 'Everyone',
    slides: 6,
    aiImagery: false,
    status: 'manual',
    caption: `A small ritual: step outside in the first hour of your day. ☀️

Morning daylight helps set your body clock, so you wake more alert and wind down more easily at night. No phone, no plan. Just light.

Will you try it tomorrow?

#morningroutine #wellness #sleep #slowliving`,
  },
  {
    id: '19-deliberately',
    title: 'Five questions for living deliberately',
    date: '2026-10-27T18:00',
    format: 'Carousel',
    audience: 'Everyone',
    slides: 8,
    aiImagery: false,
    status: 'manual',
    caption: `“I went to the woods because I wished to live deliberately.” Henry David Thoreau, Walden

What would living deliberately look like for you? Tell us below. 🌲

#slowliving #intentionalliving #nature #mindfulness`,
  },
  {
    id: '20-two-hours',
    title: '120 minutes a week in nature',
    date: '2026-10-24T18:00',
    format: 'Carousel',
    audience: 'Everyone',
    slides: 6,
    aiImagery: false,
    status: 'manual',
    caption: `120 minutes a week. 🌿

In a study of nearly 20,000 people, those who spent at least two hours a week in nature were more likely to report good health and well-being (White et al., Scientific Reports, 2019).

It doesn't have to be all at once. How are you getting your two hours this week?

#nature #wellness #wellbeing #getoutside`,
  },
  {
    id: '21-not-in-a-hurry',
    title: 'Things you only find slowly',
    date: '2026-10-22T18:00',
    format: 'Carousel',
    audience: 'Everyone',
    slides: 6,
    aiImagery: false,
    status: 'manual',
    caption: `Not everything worth finding is found in a hurry. ✦

Send this to someone who needs to slow down.

#slowliving #slowtravel #mindfulness #wellbeing`,
  },
]

export const slideUrl = (p: SocialPost, n: number) => `/social/${p.id}/${String(n).padStart(2, '0')}.jpg`
/** Reels: the video lives next to its cover (01.jpg) as reel.mp4 */
export const videoUrl = (p: SocialPost) => `/social/${p.id}/reel.mp4`
