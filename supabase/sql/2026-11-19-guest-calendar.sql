-- Visitors without an account can browse the live community calendar (events only; nothing about members).
create policy "community events: guests read live" on public.community_events for select to anon using (status = 'live');
grant select on public.community_events to anon;
-- event_going_counts: counts for everyone (anon included); who is going stays members-only (event_attendees).
