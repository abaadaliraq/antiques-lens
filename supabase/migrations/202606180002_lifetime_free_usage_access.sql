alter table public.user_usage_limits
add column if not exists access_type text not null default 'free_trial',
add column if not exists is_lifetime_free boolean not null default false,
add column if not exists lifetime_reason text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_usage_limits_access_type_check'
  ) then
    alter table public.user_usage_limits
    add constraint user_usage_limits_access_type_check
    check (access_type in ('free_trial', 'paid_monthly', 'paid_yearly', 'lifetime_free', 'admin'));
  end if;
end;
$$;

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
  is_lifetime_access boolean := false;
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
      'accessType', 'free_trial',
      'isLifetimeFree', false,
      'reason', 'auth_required'
    );
  end if;

  insert into public.user_usage_limits (user_id, free_limit, used_count, subscription_status, access_type)
  values (current_user_id, 5, 0, 'inactive', 'free_trial')
  on conflict (user_id) do nothing;

  select *
  into usage_row
  from public.user_usage_limits
  where user_id = current_user_id;

  is_lifetime_access :=
    usage_row.is_lifetime_free = true
    or usage_row.access_type in ('lifetime_free', 'admin');

  if is_lifetime_access then
    return jsonb_build_object(
      'canAnalyze', true,
      'remainingCredits', 999999,
      'usedCount', usage_row.used_count,
      'freeLimit', usage_row.free_limit,
      'subscriptionStatus', 'lifetime_free',
      'accessType', usage_row.access_type,
      'isLifetimeFree', true,
      'reason', 'Lifetime free access'
    );
  end if;

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
    'accessType', usage_row.access_type,
    'isLifetimeFree', usage_row.is_lifetime_free,
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
  is_lifetime_access boolean := false;
  remaining integer := 0;
  status_reason text := 'auth_required';
  status_message text := '';
begin
  if current_user_id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Authentication required',
      'canAnalyze', false,
      'remainingCredits', 0,
      'usedCount', 0,
      'freeLimit', 5,
      'subscriptionStatus', 'inactive',
      'accessType', 'free_trial',
      'isLifetimeFree', false,
      'reason', 'auth_required'
    );
  end if;

  insert into public.user_usage_limits (user_id, free_limit, used_count, subscription_status, access_type)
  values (current_user_id, 5, 0, 'inactive', 'free_trial')
  on conflict (user_id) do nothing;

  select *
  into usage_row
  from public.user_usage_limits
  where user_id = current_user_id
  for update;

  is_lifetime_access :=
    usage_row.is_lifetime_free = true
    or usage_row.access_type in ('lifetime_free', 'admin');

  if is_lifetime_access then
    return jsonb_build_object(
      'success', true,
      'message', 'Lifetime free account, no credit deducted',
      'canAnalyze', true,
      'remainingCredits', 999999,
      'usedCount', usage_row.used_count,
      'freeLimit', usage_row.free_limit,
      'subscriptionStatus', 'lifetime_free',
      'accessType', usage_row.access_type,
      'isLifetimeFree', true,
      'reason', 'Lifetime free access'
    );
  end if;

  is_subscription_active :=
    usage_row.subscription_status = 'active'
    and usage_row.subscription_ends_at is not null
    and usage_row.subscription_ends_at > now();

  if is_subscription_active then
    status_reason := 'subscription_active';
    status_message := 'Active subscription, no free credit deducted';
  elsif usage_row.used_count < usage_row.free_limit then
    update public.user_usage_limits
    set used_count = used_count + 1
    where user_id = current_user_id
    returning * into usage_row;

    status_reason := 'usage_incremented';
    status_message := 'Free credit deducted';
  else
    status_reason := 'limit_reached';
    status_message := 'Free usage limit reached';
  end if;

  remaining := greatest(usage_row.free_limit - usage_row.used_count, 0);

  return jsonb_build_object(
    'success', status_reason <> 'limit_reached',
    'message', status_message,
    'canAnalyze',
      is_subscription_active or usage_row.used_count < usage_row.free_limit,
    'remainingCredits', remaining,
    'usedCount', usage_row.used_count,
    'freeLimit', usage_row.free_limit,
    'subscriptionStatus', usage_row.subscription_status,
    'accessType', usage_row.access_type,
    'isLifetimeFree', usage_row.is_lifetime_free,
    'reason', status_reason
  );
end;
$$;

create or replace function public.grant_lifetime_access_by_email(
  target_email text,
  reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  select id
  into target_user_id
  from auth.users
  where lower(email) = lower(target_email)
  limit 1;

  if target_user_id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'No auth user found for this email',
      'email', target_email
    );
  end if;

  insert into public.user_usage_limits (
    user_id,
    free_limit,
    used_count,
    subscription_status,
    subscription_plan,
    subscription_started_at,
    subscription_ends_at,
    access_type,
    is_lifetime_free,
    lifetime_reason
  )
  values (
    target_user_id,
    5,
    0,
    'active',
    'lifetime_free',
    now(),
    null,
    'lifetime_free',
    true,
    reason
  )
  on conflict (user_id) do update
  set
    is_lifetime_free = true,
    access_type = 'lifetime_free',
    subscription_status = 'active',
    subscription_plan = 'lifetime_free',
    subscription_started_at = now(),
    subscription_ends_at = null,
    lifetime_reason = excluded.lifetime_reason,
    updated_at = now();

  return jsonb_build_object(
    'success', true,
    'message', 'Lifetime free access granted',
    'userId', target_user_id,
    'email', target_email,
    'reason', reason
  );
end;
$$;

revoke all on function public.grant_lifetime_access_by_email(text, text) from public;
revoke all on function public.grant_lifetime_access_by_email(text, text) from anon;
revoke all on function public.grant_lifetime_access_by_email(text, text) from authenticated;
grant execute on function public.grant_lifetime_access_by_email(text, text) to service_role;

/*
Examples:

Grant owner lifetime access:
select public.grant_lifetime_access_by_email(
  'owner@email.com',
  'KISHIB owner account'
);

Grant internal team lifetime access:
select public.grant_lifetime_access_by_email(
  'team@email.com',
  'KISHIB internal team account'
);

Revoke lifetime access:
update public.user_usage_limits
set
  is_lifetime_free = false,
  access_type = 'free_trial',
  subscription_status = 'inactive',
  subscription_plan = null,
  subscription_ends_at = null,
  lifetime_reason = null,
  updated_at = now()
where user_id = (
  select id
  from auth.users
  where lower(email) = lower('owner@email.com')
);
*/
