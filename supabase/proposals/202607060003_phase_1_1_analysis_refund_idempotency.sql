-- KISHIB PHASE 1.1 - STAGING PROPOSAL ONLY. DO NOT RUN ON PRODUCTION.
-- Requires the reviewed Phase 1 SQL (202607060002) to be applied first.
-- Adds lifecycle, cached result, one-time refund, stale-attempt recovery and
-- server-only completion/failure RPCs. Does not alter prices or payment systems.
begin;

select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('kishib_phase_1_1_refund_idempotency'));

-- Preflight: fail before changes if Phase 1 or evaluation storage is incompatible.
do $preflight$
begin
  if pg_catalog.to_regclass('public.user_usage_limits') is null
     or pg_catalog.to_regclass('public.analysis_access_reservations') is null
     or pg_catalog.to_regclass('public.evaluations') is null then
    raise exception 'PRECHECK FAILED: required tables are missing';
  end if;
  if pg_catalog.to_regprocedure('public.authorize_analysis_request(uuid,uuid)') is null then
    raise exception 'PRECHECK FAILED: reviewed Phase 1 RPC is missing';
  end if;
  if exists (select 1 from public.analysis_access_reservations) then
    raise exception 'PRECHECK FAILED: existing Phase 1 reservations require manual Staging reconciliation before Phase 1.1';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='evaluations'
      and column_name='id' and udt_name='uuid'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='evaluations'
      and column_name='user_id' and udt_name='uuid'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='evaluations'
      and column_name='analysis_result' and udt_name='jsonb'
  ) then
    raise exception 'PRECHECK FAILED: evaluations id/user_id/analysis_result types differ';
  end if;
end
$preflight$;

-- Lifecycle fields. Existing rows remain intact and default to processing.
alter table public.analysis_access_reservations
  add column if not exists status text not null default 'processing',
  add column if not exists failure_reason text null,
  add column if not exists evaluation_id uuid null,
  add column if not exists result_payload jsonb null,
  add column if not exists lease_expires_at timestamptz null,
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz null,
  add column if not exists refunded_at timestamptz null,
  add column if not exists updated_at timestamptz not null default now();

do $constraints$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid='public.analysis_access_reservations'::pg_catalog.regclass
      and conname='analysis_access_reservations_status_check'
  ) then
    alter table public.analysis_access_reservations
      add constraint analysis_access_reservations_status_check
      check (status in ('reserved','processing','succeeded','failed','refunded'));
  end if;
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid='public.analysis_access_reservations'::pg_catalog.regclass
      and conname='analysis_access_reservations_evaluation_fk'
  ) then
    alter table public.analysis_access_reservations
      add constraint analysis_access_reservations_evaluation_fk
      foreign key (evaluation_id) references public.evaluations(id) on delete set null;
  end if;
end
$constraints$;

create index if not exists analysis_access_reservations_stale_idx
  on public.analysis_access_reservations (user_id, lease_expires_at)
  where status in ('reserved','processing');

-- Replace authorization with a lifecycle-aware implementation.
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
  attempt public.analysis_access_reservations%rowtype;
  stale_attempt public.analysis_access_reservations%rowtype;
  saved_result jsonb;
  v_code text;
  v_mode text := 'none';
  v_consumed boolean := false;
  v_remaining integer := 0;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role required' using errcode='42501';
  end if;
  if target_user_id is null or target_request_id is null then
    raise exception 'user and request IDs are required' using errcode='22023';
  end if;

  insert into public.user_usage_limits
    (user_id,free_limit,used_count,subscription_status,access_type,is_lifetime_free)
  values (target_user_id,5,0,'inactive','free_trial',false)
  on conflict (user_id) do nothing;

  select * into usage_row from public.user_usage_limits
  where user_id=target_user_id for update;

  -- Recover or refund every expired attempt for this user before a new decision.
  for stale_attempt in
    select * from public.analysis_access_reservations
    where user_id=target_user_id
      and status in ('reserved','processing')
      and lease_expires_at is not null and lease_expires_at <= now()
    for update
  loop
    select analysis_result into saved_result from public.evaluations
    where id=coalesce(stale_attempt.evaluation_id, stale_attempt.request_id)
      and user_id=target_user_id;

    if found and saved_result is not null then
      update public.analysis_access_reservations
      set status='succeeded', decision_code='ANALYSIS_SUCCEEDED',
          result_payload=saved_result, completed_at=now(), updated_at=now(),
          lease_expires_at=null
      where request_id=stale_attempt.request_id;
    else
      if stale_attempt.consumed_credit then
        update public.user_usage_limits
        set used_count=greatest(used_count-1,0)
        where user_id=target_user_id returning * into usage_row;
      end if;
      update public.analysis_access_reservations
      set status=case when consumed_credit then 'refunded' else 'failed' end,
          decision_code=case when consumed_credit then 'ANALYSIS_REFUNDED' else 'ANALYSIS_FAILED' end,
          failure_reason='PROCESSING_LEASE_EXPIRED',
          refunded_at=case when consumed_credit then now() else refunded_at end,
          completed_at=now(), updated_at=now(), lease_expires_at=null
      where request_id=stale_attempt.request_id
        and status in ('reserved','processing');
    end if;
  end loop;

  select * into attempt from public.analysis_access_reservations
  where request_id=target_request_id for update;

  if found then
    if attempt.user_id <> target_user_id then
      v_code := 'REQUEST_CONFLICT';
    elsif attempt.status='succeeded' then
      return jsonb_build_object(
        'allowed',true,'code','ANALYSIS_SUCCEEDED','status','succeeded',
        'accessMode',attempt.access_mode,'consumedCredit',attempt.consumed_credit,
        'remainingCredits',attempt.remaining_credits,'usedCount',usage_row.used_count,
        'freeLimit',usage_row.free_limit,'subscriptionStatus',usage_row.subscription_status,
        'accessType',usage_row.access_type,'isLifetimeFree',usage_row.is_lifetime_free,
        'evaluationId',attempt.evaluation_id,'cachedResult',attempt.result_payload
      );
    elsif attempt.status in ('reserved','processing') then
      v_code := 'ANALYSIS_IN_PROGRESS';
    else
      v_code := 'ANALYSIS_ATTEMPT_CLOSED';
    end if;
    return jsonb_build_object(
      'allowed',false,'code',v_code,'status',attempt.status,
      'accessMode',attempt.access_mode,'consumedCredit',attempt.consumed_credit,
      'remainingCredits',attempt.remaining_credits,'usedCount',usage_row.used_count,
      'freeLimit',usage_row.free_limit,'subscriptionStatus',usage_row.subscription_status,
      'accessType',usage_row.access_type,'isLifetimeFree',usage_row.is_lifetime_free,
      'evaluationId',attempt.evaluation_id,'cachedResult',null
    );
  end if;

  if usage_row.is_lifetime_free or usage_row.access_type in ('lifetime_free','admin') then
    v_mode := 'lifetime'; v_code := 'ANALYSIS_STARTED';
  elsif usage_row.subscription_status='active'
        and usage_row.subscription_ends_at is not null
        and usage_row.subscription_ends_at > now() then
    v_mode := 'subscription'; v_code := 'ANALYSIS_STARTED';
  elsif usage_row.used_count < usage_row.free_limit then
    update public.user_usage_limits set used_count=used_count+1
    where user_id=target_user_id returning * into usage_row;
    v_mode := 'free_trial'; v_consumed := true; v_code := 'ANALYSIS_STARTED';
  else
    v_code := 'TRIAL_LIMIT_REACHED';
  end if;
  v_remaining := greatest(usage_row.free_limit-usage_row.used_count,0);

  insert into public.analysis_access_reservations
    (request_id,user_id,decision_code,access_mode,consumed_credit,
     remaining_credits,status,evaluation_id,lease_expires_at,started_at,updated_at)
  values
    (target_request_id,target_user_id,v_code,v_mode,v_consumed,v_remaining,
     case when v_code='ANALYSIS_STARTED' then 'processing' else 'failed' end,
     null,
     case when v_code='ANALYSIS_STARTED' then now()+interval '15 minutes' else null end,
     now(),now());

  return jsonb_build_object(
    'allowed',v_code='ANALYSIS_STARTED','code',v_code,
    'status',case when v_code='ANALYSIS_STARTED' then 'processing' else 'failed' end,
    'accessMode',v_mode,'consumedCredit',v_consumed,
    'remainingCredits',v_remaining,'usedCount',usage_row.used_count,
    'freeLimit',usage_row.free_limit,'subscriptionStatus',usage_row.subscription_status,
    'accessType',usage_row.access_type,'isLifetimeFree',usage_row.is_lifetime_free,
    'evaluationId',target_request_id,'cachedResult',null
  );
end
$function$;

-- Finalize only after a valid evaluation row has been stored.
create or replace function public.complete_analysis_request(
  target_user_id uuid,
  target_request_id uuid,
  target_evaluation_id uuid,
  target_result_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $function$
declare
  attempt public.analysis_access_reservations%rowtype;
  usage_row public.user_usage_limits%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role required' using errcode='42501';
  end if;
  select * into attempt from public.analysis_access_reservations
  where request_id=target_request_id and user_id=target_user_id for update;
  if not found then raise exception 'analysis attempt not found' using errcode='P0002'; end if;

  if attempt.status='succeeded' then
    select * into usage_row from public.user_usage_limits where user_id=target_user_id;
    return jsonb_build_object(
      'allowed',true,'code','ANALYSIS_SUCCEEDED','status','succeeded',
      'accessMode',attempt.access_mode,'consumedCredit',attempt.consumed_credit,
      'remainingCredits',attempt.remaining_credits,'usedCount',usage_row.used_count,
      'freeLimit',usage_row.free_limit,'subscriptionStatus',usage_row.subscription_status,
      'accessType',usage_row.access_type,'isLifetimeFree',usage_row.is_lifetime_free,
      'evaluationId',attempt.evaluation_id,'cachedResult',attempt.result_payload
    );
  end if;
  if attempt.status not in ('reserved','processing') then
    raise exception 'analysis attempt is closed' using errcode='55000';
  end if;
  if target_result_payload is null or jsonb_typeof(target_result_payload) <> 'object' then
    raise exception 'valid result payload required' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.evaluations
    where id=target_evaluation_id and user_id=target_user_id
      and analysis_result is not null
  ) then
    raise exception 'saved evaluation required before completion' using errcode='23503';
  end if;

  update public.analysis_access_reservations
  set status='succeeded',decision_code='ANALYSIS_SUCCEEDED',
      evaluation_id=target_evaluation_id,result_payload=target_result_payload,
      completed_at=now(),updated_at=now(),lease_expires_at=null,failure_reason=null
  where request_id=target_request_id
  returning * into attempt;
  select * into usage_row from public.user_usage_limits where user_id=target_user_id;

  return jsonb_build_object(
    'allowed',true,'code','ANALYSIS_SUCCEEDED','status','succeeded',
    'accessMode',attempt.access_mode,'consumedCredit',attempt.consumed_credit,
    'remainingCredits',attempt.remaining_credits,'usedCount',usage_row.used_count,
    'freeLimit',usage_row.free_limit,'subscriptionStatus',usage_row.subscription_status,
    'accessType',usage_row.access_type,'isLifetimeFree',usage_row.is_lifetime_free,
    'evaluationId',attempt.evaluation_id,'cachedResult',attempt.result_payload
  );
end
$function$;

-- Fail once. If the evaluation row already exists, recover success instead of refunding.
create or replace function public.fail_analysis_request(
  target_user_id uuid,
  target_request_id uuid,
  target_failure_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $function$
declare
  attempt public.analysis_access_reservations%rowtype;
  usage_row public.user_usage_limits%rowtype;
  saved_result jsonb;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role required' using errcode='42501';
  end if;
  select * into usage_row from public.user_usage_limits
  where user_id=target_user_id for update;
  select * into attempt from public.analysis_access_reservations
  where request_id=target_request_id and user_id=target_user_id for update;
  if not found then raise exception 'analysis attempt not found' using errcode='P0002'; end if;

  if attempt.status='succeeded' then
    return jsonb_build_object(
      'allowed',true,'code','ANALYSIS_SUCCEEDED','status','succeeded',
      'accessMode',attempt.access_mode,'consumedCredit',attempt.consumed_credit,
      'remainingCredits',attempt.remaining_credits,'usedCount',usage_row.used_count,
      'freeLimit',usage_row.free_limit,'subscriptionStatus',usage_row.subscription_status,
      'accessType',usage_row.access_type,'isLifetimeFree',usage_row.is_lifetime_free,
      'evaluationId',attempt.evaluation_id,'cachedResult',attempt.result_payload
    );
  end if;

  select analysis_result into saved_result from public.evaluations
  where id=coalesce(attempt.evaluation_id, attempt.request_id)
    and user_id=target_user_id and analysis_result is not null;
  if found then
    update public.analysis_access_reservations
    set status='succeeded',decision_code='ANALYSIS_SUCCEEDED',
        result_payload=saved_result,completed_at=now(),updated_at=now(),
        lease_expires_at=null,failure_reason=null
    where request_id=target_request_id returning * into attempt;
  elsif attempt.status in ('reserved','processing') then
    if attempt.consumed_credit then
      update public.user_usage_limits set used_count=greatest(used_count-1,0)
      where user_id=target_user_id returning * into usage_row;
    end if;
    update public.analysis_access_reservations
    set status=case when consumed_credit then 'refunded' else 'failed' end,
        decision_code=case when consumed_credit then 'ANALYSIS_REFUNDED' else 'ANALYSIS_FAILED' end,
        failure_reason=left(coalesce(target_failure_reason,'UNKNOWN_FAILURE'),500),
        refunded_at=case when consumed_credit then now() else refunded_at end,
        completed_at=now(),updated_at=now(),lease_expires_at=null
    where request_id=target_request_id returning * into attempt;
  end if;

  return jsonb_build_object(
    'allowed',attempt.status='succeeded','code',attempt.decision_code,
    'status',attempt.status,'accessMode',attempt.access_mode,
    'consumedCredit',attempt.consumed_credit,
    'remainingCredits',greatest(usage_row.free_limit-usage_row.used_count,0),
    'usedCount',usage_row.used_count,'freeLimit',usage_row.free_limit,
    'subscriptionStatus',usage_row.subscription_status,
    'accessType',usage_row.access_type,'isLifetimeFree',usage_row.is_lifetime_free,
    'evaluationId',attempt.evaluation_id,'cachedResult',attempt.result_payload
  );
end
$function$;

revoke all on function public.authorize_analysis_request(uuid,uuid) from public,anon,authenticated;
revoke all on function public.complete_analysis_request(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.fail_analysis_request(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.authorize_analysis_request(uuid,uuid) to service_role;
grant execute on function public.complete_analysis_request(uuid,uuid,uuid,jsonb) to service_role;
grant execute on function public.fail_analysis_request(uuid,uuid,text) to service_role;

commit;
