# Xanadu Team Console

Private console for the Xanadu team at **backend.dreamxanadu.com**. It lives in this folder of the app repo and deploys as its own Vercel project (Root Directory: `console`), so none of its code ships in the members' app.

## Stack
React 19, Vite, TypeScript, Tailwind v4, React Router 7. Same Supabase project as the app (**xanadu app**, `gutqzqxybcnnpwfbkjsq`), publishable key only.

```
cd console && npm install
npm run dev        # http://localhost:5174
npx tsc -b && npm run build
```

## Security
- No sign-up here. The team list is `public.team_members` (seeded with Xan).
- Front door (`src/gate.tsx`): sign in → `am_team_member()` false → "Not authorised" and signed out → otherwise two-step verification (TOTP, Supabase MFA) → console.
- `public.is_team()` is true only for a team member **with a two-step-verified session (aal2)**. Every team function checks it, so the database enforces the same rule as the screens.
- Team functions are `security definer` and owned by `postgres`, so the existing guard triggers on `profiles`, `offerings` and `messages` already let them through. No trigger changes were needed.
- Every team action writes to `public.team_actions` (audit log).
- Hidden: `noindex` meta, `X-Robots-Tag` header, `robots.txt` disallow all. Not linked from the app or website.

## Database objects (all additive)
| Object | Purpose |
|---|---|
| `team_members`, `team_actions`, `team_templates` | who's on the team; audit log; editable message templates |
| `profiles.heard_from` | "Where did you hear about Xanadu?" from every setup flow (e.g. `Instagram`, `Other: a podcast`) |
| `profiles.community_removed` | set by the team from Safety; members can't undo it (guard trigger) and `in_community()` excludes them |
| `messages: team reads team threads` policy | lets a verified team member read every member's thread with the team, so the Inbox updates live |
| `am_team_member()`, `is_team()`, `team_is_admin()`, `team_require()`, `team_log()`, `team_me()` | the gate and helpers |
| `team_counts()`, `team_signups(days)`, `team_heard_from()` | Today |
| `team_list_applications()`, `team_review_member(member, approve/changes/decline/reopen, message)` | Applications (every answer from the setup forms) |
| `team_remove_application(member, role)`, `team_restore_application(member, role)`, table `team_removed_applications` | Remove a non-approved application from the list (Removed tab, restorable, nothing sent; returns on its own if they resubmit) |
| `team_list_offerings()`, `team_review_offering(offering, live/changes/review, message)` | Offerings |
| `team_inbox()`, `team_reply(member, body)`, `team_member_thread(member)` | Inbox |
| `team_list_members()`, `team_member_extra(member)` | Members |
| `team_list_spaces()` | Spaces |
| `team_list_reports()`, `team_resolve_report(report, dismiss/warn/remove, message)`, `team_restore_community(member)` | Safety |
| `team_list_team()`, `team_add_member(email, role)`, `team_set_member_role(user, role)`, `team_remove_member(user)` (admins only; not yourself; always one admin left), `team_set_template(key, body)` | Settings |
| `social_post_state` (team-only table: post_id → posted / deleted) | Instagram: posts cleared from the list, restorable |

All team functions are `security definer`, check `is_team()` first, are executable by `authenticated` only (not `anon`), and write to the audit log when they change anything. Supabase's advisor flags them as "security definer callable by signed-in users": that's intended, the check is inside each function.

## Privacy
The console never reads `direct_messages` (members' private Community chats); the team can't see them, by design. It shows each member's thread with the Xanadu team (`messages`) and nothing else. Safety shows who reported whom and why, never the conversation.

## Screens
Today (attention counts, totals, 30-day sign-ups chart, where people heard about us, recent activity) · Applications (Pending / Not finished / Approved / Declined, every form answer step by step, Approve / Ask for changes / Decline with editable templates, keys A C D J K) · Offerings (In review / Live / Needs changes / Past) · Inbox (live, spot and volunteer requests flagged, quick replies) · Members · Spaces (country and landscape filters) · Safety (dismiss, warn, remove from Community, allow back) · Settings (team, add helpers, templates, account).

## Later
Approval emails (Resend + `notify` edge function), website waitlist, CSV export, swipe-to-decide on phones.
