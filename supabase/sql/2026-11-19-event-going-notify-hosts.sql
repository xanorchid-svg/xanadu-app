-- Applied Nov 19, 2026 (migration event_going_notify_hosts).
-- When a seeker says "I'm going", tell the hosts behind the event: the approved Container or Facilitator
-- who posted it, the Facilitator leading it (facilitator_id) and the owner of the space it's at (space_id).
-- One notification per event per host (group key 'going:<event id>'), updated with the running count,
-- pushed to their phone and shown in the bell. No email. The seeker's first name is shown only if they
-- share their profile in Community; otherwise "A seeker".
create or replace function public.event_going_notify()
returns trigger language plpgsql security definer set search_path to '' as $$
declare
  e public.community_events%rowtype;
  v_who text; v_count int; v_host uuid;
  v_hosts uuid[] := '{}';
begin
  select * into e from public.community_events where id = new.event_id;
  if e.id is null or e.status <> 'live' then return null; end if;
  if e.submitted_by is not null and exists (select 1 from public.profiles p where p.id = e.submitted_by
       and (p.container_status = 'approved' or p.facilitator_status = 'approved')) then
    v_hosts := v_hosts || e.submitted_by;
  end if;
  if e.facilitator_id is not null and exists (select 1 from public.profiles p where p.id = e.facilitator_id and p.facilitator_status = 'approved') then
    v_hosts := v_hosts || e.facilitator_id;
  end if;
  if e.space_id is not null then
    select s.owner_id into v_host from public.spaces s join public.profiles o on o.id = s.owner_id
     where s.id = e.space_id and o.container_status = 'approved';
    if v_host is not null then v_hosts := v_hosts || v_host; end if;
  end if;
  if cardinality(v_hosts) = 0 then return null; end if;
  select count(*) into v_count from public.event_going where event_id = new.event_id;
  select case when public.in_community(p.id) and nullif(trim(p.name), '') is not null
              then split_part(trim(p.name), ' ', 1) else 'A seeker' end
    into v_who from public.profiles p where p.id = new.user_id;
  for v_host in select distinct unnest(v_hosts) loop
    continue when v_host = new.user_id;
    perform public.notify_member(v_host, 'event_going',
      coalesce(v_who, 'A seeker') || ' is going to ' || left(coalesce(nullif(e.title, ''), 'your event'), 80),
      case when v_count > 1 then v_count || ' people from Xanadu are going so far.' else 'The first from Xanadu to say they’re going.' end,
      '/event/' || e.id, false, 'going:' || e.id);
  end loop;
  return null;
end $$;
revoke all on function public.event_going_notify() from public, anon, authenticated;
drop trigger if exists event_going_notify on public.event_going;
create trigger event_going_notify after insert on public.event_going
  for each row execute function public.event_going_notify();
