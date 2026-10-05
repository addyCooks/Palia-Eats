-- PaliaEats Phase 1, section 1: order foundation
-- Run once in Supabase Dashboard -> SQL Editor, after 0007_realtime.sql.
--
-- Adds:
--   * orders.channel       where an order came from ('web' now, 'whatsapp' later)
--   * orders.cancelled_by  who cancelled it (restaurant / admin / customer)
--   * notification_log     a record of every email (later WhatsApp) we try to send,
--                          so failures are visible instead of silent
-- Nothing existing is removed or renamed.

-- ---- Order channel and cancelled_by ----
create type public.order_channel as enum ('web', 'whatsapp');

alter table public.orders
  add column channel public.order_channel not null default 'web',
  add column cancelled_by text check (cancelled_by in ('restaurant', 'admin', 'customer'));

-- The channel is fixed when the order is created, like the money fields.
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
      (old.status in ('pending', 'accepted') and new.status in ('preparing', 'cancelled'))
      or (old.status = 'preparing'        and new.status in ('out_for_delivery', 'cancelled'))
      or (old.status = 'out_for_delivery' and new.status in ('delivered', 'cancelled'))
    ) then
      raise exception 'Invalid order status change: % -> %', old.status, new.status;
    end if;
    new.status_updated_at = now();
  end if;

  -- cancelled_by only makes sense on a cancelled order.
  if new.status <> 'cancelled' then
    new.cancelled_by = null;
  end if;

  return new;
end;
$$;

-- ---- Notification log ----
create table public.notification_log (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid references public.orders (id) on delete cascade,
  channel        text not null check (channel in ('email', 'whatsapp')),
  recipient_type text not null check (recipient_type in ('restaurant', 'customer')),
  event          text not null,   -- e.g. order_placed, status_preparing, order_cancelled
  recipient      text,            -- email address / phone number the message went to
  status         text not null check (status in ('sent', 'failed', 'skipped')),
  error          text,
  attempts       integer not null default 1,
  created_at     timestamptz not null default now()
);

create index notification_log_order_idx on public.notification_log (order_id, created_at desc);
create index notification_log_failed_idx on public.notification_log (created_at desc) where status = 'failed';

-- Safety net against double-sending: at most one SUCCESSFUL send per order, event,
-- channel and recipient type.
create unique index notification_log_sent_once
  on public.notification_log (order_id, event, channel, recipient_type)
  where status = 'sent';

alter table public.notification_log enable row level security;

-- Only admins can read it. Writes happen server-side with the service role (bypasses RLS).
create policy "Admins can read the notification log"
  on public.notification_log for select
  to authenticated
  using (public.is_admin());

grant select on public.notification_log to authenticated;
grant all on public.notification_log to service_role;
