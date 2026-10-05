-- PaliaEats: Step 3 - security (Row Level Security policies)
-- Run once in Supabase Dashboard -> SQL Editor, after 0001_schema.sql.

-- =========================================================
-- 1. Move private restaurant fields into an admin-only table
--    (RLS can't hide single columns, and restaurants is publicly readable)
-- =========================================================
create table public.restaurant_private (
  restaurant_id uuid primary key references public.restaurants (id) on delete cascade,
  notification_email text,
  notification_phone text,
  panel_key_hash text,
  panel_key_created_at timestamptz,
  updated_at timestamptz not null default now()
);

create trigger restaurant_private_set_updated_at
  before update on public.restaurant_private
  for each row execute function public.set_updated_at();

-- copy any existing values across, then drop them from the public table
insert into public.restaurant_private
  (restaurant_id, notification_email, notification_phone, panel_key_hash, panel_key_created_at)
select id, notification_email, notification_phone, panel_key_hash, panel_key_created_at
from public.restaurants;

alter table public.restaurants
  drop column notification_email,
  drop column notification_phone,
  drop column panel_key_hash,
  drop column panel_key_created_at;

-- every new restaurant automatically gets its (empty) private row
create function public.create_restaurant_private()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.restaurant_private (restaurant_id) values (new.id);
  return new;
end;
$$;

create trigger restaurants_create_private
  after insert on public.restaurants
  for each row execute function public.create_restaurant_private();

alter table public.restaurant_private enable row level security;

-- =========================================================
-- 2. Helper: is the current user an admin?
--    security definer so it can read profiles without recursion
-- =========================================================
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- =========================================================
-- 3. Table privileges (second lock, on top of RLS)
-- =========================================================
-- Anonymous visitors: read-only access to the public storefront tables, nothing else.
revoke all on all tables in schema public from anon;
grant select on public.restaurants, public.menu_categories, public.menu_items to anon;

-- Logged-in users may only edit their own name and phone on their profile
-- (so nobody can ever change their own role).
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Customers never write orders directly; orders are created by a secure function
-- (added in the checkout step).
revoke insert, delete on public.orders from authenticated;
revoke insert, update, delete on public.order_items from authenticated;

-- =========================================================
-- 4. Policies
-- =========================================================

-- profiles: see/edit your own row; admins can see everyone
create policy "profiles: read own or admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- restaurants: public sees active ones; admin manages all
create policy "restaurants: public read active"
  on public.restaurants for select to anon, authenticated
  using (is_active or public.is_admin());

create policy "restaurants: admin insert"
  on public.restaurants for insert to authenticated
  with check (public.is_admin());

create policy "restaurants: admin update"
  on public.restaurants for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "restaurants: admin delete"
  on public.restaurants for delete to authenticated
  using (public.is_admin());

-- restaurant_private: admin only (the restaurant panel uses the server-side admin client)
create policy "restaurant_private: admin all"
  on public.restaurant_private for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- menu_categories: public reads categories of active restaurants; admin manages
create policy "menu_categories: public read"
  on public.menu_categories for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.is_active
    )
  );

create policy "menu_categories: admin write"
  on public.menu_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- menu_items: public reads ALL items of active restaurants (so "sold out" can be shown)
create policy "menu_items: public read"
  on public.menu_items for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.is_active
    )
  );

create policy "menu_items: admin write"
  on public.menu_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- customer_addresses: each user fully manages only their own
create policy "addresses: own all"
  on public.customer_addresses for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- orders: customers read their own; admin reads and updates all
create policy "orders: read own or admin"
  on public.orders for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_admin());

create policy "orders: admin update"
  on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- order_items: visible if you can see the parent order
create policy "order_items: read via order"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.customer_id = (select auth.uid()) or public.is_admin())
    )
  );

-- =========================================================
-- 5. Order guard: only legal status changes, frozen money/customer fields.
--    Applies to everyone, including server-side admin code.
-- =========================================================
create function public.guard_order_update()
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
     or new.order_number <> old.order_number then
    raise exception 'Order customer, restaurant and amounts cannot be changed';
  end if;

  if new.status <> old.status then
    if not (
      (old.status = 'pending'          and new.status in ('accepted', 'rejected', 'cancelled'))
      or (old.status = 'accepted'      and new.status in ('preparing', 'cancelled'))
      or (old.status = 'preparing'     and new.status in ('out_for_delivery', 'cancelled'))
      or (old.status = 'out_for_delivery' and new.status in ('delivered', 'cancelled'))
    ) then
      raise exception 'Invalid order status change: % -> %', old.status, new.status;
    end if;
    new.status_updated_at = now();
  end if;

  return new;
end;
$$;

create trigger orders_guard_update
  before update on public.orders
  for each row execute function public.guard_order_update();
