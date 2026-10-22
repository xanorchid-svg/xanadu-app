-- Xanadu console, Oct 22 2026: "Remove from Xanadu" (block a member, with a reason, and undo).
-- Additive only. Paste the whole file into Supabase → SQL Editor (project "xanadu app") and press Run.
--
-- Removing someone:
--   · signs them out everywhere and blocks sign-in (so they can't sign up again with that email)
--   · hides them: Container/Facilitator status → declined (their space page and profile disappear),
--     their live and in-review offerings → declined, and they're taken out of Community
--   · records who removed them, when, the reason and your note, in public.member_removals
-- Restoring puts their statuses, Community and offerings back the way they were and lets them sign in again.
-- Removing someone never deletes their data.

create table if not exists public.member_removals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  email text,
  name text,
  reason text not null check (reason in ('safety', 'harassment', 'fake', 'guidelines', 'asked', 'other')),
  note text not null,
  removed_by uuid references auth.users on delete set null default auth.uid(),
  removed_at timestamptz not null default now(),
  prev jsonb not null default '{}'::jsonb,
  restored_at timestamptz,
  restored_by uuid references auth.users on delete set null,
  restore_note text
);
alter table public.member_removals enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'member_removals' and policyname = 'team reads removals') then
    create policy "team reads removals" on public.member_removals for select using ((select public.is_team()));
  end if;
end $$;
create index if not exists member_removals_user on public.member_removals (user_id) where restored_at is null;

create or replace function public.team_remove_from_xanadu(p_member uuid, p_reason text, p_note text)
returns json language plpgsql security definer set search_path to '' as $$
declare p public.profiles; v_email text; v_prev jsonb; v_id uuid;
begin
  perform public.team_require();
  if p_member = auth.uid() then raise exception 'you can''t remove yourself'; end if;
  if exists (select 1 from public.team_members where user_id = p_member) then
    raise exception 'they''re on the Xanadu team: remove them from the team in Settings first';
  end if;
  if p_reason not in ('safety', 'harassment', 'fake', 'guidelines', 'asked', 'other') then raise exception 'pick a reason'; end if;
  if length(trim(coalesce(p_note, ''))) < 3 then raise exception 'write a short note about why'; end if;
  if exists (select 1 from public.member_removals where user_id = p_member and restored_at is null) then
    raise exception 'already removed';
  end if;
  select * into p from public.profiles where id = p_member;
  select email into v_email from auth.users where id = p_member;
  if v_email is null then raise exception 'member not found'; end if;

  v_prev := jsonb_build_object(
    'container_status', p.container_status, 'facilitator_status', p.facilitator_status,
    'community_removed', coalesce(p.community_removed, false),
    'offerings', coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'status', o.status))
                             from public.offerings o where o.owner_id = p_member and o.status in ('live', 'in_review')), '[]'::jsonb));

  if p.id is not null then
    update public.profiles set
      container_status = case when container_status is null then null else 'declined' end,
      facilitator_status = case when facilitator_status is null then null else 'declined' end,
      community_removed = true
     where id = p_member;
  end if;
  update public.offerings set status = 'declined', updated_at = now() where owner_id = p_member and status in ('live', 'in_review');
  update auth.users set banned_until = now() + interval '100 years' where id = p_member;
  delete from auth.sessions where user_id = p_member;

  insert into public.member_removals (user_id, email, name, reason, note, prev)
  values (p_member, v_email, p.name, p_reason, trim(p_note), v_prev) returning id into v_id;
  perform public.team_log('removed_from_xanadu', 'member', p_member::text, p_reason || ': ' || trim(p_note));
  return json_build_object('id', v_id);
end $$;

create or replace function public.team_restore_to_xanadu(p_member uuid, p_note text default '')
returns json language plpgsql security definer set search_path to '' as $$
declare r public.member_removals; o jsonb;
begin
  perform public.team_require();
  select * into r from public.member_removals where user_id = p_member and restored_at is null order by removed_at desc limit 1;
  if r.id is null then raise exception 'they aren''t removed'; end if;
  update public.profiles set
    container_status = r.prev->>'container_status',
    facilitator_status = r.prev->>'facilitator_status',
    community_removed = coalesce((r.prev->>'community_removed')::boolean, false)
   where id = p_member;
  for o in select * from jsonb_array_elements(coalesce(r.prev->'offerings', '[]'::jsonb)) loop
    update public.offerings set status = o->>'status', updated_at = now() where id = (o->>'id')::uuid and status = 'declined';
  end loop;
  update auth.users set banned_until = null where id = p_member;
  update public.member_removals set restored_at = now(), restored_by = auth.uid(), restore_note = nullif(trim(coalesce(p_note, '')), '') where id = r.id;
  perform public.team_log('restored_to_xanadu', 'member', p_member::text, nullif(trim(coalesce(p_note, '')), ''));
  return json_build_object('restored', true);
end $$;

-- Every removal (newest first), with who removed and who restored
create or replace function public.team_removals()
returns json language plpgsql stable security definer set search_path to '' as $$
declare r json;
begin
  perform public.team_require();
  select coalesce(json_agg(json_build_object(
      'id', m.id, 'user_id', m.user_id, 'email', m.email, 'name', m.name, 'reason', m.reason, 'note', m.note,
      'removed_at', m.removed_at, 'removed_by', coalesce(rp.name, ru.email),
      'restored_at', m.restored_at, 'restored_by', coalesce(sp.name, su.email), 'restore_note', m.restore_note)
    order by m.removed_at desc), '[]'::json) into r
    from public.member_removals m
    left join auth.users ru on ru.id = m.removed_by left join public.profiles rp on rp.id = m.removed_by
    left join auth.users su on su.id = m.restored_by left join public.profiles sp on sp.id = m.restored_by;
  return r;
end $$;

revoke execute on function public.team_remove_from_xanadu(uuid, text, text) from public, anon;
revoke execute on function public.team_restore_to_xanadu(uuid, text) from public, anon;
revoke execute on function public.team_removals() from public, anon;
grant execute on function public.team_remove_from_xanadu(uuid, text, text) to authenticated;
grant execute on function public.team_restore_to_xanadu(uuid, text) to authenticated;
grant execute on function public.team_removals() to authenticated;

-- Someone who was removed can't get the waitlist welcome email by joining again on the website
create or replace function public.waitlist_send_welcome()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if exists (select 1 from public.member_removals where lower(email) = lower(new.email) and restored_at is null) then
    return new;
  end if;
  perform net.http_post(
    url := 'https://gutqzqxybcnnpwfbkjsq.supabase.co/functions/v1/notify',
    body := jsonb_build_object('waitlist', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb);
  return new;
end $$;
