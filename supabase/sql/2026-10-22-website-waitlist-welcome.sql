-- Xanadu, Oct 22 2026: welcome emails for people who join the waitlist on the website
-- (the "Join" form, no account). Before this, only people with an account got one.
-- Additive: three new columns on waitlist, a trigger, and updated console functions.
-- Paste the whole file into Supabase → SQL Editor (project "xanadu app") and press Run.
-- Running it also sends the welcome email to everyone already on the waitlist who never got one.

alter table public.waitlist add column if not exists welcome_sent_at timestamptz;
alter table public.waitlist add column if not exists welcome_error text;
alter table public.waitlist add column if not exists welcome_provider_id text;

-- Every new waitlist sign-up gets the welcome email (notify sends each one once)
create or replace function public.waitlist_send_welcome()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  perform net.http_post(
    url := 'https://gutqzqxybcnnpwfbkjsq.supabase.co/functions/v1/notify',
    body := jsonb_build_object('waitlist', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb);
  return new;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'waitlist_welcome_email' and tgrelid = 'public.waitlist'::regclass) then
    create trigger waitlist_welcome_email after insert on public.waitlist
      for each row execute function public.waitlist_send_welcome();
  end if;
end $$;

-- Console → Emails: include the website waitlist emails
create or replace function public.team_email_log(p_limit integer default 50)
returns json language plpgsql stable security definer set search_path to '' as $$
declare r json;
begin
  perform public.team_require();
  select coalesce(json_agg(x order by x.created_at desc), '[]'::json) into r from (
    select * from (
      select q.id, q.kind, q.status, q.error, q.created_at, q.sent_at, p.name, u.email::text as email, p.role,
             case when q.kind like 'n:%' then n.kind else q.kind end as type,
             case
               when q.kind = 'welcome_seeker' then 'Thank you for joining the Xanadu waitlist'
               when q.kind in ('application_container', 'application_facilitator') then 'Thank you for applying to Xanadu'
               else n.title end as subject
        from public.email_queue q
        join auth.users u on u.id = q.user_id
        left join public.profiles p on p.id = q.user_id
        left join public.notifications n on q.kind like 'n:%' and n.id::text = substr(q.kind, 3)
      union all
      select w.id, 'waitlist' as kind,
             case when w.welcome_error is not null then 'failed' when w.welcome_sent_at is not null then 'sent' else 'queued' end as status,
             w.welcome_error as error, w.created_at, w.welcome_sent_at as sent_at, w.name, w.email, lower(coalesce(w.role, 'seeker')) as role,
             case lower(coalesce(w.role, 'seeker')) when 'container' then 'application_container'
                  when 'facilitator' then 'application_facilitator' else 'welcome_seeker' end as type,
             case when lower(coalesce(w.role, 'seeker')) in ('container', 'facilitator') then 'Thank you for applying to Xanadu'
                  else 'Thank you for joining the Xanadu waitlist' end as subject
        from public.waitlist w
    ) all_emails
    order by created_at desc limit least(greatest(p_limit, 1), 500)
  ) x;
  return r;
end $$;

-- Console → Emails → Retry failed: also retries website waitlist emails
create or replace function public.team_retry_emails()
returns integer language plpgsql security definer set search_path to '' as $$
declare r record; n int := 0;
begin
  perform public.team_require();
  for r in update public.email_queue set status = 'queued', error = null where status = 'failed' returning id loop
    perform net.http_post(url := 'https://gutqzqxybcnnpwfbkjsq.supabase.co/functions/v1/notify',
      body := jsonb_build_object('id', r.id), headers := '{"Content-Type": "application/json"}'::jsonb);
    n := n + 1;
  end loop;
  for r in update public.waitlist set welcome_error = null where welcome_error is not null and welcome_sent_at is null returning id loop
    perform net.http_post(url := 'https://gutqzqxybcnnpwfbkjsq.supabase.co/functions/v1/notify',
      body := jsonb_build_object('waitlist', r.id), headers := '{"Content-Type": "application/json"}'::jsonb);
    n := n + 1;
  end loop;
  if n > 0 then perform public.team_log('emails_retried', 'email', null, n || ' email' || case when n = 1 then '' else 's' end); end if;
  return n;
end $$;

-- Send the welcome to everyone already on the waitlist who never got one (today: Haylee)
do $$ declare w record; begin
  for w in select id from public.waitlist where welcome_sent_at is null loop
    perform net.http_post(url := 'https://gutqzqxybcnnpwfbkjsq.supabase.co/functions/v1/notify',
      body := jsonb_build_object('waitlist', w.id), headers := '{"Content-Type": "application/json"}'::jsonb);
  end loop;
end $$;
