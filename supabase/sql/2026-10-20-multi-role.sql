-- Multi-role accounts, new "ways to take part", volunteer work on offerings, AI import usage.
-- Additive only: new columns, new tables, new functions, create-or-replace and alter policy. Nothing is dropped.

-- 1. One account, several roles. profiles.role is the hat the member is wearing now;
--    container_status / facilitator_status hold each role's own review status (null = never applied).
alter table public.profiles
  add column if not exists container_status text check (container_status in ('pending','approved','declined')),
  add column if not exists facilitator_status text check (facilitator_status in ('pending','approved','declined')),
  add column if not exists prev_role text check (prev_role in ('seeker','container','facilitator'));

update public.profiles set container_status = case when status in ('pending','approved','declined') then status else 'pending' end
 where role = 'container' and container_status is null;
update public.profiles set facilitator_status = case when status in ('pending','approved','declined') then status else 'pending' end
 where role = 'facilitator' and facilitator_status is null;

-- 2. Members can't change roles or statuses themselves (only the functions below and the team can).
create or replace function public.guard_profile()
 returns trigger language plpgsql set search_path to '' as $function$
begin
  if coalesce(auth.role(), '') = 'service_role' or current_user = 'postgres' then return new; end if;
  if tg_op = 'UPDATE' then
    -- the role can only be re-picked during the very first setup (not after, and not while adding a role)
    if (old.onboarded or old.prev_role is not null) and new.role is distinct from old.role then new.role := old.role; end if;
    if new.role is distinct from old.role then
      new.status := case when new.role = 'seeker' then 'active' else 'pending' end;
      new.container_status := case when new.role = 'container' then 'pending' end;
      new.facilitator_status := case when new.role = 'facilitator' then 'pending' end;
    else
      new.status := old.status;
      new.container_status := old.container_status;
      new.facilitator_status := old.facilitator_status;
    end if;
    new.prev_role := case when new.onboarded and not old.onboarded then null else old.prev_role end;
    new.id := old.id;
    new.community_removed := old.community_removed;
  else
    new.community_removed := false;
  end if;
  return new;
end $function$;

create or replace function public.handle_new_user()
 returns trigger language plpgsql security definer set search_path to '' as $function$
declare r text := coalesce(new.raw_user_meta_data->>'role', 'seeker');
begin
  if r not in ('seeker','container','facilitator') then r := 'seeker'; end if;
  insert into public.profiles (id, role, status, name, container_status, facilitator_status)
  values (new.id, r, case when r = 'seeker' then 'active' else 'pending' end,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
          case when r = 'container' then 'pending' end, case when r = 'facilitator' then 'pending' end)
  on conflict (id) do nothing;
  if r = 'seeker' then
    insert into public.messages (user_id, from_team, body) values
      (new.id, true, 'Welcome to Xanadu. We''re so glad you''re one of our founding Seekers.'),
      (new.id, true, 'When you request a spot on an experience, we''ll reply right here with next steps.'),
      (new.id, true, 'Questions? Reply here anytime, or write to networkxanadu@gmail.com.');
  else
    insert into public.messages (user_id, from_team, body) values
      (new.id, true, 'Welcome to Xanadu. We''re so glad you''re one of our founding members.'),
      (new.id, true, 'Here''s how it works: as spaces and facilitators join, we''ll introduce you to the ones aligned with your work. Every intro lands right here in your inbox.'),
      (new.id, true, 'Questions? Reply here anytime, or write to networkxanadu@gmail.com.');
  end if;
  return new;
end $function$;

-- Is this member an approved Container / Facilitator?
create or replace function public.has_role(u uuid, r text)
 returns boolean language sql stable security definer set search_path to '' as $function$
  select exists (select 1 from public.profiles p where p.id = u and
    case r when 'container' then p.container_status = 'approved' when 'facilitator' then p.facilitator_status = 'approved' else false end)
$function$;

-- Change which hat you're wearing. Everyone can be a Seeker; hosting roles need an application.
create or replace function public.switch_role(p_role text)
 returns text language plpgsql security definer set search_path to '' as $function$
declare me public.profiles;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.id is null then raise exception 'Please sign in again.'; end if;
  if not me.onboarded then raise exception 'Finish setting up first.'; end if;
  if p_role = 'seeker' then
    update public.profiles set role = 'seeker', status = 'active' where id = me.id;
  elsif p_role = 'container' and me.container_status is not null then
    update public.profiles set role = 'container', status = me.container_status where id = me.id;
  elsif p_role = 'facilitator' and me.facilitator_status is not null then
    update public.profiles set role = 'facilitator', status = me.facilitator_status where id = me.id;
  else
    raise exception 'You don''t have that role yet.';
  end if;
  return p_role;
end $function$;

-- Start applying for another role on the same account. Returns 'setup' (go to /welcome) or 'switched'.
create or replace function public.add_role(p_role text)
 returns text language plpgsql security definer set search_path to '' as $function$
declare me public.profiles; cur text;
begin
  if p_role not in ('container','facilitator') then raise exception 'Unknown role.'; end if;
  select * into me from public.profiles where id = auth.uid();
  if me.id is null then raise exception 'Please sign in again.'; end if;
  if not me.onboarded then raise exception 'Finish setting up your current profile first.'; end if;
  cur := case p_role when 'container' then me.container_status else me.facilitator_status end;
  if cur in ('pending','approved') then
    perform public.switch_role(p_role);
    return 'switched';
  end if;
  update public.profiles set
    prev_role = me.role, role = p_role, status = 'pending', onboarded = false,
    container_status = case when p_role = 'container' then 'pending' else container_status end,
    facilitator_status = case when p_role = 'facilitator' then 'pending' else facilitator_status end
   where id = me.id;
  return 'setup';
end $function$;

-- Changed your mind half way through adding a role: back to where you were.
create or replace function public.cancel_add_role()
 returns text language plpgsql security definer set search_path to '' as $function$
declare me public.profiles;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.id is null or me.onboarded or me.prev_role is null then return coalesce(me.role, 'seeker'); end if;
  update public.profiles set
    container_status = case when me.role = 'container' then null else container_status end,
    facilitator_status = case when me.role = 'facilitator' then null else facilitator_status end,
    role = me.prev_role,
    status = case me.prev_role when 'seeker' then 'active' when 'container' then coalesce(me.container_status, 'pending') else coalesce(me.facilitator_status, 'pending') end,
    onboarded = true, prev_role = null
   where id = me.id;
  return me.prev_role;
end $function$;

grant execute on function public.switch_role(text), public.add_role(text), public.cancel_add_role() to authenticated;
revoke execute on function public.switch_role(text), public.add_role(text), public.cancel_add_role() from anon;

-- 3. Visibility now follows each role's own approval, whichever hat the member is wearing.
alter policy "profiles: read own or approved hosts" on public.profiles
  using ((id = (select auth.uid())) or container_status = 'approved' or facilitator_status = 'approved');
alter policy "spaces: read own or approved" on public.spaces
  using ((owner_id = (select auth.uid())) or exists (select 1 from public.profiles p where p.id = spaces.owner_id and p.container_status = 'approved'));
alter policy "spaces: insert own" on public.spaces
  with check ((owner_id = (select auth.uid())) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.container_status is not null));
alter policy "offerings: insert own" on public.offerings
  with check ((owner_id = (select auth.uid())) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.container_status is not null));

create or replace function public.in_community(u uuid)
 returns boolean language sql stable security definer set search_path to '' as $function$
  select exists (select 1 from public.profiles p where p.id = u and p.community_visible and p.onboarded and not p.community_removed
                 and (p.role = 'seeker' or p.facilitator_status = 'approved'))
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.community_visible and not me.community_removed)
$function$;

create or replace function public.start_thread(p_recipient uuid, p_body text, p_space uuid default null::uuid, p_offering uuid default null::uuid)
 returns uuid language plpgsql security definer set search_path to '' as $function$
declare me public.profiles; them public.profiles; v_thread uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in again.'; end if;
  if coalesce(trim(p_body), '') = '' then raise exception 'Write a message first.'; end if;
  select * into me from public.profiles where id = auth.uid();
  select * into them from public.profiles where id = p_recipient;
  if them.id is null or them.id = me.id then raise exception 'This member isn''t available.'; end if;
  if public.is_blocked(me.id, them.id) then raise exception 'You can''t message this member.'; end if;

  select id into v_thread from public.threads
   where least(starter, recipient) = least(me.id, them.id) and greatest(starter, recipient) = greatest(me.id, them.id);

  if v_thread is null then
    if not me.onboarded then raise exception 'Finish setting up your account first.'; end if;
    -- coalesce: a role nobody applied for is null, and null must never count as "allowed"
    if not coalesce(
      (me.role = 'seeker' and (them.container_status = 'approved' or them.facilitator_status = 'approved'))
      or (me.facilitator_status = 'approved' and them.container_status = 'approved')
      or (me.container_status = 'approved' and them.facilitator_status = 'approved'), false
    ) then
      raise exception '%', case when me.role <> 'seeker' and coalesce(me.container_status, '') <> 'approved' and coalesce(me.facilitator_status, '') <> 'approved'
        then 'You can message other members once Xanadu has approved your profile.'
        else 'This member isn''t taking messages yet.' end;
    end if;
    insert into public.threads (starter, recipient, space_id, offering_id) values (me.id, them.id, p_space, p_offering)
      returning id into v_thread;
  end if;

  insert into public.thread_messages (thread_id, sender, body) values (v_thread, me.id, left(trim(p_body), 4000));
  return v_thread;
end $function$;

create or replace function public.my_threads()
 returns table(id uuid, other_id uuid, name text, photo_url text, role text, status text, space_id uuid, space_name text, offering_title text, last_body text, last_sender uuid, last_at timestamp with time zone, unread boolean, blocked boolean)
 language sql stable security definer set search_path to '' as $function$
  select t.id, o.id, coalesce(nullif(os.name, ''), o.name), coalesce(nullif(o.photo_url, ''), (os.photos)[1]), o.role, o.status,
         t.space_id, s.name, off.title, m.body, m.sender, t.last_at,
         (m.sender is not null and m.sender <> auth.uid() and m.created_at > coalesce(case when t.starter = auth.uid() then t.starter_read_at else t.recipient_read_at end, '-infinity')),
         public.is_blocked(t.starter, t.recipient)
    from public.threads t
    join public.profiles o on o.id = case when t.starter = auth.uid() then t.recipient else t.starter end
    left join lateral (select sp.name, sp.photos from public.spaces sp where sp.owner_id = o.id and o.container_status is not null
                        and coalesce(o.facilitator_status, '') <> 'approved' order by sp.created_at limit 1) os on true
    left join public.spaces s on s.id = t.space_id
    left join public.offerings off on off.id = t.offering_id
    left join lateral (select tm.body, tm.sender, tm.created_at from public.thread_messages tm where tm.thread_id = t.id order by tm.created_at desc limit 1) m on true
   where auth.uid() in (t.starter, t.recipient)
   order by t.last_at desc
$function$;

create or replace function public.on_thread_message()
 returns trigger language plpgsql security definer set search_path to '' as $function$
declare t public.threads; v_to uuid; v_from text; v_email boolean;
begin
  update public.threads set last_at = new.created_at,
    starter_read_at = case when starter = new.sender then new.created_at else starter_read_at end,
    recipient_read_at = case when recipient = new.sender then new.created_at else recipient_read_at end
  where id = new.thread_id returning * into t;
  v_to := case when t.starter = new.sender then t.recipient else t.starter end;
  select coalesce(nullif((select s.name from public.spaces s where s.owner_id = p.id and p.container_status is not null
                            and coalesce(p.facilitator_status, '') <> 'approved' order by s.created_at limit 1), ''),
                  nullif(split_part(trim(p.name), ' ', 1), ''), 'A Xanadu member')
    into v_from from public.profiles p where p.id = new.sender;
  select coalesce(p.email_messages, true) and not exists (
           select 1 from public.notifications n where n.user_id = v_to and n.group_key = 'thread:' || t.id
              and n.email and n.created_at > now() - interval '3 hours')
    into v_email from public.profiles p where p.id = v_to;
  perform public.notify_member(v_to, 'message', 'New message from ' || v_from, new.body, '/messages/' || t.id, coalesce(v_email, false), 'thread:' || t.id);
  return new;
end $function$;

-- 4. Volunteer work on offerings
alter table public.offerings
  add column if not exists volunteer_exchange boolean not null default false,
  add column if not exists volunteer_details text not null default '';

-- 5. Ways to take part (same words for Seekers and spaces): rename the two that changed
update public.profiles set lifestyle = array_replace(array_replace(lifestyle, 'A week or two', '1–3 weeks'), 'To live there', 'Community living')
 where lifestyle && array['A week or two', 'To live there'];
update public.spaces set lifestyle = array_replace(array_replace(lifestyle, 'A week or two', '1–3 weeks'), 'To live there', 'Community living')
 where lifestyle && array['A week or two', 'To live there'];

-- Matching: approved spaces by their own approval; offerings carry volunteer work and drop-in classes into the overlap
create or replace function public.my_matches(match_count integer default 6)
 returns table(kind text, id uuid, title text, town text, photo_url text, matched text[], score double precision)
 language sql stable security definer set search_path to '' as $function$
  with me as (
    select v.embedding, v.keywords from public.match_vectors v where v.kind = 'seeker' and v.ref_id = auth.uid()
  ), mine as (
    select coalesce(p.lifestyle, '{}') as lifestyle from public.profiles p where p.id = auth.uid()
  ), cands as (
    select 'space'::text as kind, s.id, s.name as title, s.town, coalesce(s.photos[1], '') as photo_url, v.keywords, v.embedding,
           coalesce(s.lifestyle, '{}') || case when s.volunteer_exchange then array['Volunteer exchange'] else '{}'::text[] end as lifestyle
    from public.spaces s
    join public.profiles p on p.id = s.owner_id and p.container_status = 'approved'
    join public.match_vectors v on v.kind = 'space' and v.ref_id = s.id
    where s.owner_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    union all
    select 'offering', o.id, o.title, coalesce(s.town, ''), coalesce(s.photos[1], ''), v.keywords, v.embedding,
           coalesce(s.lifestyle, '{}')
             || case when o.volunteer_exchange then array['Volunteer exchange'] else '{}'::text[] end
             || case when o.format = 'Drop-in' then array['A class or session'] else '{}'::text[] end
    from public.offerings o
    left join public.spaces s on s.owner_id = o.owner_id
    join public.match_vectors v on v.kind = 'offering' and v.ref_id = o.id
    where o.status = 'live' and o.owner_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  ), scored as (
    select c.kind, c.id, c.title, c.town, c.photo_url,
      array(select unnest(c.keywords) intersect select unnest(me.keywords)
            union select unnest(c.lifestyle) intersect select unnest(mine.lifestyle)) as matched,
      cardinality(array(select unnest(c.lifestyle) intersect select unnest(mine.lifestyle))) as life,
      coalesce(1 - (c.embedding operator(extensions.<=>) me.embedding), 0) as sim
    from cands c cross join me cross join mine
  )
  select kind, id, title, town, photo_url, matched,
         sim + 0.06 * cardinality(matched) + 0.04 * life + case when 'Volunteer exchange' = any(matched) then 0.2 else 0 end as score
  from scored
  where sim > 0.78 or cardinality(matched) > 0
  order by score desc
  limit least(greatest(match_count, 1), 20)
$function$;

create or replace function public.notify_matches_for(p_kind text, p_ref uuid)
 returns integer language plpgsql security definer set search_path to '' as $function$
declare v_title text; v_town text; v_life text[]; v_kw text[]; v_emb extensions.vector; v_owner uuid; n int := 0; r record;
begin
  if p_kind = 'offering' then
    select o.title, coalesce(s.town, ''),
           coalesce(s.lifestyle, '{}') || case when o.volunteer_exchange then array['Volunteer exchange'] else '{}'::text[] end
             || case when o.format = 'Drop-in' then array['A class or session'] else '{}'::text[] end,
           o.owner_id
      into v_title, v_town, v_life, v_owner
      from public.offerings o left join public.spaces s on s.owner_id = o.owner_id where o.id = p_ref and o.status = 'live';
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
     where p.role = 'seeker' and p.onboarded and p.notify and p.id <> v_owner
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
end $function$;

-- 6. Team console: one application per role, fast-track when the member is already approved in another role
create or replace function public.team_review_role(p_member uuid, p_role text, p_decision text, p_message text default '')
 returns json language plpgsql security definer set search_path to '' as $function$
declare me public.profiles; v_role text; v_status text; v_action text; v_msg text := coalesce(trim(p_message), ''); s record;
begin
  perform public.team_require();
  select * into me from public.profiles where id = p_member;
  if me.id is null then raise exception 'member not found'; end if;
  v_role := coalesce(p_role,
    case when me.role in ('container','facilitator') then me.role
         when me.container_status = 'pending' then 'container'
         when me.facilitator_status = 'pending' then 'facilitator'
         when me.container_status is not null then 'container'
         when me.facilitator_status is not null then 'facilitator' end);
  if v_role not in ('container', 'facilitator') then raise exception 'only Containers and Facilitators are reviewed'; end if;
  if (v_role = 'container' and me.container_status is null) or (v_role = 'facilitator' and me.facilitator_status is null) then
    raise exception 'this member hasn''t applied as a %', v_role;
  end if;
  v_status := case p_decision when 'approve' then 'approved' when 'decline' then 'declined' when 'changes' then 'pending' when 'reopen' then 'pending' end;
  if v_status is null then raise exception 'unknown decision %', p_decision; end if;
  update public.profiles set
    container_status = case when v_role = 'container' then v_status else container_status end,
    facilitator_status = case when v_role = 'facilitator' then v_status else facilitator_status end,
    status = case when role = v_role then v_status else status end
   where id = p_member;
  if v_msg <> '' then
    insert into public.messages (user_id, from_team, body) values (p_member, true, v_msg);
  end if;
  v_action := case p_decision when 'approve' then 'approved' when 'decline' then 'declined' when 'changes' then 'asked_for_changes' else 'reopened' end;
  perform public.team_log(v_action, 'profile', p_member::text, coalesce(nullif(me.name, ''), 'Unnamed') || ' (' || initcap(v_role) || ')');

  if p_decision = 'approve' then
    perform public.notify_member(p_member, 'approved',
      case when v_role = 'container' then 'Your space is approved. Welcome to Xanadu!' else 'You’re approved as a Facilitator. Welcome to Xanadu!' end,
      coalesce(nullif(v_msg, ''), 'Your profile is now live for members.'),
      case v_role when 'container' then '/container' else '/facilitator' end, true);
    if v_role = 'container' then
      for s in select id from public.spaces where owner_id = p_member loop perform public.notify_matches_for('space', s.id); end loop;
    end if;
  elsif p_decision = 'changes' then
    perform public.notify_member(p_member, 'changes', 'Xanadu has a note about your application',
      coalesce(nullif(v_msg, ''), 'Open your messages to see what to update.'), '/messages/team', true);
  elsif p_decision = 'decline' then
    perform public.notify_member(p_member, 'declined', 'An update on your Xanadu application',
      coalesce(nullif(v_msg, ''), 'Open your messages from the Xanadu team.'), '/messages/team', true);
  end if;
  return json_build_object('status', v_status, 'role', v_role);
end $function$;

create or replace function public.team_review_member(p_member uuid, p_decision text, p_message text default ''::text)
 returns json language plpgsql security definer set search_path to '' as $function$
begin
  return public.team_review_role(p_member, null, p_decision, p_message);
end $function$;

grant execute on function public.team_review_role(uuid, text, text, text) to authenticated;
revoke execute on function public.team_review_role(uuid, text, text, text) from anon;

create or replace function public.team_list_applications()
 returns json language plpgsql stable security definer set search_path to '' as $function$
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
           case x.app_role when 'container' then p.facilitator_status else p.container_status end as other_status
      from public.profiles p
      cross join lateral (values ('container', p.container_status), ('facilitator', p.facilitator_status)) x(app_role, app_status)
      join auth.users u on u.id = p.id
      left join public.private_details d on d.user_id = p.id
      left join lateral (select * from public.spaces sp where sp.owner_id = p.id order by sp.created_at limit 1) s on true
     where x.app_status is not null
  ) a;
  return r;
end $function$;

create or replace function public.team_counts()
 returns json language plpgsql stable security definer set search_path to '' as $function$
declare r json;
begin
  if not public.is_team() then raise exception 'not authorised' using errcode = '42501'; end if;
  select json_build_object(
    'pending_containers', (select count(*) from public.profiles where container_status = 'pending' and not (role = 'container' and not onboarded)),
    'pending_facilitators', (select count(*) from public.profiles where facilitator_status = 'pending' and not (role = 'facilitator' and not onboarded)),
    'offerings_in_review', (select count(*) from public.offerings where status = 'in_review'),
    'unanswered_messages', (select count(*) from (
        select distinct on (user_id) user_id, from_team from public.messages order by user_id, created_at desc) last
        where not last.from_team),
    'open_reports', (select count(*) from public.reports r where not exists (
        select 1 from public.team_actions a where a.target_kind = 'report' and a.target_id = r.id::text and a.action like 'report_%')),
    'members', json_build_object(
        'seeker', (select count(*) from public.profiles where container_status is null and facilitator_status is null),
        'container', (select count(*) from public.profiles where container_status is not null),
        'facilitator', (select count(*) from public.profiles where facilitator_status is not null)),
    'new_this_week', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'live_offerings', (select count(*) from public.offerings where status = 'live'),
    'approved_spaces', (select count(*) from public.spaces s join public.profiles p on p.id = s.owner_id where p.container_status = 'approved')
  ) into r;
  return r;
end $function$;

create or replace function public.team_list_members(p_role text default null::text, p_search text default null::text)
 returns table(id uuid, role text, status text, onboarded boolean, name text, email text, photo_url text, town text, region text, practices text[], lifestyle text[], seeking text, about text, languages text, community_visible boolean, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, space_name text, space_country text, space_region text, space_town text, last_message_at timestamp with time zone, awaiting_reply boolean)
 language plpgsql stable security definer set search_path to '' as $function$
begin
  if not public.is_team() then raise exception 'not authorised' using errcode = '42501'; end if;
  return query
  select p.id,
         case p_role when 'container' then 'container' when 'facilitator' then 'facilitator' when 'seeker' then 'seeker' else p.role end,
         case p_role when 'container' then p.container_status when 'facilitator' then p.facilitator_status when 'seeker' then 'active' else p.status end,
         p.onboarded, p.name, u.email::text, p.photo_url,
         p.town, p.region, p.practices, p.lifestyle, p.seeking, p.about, p.languages,
         p.community_visible, p.created_at, u.last_sign_in_at,
         s.name, s.country, s.region, s.town,
         m.created_at, coalesce(not m.from_team, false)
    from public.profiles p
    join auth.users u on u.id = p.id
    left join lateral (select sp.name, sp.country, sp.region, sp.town from public.spaces sp
                        where sp.owner_id = p.id order by sp.created_at limit 1) s on true
    left join lateral (select mm.created_at, mm.from_team from public.messages mm
                        where mm.user_id = p.id order by mm.created_at desc limit 1) m on true
   where (p_role is null
          or (p_role = 'seeker' and p.container_status is null and p.facilitator_status is null)
          or (p_role = 'container' and p.container_status is not null)
          or (p_role = 'facilitator' and p.facilitator_status is not null))
     and (p_search is null or p_search = '' or
          p.name ilike '%' || p_search || '%' or u.email ilike '%' || p_search || '%' or
          s.name ilike '%' || p_search || '%' or p.town ilike '%' || p_search || '%')
   order by p.created_at desc;
end $function$;

create or replace function public.team_list_spaces()
 returns json language plpgsql stable security definer set search_path to '' as $function$
declare r json;
begin
  perform public.team_require();
  select coalesce(json_agg(x order by x.created_at desc), '[]'::json) into r from (
    select s.id, s.owner_id, s.name, s.country, s.region, s.town, s.about, s.practices, s.lifestyle, s.photos,
           s.sleeps, s.rooms, s.mats, s.kitchen, s.getting_here, s.volunteer_exchange, s.volunteer_details, s.created_at,
           coalesce(p.container_status, p.status) as owner_status, p.name as owner_name, u.email::text as owner_email,
           (select count(*) from public.offerings o where o.owner_id = s.owner_id and o.status = 'live') as live_offerings
      from public.spaces s join public.profiles p on p.id = s.owner_id join auth.users u on u.id = s.owner_id
  ) x;
  return r;
end $function$;

create or replace function public.team_list_offerings()
 returns json language plpgsql stable security definer set search_path to '' as $function$
declare r json;
begin
  perform public.team_require();
  select coalesce(json_agg(x order by x.updated_at desc), '[]'::json) into r from (
    select o.*, p.name as host_name, coalesce(p.container_status, p.status) as host_status, u.email::text as host_email, p.photo_url as host_photo,
           s.name as space_name, s.country as space_country, s.region as space_region, s.town as space_town,
           (s.photos)[1] as cover
      from public.offerings o
      join public.profiles p on p.id = o.owner_id
      join auth.users u on u.id = o.owner_id
      left join lateral (select * from public.spaces sp where sp.owner_id = o.owner_id order by sp.created_at limit 1) s on true
     where o.status <> 'draft'
  ) x;
  return r;
end $function$;

-- 7. AI import (website / flyer): usage log and spend limits. Service role only (no policies).
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  kind text not null,
  source text not null,
  model text not null default '',
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(10,4) not null default 0,
  ok boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_created_idx on public.ai_usage (created_at);
create index if not exists ai_usage_user_idx on public.ai_usage (user_id, created_at);
alter table public.ai_usage enable row level security;

create table if not exists public.ai_settings (
  id integer primary key default 1 check (id = 1),
  monthly_cap_usd numeric(10,2) not null default 25,
  alert_every_usd numeric(10,2) not null default 10,
  alerted_through_usd numeric(10,2) not null default 0,
  daily_imports_per_member integer not null default 20
);
insert into public.ai_settings (id) values (1) on conflict (id) do nothing;
alter table public.ai_settings enable row level security;

-- The console can see spend at a glance.
create or replace function public.team_ai_spend()
 returns json language plpgsql stable security definer set search_path to '' as $function$
begin
  perform public.team_require();
  return (select json_build_object(
    'month_usd', coalesce((select sum(cost_usd) from public.ai_usage where created_at >= date_trunc('month', now())), 0),
    'total_usd', coalesce((select sum(cost_usd) from public.ai_usage), 0),
    'imports_month', (select count(*) from public.ai_usage where created_at >= date_trunc('month', now())),
    'monthly_cap_usd', s.monthly_cap_usd, 'alert_every_usd', s.alert_every_usd)
    from public.ai_settings s where s.id = 1);
end $function$;
grant execute on function public.team_ai_spend() to authenticated;
revoke execute on function public.team_ai_spend() from anon;
