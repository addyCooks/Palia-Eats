-- PaliaEats favourites
-- Run once in Supabase Dashboard -> SQL Editor, after 0012_v2_features.sql.
--
-- A logged-in customer can heart restaurants (on the cover of the restaurant page) and
-- dishes (in the dish sheet), and finds them again under Account -> Favourites.
-- Each customer only ever sees and changes their own hearts.

create table public.favourite_restaurants (
  user_id uuid not null references public.profiles (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);
create index favourite_restaurants_restaurant_idx on public.favourite_restaurants (restaurant_id);

create table public.favourite_dishes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, menu_item_id)
);
create index favourite_dishes_item_idx on public.favourite_dishes (menu_item_id);

-- ============================================================== row level security
alter table public.favourite_restaurants enable row level security;
alter table public.favourite_dishes enable row level security;

create policy "favourite restaurants: read own"
  on public.favourite_restaurants for select to authenticated
  using (user_id = (select auth.uid()));
-- Only restaurants the customer can see (visible on the website).
create policy "favourite restaurants: add own"
  on public.favourite_restaurants for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.restaurants r where r.id = favourite_restaurants.restaurant_id)
  );
create policy "favourite restaurants: remove own"
  on public.favourite_restaurants for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "favourite dishes: read own"
  on public.favourite_dishes for select to authenticated
  using (user_id = (select auth.uid()));
create policy "favourite dishes: add own"
  on public.favourite_dishes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.menu_items mi where mi.id = favourite_dishes.menu_item_id)
  );
create policy "favourite dishes: remove own"
  on public.favourite_dishes for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.favourite_restaurants, public.favourite_dishes to authenticated;
grant all on public.favourite_restaurants, public.favourite_dishes to service_role;
revoke all on public.favourite_restaurants, public.favourite_dishes from anon;
