-- KISHIB PHASE 1 STAGING POSTCHECK - READ ONLY
-- Run only after SQL 002 + SQL 003 on Staging. Contains SELECT statements only.

-- A. Capture environment identity in every screenshot/export.
select current_database() as database_name, current_user as executing_role,
       now() as checked_at, current_setting('server_version') as postgres_version;

-- B. Required tables and RLS flags.
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relkind in ('r','p')
  and c.relname in ('user_usage_limits','analysis_access_reservations','evaluations')
order by c.relname;

-- C. Columns and exact types/defaults/nullability.
select table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default
from information_schema.columns
where table_schema='public'
  and table_name in ('user_usage_limits','analysis_access_reservations','evaluations')
order by table_name, ordinal_position;

-- D. Constraints: PK, UNIQUE, FK, CHECK.
select c.relname as table_name, con.conname, con.contype,
       pg_catalog.pg_get_constraintdef(con.oid,true) as definition
from pg_catalog.pg_constraint con
join pg_catalog.pg_class c on c.oid=con.conrelid
join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in ('user_usage_limits','analysis_access_reservations','evaluations')
order by c.relname, con.conname;

-- E. Indexes, including request_id uniqueness and stale-attempt index.
select tablename,indexname,indexdef
from pg_catalog.pg_indexes
where schemaname='public'
  and tablename in ('user_usage_limits','analysis_access_reservations','evaluations')
order by tablename,indexname;

-- F. RLS policies. Reservations should have no client policy.
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_catalog.pg_policies
where schemaname='public'
  and tablename in ('user_usage_limits','analysis_access_reservations','evaluations')
order by tablename,policyname;

-- G. Table grants. anon/authenticated must have no write privilege on usage/reservations.
select table_name,grantee,privilege_type,is_grantable
from information_schema.role_table_grants
where table_schema='public'
  and table_name in ('user_usage_limits','analysis_access_reservations','evaluations')
order by table_name,grantee,privilege_type;

-- H. Functions, signatures, SECURITY DEFINER, search_path and ACL.
select p.proname,pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,p.proconfig as settings,p.proacl as acl,
       pg_catalog.pg_get_userbyid(p.proowner) as owner
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in ('can_user_analyze','increment_analysis_usage',
                    'authorize_analysis_request','complete_analysis_request',
                    'fail_analysis_request','grant_lifetime_access_by_email')
order by p.proname,arguments;

-- I. Triggers.
select c.relname as table_name,t.tgname,
       pg_catalog.pg_get_triggerdef(t.oid,true) as definition
from pg_catalog.pg_trigger t
join pg_catalog.pg_class c on c.oid=t.tgrelid
join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where not t.tgisinternal and n.nspname='public'
  and c.relname in ('user_usage_limits','analysis_access_reservations','evaluations')
order by c.relname,t.tgname;

-- J. Usage/lifetime/subscription aggregates. No personal identifiers returned.
select count(*) as usage_rows,
       count(*) filter(where free_limit<0 or used_count<0) as negative_balance_rows,
       count(*) filter(where used_count>free_limit
                         and subscription_status<>'active'
                         and not is_lifetime_free) as used_above_limit_non_entitled,
       count(*) filter(where is_lifetime_free
                         or access_type in ('lifetime_free','admin')) as lifetime_rows,
       count(*) filter(where subscription_status='active'
                         and subscription_ends_at>now()) as active_subscription_rows,
       count(*) filter(where subscription_status='active'
                         and subscription_ends_at<=now()) as expired_subscription_rows
from public.user_usage_limits;

-- K. Attempt status distribution.
select status,decision_code,access_mode,consumed_credit,count(*) as attempt_count
from public.analysis_access_reservations
group by status,decision_code,access_mode,consumed_credit
order by status,decision_code,access_mode,consumed_credit;

-- L. Critical consistency anomalies. Every count must be zero.
select
  count(*) filter(where status='refunded'
                    and (not consumed_credit or refunded_at is null)) as invalid_refund_rows,
  count(*) filter(where status='succeeded'
                    and (evaluation_id is null or result_payload is null)) as incomplete_success_rows,
  count(*) filter(where status in ('failed','refunded')
                    and failure_reason is null) as failure_without_reason_rows,
  count(*) filter(where status='processing'
                    and lease_expires_at is null) as processing_without_lease_rows,
  count(*) filter(where status not in ('processing')
                    and lease_expires_at is not null) as closed_with_live_lease_rows
from public.analysis_access_reservations;

-- M. Duplicate request IDs. Must return zero rows; PK should make duplicates impossible.
select request_id,count(*) as duplicate_count
from public.analysis_access_reservations
group by request_id
having count(*)>1;

-- N. More than one refund row per request. Must return zero rows.
select request_id,count(*) filter(where status='refunded') as refund_rows
from public.analysis_access_reservations
group by request_id
having count(*) filter(where status='refunded')>1;

-- O. More than one consumed-credit row per request. Must return zero rows.
select request_id,count(*) filter(where consumed_credit) as deduction_rows
from public.analysis_access_reservations
group by request_id
having count(*) filter(where consumed_credit)>1;

-- P. Succeeded attempts must link to the same user's saved evaluation.
select r.request_id,r.user_id,r.evaluation_id
from public.analysis_access_reservations r
left join public.evaluations e
  on e.id=r.evaluation_id and e.user_id=r.user_id
where r.status='succeeded'
  and (e.id is null or e.analysis_result is null);

-- Q. Expired processing rows awaiting lazy recovery/refund.
select request_id,user_id,lease_expires_at,consumed_credit
from public.analysis_access_reservations
where status in ('reserved','processing')
  and lease_expires_at<=now()
order by lease_expires_at;

-- R. Direct privilege assertions. All values should be false except service RPC values.
select
  pg_catalog.has_table_privilege('authenticated','public.user_usage_limits','INSERT') as auth_can_insert_usage,
  pg_catalog.has_table_privilege('authenticated','public.user_usage_limits','UPDATE') as auth_can_update_usage,
  pg_catalog.has_table_privilege('authenticated','public.analysis_access_reservations','SELECT') as auth_can_read_attempts,
  pg_catalog.has_function_privilege('authenticated','public.authorize_analysis_request(uuid,uuid)','EXECUTE') as auth_can_authorize,
  pg_catalog.has_function_privilege('authenticated','public.complete_analysis_request(uuid,uuid,uuid,jsonb)','EXECUTE') as auth_can_complete,
  pg_catalog.has_function_privilege('authenticated','public.fail_analysis_request(uuid,uuid,text)','EXECUTE') as auth_can_refund,
  pg_catalog.has_function_privilege('service_role','public.authorize_analysis_request(uuid,uuid)','EXECUTE') as service_can_authorize,
  pg_catalog.has_function_privilege('service_role','public.complete_analysis_request(uuid,uuid,uuid,jsonb)','EXECUTE') as service_can_complete,
  pg_catalog.has_function_privilege('service_role','public.fail_analysis_request(uuid,uuid,text)','EXECUTE') as service_can_refund;

-- Interpretation limitation:
-- The current schema has one row per request, so duplicate rows/refunds/deductions
-- can be disproved structurally. It is not an immutable transition ledger; historical
-- multiple UPDATE operations cannot be reconstructed from the final row alone.

