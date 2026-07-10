create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null default 'android',
  device_id text,
  locale text,
  country text,
  app_version text,
  active boolean not null default true,
  offers_enabled boolean not null default true,
  evaluations_enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_active_idx
  on public.push_tokens (active, locale, country);
create index if not exists push_tokens_user_idx
  on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "Users can read own push tokens"
  on public.push_tokens for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can insert own push tokens"
  on public.push_tokens for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can update own push tokens"
  on public.push_tokens for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on public.push_tokens to authenticated;

create or replace function public.claim_push_token(
  p_token text,
  p_platform text default 'android',
  p_locale text default null,
  p_country text default null,
  p_app_version text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.push_tokens (
    token, user_id, platform, locale, country, app_version, active, last_seen_at, updated_at
  ) values (
    p_token, auth.uid(), p_platform, p_locale, p_country, p_app_version, true, now(), now()
  )
  on conflict (token) do update set
    user_id = auth.uid(),
    platform = excluded.platform,
    locale = excluded.locale,
    country = coalesce(excluded.country, public.push_tokens.country),
    app_version = excluded.app_version,
    active = true,
    last_seen_at = now(),
    updated_at = now();
end;
$$;

revoke all on function public.claim_push_token(text, text, text, text, text) from public;
grant execute on function public.claim_push_token(text, text, text, text, text) to authenticated;
