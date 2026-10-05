-- PaliaEats: simpler order flow (no accept/reject step)
-- Run once in Supabase Dashboard -> SQL Editor, after 0005_place_order.sql.
--
-- A new order is placed straight away (status "pending", shown to people as
-- "Order placed"). The restaurant then moves it along:
--   pending -> preparing (Cooking) -> out_for_delivery -> delivered
-- and may cancel it at any point before delivery.
-- The older values "accepted" and "rejected" stay in the enum (Postgres can't drop
-- enum values easily) but are no longer used; "accepted" is still allowed to move on
-- so any old order wouldn't get stuck.

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
     or new.order_number <> old.order_number then
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

  return new;
end;
$$;
