-- PaliaEats: security self-test for the "platform foundations" tables and functions (migration 0018):
-- rate limits, crash log, admin activity log, funnel counts, help requests, phone notifications and the
-- account-deletion helper. Safe to run any time in the Supabase SQL Editor. Like rls_check.sql it
-- creates temporary users and data, checks the rules for visitor / customer / admin / server, then
-- ALWAYS rolls everything back. Expected final message:
--   "ALL PLATFORM CHECKS PASSED (everything rolled back on purpose)"

do $$
declare
  n int;
  ok boolean;
  admin_id uuid := gen_random_uuid();
  cust_id  uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid();
  rest_id  uuid;
  order_id uuid;
begin
  select id into rest_id from public.restaurants where slug = 'brown-pizza';
  if rest_id is null then select id into rest_id from public.restaurants limit 1; end if;

  insert into auth.users (id) values (admin_id), (cust_id), (other_id);
  update public.profiles set role = 'admin' where id = admin_id;
  insert into public.orders
    (customer_id, restaurant_id, subtotal, delivery_fee, total, customer_name, customer_phone, delivery_address)
    values (cust_id, rest_id, 100, 30, 130, 'Cust', '1', '{}')
    returning id into order_id;

  insert into public.support_requests (user_id, topic, message)
    values (cust_id, 'Test topic', 'A test message from the customer'),
           (other_id, 'Other topic', 'A test message from someone else');
  insert into public.error_log (fingerprint, source, message) values ('rls-test-error', 'server', 'test');
  insert into public.admin_audit_log (action, summary) values ('test', 'test entry');
  insert into public.funnel_counts (day, event, hits) values (date '2000-01-01', 'visit', 1);

  -- ============ Visitor (not logged in) ============
  set local role anon;
  begin perform 1 from public.rate_limits; raise exception 'FAIL: visitor can read rate limits';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.error_log; raise exception 'FAIL: visitor can read the error log';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.admin_audit_log; raise exception 'FAIL: visitor can read the admin activity log';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.funnel_counts; raise exception 'FAIL: visitor can read funnel counts';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.support_requests; raise exception 'FAIL: visitor can read help requests';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.push_subscriptions; raise exception 'FAIL: visitor can read push subscriptions';
  exception when insufficient_privilege then null; end;
  begin perform public.hit_rate_limit('x', 1, 1); raise exception 'FAIL: visitor can call hit_rate_limit';
  exception when insufficient_privilege then null; end;
  begin perform public.bump_funnel('visit'); raise exception 'FAIL: visitor can call bump_funnel';
  exception when insufficient_privilege then null; end;
  begin perform public.erase_customer(gen_random_uuid()); raise exception 'FAIL: visitor can call erase_customer';
  exception when insufficient_privilege then null; end;
  reset role;

  -- ============ Customer ============
  perform set_config('request.jwt.claims', json_build_object('sub', cust_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  -- help requests are readable by their sender only, and written by the server only
  select count(*) into n from public.support_requests;
  if n <> 1 then raise exception 'FAIL: customer should see only their own help request, saw %', n; end if;
  begin insert into public.support_requests (user_id, topic, message) values (cust_id, 'Direct', 'Direct insert');
    raise exception 'FAIL: customer can add a help request directly';
  exception when insufficient_privilege then null; end;
  update public.support_requests set status = 'closed';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: customer changed a help request'; end if;
  -- the crash log, admin diary, funnel numbers and spam counters are not for customers
  select count(*) into n from public.error_log;
  if n <> 0 then raise exception 'FAIL: customer can read the error log'; end if;
  select count(*) into n from public.admin_audit_log;
  if n <> 0 then raise exception 'FAIL: customer can read the admin activity log'; end if;
  select count(*) into n from public.funnel_counts;
  if n <> 0 then raise exception 'FAIL: customer can read funnel counts'; end if;
  begin perform 1 from public.rate_limits; raise exception 'FAIL: customer can read rate limits';
  exception when insufficient_privilege then null; end;
  begin perform public.hit_rate_limit('x', 1, 1); raise exception 'FAIL: customer can call hit_rate_limit';
  exception when insufficient_privilege then null; end;
  begin perform public.erase_customer(cust_id); raise exception 'FAIL: customer can call erase_customer';
  exception when insufficient_privilege then null; end;
  begin perform public.log_error('server', 'x', null, null, null, null, null);
    raise exception 'FAIL: customer can call log_error';
  exception when insufficient_privilege then null; end;
  -- phone notifications: own only
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
    values (cust_id, 'https://push.example/test-1', 'k', 'a');
  begin insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
      values (other_id, 'https://push.example/test-2', 'k', 'a');
    raise exception 'FAIL: customer added a push subscription for someone else';
  exception when insufficient_privilege then null; end;
  select count(*) into n from public.push_subscriptions;
  if n <> 1 then raise exception 'FAIL: customer should see 1 own push subscription, saw %', n; end if;
  reset role;

  -- ============ Another customer ============
  perform set_config('request.jwt.claims', json_build_object('sub', other_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.support_requests;
  if n <> 1 then raise exception 'FAIL: other customer should see only their own help request, saw %', n; end if;
  select count(*) into n from public.push_subscriptions;
  if n <> 0 then raise exception 'FAIL: other customer can see someone elses push subscriptions'; end if;
  delete from public.push_subscriptions;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: other customer removed someone elses push subscription'; end if;
  reset role;

  -- ============ Admin ============
  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.support_requests;
  if n <> 2 then raise exception 'FAIL: admin should see both help requests, saw %', n; end if;
  update public.support_requests set status = 'answered' where topic = 'Test topic';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin cannot answer a help request'; end if;
  select count(*) into n from public.error_log where fingerprint = 'rls-test-error';
  if n <> 1 then raise exception 'FAIL: admin cannot read the error log'; end if;
  update public.error_log set resolved = true where fingerprint = 'rls-test-error';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin cannot mark a problem fixed'; end if;
  select count(*) into n from public.admin_audit_log;
  if n < 1 then raise exception 'FAIL: admin cannot read the activity log'; end if;
  select count(*) into n from public.funnel_counts where day = date '2000-01-01';
  if n <> 1 then raise exception 'FAIL: admin cannot read funnel counts'; end if;
  -- the admin diary is append-only, and only the server appends
  begin insert into public.admin_audit_log (action, summary) values ('forged', 'forged entry');
    raise exception 'FAIL: admin can write the activity log directly';
  exception when insufficient_privilege then null; end;
  begin update public.admin_audit_log set summary = 'edited';
    raise exception 'FAIL: admin can edit the activity log';
  exception when insufficient_privilege then null; end;
  begin delete from public.admin_audit_log;
    raise exception 'FAIL: admin can delete from the activity log';
  exception when insufficient_privilege then null; end;
  reset role;

  -- ============ Server-side admin client (service role) ============
  set local role service_role;
  ok := public.hit_rate_limit('rls-test-key', 1, 60);
  if not ok then raise exception 'FAIL: the first hit should be allowed'; end if;
  ok := public.hit_rate_limit('rls-test-key', 1, 60);
  if ok then raise exception 'FAIL: the second hit should have been refused'; end if;

  ok := public.log_error('server', 'rls test problem', '/x', E'Error\n  at a', null, null, null);
  if not ok then raise exception 'FAIL: a new problem should be reported as new'; end if;
  ok := public.log_error('server', 'rls test problem', '/x', E'Error\n  at a', null, null, null);
  if ok then raise exception 'FAIL: a repeat of the same problem should not be reported again'; end if;
  update public.error_log set resolved = true where message = 'rls test problem';
  ok := public.log_error('server', 'rls test problem', '/x', E'Error\n  at a', null, null, null);
  if not ok then raise exception 'FAIL: a problem marked fixed that comes back should be reported again'; end if;

  perform public.bump_funnel('visit');
  begin perform public.bump_funnel('not-a-step'); raise exception 'FAIL: bump_funnel took an unknown step';
  exception when check_violation then null; end;

  -- an order nobody answers can be cancelled by the timer ('system'), and nothing else is accepted
  update public.orders set status = 'cancelled', cancelled_by = 'system' where id = order_id;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: the timer cannot cancel an unanswered order'; end if;
  select count(*) into n from public.orders where id = order_id and cancelled_by = 'system';
  if n <> 1 then raise exception 'FAIL: cancelled_by system was not kept'; end if;
  begin update public.orders set cancelled_by = 'hacker' where id = order_id;
    raise exception 'FAIL: an invalid cancelled_by was accepted';
  exception when check_violation then null; end;

  -- deleting an account: refused while an order is on its way, otherwise the order is anonymised
  insert into public.orders
    (customer_id, restaurant_id, subtotal, delivery_fee, total, customer_name, customer_phone, delivery_address)
    values (cust_id, rest_id, 50, 0, 50, 'Cust', '2', '{}')
    returning id into order_id;
  begin perform public.erase_customer(cust_id); raise exception 'FAIL: erase_customer ran with an order in progress';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if;
    if sqlerrm <> 'active_order' then raise exception 'FAIL: wrong error from erase_customer: %', sqlerrm; end if;
  end;
  update public.orders set status = 'preparing' where id = order_id;
  update public.orders set status = 'out_for_delivery' where id = order_id;
  update public.orders set status = 'delivered' where id = order_id;
  perform public.erase_customer(cust_id);
  select count(*) into n from public.orders
    where id = order_id and customer_name = 'Deleted customer' and customer_phone = '';
  if n <> 1 then raise exception 'FAIL: erase_customer did not wipe the order'; end if;
  reset role;

  -- ...and the order survives the login being deleted (the link to the customer is cleared)
  delete from auth.users where id = cust_id;
  select count(*) into n from public.orders where id = order_id and customer_id is null;
  if n <> 1 then raise exception 'FAIL: the order did not survive the customer being deleted'; end if;

  raise exception 'ALL PLATFORM CHECKS PASSED (everything rolled back on purpose)';
end $$;
