-- Oct 21, 2026: matching that keeps itself up to date, and scores for every experience.
-- 1. match_queue: any change to a space or offering queues its owner and asks match-embed to re-read it
--    (match-embed only acts on owners that are in the queue, like notify only sends what's queued).
-- 2. match_scored(): one scoring function behind my_matches (top 20, unchanged signature) and
--    my_match_scores (every candidate, for Discover's "Best match" sort).
--    Experiences now also carry their length ("A weekend", "1–3 weeks", …) as way-of-living tags,
--    and candidates without a meaning vector yet still score on shared way-of-living choices.

create table if not exists public.match_queue (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  queued_at timestamptz not null default now()
);
alter table public.match_queue enable row level security; -- no policies: service role only

create or replace function public.queue_match_refresh(p_owner uuid)
returns void language plpgsql security definer set search_path to '' as $$
begin
  if p_owner is null then return; end if;
  insert into public.match_queue (owner_id) values (p_owner)
    on conflict (owner_id) do update set queued_at = now();
  perform net.http_post(
    url := 'https://gutqzqxybcnnpwfbkjsq.supabase.co/functions/v1/match-embed',
    body := jsonb_build_object('queued', p_owner),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
end $$;
revoke all on function public.queue_match_refresh(uuid) from public, anon, authenticated;

create or replace function public.match_refresh_trigger()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  perform public.queue_match_refresh(coalesce(new.owner_id, old.owner_id));
  return null;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'offerings_match_refresh') then
    create trigger offerings_match_refresh after insert or update of title, format, practices, description, start_date, end_date, price_usd, volunteer_exchange, volunteer_details
      on public.offerings for each row execute function public.match_refresh_trigger();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'spaces_match_refresh') then
    create trigger spaces_match_refresh after insert or update of name, country, region, town, about, practices, lifestyle, volunteer_exchange, volunteer_details
      on public.spaces for each row execute function public.match_refresh_trigger();
  end if;
end $$;

-- way-of-living tags an experience carries, from its format and length
create or replace function public.offering_tags(p_format text, p_start date, p_end date, p_volunteer boolean)
returns text[] language sql immutable set search_path to '' as $$
  select array_remove(array[
    case when p_format = 'Drop-in' then 'A class or session' end,
    case when p_volunteer then 'Volunteer exchange' end,
    case when p_start is null then null
         when (coalesce(p_end, p_start) - p_start + 1) between 2 and 3 then 'A weekend'
         when (coalesce(p_end, p_start) - p_start + 1) between 4 and 21 then '1–3 weeks'
         when (coalesce(p_end, p_start) - p_start + 1) between 22 and 60 then 'A month or more'
         when (coalesce(p_end, p_start) - p_start + 1) > 60 then 'A season' end
  ], null)
$$;

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
    select 'offering', o.id, o.title, coalesce(s.town, ''), coalesce(s.photos[1], ''), coalesce(v.keywords, '{}'), v.embedding,
           array(select unnest(coalesce(s.lifestyle, '{}')) except select unnest(array['A class or session','Weekly or monthly sessions','A weekend','1–3 weeks','A month or more','A season','Community living']))
             || public.offering_tags(o.format, o.start_date, o.end_date, o.volunteer_exchange)
    from public.offerings o
    join public.profiles p on p.id = o.owner_id and p.container_status = 'approved'
    left join public.spaces s on s.owner_id = o.owner_id
    left join public.match_vectors v on v.kind = 'offering' and v.ref_id = o.id
    where o.status = 'live' and o.owner_id <> coalesce(p_user, '00000000-0000-0000-0000-000000000000'::uuid)
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

create or replace function public.my_matches(match_count integer default 6)
returns table(kind text, id uuid, title text, town text, photo_url text, matched text[], score double precision)
language sql stable security definer set search_path to '' as $$
  select m.kind, m.id, m.title, m.town, m.photo_url, m.matched, m.score
  from public.match_scored(auth.uid()) m
  where m.sim > 0.78 or cardinality(m.matched) > 0
  order by m.score desc
  limit least(greatest(match_count, 1), 20)
$$;

create or replace function public.my_match_scores()
returns table(kind text, id uuid, score double precision)
language sql stable security definer set search_path to '' as $$
  select m.kind, m.id, m.score from public.match_scored(auth.uid()) m where auth.uid() is not null
$$;
revoke all on function public.my_match_scores() from public, anon;
grant execute on function public.my_match_scores() to authenticated;

-- Offerings get their own photo (falls back to the space's main photo); my_matches uses it.
alter table public.offerings add column if not exists cover_url text not null default '';
-- match_scored was re-applied with: coalesce(nullif(o.cover_url, ''), s.photos[1], '') as the offering photo.
