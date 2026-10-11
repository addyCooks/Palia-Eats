-- PaliaEats timers: unanswered orders, the Monday summary, and tidying old records
-- Run once in Supabase Dashboard -> SQL Editor, AFTER 0018_platform_foundations.sql and after the
-- website version that has the /api/cron/pending-orders and /api/cron/weekly-summary routes is live.
--
--   every minute   if an order has waited at "Order placed" for 4+ minutes, ask the website to
--                  deal with it (remind the restaurant after 5, cancel after 15, tidy old ones)
--   Mondays 09:30  ask the website to email each restaurant its weekly summary (India time)
--   every night    delete records that are no longer needed (see the list below)
--
-- Like the "remind me when it opens" timer (0014), the website trusts these calls because each
-- carries a random key created here and stored in cron_keys, which only the server can read.

-- Phones that turned on notifications also remember the reader's language.
alter table public.push_subscriptions
  add column lang text not null default 'en' check (lang in ('en', 'hi'));

-- ================================================================== timer keys
insert into public.cron_keys (name, url, key)
values
  ('pending_orders', 'https://www.paliaeats.online/api/cron/pending-orders',
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')),
  ('weekly_summary', 'https://www.paliaeats.online/api/cron/weekly-summary',
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (name) do nothing;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- ============================================================ unanswered orders
create function public.run_pending_orders()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job record;
begin
  if exists (
    select 1 from public.orders
    where status = 'pending' and placed_at < now() - interval '4 minutes'
  ) then
    select url, key into v_job from public.cron_keys where name = 'pending_orders';
    perform net.http_post(
      url := v_job.url,
      body := '{}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_job.key
      ),
      timeout_milliseconds := 25000
    );
  end if;
end;
$$;
revoke execute on function public.run_pending_orders() from public, anon, authenticated;

-- ============================================================== weekly summary
create function public.run_weekly_summary()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job record;
begin
  select url, key into v_job from public.cron_keys where name = 'weekly_summary';
  perform net.http_post(
    url := v_job.url,
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_job.key
    ),
    timeout_milliseconds := 55000
  );
end;
$$;
revoke execute on function public.run_weekly_summary() from public, anon, authenticated;

-- ================================================================ tidy-up (nightly)
-- Matches what the Privacy Policy promises:
--   spam counters 1 day | email/WhatsApp delivery log 180 days | crash notes 60 days
--   anonymous visit counts 2 years | closed help requests 1 year after they were answered
create function public.run_retention()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.rate_limits where window_start < now() - interval '1 day';
  delete from public.notification_log where created_at < now() - interval '180 days';
  delete from public.error_log where last_seen < now() - interval '60 days';
  delete from public.funnel_counts where day < (now() at time zone 'Asia/Kolkata')::date - 730;
  delete from public.support_requests
    where status = 'closed' and coalesce(answered_at, created_at) < now() - interval '365 days';
  delete from public.whatsapp_processed where created_at < now() - interval '14 days';
  -- the timers' own run history grows forever otherwise
  delete from cron.job_run_details where end_time < now() - interval '7 days';
end;
$$;
revoke execute on function public.run_retention() from public, anon, authenticated;

-- ===================================================================== schedules
select cron.schedule('pending-orders', '* * * * *', 'select public.run_pending_orders()');
select cron.schedule('weekly-summary', '0 4 * * 1', 'select public.run_weekly_summary()');
select cron.schedule('retention', '15 21 * * *', 'select public.run_retention()');
