-- KISHIB PHASE 1 - REVIEWED STAGING APPLY SCRIPT
-- TARGET: STAGING ONLY. DO NOT RUN ON PRODUCTION.
-- PURPOSE: make new-analysis authorization server-only, atomic and idempotent.
-- DATA SAFETY: this apply script does not delete/reset/update existing user rows,
-- evaluations, reports, lifetime flags, subscription dates, or balances.
--
-- BEFORE RUNNING:
-- 1) Confirm the SQL Editor is connected to STAGING.
-- 2) Run PHASE_1_SCHEMA_INSPECTION.sql and save every result.
-- 3) Confirm user_usage_limits matches the preflight expectations below.
-- 4) Take a real Staging database backup/snapshot.
-- 5) Keep the application deployment ready: the current API fails closed until
--    authorize_analysis_request(uuid, uuid) exists.
--
-- KNOWN PRODUCT RISK:
-- A free credit is atomically consumed BEFORE the AI call. The current app does
-- not finalize/refund reservations, so an AI-provider failure does not restore it.
-- This is acceptable only for controlled Staging security tests, not Production.

begin;

-- Prevent two operators from applying this proposal concurrently.
select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('kishib_phase_1_analysis_security_v2'));

-- SECTION 1: strict preflight against the schema expected by repository migrations.
-- Raises an exception before permission/function changes if anything is missing
-- or has an incompatible type. The surrounding transaction then rolls back.
do $preflight$
declare
  mismatch text;
begin
  if pg_catalog.to_regclass('public.user_usage_limits') is null then
    raise exception 'PRECHECK FAILED: public.user_usage_limits does not exist';
  end if;

  with expected(column_name, data_type) as (
    values
      ('id', 'uuid'),
      ('user_id', 'uuid'),
      ('free_limit', 'integer'),
      ('used_count', 'integer'),
      ('subscription_status', 'text'),
      ('subscription_plan', 'text'),
      ('subscription_started_at', 'timestamp with time zone'),
      ('subscription_ends_at', 'timestamp with time zone'),
      ('access_type', 'text'),
      ('is_lifetime_free', 'boolean'),
      ('lifetime_reason', 'text')
  ),
  actual as (
    select a.attname as column_name,
           pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type
    from pg_catalog.pg_attribute a
    where a.attrelid = 'public.user_usage_limits'::pg_catalog.regclass
      and a.attnum > 0 and not a.attisdropped
  )
  select pg_catalog.string_agg(
           e.column_name || ' expected=' || e.data_type ||
           ' actual=' || coalesce(a.data_type, '<missing>'), '; '
         )
  into mismatch
  from expected e
  left join actual a using (column_name)
  where a.column_name is null or a.data_type <> e.data_type;

  if mismatch is not null then
    raise exception 'PRECHECK FAILED: incompatible user_usage_limits columns: %', mismatch;
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint c
    join pg_catalog.pg_attribute a
      on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.conrelid = 'public.user_usage_limits'::pg_catalog.regclass
      and c.contype in ('u', 'p')
      and pg_catalog.array_length(c.conkey, 1) = 1
      and a.attname = 'user_id'
  ) then
    raise exception 'PRECHECK FAILED: user_usage_limits.user_id must have a single-column UNIQUE constraint';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint c
    join pg_catalog.pg_attribute a
      on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.conrelid = 'public.user_usage_limits'::pg_catalog.regclass
      and c.contype = 'f' and a.attname = 'user_id'
      and c.confrelid = 'auth.users'::pg_catalog.regclass
  ) then
    raise exception 'PRECHECK FAILED: user_usage_limits.user_id must reference auth.users(id)';
  end if;

  if exists (
    select 1 from public.user_usage_limits
    where free_limit < 0 or used_count < 0
  ) then
    raise exception 'PRECHECK FAILED: negative free_limit/used_count rows require investigation';
  end if;
end
$preflight$;

-- SECTION 2: harden the existing entitlement table.
-- Existing rows and values are untouched. Authenticated users retain read access
-- subject to existing RLS, but lose every direct write path.
drop policy if exists "Users can insert own usage limits" on public.user_usage_limits;
revoke insert, update, delete, truncate on public.user_usage_limits from anon, authenticated;
grant select on public.user_usage_limits to authenticated;
alter table public.user_usage_limits enable row level security;

-- Revoke the legacy mutating RPC only if that exact function exists.
do $legacy_revoke$
begin
  if pg_catalog.to_regprocedure('public.increment_analysis_usage()') is not null then
    execute 'revoke all on function public.increment_analysis_usage() from public';
    execute 'revoke all on function public.increment_analysis_usage() from anon';
    execute 'revoke all on function public.increment_analysis_usage() from authenticated';
  end if;
end
$legacy_revoke$;

-- SECTION 3: server-only idempotency ledger.
-- No evaluation/report rows are referenced or modified. The table records only
-- authorization decisions. IF NOT EXISTS makes creation repeatable.
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
  constraint analysis_access_reservations_remaining_check
    check (remaining_credits >= 0)
);

create index if not exists analysis_access_reservations_user_created_idx
  on public.analysis_access_reservations (user_id, created_at desc);

-- Verify an already-existing table is compatible instead of guessing.
do $reservation_preflight$
declare
  mismatch text;
begin
  with expected(column_name, data_type, required_not_null) as (
    values
      ('request_id', 'uuid', true),
      ('user_id', 'uuid', true),
      ('decision_code', 'text', true),
      ('access_mode', 'text', true),
      ('consumed_credit', 'boolean', true),
      ('remaining_credits', 'integer', true),
      ('created_at', 'timestamp with time zone', true)
  ),
  actual as (
    select a.attname as column_name,
           pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
           a.attnotnull
    from pg_catalog.pg_attribute a
    where a.attrelid = 'public.analysis_access_reservations'::pg_catalog.regclass
      and a.attnum > 0 and not a.attisdropped
  )
  select pg_catalog.string_agg(e.column_name, ', ')
  into mismatch
  from expected e
  left join actual a using (column_name)
  where a.column_name is null or a.data_type <> e.data_type
     or (e.required_not_null and not a.attnotnull);

  if mismatch is not null then
    raise exception 'PRECHECK FAILED: incompatible analysis_access_reservations columns: %', mismatch;
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint c
    join pg_catalog.pg_attribute a
      on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.conrelid = 'public.analysis_access_reservations'::pg_catalog.regclass
      and c.contype in ('p', 'u')
      and pg_catalog.array_length(c.conkey, 1) = 1
      and a.attname = 'request_id'
  ) then
    raise exception 'PRECHECK FAILED: reservations.request_id must be PRIMARY KEY or UNIQUE';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint c
    join pg_catalog.pg_attribute a
      on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.conrelid = 'public.analysis_access_reservations'::pg_catalog.regclass
      and c.contype = 'f' and a.attname = 'user_id'
      and c.confrelid = 'auth.users'::pg_catalog.regclass
  ) then
    raise exception 'PRECHECK FAILED: reservations.user_id must reference auth.users(id)';
  end if;
end
$reservation_preflight$;

alter table public.analysis_access_reservations enable row level security;

-- This is a dedicated internal table: remove any pre-existing policies so an
-- accidentally created client policy cannot expose it. This does not delete rows.
do $drop_reservation_policies$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'analysis_access_reservations'
  loop
    execute pg_catalog.format(
      'drop policy if exists %I on public.analysis_access_reservations',
      policy_row.policyname
    );
  end loop;
end
$drop_reservation_policies$;

revoke all on public.analysis_access_reservations from public, anon, authenticated;
grant select, insert, update, delete on public.analysis_access_reservations to service_role;

-- SECTION 4: atomic server-only authorization.
-- The service passes target_user_id only after validating the Supabase access
-- token. Browser roles cannot execute this function.
create or replace function public.authorize_analysis_request(
  target_user_id uuid,
  target_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $function$
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

  -- Claim the request ID first. A duplicate waits on the PK and then reuses the
  -- stored authorization decision, preventing a second credit decrement.
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

    if not found then
      return jsonb_build_object(
        'allowed', false, 'code', 'REQUEST_STATE_UNAVAILABLE', 'accessMode', 'none',
        'consumedCredit', false, 'remainingCredits', 0, 'usedCount', 0,
        'freeLimit', 0, 'subscriptionStatus', 'inactive',
        'accessType', 'free_trial', 'isLifetimeFree', false
      );
    end if;

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
      'isLifetimeFree', coalesce(usage_row.is_lifetime_free, false),
      'replayed', true
    );
  end if;

  -- Create only a safe default row for a previously unseen authenticated user.
  -- ON CONFLICT never resets or overwrites an existing user's values.
  insert into public.user_usage_limits (
    user_id, free_limit, used_count, subscription_status, access_type, is_lifetime_free
  )
  values (target_user_id, 5, 0, 'inactive', 'free_trial', false)
  on conflict (user_id) do nothing;

  -- Serializes different concurrent request IDs for the same user.
  select * into usage_row
  from public.user_usage_limits
  where user_id = target_user_id
  for update;

  -- Lifetime access takes precedence and is never changed by this function.
  is_lifetime_access :=
    usage_row.is_lifetime_free = true
    or usage_row.access_type in ('lifetime_free', 'admin');

  -- Preserve repository behavior: a paid subscription must be active and have a
  -- non-null future end timestamp. No subscription field is modified here.
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
    'isLifetimeFree', usage_row.is_lifetime_free,
    'replayed', false
  );
end
$function$;

revoke all on function public.authorize_analysis_request(uuid, uuid) from public;
revoke all on function public.authorize_analysis_request(uuid, uuid) from anon;
revoke all on function public.authorize_analysis_request(uuid, uuid) from authenticated;
grant execute on function public.authorize_analysis_request(uuid, uuid) to service_role;

-- SECTION 5: postcondition assertions. Any failure aborts and rolls back all above.
do $postcheck$
begin
  if pg_catalog.has_table_privilege('authenticated', 'public.user_usage_limits', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.user_usage_limits', 'UPDATE')
     or pg_catalog.has_table_privilege('authenticated', 'public.user_usage_limits', 'DELETE') then
    raise exception 'POSTCHECK FAILED: authenticated still has direct write privilege on user_usage_limits';
  end if;

  if pg_catalog.has_function_privilege(
       'authenticated',
       'public.authorize_analysis_request(uuid,uuid)',
       'EXECUTE'
     ) then
    raise exception 'POSTCHECK FAILED: authenticated can execute authorize_analysis_request';
  end if;

  if not pg_catalog.has_function_privilege(
       'service_role',
       'public.authorize_analysis_request(uuid,uuid)',
       'EXECUTE'
     ) then
    raise exception 'POSTCHECK FAILED: service_role cannot execute authorize_analysis_request';
  end if;
end
$postcheck$;

commit;

-- EXPECTED EFFECT AFTER COMMIT:
-- * no existing user_usage_limits values changed;
-- * an empty/internal reservation table exists (or existing rows remain);
-- * client direct writes and legacy increment execution are denied;
-- * service_role can call one atomic authorization function.
