-- PaliaEats: Step 2 - database schema
-- Run once in Supabase Dashboard -> SQL Editor.
-- Row Level Security is ENABLED here on every table with NO policies yet,
-- which means "deny everything" until Step 3 adds the real policies.

-- =========================================================
-- Enums
-- =========================================================
create type public.user_role as enum ('customer', 'admin');

create type public.order_status as enum (
  'pending',
  'accepted',
  'preparing',
  'out_for_delivery',
  'delivered',
  'rejected',
  'cancelled'
);

create type public.payment_method as enum ('cod');

-- =========================================================
-- Shared helper: keep updated_at current
-- =========================================================
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- profiles (one row per auth user)
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile whenever someone signs up (email or Google).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- restaurants
-- =========================================================
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  tagline text,
  description text,
  about text,
  cuisine_tags text[] not null default '{}',
  phone text,
  address_text text,
  logo_url text,
  cover_url text,
  opening_time time,
  closing_time time,
  min_order_amount numeric(10, 2) not null default 0 check (min_order_amount >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  -- Branding / custom storefront
  theme jsonb not null default '{}'::jsonb,
  template_key text,
  -- Order notifications + private restaurant panel (no passwords, secret link)
  notification_email text,
  notification_phone text,
  panel_key_hash text,
  panel_key_created_at timestamptz,
  -- Switches
  is_accepting_orders boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger restaurants_set_updated_at
  before update on public.restaurants
  for each row execute function public.set_updated_at();

-- =========================================================
-- menu_categories
-- =========================================================
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  -- lets menu_items prove its category belongs to the same restaurant
  unique (id, restaurant_id)
);

create index menu_categories_restaurant_idx
  on public.menu_categories (restaurant_id, sort_order);

-- =========================================================
-- menu_items
-- =========================================================
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  is_veg boolean not null default true,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- the category must belong to the SAME restaurant
  -- (a category with items can't be deleted until its items are moved)
  foreign key (category_id, restaurant_id)
    references public.menu_categories (id, restaurant_id)
);

create index menu_items_restaurant_idx
  on public.menu_items (restaurant_id, sort_order);

create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- =========================================================
-- customer_addresses
-- =========================================================
create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default 'Home',
  address_line text not null,
  landmark text,
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_addresses_user_idx
  on public.customer_addresses (user_id);

-- at most one default address per user
create unique index customer_addresses_one_default_idx
  on public.customer_addresses (user_id)
  where is_default;

create trigger customer_addresses_set_updated_at
  before update on public.customer_addresses
  for each row execute function public.set_updated_at();

-- =========================================================
-- orders
-- =========================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- friendly number shown to people: 1001, 1002, ...
  order_number bigint generated always as identity (start with 1001) unique,
  customer_id uuid not null references public.profiles (id),
  restaurant_id uuid not null references public.restaurants (id),
  status public.order_status not null default 'pending',
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  payment_method public.payment_method not null default 'cod',
  -- Snapshots: copied at order time so later edits don't change old orders
  customer_name text not null,
  customer_phone text not null,
  delivery_address jsonb not null,
  customer_notes text,
  rejection_reason text,
  placed_at timestamptz not null default now(),
  status_updated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_idx
  on public.orders (customer_id, placed_at desc);

create index orders_restaurant_idx
  on public.orders (restaurant_id, status, placed_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- =========================================================
-- order_items
-- =========================================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- kept as a link only; name/price below are the permanent snapshot
  menu_item_id uuid references public.menu_items (id) on delete set null,
  item_name text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10, 2) not null check (line_total >= 0)
);

create index order_items_order_idx
  on public.order_items (order_id);

-- =========================================================
-- Row Level Security: ON everywhere, no policies yet (deny all)
-- =========================================================
alter table public.profiles           enable row level security;
alter table public.restaurants        enable row level security;
alter table public.menu_categories    enable row level security;
alter table public.menu_items         enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
