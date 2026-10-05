-- PaliaEats: security self-test. Safe to run any time in the Supabase SQL Editor.
-- It creates temporary users/orders, checks the rules for visitor / customer / admin,
-- then ALWAYS rolls everything back. Expected final message:
--   "ALL SECURITY CHECKS PASSED (everything rolled back on purpose)"
-- Any other message starting with FAIL tells you which rule is broken.

do $$
declare
  n int;
  admin_id uuid := gen_random_uuid();
  cust_id  uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid();
  rest_id  uuid;
  order_id uuid;
  exp_rest int;
  exp_items int;
  exp_private int;
  total_orders int;
begin
  select id into rest_id from public.restaurants where slug = 'brown-pizza';
  -- What each person SHOULD see, worked out from the real data, so the test keeps
  -- working when restaurants, menu items or orders are added or removed.
  select count(*) into exp_rest from public.restaurants where is_active;
  select count(*) into exp_items from public.menu_items mi
    join public.restaurants r on r.id = mi.restaurant_id where r.is_active;
  select count(*) into exp_private from public.restaurant_private;

  -- temp users (profiles are created by the signup trigger)
  insert into auth.users (id) values (admin_id), (cust_id), (other_id);
  update public.profiles set role = 'admin' where id = admin_id;
  insert into public.orders
    (customer_id, restaurant_id, subtotal, delivery_fee, total, customer_name, customer_phone, delivery_address)
    values (cust_id, rest_id, 100, 30, 130, 'Cust', '1', '{}')
    returning id into order_id;
  select count(*) into total_orders from public.orders;

  -- ============ Visitor (not logged in) ============
  set local role anon;
  select count(*) into n from public.restaurants;
  if n <> exp_rest then raise exception 'FAIL: visitor should see % restaurants, saw %', exp_rest, n; end if;
  select count(*) into n from public.menu_items;
  if n <> exp_items then raise exception 'FAIL: visitor should see % items, saw %', exp_items, n; end if;
  begin perform 1 from public.orders; raise exception 'FAIL: visitor can read orders';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.profiles; raise exception 'FAIL: visitor can read profiles';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.restaurant_private; raise exception 'FAIL: visitor can read private data';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.notification_log; raise exception 'FAIL: visitor can read the notification log';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.whatsapp_sessions; raise exception 'FAIL: visitor can read WhatsApp sessions';
  exception when insufficient_privilege then null; end;
  begin insert into public.restaurants (slug, name) values ('hack', 'hack'); raise exception 'FAIL: visitor can create restaurant';
  exception when insufficient_privilege then null; end;
  begin update public.menu_items set price = 0; raise exception 'FAIL: visitor can change prices';
  exception when insufficient_privilege then null; end;
  reset role;

  -- ============ Customer ============
  perform set_config('request.jwt.claims', json_build_object('sub', cust_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.restaurants;
  if n <> exp_rest then raise exception 'FAIL: customer should see % restaurants, saw %', exp_rest, n; end if;
  select count(*) into n from public.profiles;
  if n <> 1 then raise exception 'FAIL: customer should see only own profile, saw %', n; end if;
  select count(*) into n from public.orders;
  if n <> 1 then raise exception 'FAIL: customer should see own 1 order, saw %', n; end if;
  select count(*) into n from public.restaurant_private;
  if n <> 0 then raise exception 'FAIL: customer sees private restaurant data'; end if;
  begin update public.profiles set role = 'admin' where id = cust_id; raise exception 'FAIL: customer can change own role';
  exception when insufficient_privilege then null; end;
  update public.profiles set full_name = 'New Name' where id = cust_id;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: customer cannot edit own name'; end if;
  -- WhatsApp: a customer may switch their own updates on/off, but not set a WhatsApp identity,
  -- and can never read the server-only WhatsApp tables or the notification log.
  update public.profiles set whatsapp_opt_in = true where id = cust_id;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: customer cannot switch own WhatsApp updates on'; end if;
  begin update public.profiles set whatsapp_phone = '919999900009' where id = cust_id;
    raise exception 'FAIL: customer can set own whatsapp_phone';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.whatsapp_sessions; raise exception 'FAIL: customer can read WhatsApp sessions';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.whatsapp_processed; raise exception 'FAIL: customer can read WhatsApp message ids';
  exception when insufficient_privilege then null; end;
  select count(*) into n from public.notification_log;
  if n <> 0 then raise exception 'FAIL: customer can read the notification log'; end if;
  begin insert into public.orders (customer_id, restaurant_id, subtotal, delivery_fee, total, customer_name, customer_phone, delivery_address)
    values (cust_id, rest_id, 1, 0, 1, 'x', 'x', '{}'); raise exception 'FAIL: customer can insert orders directly';
  exception when insufficient_privilege then null; end;
  update public.orders set status = 'accepted';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: customer changed order status'; end if;
  update public.restaurants set name = 'hacked';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: customer updated restaurants'; end if;
  insert into public.customer_addresses (user_id, address_line) values (cust_id, 'My home');
  begin insert into public.customer_addresses (user_id, address_line) values (other_id, 'Not mine');
    raise exception 'FAIL: customer added address for someone else';
  exception when insufficient_privilege then null; end;
  reset role;

  -- ============ Another customer ============
  perform set_config('request.jwt.claims', json_build_object('sub', other_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.orders;
  if n <> 0 then raise exception 'FAIL: other customer can see someone elses order'; end if;
  select count(*) into n from public.customer_addresses;
  if n <> 0 then raise exception 'FAIL: other customer can see someone elses address'; end if;
  reset role;

  -- ============ Admin ============
  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.restaurant_private;
  if n <> exp_private then raise exception 'FAIL: admin should see % private rows, saw %', exp_private, n; end if;
  select count(*) into n from public.orders;
  if n <> total_orders then raise exception 'FAIL: admin should see all % orders, saw %', total_orders, n; end if;
  begin update public.orders set status = 'delivered' where id = order_id;
    raise exception 'FAIL: illegal status jump pending -> delivered allowed';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;
  begin update public.orders set total = 1 where id = order_id;
    raise exception 'FAIL: order total could be changed';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;
  begin update public.orders set channel = 'whatsapp' where id = order_id;
    raise exception 'FAIL: order channel could be changed';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;
  update public.orders set status = 'preparing' where id = order_id;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin cannot update order status'; end if;
  begin update public.orders set status = 'pending' where id = order_id;
    raise exception 'FAIL: order status could go backwards';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;
  update public.menu_items set is_available = false where restaurant_id = rest_id;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'FAIL: admin cannot edit menu'; end if;
  reset role;

  -- ============ Server-side admin client (service role) ============
  set local role service_role;
  select count(*) into n from public.orders;
  if n <> total_orders then raise exception 'FAIL: service role cannot read all orders'; end if;
  reset role;

  -- Roll everything back on purpose so no test data remains.
  raise exception 'ALL SECURITY CHECKS PASSED (everything rolled back on purpose)';
end $$;
