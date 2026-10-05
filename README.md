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

- `src/store.ts`: profile storage. Seeker, space and facilitator profiles (text and photos) are editable and saved on the device until Supabase accounts are connected; photos are resized before saving.
- `src/components/edit.tsx`: edit controls (text fields, photo pickers, practice pickers, save bar, sign out).
- `src/data.ts`: the data layer. `experiences` and `spaces` are empty lists today; screens already render cards when they contain items. Swap these for Supabase queries.
- `src/components/ui.tsx`: shared pieces (tab bars, chips, empty states, checklists, reviews).
- `src/screens/`: one file per screen, grouped by `seeker`, `host`, `container`, `facilitator`.
- `src/index.css`: brand tokens (navy, star gold, plum, sage, mist teal, ivory) and the intro animation.
- `public/`: logo, mark and app icons.

## Next steps

1. **Supabase:** auth (email + Google/Apple), tables for profiles, spaces, offerings, bookings, reviews and vouches, with row-level security.
2. Connect the application form to the existing `container_applications` / `facilitator_applications` tables.
3. Photo uploads (Supabase Storage).
4. Booking requests and the guest flow.

Contact: networkxanadu@gmail.com
