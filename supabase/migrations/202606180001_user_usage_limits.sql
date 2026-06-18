create extension if not exists pgcrypto;

create table if not exists public.user_usage_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  free_limit integer not null default 5,
  used_count integer not null default 0,
  subscription_status text not null default 'inactive',
  subscription_plan text null,
  subscription_started_at timestamptz null,
  subscription_ends_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_usage_limits_free_limit_check check (free_limit >= 0),
  constraint user_usage_limits_used_count_check check (used_count >= 0)
);

create or replace function public.set_user_usage_limits_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_usage_limits_updated_at on public.user_usage_limits;

create trigger set_user_usage_limits_updated_at
before update on public.user_usage_limits
for each row
execute function public.set_user_usage_limits_updated_at();

alter table public.user_usage_limits enable row level security;

drop policy if exists "Users can read own usage limits" on public.user_usage_limits;
create policy "Users can read own usage limits"
on public.user_usage_limits
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own usage limits" on public.user_usage_limits;
create policy "Users can insert own usage limits"
on public.user_usage_limits
for insert
to authenticated
with check (auth.uid() = user_id);

create or replace function public.can_user_analyze()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  usage_row public.user_usage_limits%rowtype;
  is_subscription_active boolean := false;
  remaining integer := 0;
  can_analyze boolean := false;
  status_reason text := 'auth_required';
begin
  if current_user_id is null then
    return jsonb_build_object(
      'canAnalyze', false,
      'remainingCredits', 0,
      'usedCount', 0,
      'freeLimit', 5,
      'subscriptionStatus', 'inactive',
      'reason', 'auth_required'
    );
  end if;

  insert into public.user_usage_limits (user_id, free_limit, used_count, subscription_status)
  values (current_user_id, 5, 0, 'inactive')
  on conflict (user_id) do nothing;

  select *
  into usage_row
  from public.user_usage_limits
  where user_id = current_user_id;

  is_subscription_active :=
    usage_row.subscription_status = 'active'
    and usage_row.subscription_ends_at is not null
    and usage_row.subscription_ends_at > now();

  remaining := greatest(usage_row.free_limit - usage_row.used_count, 0);
  can_analyze := is_subscription_active or usage_row.used_count < usage_row.free_limit;

  if is_subscription_active then
    status_reason := 'subscription_active';
  elsif usage_row.used_count < usage_row.free_limit then
    status_reason := 'free_credits_available';
  else
    status_reason := 'limit_reached';
  end if;

  return jsonb_build_object(
    'canAnalyze', can_analyze,
    'remainingCredits', remaining,
    'usedCount', usage_row.used_count,
    'freeLimit', usage_row.free_limit,
    'subscriptionStatus', usage_row.subscription_status,
    'reason', status_reason
  );
end;
$$;

create or replace function public.increment_analysis_usage()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  usage_row public.user_usage_limits%rowtype;
  is_subscription_active boolean := false;
  remaining integer := 0;
  status_reason text := 'auth_required';
begin
  if current_user_id is null then
    return jsonb_build_object(
      'canAnalyze', false,
      'remainingCredits', 0,
      'usedCount', 0,
      'freeLimit', 5,
      'subscriptionStatus', 'inactive',
      'reason', 'auth_required'
    );
  end if;

  insert into public.user_usage_limits (user_id, free_limit, used_count, subscription_status)
  values (current_user_id, 5, 0, 'inactive')
  on conflict (user_id) do nothing;

  select *
  into usage_row
  from public.user_usage_limits
  where user_id = current_user_id
  for update;

  is_subscription_active :=
    usage_row.subscription_status = 'active'
    and usage_row.subscription_ends_at is not null
    and usage_row.subscription_ends_at > now();

  if is_subscription_active then
    status_reason := 'subscription_active';
  elsif usage_row.used_count < usage_row.free_limit then
    update public.user_usage_limits
    set used_count = used_count + 1
    where user_id = current_user_id
    returning * into usage_row;

    status_reason := 'usage_incremented';
  else
    status_reason := 'limit_reached';
  end if;

  remaining := greatest(usage_row.free_limit - usage_row.used_count, 0);

  return jsonb_build_object(
    'canAnalyze',
      is_subscription_active or usage_row.used_count < usage_row.free_limit,
    'remainingCredits', remaining,
    'usedCount', usage_row.used_count,
    'freeLimit', usage_row.free_limit,
    'subscriptionStatus', usage_row.subscription_status,
    'reason', status_reason
  );
end;
$$;

grant execute on function public.can_user_analyze() to authenticated;
grant execute on function public.increment_analysis_usage() to authenticated;
