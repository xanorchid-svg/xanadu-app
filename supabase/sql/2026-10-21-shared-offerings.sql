-- Oct 21, 2026: offerings shared between a Facilitator and a Container.
-- * offerings.space_id   where it's held (a Xanadu space); null when it's somewhere outside Xanadu
-- * offerings.facilitator_id  who leads it (an approved Facilitator), optional
-- * offerings.venue_name / venue_place  an outside venue, when space_id is null
-- owner_id stays the member who created it (and can edit it). No one has to accept being added,
-- but the space's host or the Facilitator can remove themselves (leave_offering).
-- A Facilitator holding something at an outside venue can invite that venue to Xanadu (invite_venue);
-- notify emails it, and the console shows "Referred by" when that venue applies.

-- 1. columns ------------------------------------------------------------------------------
alter table public.offerings add column if not exists space_id uuid references public.spaces (id) on delete set null;
alter table public.offerings add column if not exists facilitator_id uuid references public.profiles (id) on delete set null;
alter table public.offerings add column if not exists venue_name text not null default '';
alter table public.offerings add column if not exists venue_place text not null default '';
create index if not exists offerings_space_id_idx on public.offerings (space_id);
create index if not exists offerings_facilitator_id_idx on public.offerings (facilitator_id);

-- every existing offering is held at its creator's space
update public.offerings o set space_id = s.id
  from public.spaces s where s.owner_id = o.owner_id and o.space_id is null and o.venue_name = '';

-- 2. checks on links -------------------------------------------------------------------------
create or replace function public.guard_offering_links()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  -- a Container's own offering is held at their space unless they say otherwise
  if tg_op = 'INSERT' and new.space_id is null and coalesce(new.venue_name, '') = '' then
    select s.id into new.space_id from public.spaces s join public.profiles p on p.id = s.owner_id
     where s.owner_id = new.owner_id and p.container_status = 'approved' order by s.created_at limit 1;
  end if;
  if coalesce(auth.role(), '') = 'service_role' or current_user = 'postgres' then return new; end if;
  if new.space_id is not null and (tg_op = 'INSERT' or new.space_id is distinct from old.space_id) and not exists (
    select 1 from public.spaces s join public.profiles p on p.id = s.owner_id
     where s.id = new.space_id and p.container_status = 'approved') then
    raise exception 'That space isn’t on Xanadu yet.';
  end if;
  if new.facilitator_id is not null and (tg_op = 'INSERT' or new.facilitator_id is distinct from old.facilitator_id) and not exists (
    select 1 from public.profiles p where p.id = new.facilitator_id and p.facilitator_status = 'approved') then
    raise exception 'That Facilitator isn’t on Xanadu yet.';
  end if;
  if new.space_id is not null then new.venue_name := ''; new.venue_place := ''; end if;
  return new;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'offerings_links_guard') then
    create trigger offerings_links_guard before insert or update of space_id, facilitator_id, venue_name, venue_place
      on public.offerings for each row execute function public.guard_offering_links();
  end if;
end $$;

-- 3. tell the space's host and the Facilitator when they're added --------------------------------
create or replace function public.offering_links_notify()
returns trigger language plpgsql security definer set search_path to '' as $$
declare v_creator text; v_host uuid; v_space text;
begin
  select coalesce(nullif(s.name, ''), nullif(p.name, ''), 'A Xanadu member') into v_creator
    from public.profiles p left join public.spaces s on s.id = new.space_id and s.owner_id = p.id where p.id = new.owner_id;
  if new.space_id is not null and (tg_op = 'INSERT' or new.space_id is distinct from old.space_id) then
    select s.owner_id, s.name into v_host, v_space from public.spaces s where s.id = new.space_id;
    if v_host is not null and v_host <> new.owner_id then
      perform public.notify_member(v_host, 'offering_linked',
        v_creator || ' added an experience at ' || coalesce(nullif(v_space, ''), 'your space'),
        coalesce(nullif(new.title, ''), 'A new experience') || '. If it isn’t right, you can remove your space from it.',
        '/experience/' || new.id, true);
    end if;
  end if;
  if new.facilitator_id is not null and new.facilitator_id <> new.owner_id
     and (tg_op = 'INSERT' or new.facilitator_id is distinct from old.facilitator_id) then
    perform public.notify_member(new.facilitator_id, 'offering_linked',
      v_creator || ' added you to ' || coalesce(nullif(new.title, ''), 'an experience'),
      'You’re listed as the Facilitator leading it. If it isn’t right, you can remove yourself.',
      '/experience/' || new.id, true);
  end if;
  return null;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'offerings_links_notify') then
    create trigger offerings_links_notify after insert or update of space_id, facilitator_id
      on public.offerings for each row execute function public.offering_links_notify();
  end if;
end $$;

-- 4. who can create, edit and see ------------------------------------------------------------------
alter policy "offerings: insert own" on public.offerings with check (
  owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.container_status = 'approved' or p.facilitator_status = 'approved')));
alter policy "offerings: update own" on public.offerings using (
  owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.container_status = 'approved' or p.facilitator_status = 'approved')));
alter policy "offerings: read own or live" on public.offerings using (
  owner_id = (select auth.uid()) or status = 'live' or facilitator_id = (select auth.uid())
  or exists (select 1 from public.spaces s where s.id = offerings.space_id and s.owner_id = (select auth.uid())));

-- 5. remove myself ---------------------------------------------------------------------------
create or replace function public.leave_offering(p_offering uuid)
returns text language plpgsql security definer set search_path to '' as $$
declare o public.offerings; v_me uuid := auth.uid(); v_who text; v_left text;
begin
  select * into o from public.offerings where id = p_offering;
  if o.id is null then raise exception 'Experience not found'; end if;
  if o.owner_id = v_me then raise exception 'You created this experience. Edit or delete it instead.'; end if;
  if exists (select 1 from public.spaces s where s.id = o.space_id and s.owner_id = v_me) then
    select name into v_who from public.spaces where id = o.space_id;
    update public.offerings set space_id = null where id = p_offering;
    v_left := 'space';
  elsif o.facilitator_id = v_me then
    select name into v_who from public.profiles where id = v_me;
    update public.offerings set facilitator_id = null where id = p_offering;
    v_left := 'facilitator';
  else
    raise exception 'You’re not part of this experience.';
  end if;
  perform public.notify_member(o.owner_id, 'offering_left',
    coalesce(nullif(v_who, ''), 'A member') || case when v_left = 'space' then ' removed their space from ' else ' removed themselves from ' end
      || coalesce(nullif(o.title, ''), 'your experience'),
    case when v_left = 'space' then 'Choose another space, or add where it’s held, so Seekers know where to go.'
         else 'You can add another Facilitator from the experience.' end,
    '/experience/' || p_offering, true);
  return v_left;
end $$;
revoke all on function public.leave_offering(uuid) from public, anon;
grant execute on function public.leave_offering(uuid) to authenticated;

-- 6. invite an outside venue (referral) ----------------------------------------------------------------
create table if not exists public.venue_invites (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid references public.offerings (id) on delete set null,
  invited_by uuid references auth.users (id) on delete cascade,
  venue_name text not null default '',
  email text not null,
  status text not null default 'queued', -- queued, sent, failed
  error text,
  provider_id text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.venue_invites enable row level security; -- no policies: team functions and the service role only
create index if not exists venue_invites_email_idx on public.venue_invites (lower(email));
create index if not exists venue_invites_invited_by_idx on public.venue_invites (invited_by);
create index if not exists venue_invites_offering_idx on public.venue_invites (offering_id);

create or replace function public.invite_venue(p_offering uuid, p_email text)
returns void language plpgsql security definer set search_path to '' as $$
declare v_me uuid := auth.uid(); o public.offerings; v_email text := lower(trim(coalesce(p_email, ''))); v_id uuid;
begin
  select * into o from public.offerings where id = p_offering;
  if o.id is null or o.owner_id <> v_me then raise exception 'Only the person who created this experience can invite its venue.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'That email address doesn’t look right.'; end if;
  if (select count(*) from public.venue_invites where invited_by = v_me and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You’ve sent a lot of invites today. Try again tomorrow.';
  end if;
  if exists (select 1 from public.venue_invites where lower(email) = v_email and created_at > now() - interval '30 days') then
    return; -- already invited recently: don't email them twice
  end if;
  insert into public.venue_invites (offering_id, invited_by, venue_name, email) values (p_offering, v_me, o.venue_name, v_email) returning id into v_id;
  perform net.http_post(url := 'https://gutqzqxybcnnpwfbkjsq.supabase.co/functions/v1/notify',
    body := jsonb_build_object('invite', v_id), headers := '{"Content-Type": "application/json"}'::jsonb);
end $$;
revoke all on function public.invite_venue(uuid, text) from public, anon;
grant execute on function public.invite_venue(uuid, text) to authenticated;

-- 7. declined hosts ---------------------------------------------------------------------------
create or replace function public.decline_offerings_of_declined_host()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if new.container_status = 'declined' and old.container_status is distinct from 'declined' then
    update public.offerings set status = 'declined', updated_at = now()
     where owner_id = new.id and status <> 'declined' and coalesce(new.facilitator_status, '') <> 'approved';
    update public.offerings set space_id = null where space_id in (select id from public.spaces where owner_id = new.id) and owner_id <> new.id;
  end if;
  return new;
end $$;

create or replace function public.decline_offerings_of_declined_facilitator()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if new.facilitator_status = 'declined' and old.facilitator_status is distinct from 'declined' then
    update public.offerings set status = 'declined', updated_at = now()
     where owner_id = new.id and status <> 'declined' and coalesce(new.container_status, '') <> 'approved';
    update public.offerings set facilitator_id = null where facilitator_id = new.id;
  end if;
  return new;
end $$;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'profiles_decline_facilitator_offerings') then
    create trigger profiles_decline_facilitator_offerings after update of facilitator_status on public.profiles
      for each row execute function public.decline_offerings_of_declined_facilitator();
  end if;
end $$;

-- 8. matching and notifications follow space_id -----------------------------------------------------
create or replace function public.match_scored(p_user uuid)
returns table(kind text, id uuid, title text, town text, photo_url text, matched text[], sim double precision, score double precision)
language sql stable security definer set search_path to '' as $$
  with me as (
    select v.embedding, v.keywords from public.match_vectors v where v.kind = 'seeker' and v.ref_id = p_user
  ), mine as (
    select coalesce(p.lifestyle, '{}') as lifestyle from public.profiles p where p.id = p_user
  ), cands as (
    select 'space'::text as kind, s.id, s.name as title, s.town, coalesce(s.photos[1], '') as photo_url,
           coalesce(v.keywords, '{}') as keywords, v.embedding,
           coalesce(s.lifestyle, '{}') || case when s.volunteer_exchange then array['Volunteer exchange'] else '{}'::text[] end as lifestyle
    from public.spaces s
    join public.profiles p on p.id = s.owner_id and p.container_status = 'approved'
    left join public.match_vectors v on v.kind = 'space' and v.ref_id = s.id
    where s.owner_id <> coalesce(p_user, '00000000-0000-0000-0000-000000000000'::uuid)
    union all
    select 'offering', o.id, o.title, coalesce(s.town, ''), coalesce(nullif(o.cover_url, ''), s.photos[1], ''), coalesce(v.keywords, '{}'), v.embedding,
           array(select unnest(coalesce(s.lifestyle, '{}')) except select unnest(array['A class or session','Weekly or monthly sessions','A weekend','1–3 weeks','A month or more','A season','Community living']))
             || public.offering_tags(o.format, o.start_date, o.end_date, o.volunteer_exchange)
    from public.offerings o
    join public.profiles p on p.id = o.owner_id and (p.container_status = 'approved' or p.facilitator_status = 'approved')
    left join public.spaces s on s.id = o.space_id
    left join public.match_vectors v on v.kind = 'offering' and v.ref_id = o.id
    where o.status = 'live'
      and coalesce(p_user, '00000000-0000-0000-0000-000000000000'::uuid) not in (o.owner_id, coalesce(o.facilitator_id, o.owner_id), coalesce(s.owner_id, o.owner_id))
  ), scored as (
    select c.kind, c.id, c.title, c.town, c.photo_url,
      array(select unnest(c.keywords) intersect select unnest(coalesce(me.keywords, '{}'))
            union select unnest(c.lifestyle) intersect select unnest(mine.lifestyle)) as matched,
      cardinality(array(select unnest(c.lifestyle) intersect select unnest(mine.lifestyle))) as life,
      coalesce(1 - (c.embedding operator(extensions.<=>) me.embedding), 0) as sim
    from cands c cross join mine left join me on true
  )
  select kind, id, title, town, photo_url, matched, sim,
         sim + 0.06 * cardinality(matched) + 0.04 * life + case when 'Volunteer exchange' = any(matched) then 0.2 else 0 end as score
  from scored
$$;
revoke all on function public.match_scored(uuid) from public, anon, authenticated;

create or replace function public.notify_matches_for(p_kind text, p_ref uuid)
returns integer language plpgsql security definer set search_path to '' as $$
declare v_title text; v_town text; v_life text[]; v_kw text[]; v_emb extensions.vector; v_owner uuid; v_others uuid[] := '{}'; n int := 0; r record;
begin
  if p_kind = 'offering' then
    select o.title, coalesce(s.town, ''),
           array(select unnest(coalesce(s.lifestyle, '{}')) except select unnest(array['A class or session','Weekly or monthly sessions','A weekend','1–3 weeks','A month or more','A season','Community living']))
             || public.offering_tags(o.format, o.start_date, o.end_date, o.volunteer_exchange),
           o.owner_id, array_remove(array[o.facilitator_id, s.owner_id], null)
      into v_title, v_town, v_life, v_owner, v_others
      from public.offerings o left join public.spaces s on s.id = o.space_id where o.id = p_ref and o.status = 'live';
  else
    select s.name, coalesce(s.town, ''),
           coalesce(s.lifestyle, '{}') || case when s.volunteer_exchange then array['Volunteer exchange'] else '{}'::text[] end,
           s.owner_id
      into v_title, v_town, v_life, v_owner
      from public.spaces s join public.profiles p on p.id = s.owner_id and p.container_status = 'approved' where s.id = p_ref;
  end if;
  if v_title is null then return 0; end if;
  select v.keywords, v.embedding into v_kw, v_emb from public.match_vectors v where v.kind = p_kind and v.ref_id = p_ref;
  if v_emb is null then return 0; end if;

  for r in
    select p.id,
           1 - (v_emb operator(extensions.<=>) sv.embedding) as sim,
           cardinality(array(select unnest(v_kw) intersect select unnest(sv.keywords))) as kw,
           cardinality(array(select unnest(v_life) intersect select unnest(coalesce(p.lifestyle, '{}')))) as life
      from public.profiles p
      join public.match_vectors sv on sv.kind = 'seeker' and sv.ref_id = p.id
     where p.role = 'seeker' and p.onboarded and p.notify and p.id <> v_owner and not (p.id = any(v_others))
       and not exists (select 1 from public.notifications nn where nn.user_id = p.id and nn.group_key = 'match:' || p_ref)
  loop
    if r.sim > 0.82 or (r.sim > 0.76 and r.kw + r.life >= 2) or r.kw + r.life >= 3 then
      perform public.notify_member(r.id, 'match',
        case when p_kind = 'offering' then 'A new experience aligned with you' else 'A new place aligned with you' end,
        v_title || case when v_town <> '' then ' · ' || v_town else '' end,
        case when p_kind = 'offering' then '/experience/' || p_ref else '/space/' || p_ref end,
        true, 'match:' || p_ref);
      n := n + 1;
      exit when n >= 300;
    end if;
  end loop;
  return n;
end $$;

-- 9. console ------------------------------------------------------------------------------------
create or replace function public.team_list_offerings()
returns json language plpgsql stable security definer set search_path to '' as $$
declare r json;
begin
  perform public.team_require();
  select coalesce(json_agg(x order by x.updated_at desc), '[]'::json) into r from (
    select o.*, coalesce(nullif(cs.name, ''), p.name) as host_name, coalesce(case when cs.id is not null then p.container_status else p.facilitator_status end, p.status) as host_status,
           u.email::text as host_email, coalesce(nullif(p.photo_url, ''), (cs.photos)[1]) as host_photo,
           case when cs.id is not null then 'container' else 'facilitator' end as created_as,
           s.name as space_name, s.country as space_country, s.region as space_region, s.town as space_town,
           f.name as facilitator_name, f.photo_url as facilitator_photo,
           coalesce(nullif(o.cover_url, ''), (s.photos)[1]) as cover
      from public.offerings o
      join public.profiles p on p.id = o.owner_id
      join auth.users u on u.id = o.owner_id
      left join public.spaces s on s.id = o.space_id
      left join public.spaces cs on cs.id = o.space_id and cs.owner_id = o.owner_id
      left join public.profiles f on f.id = o.facilitator_id
     where o.status <> 'draft'
  ) x;
  return r;
end $$;

create or replace function public.team_review_offering(p_offering uuid, p_decision text, p_message text default ''::text)
returns json language plpgsql security definer set search_path to '' as $$
declare v_owner uuid; v_title text; v_status text; v_msg text := coalesce(trim(p_message), ''); v_edit text; o public.offerings;
begin
  perform public.team_require();
  select * into o from public.offerings where id = p_offering;
  v_owner := o.owner_id; v_title := o.title;
  if v_owner is null then raise exception 'offering not found'; end if;
  v_status := case p_decision when 'live' then 'live' when 'changes' then 'declined' when 'review' then 'in_review' end;
  if v_status is null then raise exception 'unknown decision %', p_decision; end if;
  update public.offerings set status = v_status where id = p_offering;
  if v_msg <> '' then
    insert into public.messages (user_id, from_team, body) values (v_owner, true, v_msg);
  end if;
  perform public.team_log(case p_decision when 'live' then 'offering_live' when 'changes' then 'offering_needs_changes' else 'offering_back_in_review' end,
    'offering', p_offering::text, v_title);
  -- the edit screen is the creator's: their space's offering list, or the Facilitator's
  v_edit := case when exists (select 1 from public.spaces s where s.id = o.space_id and s.owner_id = v_owner)
                   or (o.space_id is null and exists (select 1 from public.profiles p where p.id = v_owner and p.container_status = 'approved' and coalesce(p.facilitator_status, '') <> 'approved'))
                 then '/container/offering?id=' else '/facilitator/offering?id=' end;
  if p_decision = 'live' then
    perform public.notify_member(v_owner, 'offering_live', coalesce(nullif(v_title, ''), 'Your experience') || ' is live',
      coalesce(nullif(v_msg, ''), 'Seekers aligned with it will start seeing it first.'), '/experience/' || p_offering, true);
    perform public.notify_matches_for('offering', p_offering);
  elsif p_decision = 'changes' then
    perform public.notify_member(v_owner, 'offering_changes', 'Changes requested for ' || coalesce(nullif(v_title, ''), 'your experience'),
      coalesce(nullif(v_msg, ''), 'Open your messages to see what to update.'), v_edit || p_offering, true);
  end if;
  return json_build_object('status', v_status);
end $$;

-- applications show who referred a venue (a Facilitator invited them by email)
create or replace function public.team_list_applications()
returns json language plpgsql stable security definer set search_path to '' as $$
declare r json;
begin
  perform public.team_require();
  select coalesce(json_agg(a order by a.fast_track desc, a.submitted desc nulls last), '[]'::json) into r from (
    select p.id, p.id::text || ':' || x.app_role as key, x.app_role as role, x.app_status as status,
           not (p.role = x.app_role and not p.onboarded) as onboarded,
           p.name, u.email::text as email, p.photo_url, p.town, p.region,
           p.practices, p.about, p.languages, p.trainings, p.lifestyle, p.heard_from, p.created_at,
           greatest(p.updated_at, d.updated_at, s.updated_at) as submitted, u.last_sign_in_at,
           d.phone, d.proof, d.references_list, d.insurance, coalesce(d.agreed_guidelines, false) as agreed_guidelines,
           case when s.id is null then null else json_build_object(
             'id', s.id, 'name', s.name, 'country', s.country, 'region', s.region, 'town', s.town, 'about', s.about,
             'practices', s.practices, 'lifestyle', s.lifestyle, 'photos', s.photos, 'sleeps', s.sleeps, 'rooms', s.rooms,
             'mats', s.mats, 'kitchen', s.kitchen, 'getting_here', s.getting_here,
             'volunteer_exchange', s.volunteer_exchange, 'volunteer_details', s.volunteer_details) end as space,
           (select count(*) from public.offerings o where o.owner_id = p.id) as offerings,
           (select json_build_object('at', m.created_at, 'from_team', m.from_team) from public.messages m
             where m.user_id = p.id order by m.created_at desc limit 1) as last_message,
           (x.app_status = 'pending' and (case x.app_role when 'container' then p.facilitator_status else p.container_status end) = 'approved') as fast_track,
           case x.app_role when 'container' then p.facilitator_status else p.container_status end as other_status,
           case when x.app_role = 'container' then (
             select json_build_object('name', rp.name, 'id', rp.id, 'facilitator_approved', rp.facilitator_status = 'approved', 'venue', vi.venue_name, 'at', vi.created_at)
               from public.venue_invites vi join public.profiles rp on rp.id = vi.invited_by
              where lower(vi.email) = lower(u.email) order by vi.created_at limit 1) end as referred_by
      from public.profiles p
      cross join lateral (values ('container', p.container_status), ('facilitator', p.facilitator_status)) x(app_role, app_status)
      join auth.users u on u.id = p.id
      left join public.private_details d on d.user_id = p.id
      left join lateral (select * from public.spaces sp where sp.owner_id = p.id order by sp.created_at limit 1) s on true
     where x.app_status is not null
  ) a;
  return r;
end $$;

-- 10. offering changes also refresh matching for the space's host's listing (owner already queued)
-- (match-embed re-reads every offering a host created or that's held at their space)
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'offerings_match_refresh_links') then
    create trigger offerings_match_refresh_links after update of space_id, facilitator_id, cover_url
      on public.offerings for each row execute function public.match_refresh_trigger();
  end if;
end $$;

-- Oct 21 fix: run as the member (security invoker), or the bypass check is always true and the link checks never run.
alter function public.guard_offering_links() security invoker;
