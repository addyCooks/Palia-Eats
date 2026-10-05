-- PaliaEats Phase 1, section 7: WhatsApp foundation
-- Run once in Supabase Dashboard -> SQL Editor, after 0009_days_off.sql.
--
--   profiles.whatsapp_opt_in   customer agreed to get order updates on WhatsApp
--   profiles.whatsapp_phone    set only for people who order through the WhatsApp bot
--                              (their WhatsApp number, with country code, digits only)
--   whatsapp_sessions          one row per WhatsApp number: where they are in the chat, and
--                              when they last wrote to us (WhatsApp only lets a business send
--                              free-form messages within 24 hours of that)
--   whatsapp_processed         message ids already handled, so WhatsApp retries do nothing
--
-- The two tables are used only by the server (service role). Nobody else can read them.

alter table public.profiles
  add column whatsapp_opt_in boolean not null default false,
  add column whatsapp_phone text unique check (whatsapp_phone ~ '^[0-9]{8,15}$');

-- Customers can switch the opt-in on or off themselves (like their name and phone).
grant update (whatsapp_opt_in) on public.profiles to authenticated;

create table public.whatsapp_sessions (
  phone           text primary key check (phone ~ '^[0-9]{8,15}$'),
  data            jsonb not null default '{}'::jsonb,
  last_inbound_at timestamptz,
  updated_at      timestamptz not null default now()
);

create table public.whatsapp_processed (
  message_id text primary key,
  created_at timestamptz not null default now()
);
create index whatsapp_processed_created_idx on public.whatsapp_processed (created_at);

alter table public.whatsapp_sessions enable row level security;
alter table public.whatsapp_processed enable row level security;
-- No policies on purpose: only the service role (which bypasses RLS) can touch these.

revoke all on public.whatsapp_sessions, public.whatsapp_processed from anon, authenticated;
grant all on public.whatsapp_sessions, public.whatsapp_processed to service_role;
