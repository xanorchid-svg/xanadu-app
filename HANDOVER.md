# Xanadu App — Handover

_Last updated: October 5, 2026. Paste this file into a new chat to pick up where we left off._

## What Xanadu is
Xanadu is a marketplace that connects three kinds of member:
- **Containers:** retreat spaces.
- **Facilitators:** guides who run retreats and classes.
- **Seekers:** people looking for an experience.

The first market is Costa Rica. The tagline is "Xanadu begins with you."

**Brand colours:**
- Navy #101B2C
- Star gold #B89567
- Plum #2A1F39
- Slate #49536F
- Sage #494E38
- Mist teal #6A838A

The logo is a fine-line, portal-like emblem with a star at its centre.

**How Xan wants to work:**
- The most efficient route, with the least work for her.
- Her budget is about $100 a month.
- Build on the existing v1 design rather than redesigning it.
- The platform launches **empty**. No real businesses are pre-listed, so places like Wild Child and Posada Natura must sign up themselves.

## Where things live

| Thing | Where |
|---|---|
| Code | GitHub `xanorchid-svg/xanadu-app`, branch `main` |
| Live app | https://app.dreamxanadu.com (Vercel, auto-deploys on every push to `main`) |
| Database, sign-in, storage | Supabase project `nmstrfmxflwgbgkiyeyq` (https://nmstrfmxflwgbgkiyeyq.supabase.co) |
| Google sign-in | Google Cloud project "Xanadu" under networkxanadu-org, owned by networkxanadu@gmail.com |
| Contact email used in the app | networkxanadu@gmail.com |
| Original design | Claude Design canvas with 16 artboards (v1 look, already built) |
| Full technical notes | `README.md` in the repo |

## Tech stack
- **App:** React 19, Vite, TypeScript and Tailwind v4, using React Router 7.
- **Install to phone:** it's a PWA, so it can be added to the home screen.
- **Backend:** Supabase handles auth, Postgres with row-level security, storage (`photos` bucket), realtime and an edge function.
- **Supabase key in the code:** the publishable key is in `src/lib/supabase.ts`. That's safe to ship; row-level security protects the data.

## What's built (all live)
1. **Intro and sign-in**
   - The logo zooms out on ivory, then the emblem grows into a full-screen navy background and its fine lines orbit the central star.
   - Sign in or sign up as Seeker, Container or Facilitator.
   - Also includes forgot password, email confirmation, and links to Terms and Privacy.
2. **Accounts**
   - Each role gets its own setup flow at `/welcome`:
     - Seeker: 2 steps.
     - Container: 4 steps, including proof and agreement.
     - Facilitator: 4 steps, including trainings, references and agreement.
   - Everything saves to Supabase.
   - Every profile page has editing (text and photos) and Sign out.
3. **Google and Apple sign-in**
   - The buttons only appear when the provider is switched on in Supabase. That fixed the "provider is not enabled" error.
4. **Seekers**
   - Discover, Calendar, Saved and You pages.
   - Seekers can pick "Volunteer exchange" and write what they're looking for in their own words.
5. **AI matching**
   - The `match-embed` edge function picks out keywords and creates embeddings with Supabase's free built-in `gte-small` model.
   - The `my_matches()` function ranks approved spaces and live offerings, with an extra boost for volunteer exchange.
   - Discover shows "Top matches for you", and the You page shows "We picked up on…" keywords.
6. **Containers**
   - Home checklist, new offering, and offering management (guests, schedule, meals, outings).
   - Space profile with a "We welcome volunteers" switch and details.
   - Inbox to the Xanadu team, and an application-status banner.
7. **Facilitators**
   - Home, Spaces, Inbox and Profile pages (trainings, references, insurance).
8. **Community** (Seekers and approved Facilitators)
   - It's opt-in. Location is rounded to about 1 km on the phone, and others only see distance in miles.
   - Radius of 5, 10 or 25 miles.
   - Connect, accept or decline, then live chat once both accept.
   - Report, remove or block from the chat menu.
9. **Public pages:** `/space/:id` (a space as guests see it), `/experience/:id`, `/privacy` and `/terms`.
10. **Pages open at the top** on navigation and on refresh.

## Routes
| Who | Routes |
|---|---|
| Public | `/`, `/auth/callback`, `/reset-password`, `/privacy`, `/terms` |
| Setup | `/welcome` |
| Seeker | `/discover`, `/calendar`, `/saved`, `/you` |
| Any signed-in member | `/experience/:id`, `/space/:id`, `/apply/status`, `/community`, `/community/chat/:id` |
| Container | `/container`, `/container/new`, `/container/offering?id=`, `/container/space`, `/container/inbox` |
| Facilitator | `/facilitator`, `/facilitator/spaces`, `/facilitator/inbox`, `/facilitator/profile` |

## Database (Supabase, public schema)
**Tables**

| Table | What it holds |
|---|---|
| `profiles` | role, status, onboarded, name, photo_url, town, region, practices, about, languages, trainings, prefs, seeking, notify, launch_notify, chart_early, open_to_spaces, community_visible |
| `private_details` | proof, phone, references, insurance (owner only) |
| `spaces` | includes volunteer_exchange and volunteer_details |
| `offerings` | status: draft, in_review, live or declined |
| `messages` | member ↔ Xanadu team |
| `member_locations` | owner only |
| `connections` | |
| `blocks` | |
| `reports` | |
| `direct_messages` | realtime |
| `match_vectors` | written only by the edge function; members can read their own row |

**Functions and triggers**
- **Database functions:** `nearby_members`, `my_connections`, `my_matches`, `in_community`, `is_blocked`.
- **Guard triggers:** stop members from changing their own role or status, or tampering with connections and messages.
- **Edge function:** `match-embed`. Its source is in `supabase/functions/match-embed/`.

**Running Xanadu day to day** (Supabase → Table Editor)

| Task | How |
|---|---|
| Approve a host | `profiles.status` = `approved` |
| Publish an offering | `offerings.status` = `live` |
| Reply to a member | Add a `messages` row with `user_id` and `from_team` = true |
| Review reports | `reports` table |

## Setup status and next steps for Xan
- ✅ Google Cloud OAuth client created; app is **In production**, External.
- ✅ Privacy and Terms pages are live and linked in Google Branding.
- ⏳ **Supabase → Authentication → Sign In / Providers → Google:** turn it on and paste the Client ID and secret.
- ⏳ **Supabase → Authentication → URL Configuration:**
  - Site URL: `https://app.dreamxanadu.com`
  - Redirect URLs: `https://app.dreamxanadu.com/**`, `https://*.vercel.app/**`, `http://localhost:5173/**`
- ⏳ **Test** "Continue with Google" on the live app. Google settings can take up to a few hours to take effect.
- ⏳ **Email:** Supabase's built-in email sends only a few messages an hour. Set up custom SMTP (for example Resend's free plan) before real sign-ups, or turn off "Confirm email" for now.
- Optional:
  - Google branding verification, so the Google popup says "Xanadu" instead of the supabase.co address. This means verifying dreamxanadu.com in Google Search Console. It's free and takes a few days.
  - Leaked-password protection in Supabase, if her plan allows it.
- **Apple sign-in:** needs an Apple Developer account at $99 a year. It's deferred until the App Store matters, so confirm with Xan before spending.
- **Not yet tested end to end on a real phone:** sign-up → setup, Google sign-in, Community chat, and the AI matching call.

## Ideas parked for later
- **Reels:** short videos from Facilitators and Containers, shown by location. Xan said this is "down the line."
- **Bookings and payments:** "Request a spot" currently sends a message to the team.
- **Reviews:** the UI is in place but empty until bookings exist.
- **Aligned facilitators for spaces**, and a working "Share" link for spaces.

## Notes for the next Claude session
- **No network access from the workspace:** it can't reach Supabase or app.dreamxanadu.com. Test the database with Supabase MCP `execute_sql` DO blocks that `raise exception` with the results, so everything rolls back. Test the UI with a local `vite preview` plus Playwright, using `executablePath: '/opt/pw-browsers/chromium'`.
- **Avoid destructive migrations:** steps like dropping columns or functions got cancelled even after Xan approved them. Use non-destructive alternatives. The old `profiles.email` column still exists but is no longer written to.
- **Git commits** end with the Co-Authored-By and Claude-Session lines the session asks for.
- **Building:** `npx tsc -b && npm run build` must pass before pushing.
