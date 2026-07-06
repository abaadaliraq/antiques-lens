-- STAGING ONLY. Non-destructive Phase 1.1 rollback.
-- Keeps lifecycle columns and attempt history. Does not modify user balances.
-- After this file, rerun 202607060002_phase_1_analysis_security_reviewed.sql
-- to restore the Phase 1 authorize function; the API remains fail-closed meanwhile.
begin;
select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('kishib_phase_1_1_refund_idempotency'));
revoke all on function public.complete_analysis_request(uuid,uuid,uuid,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.fail_analysis_request(uuid,uuid,text) from public,anon,authenticated,service_role;
drop function if exists public.complete_analysis_request(uuid,uuid,uuid,jsonb);
drop function if exists public.fail_analysis_request(uuid,uuid,text);
-- Disable the Phase 1.1 authorize function until reviewed Phase 1 is reapplied.
revoke all on function public.authorize_analysis_request(uuid,uuid) from public,anon,authenticated,service_role;
drop function if exists public.authorize_analysis_request(uuid,uuid);
commit;
