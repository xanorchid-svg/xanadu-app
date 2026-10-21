-- Oct 20, 2026: the website's "Join the waitlist" now saves here, in the app database (applied as migration website_waitlist).
-- The website (repo xanorchid-svg/Xanadu, src/lib/waitlist.js) calls join_waitlist with the publishable key.
-- Nobody can read or write public.waitlist directly; the team reads it through team_waitlist() (Console → Waitlist).
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) <= 320 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role text not null default 'Seeker',
  intention text check (intention is null or char_length(intention) <= 4000),
  seeking text[], stay_length text, stay_work text, stay_where text[], source text,
  invited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create unique index if not exists waitlist_email_key on public.waitlist (lower(email));
alter table public.waitlist enable row level security;
revoke all on public.waitlist from anon, authenticated;
-- join_waitlist(p_name, p_email, p_intention, p_seeking, p_length, p_work, p_where, p_source): security definer,
--   validates name/email, one row per email (a repeat sign-up updates it and keeps earlier answers); anon + authenticated.
-- team_waitlist(): team_require(), returns every row newest first with has_account (email already has an app login).
