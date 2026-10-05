-- PaliaEats: Step 3 (fix) - explicit table privileges for logged-in users
-- Tables created via SQL get no automatic privileges on this project, so we grant
-- them explicitly. RLS policies (0002) then decide which ROWS each user may touch.

-- Server-side admin client (service role): full access, bypasses RLS by design.
grant all on all tables in schema public to service_role;

-- Logged-in users: read access everywhere RLS allows it
grant select on
  public.profiles,
  public.restaurants,
  public.restaurant_private,
  public.menu_categories,
  public.menu_items,
  public.customer_addresses,
  public.orders,
  public.order_items
to authenticated;

-- Admin writes (RLS limits these to admins)
grant insert, update, delete on
  public.restaurants,
  public.restaurant_private,
  public.menu_categories,
  public.menu_items
to authenticated;

-- Customers manage their own addresses (RLS limits to own rows)
grant insert, update, delete on public.customer_addresses to authenticated;

-- Admin updates order status (RLS limits to admins; trigger limits which changes)
grant update on public.orders to authenticated;

-- profiles: update on full_name/phone only was granted in 0002 (role stays locked).
-- order_items: read-only for everyone; rows are created by the order function.
