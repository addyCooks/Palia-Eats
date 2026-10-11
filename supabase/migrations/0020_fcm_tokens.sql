-- Notifications through Firebase Cloud Messaging (FCM), next to the notifications we already send
-- ourselves (web push, 0018). A phone that turned notifications on through Firebase is stored in
-- the same table: its FCM token goes in "endpoint" and it has no p256dh/auth keys.
-- Run once in Supabase Dashboard -> SQL Editor, BEFORE the website version that saves FCM tokens.

alter table public.push_subscriptions
  add column kind text not null default 'webpush' check (kind in ('webpush', 'fcm'));

alter table public.push_subscriptions alter column p256dh drop not null;
alter table public.push_subscriptions alter column auth drop not null;

-- A web push row needs its keys, an FCM row must not have them.
alter table public.push_subscriptions
  add constraint push_subscriptions_keys_match_kind
  check ((kind = 'webpush' and p256dh is not null and auth is not null) or (kind = 'fcm'));
