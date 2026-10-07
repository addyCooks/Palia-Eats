-- PaliaEats "Remind me when it opens"
-- Run once in Supabase Dashboard -> SQL Editor, after 0013_favourites.sql.
--
-- On the "restaurant closed" screen a logged-in customer can ask for one email when the
-- restaurant opens again. Every 5 minutes the database checks whether any of those
-- restaurants has opened; only then does it call the website, which sends the emails and
-- removes the reminders. Reminders nobody needed for 3 days are dropped.
--
-- The website trusts the timer's call because it carries a random key that is created
-- here and stored in cron_keys, which only the server can read. No secret is copied
-- by hand.

-- ========================================================================= reminders
create table public.open_reminders (
  user_id uuid not null references public.profiles (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);
create index open_reminders_restaurant_idx on public.open_reminders (restaurant_id);

alter table public.open_reminders enable row level security;

create policy "open reminders: read own"
  on public.open_reminders for select to authenticated
  using (user_id = (select auth.uid()));
create policy "open reminders: add own"
  on public.open_reminders for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.restaurants r where r.id = open_reminders.restaurant_id)
  );
create policy "open reminders: remove own"
  on public.open_reminders for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.open_reminders to authenticated;
grant all on public.open_reminders to service_role;
revoke all on public.open_reminders from anon;

-- ===================================================================== timer key
-- Server-only: no policies, so only the service role (the website's server) can read it.
create table public.cron_keys (
  name text primary key,
  url text not null,
  key text not null
);
alter table public.cron_keys enable row level security;
revoke all on public.cron_keys from anon, authenticated;
grant all on public.cron_keys to service_role;

insert into public.cron_keys (name, url, key)
values (
  'open_reminders',
  'https://paliaeats.vercel.app/api/cron/open-reminders',
  replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
);

-- ========================================================================= timer
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create function public.run_open_reminders()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job record;
begin
  delete from public.open_reminders where created_at < now() - interval '3 days';

  if exists (
    select 1
    from public.open_reminders o
    join public.restaurants r on r.id = o.restaurant_id
    where r.is_active
      and r.is_accepting_orders
      and public.is_within_hours(r.opening_time, r.closing_time, r.closed_days, now())
  ) then
    select url, key into v_job from public.cron_keys where name = 'open_reminders';
    perform net.http_post(
      url := v_job.url,
      body := '{}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_job.key
      ),
      timeout_milliseconds := 20000
    );
  end if;
end;
$$;

revoke execute on function public.run_open_reminders() from public, anon, authenticated;

select cron.schedule('open-reminders', '*/5 * * * *', 'select public.run_open_reminders()');
