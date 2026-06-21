create table if not exists public.similar_image_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source text not null,
  status text not null,
  created_at timestamptz default now(),
  error_message text null,
  constraint similar_image_usage_logs_source_check
    check (source in ('google_lens', 'pinterest')),
  constraint similar_image_usage_logs_status_check
    check (status in ('success', 'failed', 'skipped_limit'))
);

create index if not exists similar_image_usage_logs_user_source_created_idx
on public.similar_image_usage_logs (user_id, source, created_at desc);

alter table public.similar_image_usage_logs enable row level security;

drop policy if exists "Users can read own similar image usage logs"
on public.similar_image_usage_logs;

create policy "Users can read own similar image usage logs"
on public.similar_image_usage_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Service role can manage similar image usage logs"
on public.similar_image_usage_logs;

create policy "Service role can manage similar image usage logs"
on public.similar_image_usage_logs
for all
to service_role
using (true)
with check (true);
