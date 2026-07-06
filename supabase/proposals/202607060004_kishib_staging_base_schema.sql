-- KISHIB STAGING BASE SCHEMA
-- TARGET PROJECT REF: hvjwjbomfsuwaauolgyh (STAGING ONLY)
-- REVIEW/RUN MANUALLY IN THE STAGING SQL EDITOR. DO NOT RUN ON PRODUCTION.
-- Creates structure only. It inserts no users and copies no production data.
-- No secrets, URLs, API keys, or service-role key values are stored here.

begin;
select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('kishib_staging_base_schema_v1'));

create extension if not exists pgcrypto;

-- Shared updated_at trigger for staging-owned public tables.
create or replace function public.set_kishib_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) Minimal application profile. auth.users remains Supabase-managed.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text null,
  full_name text null,
  avatar_url text null,
  phone text null,
  gender text null,
  country text null,
  country_code text null,
  country_name_en text null,
  city text null,
  province text null,
  province_code text null,
  province_name_en text null,
  provider text null,
  app_language text null,
  device_locale text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_gender_check
    check (gender is null or gender in ('male','female','prefer_not_to_say'))
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_kishib_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select to authenticated
using (auth.uid()=id);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
on public.profiles for insert to authenticated
with check (auth.uid()=id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update to authenticated
using (auth.uid()=id) with check (auth.uid()=id);

revoke all on public.profiles from anon;
revoke delete,truncate,references,trigger on public.profiles from authenticated;
grant select,insert,update on public.profiles to authenticated;

-- 2) Free credits, subscription state and lifetime entitlement.
create table if not exists public.user_usage_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  free_limit integer not null default 5,
  used_count integer not null default 0,
  subscription_status text not null default 'inactive',
  subscription_plan text null,
  subscription_started_at timestamptz null,
  subscription_ends_at timestamptz null,
  access_type text not null default 'free_trial',
  is_lifetime_free boolean not null default false,
  lifetime_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_usage_limits_free_limit_check check (free_limit>=0),
  constraint user_usage_limits_used_count_check check (used_count>=0),
  constraint user_usage_limits_access_type_check
    check (access_type in ('free_trial','paid_monthly','paid_yearly','lifetime_free','admin'))
);

create index if not exists user_usage_limits_subscription_idx
  on public.user_usage_limits (subscription_status,subscription_ends_at);

create or replace function public.set_user_usage_limits_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at=now();
  return new;
end;
$$;

drop trigger if exists set_user_usage_limits_updated_at on public.user_usage_limits;
create trigger set_user_usage_limits_updated_at
before update on public.user_usage_limits
for each row execute function public.set_user_usage_limits_updated_at();

alter table public.user_usage_limits enable row level security;

drop policy if exists "Users can read own usage limits" on public.user_usage_limits;
create policy "Users can read own usage limits"
on public.user_usage_limits for select to authenticated
using (auth.uid()=user_id);

-- Intentionally no client INSERT/UPDATE/DELETE policy.
revoke all on public.user_usage_limits from public,anon,authenticated;
grant select on public.user_usage_limits to authenticated;

-- Read-only entitlement RPC used by the UI. It may create only a safe default row.
create or replace function public.can_user_analyze()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_user_id uuid:=auth.uid();
  usage_row public.user_usage_limits%rowtype;
  lifetime_access boolean:=false;
  active_subscription boolean:=false;
  remaining integer:=0;
  allowed boolean:=false;
  reason text:='auth_required';
begin
  if current_user_id is null then
    return jsonb_build_object(
      'canAnalyze',false,'remainingCredits',0,'usedCount',0,'freeLimit',5,
      'subscriptionStatus','inactive','accessType','free_trial',
      'isLifetimeFree',false,'reason','auth_required'
    );
  end if;

  insert into public.user_usage_limits
    (user_id,free_limit,used_count,subscription_status,access_type,is_lifetime_free)
  values (current_user_id,5,0,'inactive','free_trial',false)
  on conflict (user_id) do nothing;

  select * into usage_row from public.user_usage_limits
  where user_id=current_user_id;

  lifetime_access:=usage_row.is_lifetime_free
    or usage_row.access_type in ('lifetime_free','admin');
  active_subscription:=usage_row.subscription_status='active'
    and usage_row.subscription_ends_at is not null
    and usage_row.subscription_ends_at>now();
  remaining:=greatest(usage_row.free_limit-usage_row.used_count,0);
  allowed:=lifetime_access or active_subscription
    or usage_row.used_count<usage_row.free_limit;

  if lifetime_access then reason:='lifetime_access';
  elsif active_subscription then reason:='subscription_active';
  elsif usage_row.used_count<usage_row.free_limit then reason:='free_credits_available';
  else reason:='limit_reached';
  end if;

  return jsonb_build_object(
    'canAnalyze',allowed,'remainingCredits',remaining,
    'usedCount',usage_row.used_count,'freeLimit',usage_row.free_limit,
    'subscriptionStatus',case when lifetime_access then 'lifetime_free'
                              else usage_row.subscription_status end,
    'accessType',usage_row.access_type,
    'isLifetimeFree',lifetime_access,'reason',reason
  );
end;
$$;

revoke all on function public.can_user_analyze() from public,anon;
grant execute on function public.can_user_analyze() to authenticated;

-- Optional staging/admin helper. Never callable from browser roles.
create or replace function public.grant_lifetime_access_by_email(
  target_email text,
  reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  target_user_id uuid;
begin
  select id into target_user_id from auth.users
  where lower(email)=lower(target_email) limit 1;
  if target_user_id is null then
    return jsonb_build_object('success',false,'message','No auth user found');
  end if;

  insert into public.user_usage_limits
    (user_id,free_limit,used_count,subscription_status,subscription_plan,
     subscription_started_at,subscription_ends_at,access_type,is_lifetime_free,lifetime_reason)
  values
    (target_user_id,5,0,'active','lifetime_free',now(),null,
     'lifetime_free',true,reason)
  on conflict (user_id) do update set
    subscription_status='active',subscription_plan='lifetime_free',
    subscription_started_at=now(),subscription_ends_at=null,
    access_type='lifetime_free',is_lifetime_free=true,
    lifetime_reason=excluded.lifetime_reason,updated_at=now();

  return jsonb_build_object('success',true,'userId',target_user_id);
end;
$$;

revoke all on function public.grant_lifetime_access_by_email(text,text)
  from public,anon,authenticated;
grant execute on function public.grant_lifetime_access_by_email(text,text)
  to service_role;

-- 3) Saved evaluation results. New writes are server-side only.
create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text null,
  user_name text null,
  user_phone text null,
  user_country text null,
  user_country_code text null,
  user_country_name_en text null,
  user_city text null,
  user_province text null,
  user_province_code text null,
  user_province_name_en text null,
  user_gender text null,
  title text null,
  locale text null,
  item_type text null,
  image_url text null,
  cloudinary_public_id text null,
  analysis_result jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evaluations_user_gender_check
    check (user_gender is null or user_gender in ('male','female','prefer_not_to_say'))
);

create index if not exists evaluations_user_created_idx
  on public.evaluations (user_id,created_at desc);
create index if not exists evaluations_created_idx
  on public.evaluations (created_at desc);

drop trigger if exists set_evaluations_updated_at on public.evaluations;
create trigger set_evaluations_updated_at
before update on public.evaluations
for each row execute function public.set_kishib_updated_at();

alter table public.evaluations enable row level security;

drop policy if exists "Users can read own evaluations" on public.evaluations;
create policy "Users can read own evaluations"
on public.evaluations for select to authenticated
using (auth.uid()=user_id);

-- Service role bypasses RLS for server-side insert/finalize. Browser writes denied.
revoke all on public.evaluations from public,anon,authenticated;
grant select on public.evaluations to authenticated;

-- Final postconditions for this base only.
do $postcheck$
begin
  if pg_catalog.to_regclass('public.profiles') is null
     or pg_catalog.to_regclass('public.user_usage_limits') is null
     or pg_catalog.to_regclass('public.evaluations') is null then
    raise exception 'BASE SCHEMA FAILED: required table missing';
  end if;
  if pg_catalog.has_table_privilege('authenticated','public.user_usage_limits','INSERT')
     or pg_catalog.has_table_privilege('authenticated','public.user_usage_limits','UPDATE')
     or pg_catalog.has_table_privilege('authenticated','public.evaluations','INSERT') then
    raise exception 'BASE SCHEMA FAILED: unsafe authenticated write privilege';
  end if;
end;
$postcheck$;

commit;

-- NEXT, IN ORDER:
-- 1) PHASE_1_SCHEMA_INSPECTION.sql
-- 2) 202607060002_phase_1_analysis_security_reviewed.sql
-- 3) confirm analysis_access_reservations is empty
-- 4) 202607060003_phase_1_1_analysis_refund_idempotency.sql
-- 5) PHASE_1_STAGING_POSTCHECK.sql

