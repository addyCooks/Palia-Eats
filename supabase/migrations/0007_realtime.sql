-- PaliaEats: instant updates with Supabase Realtime (WebSockets)
-- Run once in Supabase Dashboard -> SQL Editor, after 0006_simple_order_flow.sql.
--
-- 1. Customers, the admin and storefronts listen to live database changes. Row Level
--    Security still decides which rows each listener is allowed to receive.
-- 2. The restaurant panel has no login, so it can't listen to private rows. Instead the
--    database sends an EMPTY "something changed" ping on a secret channel per restaurant;
--    the panel then fetches the real data through its own secure session.

-- ---------------------------------------------------------------------------
-- 1. Live change feeds (only the tables the app listens to)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['orders', 'restaurants', 'menu_items'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. A secret channel name per restaurant for the panel pings
--    (random, unguessable; the admin's "generate a new link" replaces it)
-- ---------------------------------------------------------------------------
alter table public.restaurant_private
  add column realtime_topic text not null
  default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));

create function public.notify_panel_of_order_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_topic text;
begin
  select realtime_topic into v_topic
  from public.restaurant_private
  where restaurant_id = new.restaurant_id;

  if v_topic is not null then
    -- The ping carries NO order data. If Realtime is ever unavailable, ordering must
    -- still work, so any failure here is swallowed.
    begin
      perform realtime.send('{}'::jsonb, 'refresh', 'panel:' || v_topic, false);
    exception when others then
      null;
    end;
  end if;

  return new;
end;
$$;

create trigger orders_notify_panel
  after insert or update of status on public.orders
  for each row execute function public.notify_panel_of_order_change();
