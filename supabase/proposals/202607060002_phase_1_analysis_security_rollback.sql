-- KISHIB PHASE 1 - SAFE FAIL-CLOSED ROLLBACK FOR STAGING ONLY
-- DO NOT RUN ON PRODUCTION.
--
-- This rollback disables the new authorization RPC without deleting any table,
-- reservation history, user balance, lifetime flag, subscription, evaluation,
-- or report. The application will return ACCESS_SERVICE_UNAVAILABLE (503) until
-- the reviewed apply script is fixed/reapplied.
--
-- SECURITY DECISION: this file intentionally does NOT restore the unsafe client
-- INSERT policy or EXECUTE privilege on increment_analysis_usage(). Restoring
-- those permissions would reopen the bypass described by the audit.
--
-- BEFORE RUNNING:
-- * Confirm this is STAGING.
-- * Save inspection output and application logs.
-- * Use only if the reviewed function causes a Staging regression.

begin;

select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('kishib_phase_1_analysis_security_v2'));

-- Stop all callers first, then remove only the new RPC definition.
do $revoke_new_rpc$
begin
  if pg_catalog.to_regprocedure(
       'public.authorize_analysis_request(uuid,uuid)'
     ) is not null then
    execute 'revoke all on function public.authorize_analysis_request(uuid, uuid) from public';
    execute 'revoke all on function public.authorize_analysis_request(uuid, uuid) from anon';
    execute 'revoke all on function public.authorize_analysis_request(uuid, uuid) from authenticated';
    execute 'revoke all on function public.authorize_analysis_request(uuid, uuid) from service_role';
  end if;
end
$revoke_new_rpc$;

drop function if exists public.authorize_analysis_request(uuid, uuid);

-- Preserve the idempotency table and its rows for incident review.
-- Keep it inaccessible to browser roles.
do $preserve_internal_table$
begin
  if pg_catalog.to_regclass('public.analysis_access_reservations') is not null then
    execute 'alter table public.analysis_access_reservations enable row level security';
    execute 'revoke all on public.analysis_access_reservations from public, anon, authenticated';
  end if;
end
$preserve_internal_table$;

-- Keep user_usage_limits read-only from clients. Do not restore the vulnerable
-- INSERT policy and do not restore the legacy mutating RPC.
do $preserve_usage_security$
begin
  if pg_catalog.to_regclass('public.user_usage_limits') is not null then
    execute 'drop policy if exists "Users can insert own usage limits" on public.user_usage_limits';
    execute 'revoke insert, update, delete, truncate on public.user_usage_limits from anon, authenticated';
  end if;

  if pg_catalog.to_regprocedure('public.increment_analysis_usage()') is not null then
    execute 'revoke all on function public.increment_analysis_usage() from public';
    execute 'revoke all on function public.increment_analysis_usage() from anon';
    execute 'revoke all on function public.increment_analysis_usage() from authenticated';
  end if;
end
$preserve_usage_security$;

commit;

-- EXPECTED RESULT:
-- * No user/evaluation/report/reservation data is deleted or changed.
-- * The new RPC no longer exists.
-- * Browser clients still cannot modify entitlements.
-- * /api/analyze fails closed with 503 until the reviewed SQL is reapplied.

