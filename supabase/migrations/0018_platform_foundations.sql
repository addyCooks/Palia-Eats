-- PaliaEats platform foundations
-- Run once in Supabase Dashboard -> SQL Editor, after 0017_address_location.sql.
--
-- Adds the tables and functions behind the "production hardening" batch:
--   rate_limits         one counter per key (used to stop spam on sign-up, /join, help requests...)
--   error_log           every crash the website hits, grouped, so nothing fails silently
--   admin_audit_log     who did what in the admin area (cannot be edited or deleted from the site)
--   funnel_counts       how many visits reached each step (visit -> restaurant -> cart -> checkout)
--   support_requests    help requests sent from the website (Admin -> Support)
--   push_subscriptions  phones that agreed to get order updates as notifications
--   restaurants.fssai_number     optional licence number shown on the restaurant page
--   restaurant_private.weekly_summary   restaurants can switch their Monday summary email off
--   orders.cancelled_by = 'system'      an order nobody answered is cancelled automatically
--   erase_customer()    anonymises a customer's orders when they delete their account
-- Nothing existing is removed. Orders and ratings keep their rows when a customer deletes
-- their account (the customer link is cleared), so restaurants' sales records stay correct.

-- ================================================================== rate limits
create table public.rate_limits (
  key text primary key,
  hits integer not null default 0,
  window_start timestamptz not null default now()
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;
grant all on public.rate_limits to service_role;

-- Counts one hit for p_key. Returns true while the caller is still under p_max hits per
-- p_window_seconds, false once they are over.
create function public.hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limits as r (key, hits, window_start)
  values (left(p_key, 200), 1, now())
  on conflict (key) do update
    set hits = case
          when r.window_start <= now() - make_interval(secs => p_window_seconds) then 1
          else r.hits + 1 end,
        window_start = case
          when r.window_start <= now() - make_interval(secs => p_window_seconds) then now()
          else r.window_start end
  returning hits into v_hits;
  return v_hits <= p_max;
end;
$$;
revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- ==================================================================== error log
create table public.error_log (
  id bigint generated always as identity primary key,
  fingerprint text not null unique,
  source text not null check (source in ('server', 'browser')),
  message text not null,
  path text,
  stack text,
  digest text,
  user_id uuid references public.profiles (id) on delete set null,
  user_agent text,
  occurrences integer not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  resolved boolean not null default false,
  resolved_at timestamptz
);
create index error_log_open_idx on public.error_log (last_seen desc) where not resolved;

alter table public.error_log enable row level security;
create policy "error log: admin read" on public.error_log
  for select to authenticated using (public.is_admin());
create policy "error log: admin update" on public.error_log
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, update on public.error_log to authenticated;
grant all on public.error_log to service_role;
revoke all on public.error_log from anon;

-- Records one crash. The same crash is stored once and counted. Returns true when the admin
-- should be alerted: a brand new problem, or an old one that had been marked fixed.
create function public.log_error(
  p_source text, p_message text, p_path text, p_stack text, p_digest text, p_user uuid, p_user_agent text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message text := left(coalesce(nullif(trim(p_message), ''), 'Unknown error'), 500);
  v_fingerprint text;
  v_was_resolved boolean;
  v_inserted boolean;
begin
  v_fingerprint := md5(
    p_source || '|' || left(v_message, 200) || '|' || coalesce(split_part(coalesce(p_stack, ''), E'\n', 2), '')
  );
  select resolved into v_was_resolved from public.error_log where fingerprint = v_fingerprint;

  insert into public.error_log as e (fingerprint, source, message, path, stack, digest, user_id, user_agent)
  values (
    v_fingerprint, p_source, v_message, left(p_path, 300), left(p_stack, 4000), left(p_digest, 80), p_user,
    left(p_user_agent, 300)
  )
  on conflict (fingerprint) do update
    set occurrences = e.occurrences + 1,
        last_seen = now(),
        path = coalesce(excluded.path, e.path),
        resolved = false,
        resolved_at = null
  returning (xmax = 0) into v_inserted;

  return v_inserted or coalesce(v_was_resolved, false);
end;
$$;
revoke execute on function public.log_error(text, text, text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.log_error(text, text, text, text, text, uuid, text) to service_role;

-- ================================================================== admin audit
create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_name text,
  action text not null,
  target_type text,
  target_id text,
  summary text not null,
  details jsonb
);
create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;
create policy "audit log: admin read" on public.admin_audit_log
  for select to authenticated using (public.is_admin());
-- Only the website's server writes to it (service role). Nobody can edit or delete a row.
grant select on public.admin_audit_log to authenticated;
grant select, insert on public.admin_audit_log to service_role;
revoke all on public.admin_audit_log from anon;

-- ==================================================================== funnel
create table public.funnel_counts (
  day date not null,
  event text not null check (event in ('visit', 'restaurant_view', 'add_to_cart', 'checkout_start')),
  hits bigint not null default 0,
  primary key (day, event)
);
alter table public.funnel_counts enable row level security;
create policy "funnel: admin read" on public.funnel_counts
  for select to authenticated using (public.is_admin());
grant select on public.funnel_counts to authenticated;
grant all on public.funnel_counts to service_role;
revoke all on public.funnel_counts from anon;

create function public.bump_funnel(p_event text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.funnel_counts as f (day, event, hits)
  values ((now() at time zone 'Asia/Kolkata')::date, p_event, 1)
  on conflict (day, event) do update set hits = f.hits + 1;
$$;
revoke execute on function public.bump_funnel(text) from public, anon, authenticated;
grant execute on function public.bump_funnel(text) to service_role;

-- ============================================================ support requests
create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null default 'customer' check (kind in ('customer', 'restaurant')),
  user_id uuid references public.profiles (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  restaurant_id uuid references public.restaurants (id) on delete set null,
  name text check (char_length(name) <= 80),
  contact_email text check (char_length(contact_email) <= 120),
  contact_phone text check (contact_phone ~ '^[0-9]{10}$'),
  topic text not null check (char_length(topic) between 2 and 60),
  message text not null check (char_length(message) between 5 and 1000),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  admin_note text check (char_length(admin_note) <= 600),
  answered_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null
);
create index support_requests_status_idx on public.support_requests (status, created_at desc);
create index support_requests_user_idx on public.support_requests (user_id, created_at desc);

alter table public.support_requests enable row level security;
create policy "support: read own" on public.support_requests
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "support: admin update" on public.support_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
-- New requests are saved by the website's server after it checks the form and the rate limit.
grant select, update on public.support_requests to authenticated;
grant all on public.support_requests to service_role;
revoke all on public.support_requests from anon;

-- ======================================================== push notifications
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
create policy "push: read own" on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "push: add own" on public.push_subscriptions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "push: remove own" on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;
revoke all on public.push_subscriptions from anon;

-- ====================================================== restaurants: FSSAI, summary
alter table public.restaurants
  add column fssai_number text check (fssai_number ~ '^[0-9]{14}$');

alter table public.restaurant_private
  add column weekly_summary boolean not null default true;

-- ===================================================== automatic cancellation
alter table public.orders drop constraint orders_cancelled_by_check;
alter table public.orders
  add constraint orders_cancelled_by_check
  check (cancelled_by in ('restaurant', 'admin', 'customer', 'system'));

-- ============================================================ account deletion
-- Orders and ratings stay (restaurants need their sales records) but lose the link to the
-- person once the account is gone.
alter table public.orders alter column customer_id drop not null;
alter table public.orders drop constraint orders_customer_id_fkey;
alter table public.orders
  add constraint orders_customer_id_fkey
  foreign key (customer_id) references public.profiles (id) on delete set null;

alter table public.order_ratings alter column customer_id drop not null;
alter table public.order_ratings drop constraint order_ratings_customer_id_fkey;
alter table public.order_ratings
  add constraint order_ratings_customer_id_fkey
  foreign key (customer_id) references public.profiles (id) on delete set null;

-- Called by the website just before the login itself is deleted. Refuses while an order is
-- still on its way. Wipes the personal details copied onto old orders.
create function public.erase_customer(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.orders
    where customer_id = p_uid and status in ('pending', 'accepted', 'preparing', 'out_for_delivery')
  ) then
    raise exception 'active_order';
  end if;

  update public.orders
     set customer_name = 'Deleted customer',
         customer_phone = '',
         customer_notes = null,
         delivery_address = jsonb_build_object('label', 'Deleted', 'address_line', 'Address removed')
   where customer_id = p_uid;

  update public.order_ratings set comment = null where customer_id = p_uid;
end;
$$;
revoke execute on function public.erase_customer(uuid) from public, anon, authenticated;
grant execute on function public.erase_customer(uuid) to service_role;
