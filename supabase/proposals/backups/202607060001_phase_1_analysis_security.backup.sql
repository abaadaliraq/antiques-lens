-- REVIEW ONLY: DO NOT APPLY TO PRODUCTION WITHOUT BACKUP AND APPROVAL.
-- Phase 1 server-only atomic authorization. Does not modify evaluations or reports.
begin;

drop policy if exists "Users can insert own usage limits" on public.user_usage_limits;
revoke insert, update, delete, truncate on public.user_usage_limits from anon, authenticated;
grant select on public.user_usage_limits to authenticated;

revoke all on function public.increment_analysis_usage() from public;
revoke all on function public.increment_analysis_usage() from anon;
revoke all on function public.increment_analysis_usage() from authenticated;

create table if not exists public.analysis_access_reservations (
  request_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  decision_code text not null,
  access_mode text not null,
  consumed_credit boolean not null default false,
  remaining_credits integer not null default 0,
  created_at timestamptz not null default now(),
  constraint analysis_access_reservations_access_mode_check
    check (access_mode in ('processing', 'free_trial', 'subscription', 'lifetime', 'none')),
  constraint analysis_access_reservations_remaining_check check (remaining_credits >= 0)
);

create index if not exists analysis_access_reservations_user_created_idx
  on public.analysis_access_reservations (user_id, created_at desc);

alter table public.analysis_access_reservations enable row level security;
revoke all on public.analysis_access_reservations from public, anon, authenticated;
grant select, insert, update, delete on public.analysis_access_reservations to service_role;

create or replace function public.authorize_analysis_request(
  target_user_id uuid,
  target_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  usage_row public.user_usage_limits%rowtype;
  existing_reservation public.analysis_access_reservations%rowtype;
  inserted_request_id uuid;
  is_lifetime_access boolean := false;
  is_subscription_active boolean := false;
  v_decision_code text := 'TRIAL_LIMIT_REACHED';
  v_access_mode text := 'none';
  v_consumed_credit boolean := false;
  v_remaining integer := 0;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role required' using errcode = '42501';
  end if;

  if target_user_id is null or target_request_id is null then
    return jsonb_build_object(
      'allowed', false, 'code', 'INVALID_REQUEST', 'accessMode', 'none',
      'consumedCredit', false, 'remainingCredits', 0, 'usedCount', 0,
      'freeLimit', 5, 'subscriptionStatus', 'inactive',
      'accessType', 'free_trial', 'isLifetimeFree', false
    );
  end if;

  insert into public.analysis_access_reservations (
    request_id, user_id, decision_code, access_mode, consumed_credit, remaining_credits
  )
  values (target_request_id, target_user_id, 'PROCESSING', 'processing', false, 0)
  on conflict (request_id) do nothing
  returning request_id into inserted_request_id;

  if inserted_request_id is null then
    select * into existing_reservation
    from public.analysis_access_reservations
    where request_id = target_request_id;

    if existing_reservation.user_id <> target_user_id then
      return jsonb_build_object(
        'allowed', false, 'code', 'REQUEST_CONFLICT', 'accessMode', 'none',
        'consumedCredit', false, 'remainingCredits', 0, 'usedCount', 0,
        'freeLimit', 0, 'subscriptionStatus', 'inactive',
        'accessType', 'free_trial', 'isLifetimeFree', false
      );
    end if;

    select * into usage_row
    from public.user_usage_limits
    where user_id = target_user_id;

    return jsonb_build_object(
      'allowed', existing_reservation.decision_code in (
        'TRIAL_CREDIT_RESERVED', 'SUBSCRIPTION_ACTIVE', 'LIFETIME_ACCESS'
      ),
      'code', existing_reservation.decision_code,
      'accessMode', existing_reservation.access_mode,
      'consumedCredit', existing_reservation.consumed_credit,
      'remainingCredits', existing_reservation.remaining_credits,
      'usedCount', coalesce(usage_row.used_count, 0),
      'freeLimit', coalesce(usage_row.free_limit, 5),
      'subscriptionStatus', coalesce(usage_row.subscription_status, 'inactive'),
      'accessType', coalesce(usage_row.access_type, 'free_trial'),
      'isLifetimeFree', coalesce(usage_row.is_lifetime_free, false)
    );
  end if;

  insert into public.user_usage_limits (
    user_id, free_limit, used_count, subscription_status, access_type, is_lifetime_free
  )
  values (target_user_id, 5, 0, 'inactive', 'free_trial', false)
  on conflict (user_id) do nothing;

  select * into usage_row
  from public.user_usage_limits
  where user_id = target_user_id
  for update;

  is_lifetime_access :=
    usage_row.is_lifetime_free = true
    or usage_row.access_type in ('lifetime_free', 'admin');

  is_subscription_active :=
    usage_row.subscription_status = 'active'
    and usage_row.subscription_ends_at is not null
    and usage_row.subscription_ends_at > now();

  if is_lifetime_access then
    v_decision_code := 'LIFETIME_ACCESS';
    v_access_mode := 'lifetime';
    v_remaining := greatest(usage_row.free_limit - usage_row.used_count, 0);
  elsif is_subscription_active then
    v_decision_code := 'SUBSCRIPTION_ACTIVE';
    v_access_mode := 'subscription';
    v_remaining := greatest(usage_row.free_limit - usage_row.used_count, 0);
  elsif usage_row.used_count < usage_row.free_limit then
    update public.user_usage_limits
    set used_count = used_count + 1
    where user_id = target_user_id
    returning * into usage_row;

    v_decision_code := 'TRIAL_CREDIT_RESERVED';
    v_access_mode := 'free_trial';
    v_consumed_credit := true;
    v_remaining := greatest(usage_row.free_limit - usage_row.used_count, 0);
  else
    v_decision_code := 'TRIAL_LIMIT_REACHED';
    v_access_mode := 'none';
    v_remaining := 0;
  end if;

  update public.analysis_access_reservations r
  set decision_code = v_decision_code,
      access_mode = v_access_mode,
      consumed_credit = v_consumed_credit,
      remaining_credits = v_remaining
  where r.request_id = target_request_id;

  return jsonb_build_object(
    'allowed', v_decision_code in (
      'TRIAL_CREDIT_RESERVED', 'SUBSCRIPTION_ACTIVE', 'LIFETIME_ACCESS'
    ),
    'code', v_decision_code, 'accessMode', v_access_mode,
    'consumedCredit', v_consumed_credit, 'remainingCredits', v_remaining,
    'usedCount', usage_row.used_count, 'freeLimit', usage_row.free_limit,
    'subscriptionStatus', usage_row.subscription_status,
    'accessType', usage_row.access_type,
    'isLifetimeFree', usage_row.is_lifetime_free
  );
end;
$$;

revoke all on function public.authorize_analysis_request(uuid, uuid) from public;
revoke all on function public.authorize_analysis_request(uuid, uuid) from anon;
revoke all on function public.authorize_analysis_request(uuid, uuid) from authenticated;
grant execute on function public.authorize_analysis_request(uuid, uuid) to service_role;

commit;
