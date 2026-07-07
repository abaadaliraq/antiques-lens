-- Keep evaluation archive private per authenticated user.
-- No retention, cleanup, or automatic deletion is defined here.

alter table public.evaluations
add column if not exists main_image text,
add column if not exists status text not null default 'completed';

update public.evaluations
set main_image = image_url
where main_image is null
  and image_url is not null;

update public.evaluations
set status = 'completed'
where status is null;

create index if not exists evaluations_user_created_idx
on public.evaluations (user_id, created_at desc);

alter table public.evaluations enable row level security;

alter table public.evaluations force row level security;

drop policy if exists evaluations_select_own on public.evaluations;
drop policy if exists evaluations_insert_own on public.evaluations;
drop policy if exists evaluations_update_own on public.evaluations;
drop policy if exists evaluations_delete_own on public.evaluations;

create policy evaluations_select_own
on public.evaluations
for select
to authenticated
using (user_id = auth.uid());

create policy evaluations_insert_own
on public.evaluations
for insert
to authenticated
with check (user_id = auth.uid());

create policy evaluations_update_own
on public.evaluations
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy evaluations_delete_own
on public.evaluations
for delete
to authenticated
using (user_id = auth.uid());
