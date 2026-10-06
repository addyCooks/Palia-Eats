-- PaliaEats v2 features
-- Run once in Supabase Dashboard -> SQL Editor, after 0011_place_order_core.sql.
--
--   Dishes      bestseller flag, egg marker, prep time, optional half-plate price
--   Restaurants area (public), owner name and commission % (admin only), rating average
--   Customers   admin can block a customer; blocked customers cannot order
--   Orders      rider assignment, half/full on each line, a timestamp for every status change
--   Ratings     customers rate a delivered order once (1-5 stars + optional note)
--   Riders      the people who deliver (PaliaEats riders, or a restaurant's own)
--   Payouts     weekly settlement records per restaurant (admin only)
-- place_order_core() learns half plates and blocked customers. Everything else is unchanged.

-- =========================================================================== dishes
alter table public.menu_items
  add column is_bestseller boolean not null default false,
  add column contains_egg boolean not null default false,
  add column prep_minutes smallint check (prep_minutes between 1 and 240),
  add column half_price numeric(10, 2) check (half_price >= 0),
  add constraint menu_items_veg_not_egg check (not (is_veg and contains_egg));

-- ====================================================================== restaurants
alter table public.restaurants
  add column area text check (char_length(area) <= 60),
  add column rating_avg numeric(2, 1),
  add column rating_count integer not null default 0;

alter table public.restaurant_private
  add column owner_name text check (char_length(owner_name) <= 80),
  add column commission_percent numeric(5, 2) not null default 8
    check (commission_percent between 0 and 100);

-- ======================================================================== customers
alter table public.profiles
  add column is_blocked boolean not null default false;
-- (Customers can only update full_name, phone and whatsapp_opt_in, so they can't unblock
-- themselves. Admins change this through the server.)

-- =========================================================================== riders
create table public.riders (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  phone text check (phone ~ '^[6-9][0-9]{9}$'),
  -- null = a PaliaEats rider who can deliver for any restaurant
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index riders_restaurant_idx on public.riders (restaurant_id);

alter table public.orders
  add column rider_id uuid references public.riders (id) on delete set null;
create index orders_rider_idx on public.orders (rider_id);

-- ============================================================== half / full lines
alter table public.order_items
  add column variant text not null default 'full' check (variant in ('full', 'half'));

-- ============================================================= status timestamps
create table public.order_status_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  at timestamptz not null default now()
);
create index order_status_events_order_idx on public.order_status_events (order_id, at);

create function public.log_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_events (order_id, status, at) values (new.id, new.status, new.placed_at);
  elsif new.status is distinct from old.status then
    insert into public.order_status_events (order_id, status, at) values (new.id, new.status, now());
  end if;
  return new;
end;
$$;

create trigger orders_log_status
  after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- Existing orders: when they were placed, and their current status.
insert into public.order_status_events (order_id, status, at)
  select id, 'pending', placed_at from public.orders;
insert into public.order_status_events (order_id, status, at)
  select id, status, status_updated_at from public.orders where status <> 'pending';

-- ========================================================================== ratings
create table public.order_ratings (
  order_id uuid primary key references public.orders (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  comment text check (char_length(comment) <= 300),
  created_at timestamptz not null default now()
);
create index order_ratings_restaurant_idx on public.order_ratings (restaurant_id);

-- Keeps restaurants.rating_avg / rating_count up to date (shown publicly).
create function public.refresh_restaurant_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_restaurant uuid := coalesce(new.restaurant_id, old.restaurant_id);
begin
  update public.restaurants r
     set rating_avg = s.avg_stars, rating_count = s.n
    from (
      select round(avg(stars)::numeric, 1) as avg_stars, count(*)::int as n
      from public.order_ratings where restaurant_id = v_restaurant
    ) s
   where r.id = v_restaurant;
  return null;
end;
$$;

create trigger order_ratings_refresh
  after insert or update or delete on public.order_ratings
  for each row execute function public.refresh_restaurant_rating();

-- ========================================================================== payouts
create table public.restaurant_payouts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  week_start date not null,
  week_end date not null,
  gross numeric(12, 2) not null,
  commission_percent numeric(5, 2) not null,
  commission numeric(12, 2) not null,
  net numeric(12, 2) not null,
  paid_at timestamptz not null default now(),
  paid_by uuid references public.profiles (id) on delete set null,
  unique (restaurant_id, week_start)
);

-- ===================================================================== order guard
-- Same rules as before, plus: a rider can only be assigned if they are active and work
-- for this restaurant (or for PaliaEats in general).
create or replace function public.guard_order_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.customer_id <> old.customer_id
     or new.restaurant_id <> old.restaurant_id
     or new.subtotal <> old.subtotal
     or new.delivery_fee <> old.delivery_fee
     or new.total <> old.total
     or new.order_number <> old.order_number
     or new.channel <> old.channel then
    raise exception 'Order customer, restaurant and amounts cannot be changed';
  end if;

  if new.status <> old.status then
    if not (
      (old.status in ('pending', 'accepted') and new.status in ('preparing', 'cancelled'))
      or (old.status = 'preparing'        and new.status in ('out_for_delivery', 'cancelled'))
      or (old.status = 'out_for_delivery' and new.status in ('delivered', 'cancelled'))
    ) then
      raise exception 'Invalid order status change: % -> %', old.status, new.status;
    end if;
    new.status_updated_at = now();
  end if;

  if new.rider_id is distinct from old.rider_id and new.rider_id is not null then
    if not exists (
      select 1 from public.riders r
      where r.id = new.rider_id and r.is_active
        and (r.restaurant_id is null or r.restaurant_id = new.restaurant_id)
    ) then
      raise exception 'Invalid rider for this order';
    end if;
  end if;

  if new.status <> 'cancelled' then
    new.cancelled_by = null;
  end if;

  return new;
end;
$$;

-- ================================================================== place_order_core
-- As before, plus: each line may ask for 'half' (only if the dish has a half price), and
-- blocked customers are refused.
create or replace function public.place_order_core(
  p_uid uuid,
  p_channel public.order_channel,
  p_restaurant_id uuid,
  p_items jsonb,            -- [{ "id": "<menu item>", "quantity": 2, "variant": "half" }, ...]
  p_address_id uuid,
  p_notes text,
  p_expected_total numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := p_uid;
  v_profile record;
  v_address record;
  v_restaurant record;
  v_phone text;
  v_notes text := nullif(trim(coalesce(p_notes, '')), '');
  v_bad_name text;
  v_subtotal numeric(10, 2);
  v_total numeric(10, 2);
  v_order_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'invalid_items';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_items) as x (id uuid, quantity int, variant text)
    where x.id is null or x.quantity is null or x.quantity < 1 or x.quantity > 20
       or coalesce(x.variant, 'full') not in ('full', 'half')
  ) then
    raise exception 'invalid_items';
  end if;

  if (select count(distinct (x.id, coalesce(x.variant, 'full')))
      from jsonb_to_recordset(p_items) as x (id uuid, quantity int, variant text))
     <> jsonb_array_length(p_items) then
    raise exception 'invalid_items';  -- the same dish and size listed twice
  end if;

  if v_notes is not null and char_length(v_notes) > 300 then
    raise exception 'notes_too_long';
  end if;

  select full_name, phone, is_blocked into v_profile from public.profiles where id = v_uid;
  if coalesce(v_profile.is_blocked, false) then
    raise exception 'account_blocked';
  end if;

  select * into v_address
  from public.customer_addresses
  where id = p_address_id and user_id = v_uid;
  if not found then
    raise exception 'invalid_address';
  end if;

  v_phone := coalesce(v_address.phone, v_profile.phone);
  if v_phone is null then
    raise exception 'phone_required';
  end if;
  if v_profile.full_name is null or trim(v_profile.full_name) = '' then
    raise exception 'name_required';
  end if;

  select * into v_restaurant
  from public.restaurants
  where id = p_restaurant_id and is_active;
  if not found then
    raise exception 'restaurant_unavailable';
  end if;

  if not v_restaurant.is_accepting_orders then
    raise exception 'restaurant_paused';
  end if;

  if not public.is_within_hours(
       v_restaurant.opening_time, v_restaurant.closing_time, v_restaurant.closed_days, now()
     ) then
    raise exception 'restaurant_closed';
  end if;

  select coalesce(mi.name, 'An item') into v_bad_name
  from jsonb_to_recordset(p_items) as x (id uuid, quantity int, variant text)
  left join public.menu_items mi
    on mi.id = x.id and mi.restaurant_id = p_restaurant_id
  where mi.id is null
     or not mi.is_available
     or (coalesce(x.variant, 'full') = 'half' and mi.half_price is null)
  limit 1;
  if found then
    raise exception 'item_unavailable' using detail = v_bad_name;
  end if;

  select sum(
           case when coalesce(x.variant, 'full') = 'half' then mi.half_price else mi.price end
           * x.quantity
         ) into v_subtotal
  from jsonb_to_recordset(p_items) as x (id uuid, quantity int, variant text)
  join public.menu_items mi on mi.id = x.id;

  if v_subtotal < v_restaurant.min_order_amount then
    raise exception 'below_minimum' using detail = v_restaurant.min_order_amount::text;
  end if;

  v_total := v_subtotal + v_restaurant.delivery_fee;

  if p_expected_total is distinct from v_total then
    raise exception 'price_changed' using detail = v_total::text;
  end if;

  select id into v_order_id
  from public.orders
  where customer_id = v_uid
    and restaurant_id = p_restaurant_id
    and subtotal = v_subtotal
    and total = v_total
    and placed_at > now() - interval '15 seconds'
  order by placed_at desc
  limit 1;
  if found then
    return v_order_id;
  end if;

  if (select count(*) from public.orders
      where customer_id = v_uid and placed_at > now() - interval '10 minutes') >= 5 then
    raise exception 'too_many_orders';
  end if;

  insert into public.orders (
    customer_id, restaurant_id, subtotal, delivery_fee, total, payment_method,
    customer_name, customer_phone, delivery_address, customer_notes, channel
  )
  values (
    v_uid, p_restaurant_id, v_subtotal, v_restaurant.delivery_fee, v_total, 'cod',
    trim(v_profile.full_name), v_phone,
    jsonb_build_object(
      'label', v_address.label,
      'address_line', v_address.address_line,
      'landmark', v_address.landmark,
      'phone', v_address.phone
    ),
    v_notes, p_channel
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total, variant)
  select v_order_id,
         mi.id,
         mi.name || case when coalesce(x.variant, 'full') = 'half' then ' (Half)' else '' end,
         case when coalesce(x.variant, 'full') = 'half' then mi.half_price else mi.price end,
         x.quantity,
         case when coalesce(x.variant, 'full') = 'half' then mi.half_price else mi.price end * x.quantity,
         coalesce(x.variant, 'full')
  from jsonb_to_recordset(p_items) as x (id uuid, quantity int, variant text)
  join public.menu_items mi on mi.id = x.id;

  return v_order_id;
end;
$$;

-- ============================================================== row level security
alter table public.riders enable row level security;
alter table public.order_status_events enable row level security;
alter table public.order_ratings enable row level security;
alter table public.restaurant_payouts enable row level security;

create policy "riders: admin all"
  on public.riders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "riders: customer sees own order's rider"
  on public.riders for select to authenticated
  using (exists (
    select 1 from public.orders o where o.rider_id = riders.id and o.customer_id = (select auth.uid())
  ));

create policy "status events: own orders or admin"
  on public.order_status_events for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_status_events.order_id and o.customer_id = (select auth.uid())
    )
  );

create policy "ratings: read own or admin"
  on public.order_ratings for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_admin());
create policy "ratings: rate own delivered order"
  on public.order_ratings for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and exists (
      select 1 from public.orders o
      where o.id = order_ratings.order_id
        and o.customer_id = (select auth.uid())
        and o.restaurant_id = order_ratings.restaurant_id
        and o.status = 'delivered'
    )
  );

create policy "payouts: admin all"
  on public.restaurant_payouts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.riders, public.restaurant_payouts to authenticated;
grant select on public.order_status_events to authenticated;
grant select, insert on public.order_ratings to authenticated;
grant all on public.riders, public.order_status_events, public.order_ratings, public.restaurant_payouts
  to service_role;
revoke all on public.riders, public.order_status_events, public.order_ratings, public.restaurant_payouts
  from anon;

-- Live updates: the customer's tracking page follows status events and rider changes.
alter publication supabase_realtime add table public.order_status_events;
