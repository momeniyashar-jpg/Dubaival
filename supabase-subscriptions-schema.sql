-- Launch-readiness items 4-5/8: consumer Pro subscription (usage limit +
-- Stripe). Run this once in Supabase Dashboard -> SQL Editor.

alter table user_profiles add column if not exists is_pro boolean not null default false;
alter table user_profiles add column if not exists stripe_customer_id text;
alter table user_profiles add column if not exists stripe_subscription_id text;
alter table user_profiles add column if not exists pro_since timestamptz;

-- Stripe webhook (api/stripe-webhook.js) needs to look up a user by
-- stripe_customer_id when a subscription event arrives, and updates
-- is_pro using the service-role key (bypasses RLS) — no new policy needed
-- beyond whatever already exists on user_profiles for that service key.
create index if not exists user_profiles_stripe_customer_idx on user_profiles(stripe_customer_id);
