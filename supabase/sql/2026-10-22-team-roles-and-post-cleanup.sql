-- Xanadu console, Oct 22 2026. Additive only: nothing is dropped or altered.
-- Paste the whole file into Supabase → SQL Editor (project "xanadu app") and press Run.
--
-- 1. Settings → The team: admins can change a teammate's role or remove them.
--    You can't change or remove yourself, and the team always keeps at least one admin.
-- 2. Instagram: remember which posts were deleted or marked "already posted" in the console.

create or replace function public.team_set_member_role(p_user uuid, p_role text)
returns json language plpgsql security definer set search_path to '' as $$
declare v_old text; v_email text;
begin
  if not public.team_is_admin() then raise exception 'only admins can change team roles' using errcode = '42501'; end if;
  if p_role not in ('admin', 'reviewer') then raise exception 'unknown role'; end if;
  if p_user = auth.uid() then raise exception 'you can''t change your own role: ask another admin'; end if;
  select role into v_old from public.team_members where user_id = p_user;
  if v_old is null then raise exception 'not on the team'; end if;
  if v_old = p_role then return json_build_object('user_id', p_user, 'role', p_role); end if;
  if v_old = 'admin' and (select count(*) from public.team_members where role = 'admin') <= 1 then
    raise exception 'the team needs at least one admin';
  end if;
  update public.team_members set role = p_role where user_id = p_user;
  select email into v_email from auth.users where id = p_user;
  perform public.team_log('team_member_role', 'team', p_user::text, coalesce(v_email, '') || ': ' || v_old || ' → ' || p_role);
  return json_build_object('user_id', p_user, 'role', p_role);
end $$;

create or replace function public.team_remove_member(p_user uuid)
returns json language plpgsql security definer set search_path to '' as $$
declare v_old text; v_email text;
begin
  if not public.team_is_admin() then raise exception 'only admins can remove team members' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'you can''t remove yourself: ask another admin'; end if;
  select role into v_old from public.team_members where user_id = p_user;
  if v_old is null then raise exception 'not on the team'; end if;
  if v_old = 'admin' and (select count(*) from public.team_members where role = 'admin') <= 1 then
    raise exception 'the team needs at least one admin';
  end if;
  select email into v_email from auth.users where id = p_user;
  delete from public.team_members where user_id = p_user;
  perform public.team_log('team_member_removed', 'team', p_user::text, coalesce(v_email, '') || ' (was ' || v_old || ')');
  return json_build_object('user_id', p_user, 'removed', true);
end $$;

-- Only signed-in people can call these (they still refuse anyone who isn't an admin)
revoke execute on function public.team_set_member_role(uuid, text) from public, anon;
revoke execute on function public.team_remove_member(uuid) from public, anon;
grant execute on function public.team_set_member_role(uuid, text) to authenticated;
grant execute on function public.team_remove_member(uuid) to authenticated;

-- Instagram posts the team has cleared from the console list
create table if not exists public.social_post_state (
  post_id text primary key,
  state text not null check (state in ('posted', 'deleted')),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users on delete set null
);
alter table public.social_post_state enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'social_post_state' and policyname = 'team manages post state') then
    create policy "team manages post state" on public.social_post_state for all
      using ((select public.is_team())) with check ((select public.is_team()));
  end if;
end $$;
