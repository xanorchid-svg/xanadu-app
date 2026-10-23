-- Console: remove applications from the Applications list to clear space (applied Oct 23, 2026)
-- Removing hides an application under "Removed"; nothing is sent and the member's account and answers are untouched.
-- It comes back on its own if their status changes (e.g. they resubmit). Approved applications can't be removed here.

create table if not exists public.team_removed_applications (
  member uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('container','facilitator')),
  status_at_removal text,
  removed_by uuid references auth.users(id) on delete set null,
  removed_at timestamptz not null default now(),
  primary key (member, role)
);
alter table public.team_removed_applications enable row level security; -- no policies: only definer functions touch it

-- team_remove_application(member, role) and team_restore_application(member, role):
--   security definer, call team_require(), log to team_actions (removed_application / restored_application),
--   execute revoked from public and anon, granted to authenticated.
-- team_list_applications(): now also returns removed_at (set while status still equals status_at_removal).
-- team_counts(): pending Container/Facilitator counts skip removed applications.
-- Full function bodies: see the live database (pg_get_functiondef).
