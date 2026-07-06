-- READ-ONLY INSPECTION FOR STAGING.
-- Safe to run in Supabase SQL Editor: contains SELECT statements only.
-- Run this before any Phase 1 security proposal and save the complete output.

-- 1) Environment identity. Confirm this is STAGING before continuing.
select current_database() as database_name, current_user as executing_role,
       current_setting('server_version') as postgres_version, now() as inspected_at;

-- 2) Relevant public tables. user_usage_limits must exist; reservations may not exist yet.
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relname in ('user_usage_limits', 'analysis_access_reservations', 'evaluations', 'profiles')
order by c.relname;

-- 3) Exact columns and types.
select table_schema, table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('user_usage_limits', 'analysis_access_reservations', 'evaluations', 'profiles')
order by table_name, ordinal_position;

-- 4) Primary, unique, foreign-key and check constraints with definitions.
select n.nspname as schema_name, c.relname as table_name, con.conname as constraint_name,
       con.contype as constraint_type, pg_catalog.pg_get_constraintdef(con.oid, true) as definition
from pg_catalog.pg_constraint con
join pg_catalog.pg_class c on c.oid = con.conrelid
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('user_usage_limits', 'analysis_access_reservations', 'evaluations', 'profiles')
order by c.relname, con.conname;

-- 5) Indexes, including uniqueness.
select schemaname, tablename, indexname, indexdef
from pg_catalog.pg_indexes
where schemaname = 'public'
  and tablename in ('user_usage_limits', 'analysis_access_reservations', 'evaluations', 'profiles')
order by tablename, indexname;

-- 6) RLS policies and their USING/WITH CHECK expressions.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename in ('user_usage_limits', 'analysis_access_reservations', 'evaluations', 'profiles')
order by tablename, policyname;

-- 7) Table grants. Authenticated must not have INSERT/UPDATE/DELETE on usage limits.
select table_schema, table_name, grantee, privilege_type, is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('user_usage_limits', 'analysis_access_reservations', 'evaluations', 'profiles')
order by table_name, grantee, privilege_type;

-- 8) Relevant functions, signatures, owner, security mode and ACL.
select n.nspname as schema_name, p.proname as function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
       pg_catalog.pg_get_userbyid(p.proowner) as owner,
       p.prosecdef as security_definer, p.proconfig as settings, p.proacl as acl
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('can_user_analyze', 'increment_analysis_usage',
                    'grant_lifetime_access_by_email', 'authorize_analysis_request',
                    'complete_analysis_request', 'fail_analysis_request')
order by p.proname, arguments;

-- 9) Function source. Review for unexpected deployed differences.
select n.nspname as schema_name, p.proname as function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
       pg_catalog.pg_get_functiondef(p.oid) as function_definition
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('can_user_analyze', 'increment_analysis_usage',
                    'grant_lifetime_access_by_email', 'authorize_analysis_request',
                    'complete_analysis_request', 'fail_analysis_request')
order by p.proname, arguments;

-- 10) Triggers on relevant tables.
select n.nspname as schema_name, c.relname as table_name, t.tgname as trigger_name,
       pg_catalog.pg_get_triggerdef(t.oid, true) as definition
from pg_catalog.pg_trigger t
join pg_catalog.pg_class c on c.oid = t.tgrelid
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal and n.nspname = 'public'
  and c.relname in ('user_usage_limits', 'analysis_access_reservations')
order by c.relname, t.tgname;

-- 11) Read-only aggregate sanity check. No emails or user IDs are returned.
select count(*) as usage_rows,
       count(*) filter (where used_count < 0 or free_limit < 0) as invalid_negative_rows,
       count(*) filter (where used_count > free_limit) as used_above_free_limit,
       count(*) filter (where is_lifetime_free = true) as lifetime_flag_rows,
       count(*) filter (where access_type in ('lifetime_free', 'admin')) as lifetime_access_type_rows,
       count(*) filter (where subscription_status = 'active'
                         and subscription_ends_at > now()) as active_subscription_rows,
       count(*) filter (where subscription_status = 'active'
                         and subscription_ends_at <= now()) as expired_subscription_rows
from public.user_usage_limits;

-- STOP after saving the results. Do not run the reviewed apply file if:
-- * user_usage_limits or required columns are missing/different;
-- * user_id is not uuid + unique + FK to auth.users;
-- * used_count/free_limit are not integer-compatible;
-- * lifetime columns differ from the expected boolean/text design;
-- * unexpected client write grants or policies need separate investigation.
