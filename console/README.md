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
| `team_members` | who's on the team (`admin` or `reviewer`) |
| `team_actions` | audit log, readable by `is_team()` |
| `am_team_member()` | am I on the list (any sign-in level) |
| `is_team()` | on the list **and** aal2 |
| `team_log(action, kind, target, note)` | write to the audit log |
| `team_me()` | name, photo and role for the header |
| `team_counts()` | numbers for Today |

## Privacy
The console never reads `direct_messages` (members' private Community chats); the team can't see them, by design. It shows each member's thread with the Xanadu team (`messages`) and nothing else.

## Built
1. Foundation: sign-in (email/password or Google), two-step setup and verify, Not authorised, sidebar/bottom-bar shell, Today (attention counts, growth numbers, recent activity), Settings.
2. Members directory (`team_list_members`, `team_member_thread`): tabs by role, search, drawer with profile, way of living, team thread and history.

## Next (from claude/BACKEND-HANDOVER.md)
2. Applications queue + review drawer + `team_review_member`.
3. Offerings review. 4. Inbox + Members. 5. Today growth chart. 6. Spaces, Safety, Settings. 7. Emails (Resend), waitlist, CSV.
