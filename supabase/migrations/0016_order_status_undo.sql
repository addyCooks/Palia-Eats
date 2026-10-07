-- PaliaEats: undo a mistaken status tap
-- Run once in Supabase Dashboard -> SQL Editor, after 0015_restaurant_applications.sql.
--
-- The restaurant (or admin) can move an order ONE step back:
--   Cooking -> New, On the way -> Cooking, Delivered -> On the way.
-- Forward moves are unchanged; jumps and anything after a cancellation stay blocked.
-- Everything else in the order guard is the same as in 0012_v2_features.sql.

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
      -- forward
      (old.status in ('pending', 'accepted') and new.status in ('preparing', 'cancelled'))
      or (old.status = 'preparing'        and new.status in ('out_for_delivery', 'cancelled'))
      or (old.status = 'out_for_delivery' and new.status in ('delivered', 'cancelled'))
      -- one step back, to undo a mistaken tap
      or (old.status = 'preparing'        and new.status = 'pending')
      or (old.status = 'out_for_delivery' and new.status = 'preparing')
      or (old.status = 'delivered'        and new.status = 'out_for_delivery')
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

-- The reminder timer now calls the site on its own domain.
update public.cron_keys
   set url = 'https://www.paliaeats.online/api/cron/open-reminders'
 where name = 'open_reminders';
