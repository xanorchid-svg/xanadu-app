-- Oct 21, 2026: community events. Any member can share a local event they saw (a poster or a message);
-- the Xanadu team approves it in the console, and it shows on the Calendar and Discover labelled
-- "Community event · not verified by Xanadu". It's separate from offerings, which are reviewed listings.

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references auth.users (id) on delete cascade,
  title text not null default '' check (char_length(title) <= 160),
  description text not null default '' check (char_length(description) <= 2000),
  start_date date,
  end_date date,
  start_time text not null default '' check (char_length(start_time) <= 20),
  end_time text not null default '' check (char_length(end_time) <= 20),
  venue text not null default '' check (char_length(venue) <= 160),
  town text not null default '' check (char_length(town) <= 120),
  price_note text not null default '' check (char_length(price_note) <= 120),
  contact text not null default '' check (char_length(contact) <= 200),
  link text not null default '' check (char_length(link) <= 500),
  tags text[] not null default '{}',
  photo_url text not null default '',
  aligned boolean, -- what the poster reader thought: a wellness, healing or movement event?
  status text not null default 'pending' check (status in ('pending', 'live', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.community_events enable row level security;
create index if not exists community_events_status_date_idx on public.community_events (status, start_date);
create index if not exists community_events_submitted_by_idx on public.community_events (submitted_by);

-- members share as themselves, always pending; 10 a day each; only the team changes the status
create or replace function public.guard_community_event()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if coalesce(auth.role(), '') = 'service_role' or current_user = 'postgres' then return new; end if;
  if tg_op = 'INSERT' then
    new.submitted_by := auth.uid();
    new.status := 'pending';
    new.reviewed_at := null;
    if (select count(*) from public.community_events where submitted_by = auth.uid() and created_at > now() - interval '1 day') >= 10 then
      raise exception 'You’ve shared a lot of events today. Please try again tomorrow.';
    end if;
  else
    new.submitted_by := old.submitted_by;
    new.status := old.status;
    new.reviewed_at := old.reviewed_at;
  end if;
  new.updated_at := now();
  if new.end_date is not null and new.start_date is not null and new.end_date < new.start_date then new.end_date := new.start_date; end if;
  return new;
end $$;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'community_events_guard') then
    create trigger community_events_guard before insert or update on public.community_events
      for each row execute function public.guard_community_event();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'community_events' and policyname = 'community events: read live or own') then
    create policy "community events: read live or own" on public.community_events for select to authenticated
      using (status = 'live' or submitted_by = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'community_events' and policyname = 'community events: share') then
    create policy "community events: share" on public.community_events for insert to authenticated
      with check (submitted_by = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.onboarded));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'community_events' and policyname = 'community events: edit own while pending') then
    create policy "community events: edit own while pending" on public.community_events for update to authenticated
      using (submitted_by = (select auth.uid()) and status = 'pending') with check (submitted_by = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'community_events' and policyname = 'community events: delete own') then
    create policy "community events: delete own" on public.community_events for delete to authenticated
      using (submitted_by = (select auth.uid()));
  end if;
end $$;

-- console
create or replace function public.team_list_community_events()
returns json language plpgsql stable security definer set search_path to '' as $$
declare r json;
begin
  perform public.team_require();
  select coalesce(json_agg(x order by (x.status = 'pending') desc, x.start_date nulls last, x.created_at desc), '[]'::json) into r from (
    select e.*, p.name as submitted_by_name, u.email::text as submitted_by_email
      from public.community_events e
      left join public.profiles p on p.id = e.submitted_by
      left join auth.users u on u.id = e.submitted_by
     where e.start_date is null or coalesce(e.end_date, e.start_date) >= current_date - 7 or e.status = 'pending'
  ) x;
  return r;
end $$;

create or replace function public.team_review_community_event(p_event uuid, p_decision text, p_message text default '')
returns json language plpgsql security definer set search_path to '' as $$
declare e public.community_events; v_status text; v_msg text := coalesce(trim(p_message), '');
begin
  perform public.team_require();
  select * into e from public.community_events where id = p_event;
  if e.id is null then raise exception 'event not found'; end if;
  v_status := case p_decision when 'approve' then 'live' when 'decline' then 'declined' when 'pending' then 'pending' end;
  if v_status is null then raise exception 'unknown decision %', p_decision; end if;
  update public.community_events set status = v_status, reviewed_at = case when v_status = 'pending' then null else now() end where id = p_event;
  perform public.team_log('community_event_' || v_status, 'community_event', p_event::text, e.title);
  if v_status = 'live' and e.submitted_by is not null then
    perform public.notify_member(e.submitted_by, 'event_live', 'Thank you. ' || coalesce(nullif(e.title, ''), 'Your event') || ' is on the calendar',
      coalesce(nullif(v_msg, ''), 'Members nearby can see it now as a community event.'), '/event/' || p_event, false);
  elsif v_status = 'declined' and e.submitted_by is not null and v_msg <> '' then
    perform public.notify_member(e.submitted_by, 'event_declined', 'About the event you shared', v_msg, '/calendar', false);
  end if;
  return json_build_object('status', v_status);
end $$;

-- Today's count in the console
create or replace function public.team_pending_community_events()
returns integer language sql stable security definer set search_path to '' as $$
  select case when public.is_team() then (select count(*)::int from public.community_events where status = 'pending') else 0 end
$$;

-- Oct 21 fix: guards must run as the member (security invoker), or their "is this the team?" bypass is always true.
alter function public.guard_community_event() security invoker;
