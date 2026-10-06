# Xanadu App

**A network for awakening places.** The Xanadu app connects Containers (retreat spaces), Facilitators (guides) and Seekers, starting in Costa Rica.

This is **v1: the interface.** Every screen from the Claude Design canvas is built and linked. The platform launches empty, so each screen shows a thoughtful empty state until founding members join. Sign-in and forms work on the page but don't save anything yet; that's the next step (Supabase).

## Stack

React + Vite + TypeScript, Tailwind CSS v4, React Router, and `vite-plugin-pwa` so it installs to a phone's home screen. Deploys to Vercel (`vercel.json` handles client-side routes).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Screens and routes

| Who | Screen | Route |
|---|---|---|
| Everyone | Logo intro → sign in (Seeker / Container / Facilitator) | `/` |
| Seeker | Discover | `/discover` |
| Seeker | Calendar (by region, by day) | `/calendar` |
| Seeker | Experience listing (template) | `/experience/preview` |
| Seeker | Saved | `/saved` |
| Seeker | You (alignment, journeys, account) | `/you` |
| Everyone | Messages: thread with the Xanadu team (`?draft=` starts a message) | `/messages` |
| Hosts | Apply as a founding Container or Facilitator | `/apply?role=Container` |
| Hosts | Application status (`?stage=review\|call\|accepted`) | `/apply/status` |
| Container | Home (setup checklist) | `/container` |
| Container | New offering (4 steps) | `/container/new` |
| Container | Manage offering (guests, schedule, meals, outings) | `/container/offering` |
| Container | Space profile with reviews | `/container/space` |
| Container | Inbox | `/container/inbox` |
| Facilitator | Home (profile checklist, intros, path to Verified) | `/facilitator` |
| Facilitator | Find spaces | `/facilitator/spaces` |
| Facilitator | Inbox | `/facilitator/inbox` |
| Facilitator | Profile with reviews | `/facilitator/profile` |

## Where things live

- `src/lib/supabase.ts`: connection to the Supabase project ("DreamXanadu Website"). The publishable key is safe in the app; access is controlled by row-level security.
- `src/auth.tsx`: sign-in state, the member's profile, and `RequireRole`, which protects every page by role.
- `src/store.ts`: data hooks: profiles, spaces, private details, offerings, inbox messages and photo uploads.
- `src/screens/Intro.tsx`: intro animation + sign in / create account (email, Google, password reset).
- `src/screens/Welcome.tsx`: the setup flow after sign-up, different for Seekers, Containers and Facilitators.
- `src/components/`: shared pieces (tab bars, chips, empty states, edit controls, logo).
- `public/`: logo layers and app icons.

## Database (Supabase)

| Table | What it holds | Who can see it |
|---|---|---|
| `profiles` | One per member: role, status, name, photo, practices, preferences | Own row; approved hosts are visible to members |
| `private_details` | References, insurance, reviews/referrals, phone | Only the member (and the Xanadu team) |
| `spaces` | A Container's space | Owner; approved spaces visible to members |
| `offerings` | Retreats, trainings, drop-ins | Owner; `live` offerings visible to members |
| `messages` | Each member's thread with the Xanadu team (replies arrive live) | Only that member (and the team) |
| `saved_items` | Hearts: saved experiences and spaces | Only that member |
| storage `photos` | Uploaded photos, one folder per member | Public to view; only the owner can upload |

Members can't approve themselves: `status` on profiles and offerings only changes when the Xanadu team sets it. The one exception: a host can resubmit an offering the team marked `declined` ("Needs changes"), which moves it back to `in_review`.

### Running Xanadu (team tasks in the Supabase dashboard → Table Editor)
- **Approve a host:** `profiles` → set `status` to `approved` (or `declined`).
- **Publish an offering:** `offerings` → set `status` to `live`.
- **Read and reply to members:** `messages` → add a row with the member's `user_id`, `from_team` = true and your reply in `body`.
- **Community reports:** `reports` → each row is a member reporting another (`reporter`, `reported`, `reason`). Blocks are in `blocks`.

### Community
`/community` (Seekers and approved Facilitators). Opt-in: a member appears only after turning on *Show me in Community* and sharing their location, which is rounded to about 1 km on the phone and never shown to anyone. Others see name, photo, practices and distance in whole miles (5, 10 or 25 mi circles). Chat (`/community/chat/:id`) opens only after both people accept a connection; messages arrive live. Members can report, remove or block from the chat menu.

### Discover filters and destinations
Xanadu is global. Spaces have `country`, `region` (state, province or island) and `town`; hosts pick a country from `DESTINATIONS` in `src/data.ts` or type another. Discover has a Filters sheet (`src/components/FilterSheet.tsx`, logic in `src/filters.ts`): Type (Retreat, Training, Drop-in, Volunteer exchange), Where (countries and regions that actually have listings), When, Price, Length and Sort. Options that would show nothing are hidden, and filters are kept for the session. Calendar and Facilitator Spaces filter by country.

### AI matching (Seekers → spaces and experiences)
Seekers describe what they're looking for in their own words (sign-up and their profile). The `match-embed` edge function (`supabase/functions/match-embed`) reads that text, picks out keywords (e.g. Volunteer exchange, Surf, Yoga) and creates an AI meaning vector with Supabase's built-in `gte-small` model (free, no API key). Hosts' spaces and offerings are processed the same way whenever they're saved. `my_matches()` ranks approved spaces and live offerings by meaning plus shared keywords, with an extra boost for volunteer exchange; Discover shows the top 6. Spaces can turn on *We welcome volunteers* and describe the exchange.

### Google / Apple sign-in
The "Continue with Google" and "Continue with Apple" buttons appear automatically once each provider is switched on in Supabase → Authentication → Sign In / Providers. Apple needs an Apple Developer account ($99/year), and its client secret expires every 6 months and must be regenerated. Apple sign-in is required for the App Store because the app offers Google sign-in (guideline 4.8).

### Delete my account
Every profile page has *Delete my account* (type DELETE to confirm). It calls the `delete-account` edge function (`supabase/functions/delete-account`), which removes the member's photos and their auth user; every table row goes with it through ON DELETE CASCADE. Required for the App Store (guideline 5.1.1(v)).

## Next steps

1. Booking requests and guest lists.
2. A simple admin screen for approvals and replies.
3. Public facilitator profiles for Seekers (the Saved → Guides tab is ready for them).

Contact: networkxanadu@gmail.com
