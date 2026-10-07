-- PaliaEats: optional "use my current location" on saved addresses
-- Run once in Supabase Dashboard -> SQL Editor, after 0016_order_status_undo.sql.
--
-- A customer may attach their phone's location pin to an address. It is optional.
-- Orders copy it into delivery_address (as lat / lng) so the restaurant and the rider
-- can open the exact spot in Google Maps.
-- place_order_core is the same as in 0012_v2_features.sql, except for those two fields.

alter table public.customer_addresses
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.customer_addresses
  drop constraint if exists customer_addresses_location_check;
alter table public.customer_addresses
  add constraint customer_addresses_location_check check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null
        and latitude between -90 and 90 and longitude between -180 and 180)
  );

-- ================================================================== place_order_core
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
      'phone', v_address.phone,
      'lat', v_address.latitude,
      'lng', v_address.longitude
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
