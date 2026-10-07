-- PaliaEats: self-test for place_order(). Safe to run any time in the SQL Editor.
-- Needs the sample restaurants (brown-pizza, blue-cafe) from seed.sql.
-- Uses temporary users/orders and ALWAYS rolls back. Expected final message:
--   "ALL PLACE_ORDER CHECKS PASSED (everything rolled back on purpose)"

do $$
declare
  cust_id  uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid();
  rest_id  uuid;
  other_rest_item uuid;
  item1 uuid;
  item2 uuid;
  addr_id  uuid;
  other_addr_id uuid;
  fee numeric;
  expected numeric;
  good_items jsonb;
  order1 uuid;
  order2 uuid;
  order3 uuid;
  n int;
  t numeric;
  win_start time := ((now() at time zone 'Asia/Kolkata') + interval '2 hours')::time;
  win_end   time := ((now() at time zone 'Asia/Kolkata') + interval '3 hours')::time;
begin
  select id, delivery_fee into rest_id, fee from public.restaurants where slug = 'brown-pizza';
  select id into item1 from public.menu_items where restaurant_id = rest_id and name = 'Margherita';
  select id into item2 from public.menu_items where restaurant_id = rest_id and name = 'Farmhouse';
  select mi.id into other_rest_item from public.menu_items mi
    join public.restaurants r on r.id = mi.restaurant_id where r.slug = 'blue-cafe' limit 1;
  if rest_id is null or item1 is null or item2 is null or other_rest_item is null then
    raise exception 'SETUP: sample data missing (need brown-pizza Margherita + Farmhouse, and blue-cafe items)';
  end if;

  -- Make the test independent of the real opening hours, minimum, and sold-out switches
  update public.restaurants set opening_time = null, closing_time = null,
    min_order_amount = 150, is_active = true, is_accepting_orders = true where id = rest_id;
  update public.menu_items set is_available = true where id in (item1, item2);

  insert into auth.users (id) values (cust_id), (other_id);
  update public.profiles set full_name = 'Test Customer', phone = '9876543210' where id = cust_id;
  update public.profiles set full_name = 'Other Person', phone = '9123456780' where id = other_id;
  insert into public.customer_addresses (user_id, label, address_line, is_default, latitude, longitude)
    values (cust_id, 'Home', '12 Test Street', true, 28.432, 80.581) returning id into addr_id;
  insert into public.customer_addresses (user_id, label, address_line, is_default)
    values (other_id, 'Home', '99 Other Street', true) returning id into other_addr_id;

  good_items := jsonb_build_array(
    jsonb_build_object('id', item1, 'quantity', 2),
    jsonb_build_object('id', item2, 'quantity', 1));
  expected := 199.00 * 2 + 279.00 + fee;

  perform set_config('request.jwt.claims',
    json_build_object('sub', cust_id, 'role', 'authenticated')::text, true);

  -- ============ 1. Happy path ============
  set local role authenticated;
  order1 := public.place_order(rest_id, good_items, addr_id, '  Extra cheese please  ', expected);
  reset role;

  select count(*) into n from public.orders
    where id = order1 and customer_id = cust_id and status = 'pending'
      and subtotal = 677.00 and delivery_fee = fee and total = expected
      and customer_name = 'Test Customer' and customer_phone = '9876543210'
      and customer_notes = 'Extra cheese please'
      and delivery_address ->> 'address_line' = '12 Test Street'
      and (delivery_address ->> 'lat')::float8 = 28.432
      and (delivery_address ->> 'lng')::float8 = 80.581;
  if n <> 1 then raise exception 'FAIL: order was not created with the right values (incl. location pin)'; end if;

  -- A location pin needs both halves, inside the map.
  begin
    insert into public.customer_addresses (user_id, label, address_line, latitude)
      values (cust_id, 'Half pin', '1 Test', 28.4);
    raise exception 'FAIL: half a location pin was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.customer_addresses (user_id, label, address_line, latitude, longitude)
      values (cust_id, 'Bad pin', '1 Test', 128.4, 80.5);
    raise exception 'FAIL: a location pin off the map was accepted';
  exception when check_violation then null;
  end;
  select count(*) into n from public.order_items
    where order_id = order1 and item_name in ('Margherita', 'Farmhouse');
  if n <> 2 then raise exception 'FAIL: order items missing'; end if;
  select line_total into t from public.order_items where order_id = order1 and item_name = 'Margherita';
  if t <> 398.00 then raise exception 'FAIL: line total wrong (%)', t; end if;

  -- ============ 2. Double-click returns the SAME order ============
  set local role authenticated;
  order2 := public.place_order(rest_id, good_items, addr_id, null, expected);
  reset role;
  if order2 <> order1 then raise exception 'FAIL: duplicate click created a second order'; end if;

  -- ============ 3. Wrong expected total ============
  set local role authenticated;
  begin
    perform public.place_order(rest_id, good_items, addr_id, null, expected - 1);
    raise exception 'FAIL: expected price_changed';
  exception when others then
    if sqlerrm <> 'price_changed' then raise exception 'FAIL: expected price_changed, got: %', sqlerrm; end if;
  end;

  -- ============ 4. Item from another restaurant ============
  begin
    perform public.place_order(rest_id,
      jsonb_build_array(jsonb_build_object('id', other_rest_item, 'quantity', 1)), addr_id, null, 0);
    raise exception 'FAIL: expected item_unavailable (other restaurant)';
  exception when others then
    if sqlerrm <> 'item_unavailable' then raise exception 'FAIL: expected item_unavailable, got: %', sqlerrm; end if;
  end;

  -- ============ 5. Someone else's address ============
  begin
    perform public.place_order(rest_id, good_items, other_addr_id, null, expected);
    raise exception 'FAIL: expected invalid_address';
  exception when others then
    if sqlerrm <> 'invalid_address' then raise exception 'FAIL: expected invalid_address, got: %', sqlerrm; end if;
  end;

  -- ============ 6. Bad quantities and duplicate lines ============
  begin
    perform public.place_order(rest_id,
      jsonb_build_array(jsonb_build_object('id', item1, 'quantity', 0)), addr_id, null, 0);
    raise exception 'FAIL: expected invalid_items (quantity 0)';
  exception when others then
    if sqlerrm <> 'invalid_items' then raise exception 'FAIL: expected invalid_items (0), got: %', sqlerrm; end if;
  end;
  begin
    perform public.place_order(rest_id,
      jsonb_build_array(jsonb_build_object('id', item1, 'quantity', 21)), addr_id, null, 0);
    raise exception 'FAIL: expected invalid_items (quantity 21)';
  exception when others then
    if sqlerrm <> 'invalid_items' then raise exception 'FAIL: expected invalid_items (21), got: %', sqlerrm; end if;
  end;
  begin
    perform public.place_order(rest_id,
      jsonb_build_array(jsonb_build_object('id', item1, 'quantity', 1),
                        jsonb_build_object('id', item1, 'quantity', 1)), addr_id, null, 0);
    raise exception 'FAIL: expected invalid_items (duplicate)';
  exception when others then
    if sqlerrm <> 'invalid_items' then raise exception 'FAIL: expected invalid_items (dup), got: %', sqlerrm; end if;
  end;
  begin
    perform public.place_order(rest_id, '[]'::jsonb, addr_id, null, 0);
    raise exception 'FAIL: expected invalid_items (empty)';
  exception when others then
    if sqlerrm <> 'invalid_items' then raise exception 'FAIL: expected invalid_items (empty), got: %', sqlerrm; end if;
  end;
  begin
    perform public.place_order(rest_id, good_items, addr_id, repeat('x', 301), expected);
    raise exception 'FAIL: expected notes_too_long';
  exception when others then
    if sqlerrm <> 'notes_too_long' then raise exception 'FAIL: expected notes_too_long, got: %', sqlerrm; end if;
  end;
  reset role;

  -- ============ 7. Sold-out item ============
  update public.menu_items set is_available = false where id = item2;
  set local role authenticated;
  begin
    perform public.place_order(rest_id, good_items, addr_id, null, expected);
    raise exception 'FAIL: expected item_unavailable (sold out)';
  exception when others then
    if sqlerrm <> 'item_unavailable' then raise exception 'FAIL: expected item_unavailable (sold out), got: %', sqlerrm; end if;
  end;
  reset role;
  update public.menu_items set is_available = true where id = item2;

  -- ============ 8. Below the minimum order ============
  update public.restaurants set min_order_amount = 10000 where id = rest_id;
  set local role authenticated;
  begin
    perform public.place_order(rest_id, good_items, addr_id, null, expected);
    raise exception 'FAIL: expected below_minimum';
  exception when others then
    if sqlerrm <> 'below_minimum' then raise exception 'FAIL: expected below_minimum, got: %', sqlerrm; end if;
  end;
  reset role;
  update public.restaurants set min_order_amount = 150 where id = rest_id;

  -- ============ 9. Paused / hidden / closed restaurant ============
  update public.restaurants set is_accepting_orders = false where id = rest_id;
  set local role authenticated;
  begin
    perform public.place_order(rest_id, good_items, addr_id, null, expected);
    raise exception 'FAIL: expected restaurant_paused';
  exception when others then
    if sqlerrm <> 'restaurant_paused' then raise exception 'FAIL: expected restaurant_paused, got: %', sqlerrm; end if;
  end;
  reset role;
  update public.restaurants set is_accepting_orders = true, is_active = false where id = rest_id;
  set local role authenticated;
  begin
    perform public.place_order(rest_id, good_items, addr_id, null, expected);
    raise exception 'FAIL: expected restaurant_unavailable';
  exception when others then
    if sqlerrm <> 'restaurant_unavailable' then raise exception 'FAIL: expected restaurant_unavailable, got: %', sqlerrm; end if;
  end;
  reset role;
  update public.restaurants set is_active = true, opening_time = win_start, closing_time = win_end where id = rest_id;
  set local role authenticated;
  begin
    perform public.place_order(rest_id, good_items, addr_id, null, expected);
    raise exception 'FAIL: expected restaurant_closed';
  exception when others then
    if sqlerrm <> 'restaurant_closed' then raise exception 'FAIL: expected restaurant_closed, got: %', sqlerrm; end if;
  end;
  reset role;
  update public.restaurants set opening_time = null, closing_time = null where id = rest_id;

  -- ============ 9b. Day off (closed today, even with no opening hours) ============
  update public.restaurants
    set closed_days = array[extract(dow from (now() at time zone 'Asia/Kolkata'))::int]::smallint[]
    where id = rest_id;
  set local role authenticated;
  begin
    perform public.place_order(rest_id, good_items, addr_id, null, expected);
    raise exception 'FAIL: expected restaurant_closed (day off)';
  exception when others then
    if sqlerrm <> 'restaurant_closed' then raise exception 'FAIL: expected restaurant_closed (day off), got: %', sqlerrm; end if;
  end;
  reset role;
  -- A different weekday off must NOT block today's orders; the 15 s double-click rule
  -- returns the existing order, which proves the order went through the hours check.
  update public.restaurants
    set closed_days = array[(extract(dow from (now() at time zone 'Asia/Kolkata'))::int + 1) % 7]::smallint[]
    where id = rest_id;
  set local role authenticated;
  order2 := public.place_order(rest_id, good_items, addr_id, null, expected);
  reset role;
  if order2 <> order1 then raise exception 'FAIL: another day off blocked today''s order'; end if;
  update public.restaurants set closed_days = '{}' where id = rest_id;

  -- ============ 9c. Menu changes AFTER ordering never rewrite the order ============
  update public.menu_items set price = price + 50 where id = item1;
  select unit_price into t from public.order_items where order_id = order1 and item_name = 'Margherita';
  if t <> 199.00 then raise exception 'FAIL: a later price change altered a past order (%)', t; end if;
  delete from public.menu_items where id = item2;
  select count(*) into n from public.order_items
    where order_id = order1 and item_name = 'Farmhouse' and menu_item_id is null and unit_price = 279.00;
  if n <> 1 then raise exception 'FAIL: deleting a dish damaged a past order'; end if;
  -- put the dish back for the remaining checks
  insert into public.menu_items (id, restaurant_id, category_id, name, price, is_available)
    select item2, restaurant_id, category_id, 'Farmhouse', 279.00, true
    from public.menu_items where id = item1;
  update public.menu_items set price = 199.00 where id = item1;

  -- ============ 10. No phone number anywhere ============
  update public.profiles set phone = null where id = cust_id;
  set local role authenticated;
  begin
    perform public.place_order(rest_id, good_items, addr_id, null, expected);
    raise exception 'FAIL: expected phone_required';
  exception when others then
    if sqlerrm <> 'phone_required' then raise exception 'FAIL: expected phone_required, got: %', sqlerrm; end if;
  end;
  reset role;
  update public.profiles set phone = '9876543210' where id = cust_id;

  -- ============ 11. Not logged in ============
  set local role anon;
  begin
    perform public.place_order(rest_id, good_items, addr_id, null, expected);
    raise exception 'FAIL: visitor could call place_order';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- ============ 11b. A logged-in user cannot call place_order_core ============
  -- (it takes the customer id as an argument, so they could order as someone else)
  set local role authenticated;
  begin
    perform public.place_order_core(other_id, 'web', rest_id, good_items, other_addr_id, null, expected);
    raise exception 'FAIL: a logged-in user could call place_order_core';
  exception when insufficient_privilege then null;
  end;
  reset role;
  set local role anon;
  begin
    perform public.place_order_core(other_id, 'web', rest_id, good_items, other_addr_id, null, expected);
    raise exception 'FAIL: a visitor could call place_order_core';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- ============ 11c. The server can place a WhatsApp order (same rules, channel whatsapp) ============
  select count(*) into n from public.orders where id = order1 and channel = 'web';
  if n <> 1 then raise exception 'FAIL: website orders must be recorded with channel web'; end if;
  set local role service_role;
  order2 := public.place_order_core(other_id, 'whatsapp', rest_id, good_items, other_addr_id, null, expected);
  reset role;
  select count(*) into n from public.orders where id = order2 and customer_id = other_id and channel = 'whatsapp';
  if n <> 1 then raise exception 'FAIL: WhatsApp order not created with channel whatsapp'; end if;
  update public.menu_items set is_available = false where id = item2;
  set local role service_role;
  begin
    perform public.place_order_core(other_id, 'whatsapp', rest_id, good_items, other_addr_id, null, expected);
    raise exception 'FAIL: WhatsApp order ignored the sold-out rule';
  exception when others then
    if sqlerrm <> 'item_unavailable' then raise exception 'FAIL: expected item_unavailable (whatsapp), got: %', sqlerrm; end if;
  end;
  reset role;
  update public.menu_items set is_available = true where id = item2;

  -- ============ 11d. Half plates ============
  update public.menu_items set half_price = null where id = item1;
  set local role authenticated;
  begin
    perform public.place_order(rest_id,
      jsonb_build_array(jsonb_build_object('id', item1, 'quantity', 1, 'variant', 'half')), addr_id, null, 0);
    raise exception 'FAIL: expected item_unavailable (dish has no half plate)';
  exception when others then
    if sqlerrm <> 'item_unavailable' then raise exception 'FAIL: expected item_unavailable (no half), got: %', sqlerrm; end if;
  end;
  reset role;
  update public.menu_items set half_price = 120.00 where id = item1;
  set local role authenticated;
  begin
    perform public.place_order(rest_id,
      jsonb_build_array(jsonb_build_object('id', item1, 'quantity', 1, 'variant', 'quarter')), addr_id, null, 0);
    raise exception 'FAIL: expected invalid_items (unknown variant)';
  exception when others then
    if sqlerrm <> 'invalid_items' then raise exception 'FAIL: expected invalid_items (variant), got: %', sqlerrm; end if;
  end;
  begin
    perform public.place_order(rest_id,
      jsonb_build_array(jsonb_build_object('id', item1, 'quantity', 1, 'variant', 'half'),
                        jsonb_build_object('id', item1, 'quantity', 1, 'variant', 'half')), addr_id, null, 0);
    raise exception 'FAIL: expected invalid_items (duplicate half line)';
  exception when others then
    if sqlerrm <> 'invalid_items' then raise exception 'FAIL: expected invalid_items (dup half), got: %', sqlerrm; end if;
  end;
  -- Half and full of the same dish in one order is fine: 2 x 120 + 1 x 199 + 1 x 279 = 718
  order3 := public.place_order(rest_id,
    jsonb_build_array(jsonb_build_object('id', item1, 'quantity', 2, 'variant', 'half'),
                      jsonb_build_object('id', item1, 'quantity', 1, 'variant', 'full'),
                      jsonb_build_object('id', item2, 'quantity', 1)), addr_id, null, 718.00 + fee);
  reset role;
  select count(*) into n from public.orders where id = order3 and subtotal = 718.00;
  if n <> 1 then raise exception 'FAIL: half-plate order total wrong'; end if;
  select count(*) into n from public.order_items
    where order_id = order3 and item_name = 'Margherita (Half)' and variant = 'half'
      and unit_price = 120.00 and quantity = 2 and line_total = 240.00;
  if n <> 1 then raise exception 'FAIL: half-plate line not saved correctly'; end if;
  select count(*) into n from public.order_items
    where order_id = order3 and variant = 'full' and item_name in ('Margherita', 'Farmhouse');
  if n <> 2 then raise exception 'FAIL: full-plate lines not saved correctly'; end if;

  -- ============ 11e. Blocked customer ============
  update public.profiles set is_blocked = true where id = cust_id;
  set local role authenticated;
  begin
    perform public.place_order(rest_id, good_items, addr_id, null, expected);
    raise exception 'FAIL: expected account_blocked';
  exception when others then
    if sqlerrm <> 'account_blocked' then raise exception 'FAIL: expected account_blocked, got: %', sqlerrm; end if;
  end;
  reset role;
  update public.profiles set is_blocked = false where id = cust_id;

  -- ============ 11f. Status timeline and ratings ============
  select count(*) into n from public.order_status_events where order_id = order3 and status = 'pending';
  if n <> 1 then raise exception 'FAIL: placing an order did not log a pending event'; end if;
  set local role authenticated;
  begin
    insert into public.order_ratings (order_id, customer_id, restaurant_id, stars) values (order3, cust_id, rest_id, 5);
    raise exception 'FAIL: rated an order that was not delivered yet';
  exception when insufficient_privilege then null;
  end;
  reset role;
  update public.orders set status = 'preparing' where id = order3;
  update public.orders set status = 'out_for_delivery' where id = order3;
  update public.orders set status = 'delivered' where id = order3;
  select count(*) into n from public.order_status_events where order_id = order3;
  if n <> 4 then raise exception 'FAIL: expected 4 status events, got %', n; end if;
  -- someone else's delivered order cannot be rated
  update public.orders set status = 'preparing' where id = order2;
  update public.orders set status = 'out_for_delivery' where id = order2;
  update public.orders set status = 'delivered' where id = order2;
  set local role authenticated;
  begin
    insert into public.order_ratings (order_id, customer_id, restaurant_id, stars) values (order2, cust_id, rest_id, 1);
    raise exception 'FAIL: rated someone else''s order';
  exception when insufficient_privilege then null;
  end;
  insert into public.order_ratings (order_id, customer_id, restaurant_id, stars, comment)
    values (order3, cust_id, rest_id, 4, 'Good');
  begin
    insert into public.order_ratings (order_id, customer_id, restaurant_id, stars) values (order3, cust_id, rest_id, 1);
    raise exception 'FAIL: rated the same order twice';
  exception when unique_violation then null;
  end;
  reset role;
  select count(*) into n from public.restaurants r
    where r.id = rest_id
      and r.rating_count = (select count(*) from public.order_ratings where restaurant_id = rest_id)
      and r.rating_avg = (select round(avg(stars)::numeric, 1) from public.order_ratings where restaurant_id = rest_id);
  if n <> 1 then raise exception 'FAIL: restaurant rating was not updated'; end if;

  -- ============ 12. Order limit (5 per 10 minutes) ============
  -- 2 orders exist already; add 4 more directly, then a different order must be refused.
  insert into public.orders (customer_id, restaurant_id, subtotal, delivery_fee, total, customer_name, customer_phone, delivery_address)
  select cust_id, rest_id, 1, 0, 1, 'x', 'x', '{}' from generate_series(1, 4);
  set local role authenticated;
  begin
    perform public.place_order(rest_id,
      jsonb_build_array(jsonb_build_object('id', item1, 'quantity', 1),
                        jsonb_build_object('id', item2, 'quantity', 1)), addr_id, null, 478.00 + fee);
    raise exception 'FAIL: expected too_many_orders';
  exception when others then
    if sqlerrm <> 'too_many_orders' then raise exception 'FAIL: expected too_many_orders, got: %', sqlerrm; end if;
  end;
  reset role;

  raise exception 'ALL PLACE_ORDER CHECKS PASSED (everything rolled back on purpose)';
end $$;
