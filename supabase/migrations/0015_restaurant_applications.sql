-- PaliaEats restaurant registration
-- Run once in Supabase Dashboard -> SQL Editor, after 0014_open_reminders.sql.
--
-- A restaurant fills in "Add your restaurant" on the website. The request waits for the
-- admin (Admin -> Requests). Approving it creates the restaurant in "setting up" mode:
-- hidden from customers, but its panel already works, so the owner can add the menu
-- and hours from the emailed panel link. The admin makes it visible when it's ready.
--
-- Requests are only ever read or changed by the admin. The public form is saved by the
-- website's server after checking it, so visitors have no access to this table at all.

create table public.restaurant_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  restaurant_name text not null check (char_length(restaurant_name) between 2 and 80),
  owner_name text not null check (char_length(owner_name) between 2 and 80),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  email text not null check (char_length(email) between 5 and 120),
  area text not null check (char_length(area) between 2 and 60),
  address text not null check (char_length(address) between 5 and 300),
  cuisines text[] not null default '{}' check (cardinality(cuisines) <= 10),
  opening_time time,
  closing_time time,
  fssai text check (fssai ~ '^[0-9]{14}$'),
  message text check (char_length(message) <= 600),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null,
  reject_reason text check (char_length(reject_reason) <= 300),
  restaurant_id uuid references public.restaurants (id) on delete set null
);
create index restaurant_applications_status_idx on public.restaurant_applications (status, created_at desc);

alter table public.restaurant_applications enable row level security;

create policy "restaurant applications: admin all"
  on public.restaurant_applications for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.restaurant_applications to authenticated;
grant all on public.restaurant_applications to service_role;
revoke all on public.restaurant_applications from anon;

-- "Setting up": an approved restaurant that isn't visible yet may still use its panel.
-- Cleared when the admin makes the restaurant visible.
alter table public.restaurant_private
  add column setting_up boolean not null default false;
