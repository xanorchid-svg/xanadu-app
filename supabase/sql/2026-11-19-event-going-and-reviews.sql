-- Community events: "I'm going", who's going, and reviews (Nov 19, 2026)
--
-- * Seekers mark "I'm going" on a community event. Everyone signed in sees how many are going;
--   members who share their profile in Community see each other by name and can connect.
-- * After the event, those who went can rate the space and the facilitator/host (0–5 stars + comment).
-- * The team links an event to a Xanadu space and/or Facilitator in the console. Reviews only show
--   on that space's or Facilitator's page once they've applied and been approved.

-- 1. Which Xanadu space / Facilitator an event belongs to (set by the team; empty until they join)
alter table public.community_events
  add column if not exists space_id uuid references public.spaces(id) on delete set null,
  add column if not exists facilitator_id uuid references public.profiles(id) on delete set null;
create index if not exists community_events_space_idx on public.community_events(space_id);
create index if not exists community_events_facilitator_idx on public.community_events(facilitator_id);

-- 2. I'm going
create table if not exists public.event_going (
  event_id uuid not null references public.community_events(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index if not exists event_going_user_idx on public.event_going(user_id);
alter table public.event_going enable row level security;

drop policy if exists "event going: read own" on public.event_going;
create policy "event going: read own" on public.event_going for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "event going: add own" on public.event_going;
create policy "event going: add own" on public.event_going for insert to authenticated
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.community_events e where e.id = event_id and e.status = 'live'));
drop policy if exists "event going: remove own" on public.event_going;
create policy "event going: remove own" on public.event_going for delete to authenticated
  using (user_id = (select auth.uid()));

-- How many are going, for a list of events (any signed-in member)
create or replace function public.event_going_counts(p_ids uuid[])
returns table(event_id uuid, going int)
language sql stable security definer set search_path = '' as $$
  select g.event_id, count(*)::int
  from public.event_going g
  join public.community_events e on e.id = g.event_id and e.status = 'live'
  where (select auth.uid()) is not null and g.event_id = any(p_ids)
  group by g.event_id
$$;

-- Who's going to one event. Names only for members who share their profile in Community
-- (and only to a viewer who does too), never anyone either side has blocked. Everyone else is counted.
create or replace function public.event_attendees(p_event uuid)
returns json
language sql stable security definer set search_path = '' as $$
  with g as (
    select eg.user_id, eg.created_at from public.event_going eg
    join public.community_events e on e.id = eg.event_id and e.status = 'live'
    where eg.event_id = p_event and (select auth.uid()) is not null
  ), vis as (
    select p.id, p.name, p.photo_url, p.town, p.practices, g.created_at,
           c.id as cid, c.status as cst, (c.addressee = (select auth.uid())) as inc
    from g join public.profiles p on p.id = g.user_id
    left join public.connections c
      on least(c.requester, c.addressee) = least((select auth.uid()), p.id)
     and greatest(c.requester, c.addressee) = greatest((select auth.uid()), p.id)
    where p.id <> (select auth.uid()) and public.in_community(p.id) and not public.is_blocked((select auth.uid()), p.id)
  )
  select json_build_object(
    'going', (select count(*) from g),
    'me', exists (select 1 from g where g.user_id = (select auth.uid())),
    'visible', exists (select 1 from public.profiles me where me.id = (select auth.uid()) and me.community_visible and not me.community_removed),
    'people', coalesce((select json_agg(json_build_object('id', id, 'name', name, 'photo_url', photo_url, 'town', town, 'practices', practices,
                 'connection_id', cid, 'connection_status', cst, 'incoming', inc) order by created_at) from vis), '[]'::json)
  )
$$;

-- 3. Reviews
create table if not exists public.event_reviews (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.community_events(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  target text not null check (target in ('space', 'facilitator')),
  rating int not null check (rating between 0 and 5),
  comment text not null default '' check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id, target)
);
create index if not exists event_reviews_event_idx on public.event_reviews(event_id);
alter table public.event_reviews enable row level security;

drop policy if exists "event reviews: read own" on public.event_reviews;
create policy "event reviews: read own" on public.event_reviews for select to authenticated
  using (user_id = (select auth.uid()));
-- only someone who said they were going, once the event has started
drop policy if exists "event reviews: add own" on public.event_reviews;
create policy "event reviews: add own" on public.event_reviews for insert to authenticated
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.event_going g where g.event_id = event_reviews.event_id and g.user_id = (select auth.uid()))
    and exists (select 1 from public.community_events e where e.id = event_reviews.event_id and e.start_date <= current_date));
drop policy if exists "event reviews: edit own" on public.event_reviews;
create policy "event reviews: edit own" on public.event_reviews for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "event reviews: remove own" on public.event_reviews;
create policy "event reviews: remove own" on public.event_reviews for delete to authenticated
  using (user_id = (select auth.uid()));

-- Reviews for a space or Facilitator page: only once they're approved on Xanadu.
-- Reviewers are shown by first name only.
create or replace function public.member_reviews(p_kind text, p_id uuid)
returns json
language sql stable security definer set search_path = '' as $$
  with ok as (
    select case
      when p_kind = 'space' then exists (select 1 from public.spaces s join public.profiles o on o.id = s.owner_id
                                         where s.id = p_id and o.container_status = 'approved')
      when p_kind = 'facilitator' then exists (select 1 from public.profiles f where f.id = p_id and f.facilitator_status = 'approved')
      else false end as approved
  ), r as (
    select rv.rating, rv.comment, rv.created_at, e.title as event_title, e.start_date,
           split_part(coalesce(nullif(trim(p.name), ''), 'A member'), ' ', 1) as first_name, p.photo_url
    from public.event_reviews rv
    join public.community_events e on e.id = rv.event_id
    left join public.profiles p on p.id = rv.user_id
    where (select approved from ok) and (select auth.uid()) is not null
      and rv.target = p_kind
      and ((p_kind = 'space' and e.space_id = p_id) or (p_kind = 'facilitator' and e.facilitator_id = p_id))
  )
  select json_build_object(
    'count', (select count(*) from r),
    'average', (select round(avg(rating)::numeric, 1) from r),
    'dist', (select json_object_agg(s, (select count(*) from r where r.rating = s)) from generate_series(0, 5) s),
    'reviews', coalesce((select json_agg(json_build_object('rating', rating, 'comment', comment, 'created_at', created_at,
                 'event_title', event_title, 'start_date', start_date, 'first_name', first_name, 'photo_url', photo_url)
                 order by created_at desc) from (select * from r order by created_at desc limit 50) x), '[]'::json)
  )
$$;

-- 4. Console: link an event to a Xanadu space and/or Facilitator
create or replace function public.team_link_community_event(p_event uuid, p_space uuid, p_facilitator uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_team() then raise exception 'Team only'; end if;
  update public.community_events set space_id = p_space, facilitator_id = p_facilitator, updated_at = now() where id = p_event;
end $$;

create or replace function public.team_link_options()
returns json
language sql stable security definer set search_path = '' as $$
  select case when public.is_team() then json_build_object(
    'spaces', coalesce((select json_agg(json_build_object('id', s.id, 'name', s.name, 'town', s.town, 'approved', o.container_status = 'approved') order by s.name)
                        from public.spaces s join public.profiles o on o.id = s.owner_id), '[]'::json),
    'facilitators', coalesce((select json_agg(json_build_object('id', p.id, 'name', p.name, 'town', p.town, 'approved', p.facilitator_status = 'approved') order by p.name)
                        from public.profiles p where p.facilitator_status is not null), '[]'::json)
  ) else null end
$$;

grant execute on function public.event_going_counts(uuid[]) to authenticated;
grant execute on function public.event_attendees(uuid) to authenticated;
grant execute on function public.member_reviews(text, uuid) to authenticated;
grant execute on function public.team_link_community_event(uuid, uuid, uuid) to authenticated;
grant execute on function public.team_link_options() to authenticated;
revoke execute on function public.event_going_counts(uuid[]) from anon;
revoke execute on function public.event_attendees(uuid) from anon;
revoke execute on function public.member_reviews(text, uuid) from anon;
revoke execute on function public.team_link_community_event(uuid, uuid, uuid) from anon;
revoke execute on function public.team_link_options() from anon;
