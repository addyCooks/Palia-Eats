-- PaliaEats: Step 10 - the secure "place order" function
-- Run once in Supabase Dashboard -> SQL Editor, after 0004_storage.sql.
--
-- Customers cannot insert into orders directly. They call this function, which
-- re-checks EVERYTHING on the server (prices, availability, hours, minimum order,
-- delivery fee) and creates the order and its items in one transaction.
-- Problems are reported with short error codes that the app turns into friendly text.

create function public.place_order(
  p_restaurant_id uuid,
  p_items jsonb,            -- [{ "id": "<menu item id>", "quantity": 2 }, ...]
  p_address_id uuid,
  p_notes text,
  p_expected_total numeric  -- the total the customer saw; must match what we compute
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_profile record;
  v_address record;
  v_restaurant record;
  v_phone text;
  v_notes text := nullif(trim(coalesce(p_notes, '')), '');
  v_now_time time := (now() at time zone 'Asia/Kolkata')::time;  -- restaurants run on Indian time
  v_bad_name text;
  v_subtotal numeric(10, 2);
  v_total numeric(10, 2);
  v_order_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- ---- Shape of the request -------------------------------------------------
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'invalid_items';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_items) as x (id uuid, quantity int)
    where x.id is null or x.quantity is null or x.quantity < 1 or x.quantity > 20
  ) then
    raise exception 'invalid_items';
  end if;

  if (select count(distinct x.id) from jsonb_to_recordset(p_items) as x (id uuid, quantity int))
     <> jsonb_array_length(p_items) then
    raise exception 'invalid_items';  -- the same item listed twice
  end if;

  if v_notes is not null and char_length(v_notes) > 300 then
    raise exception 'notes_too_long';
  end if;

  -- ---- Customer and delivery address (must belong to the caller) ------------
  select full_name, phone into v_profile from public.profiles where id = v_uid;

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

  -- ---- Restaurant: visible, taking orders, and open right now ---------------
  select * into v_restaurant
  from public.restaurants
  where id = p_restaurant_id and is_active;
  if not found then
    raise exception 'restaurant_unavailable';
  end if;

  if not v_restaurant.is_accepting_orders then
    raise exception 'restaurant_paused';
  end if;

  if v_restaurant.opening_time is not null
     and v_restaurant.closing_time is not null
     and v_restaurant.opening_time <> v_restaurant.closing_time then
    if v_restaurant.opening_time < v_restaurant.closing_time then
      -- normal day, e.g. 10:00 - 22:00
      if not (v_now_time >= v_restaurant.opening_time and v_now_time < v_restaurant.closing_time) then
        raise exception 'restaurant_closed';
      end if;
    else
      -- crosses midnight, e.g. 18:00 - 02:00
      if not (v_now_time >= v_restaurant.opening_time or v_now_time < v_restaurant.closing_time) then
        raise exception 'restaurant_closed';
      end if;
    end if;
  end if;

  -- ---- Items: all must exist, belong to THIS restaurant, and be available ----
  select coalesce(mi.name, 'An item') into v_bad_name
  from jsonb_to_recordset(p_items) as x (id uuid, quantity int)
  left join public.menu_items mi
    on mi.id = x.id and mi.restaurant_id = p_restaurant_id
  where mi.id is null or not mi.is_available
  limit 1;
  if found then
    raise exception 'item_unavailable' using detail = v_bad_name;
  end if;

  -- ---- Money: computed here from database prices, never from the browser ----
  select sum(mi.price * x.quantity) into v_subtotal
  from jsonb_to_recordset(p_items) as x (id uuid, quantity int)
  join public.menu_items mi on mi.id = x.id;

  if v_subtotal < v_restaurant.min_order_amount then
    raise exception 'below_minimum' using detail = v_restaurant.min_order_amount::text;
  end if;

  v_total := v_subtotal + v_restaurant.delivery_fee;

  if p_expected_total is distinct from v_total then
    raise exception 'price_changed' using detail = v_total::text;
  end if;

  -- ---- Double-click / retry protection --------------------------------------
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

  -- ---- Simple abuse limit: 5 orders per 10 minutes --------------------------
  if (select count(*) from public.orders
      where customer_id = v_uid and placed_at > now() - interval '10 minutes') >= 5 then
    raise exception 'too_many_orders';
  end if;

  -- ---- Create the order and its items ---------------------------------------
  insert into public.orders (
    customer_id, restaurant_id, subtotal, delivery_fee, total, payment_method,
    customer_name, customer_phone, delivery_address, customer_notes
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
    v_notes
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total)
  select v_order_id, mi.id, mi.name, mi.price, x.quantity, mi.price * x.quantity
  from jsonb_to_recordset(p_items) as x (id uuid, quantity int)
  join public.menu_items mi on mi.id = x.id;

  return v_order_id;
end;
$$;

-- Only logged-in users may call it.
revoke all on function public.place_order(uuid, jsonb, uuid, text, numeric) from public, anon;
grant execute on function public.place_order(uuid, jsonb, uuid, text, numeric) to authenticated;
