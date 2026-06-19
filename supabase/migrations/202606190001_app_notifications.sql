create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  audience text not null default 'all'
    check (audience in ('all', 'emails')),
  target_emails text[],
  title jsonb not null default '{}'::jsonb,
  body jsonb not null default '{}'::jsonb,
  link_url text,
  kind text not null default 'info',
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_notification_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_id uuid not null references public.app_notifications(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);

create index if not exists app_notifications_active_idx
  on public.app_notifications (active, starts_at desc, expires_at);

create index if not exists app_notification_reads_user_idx
  on public.app_notification_reads (user_id, read_at desc);

alter table public.app_notifications enable row level security;
alter table public.app_notification_reads enable row level security;

drop policy if exists "Authenticated users can read visible app notifications"
  on public.app_notifications;

create policy "Authenticated users can read visible app notifications"
  on public.app_notifications
  for select
  to authenticated
  using (
    active = true
    and starts_at <= now()
    and (expires_at is null or expires_at > now())
    and (
      audience = 'all'
      or (
        audience = 'emails'
        and exists (
          select 1
          from unnest(coalesce(target_emails, array[]::text[])) as target_email
          where lower(target_email) = lower(auth.jwt() ->> 'email')
        )
      )
    )
  );

drop policy if exists "Users can read own notification reads"
  on public.app_notification_reads;

create policy "Users can read own notification reads"
  on public.app_notification_reads
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can mark own notifications read"
  on public.app_notification_reads;

create policy "Users can mark own notifications read"
  on public.app_notification_reads
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notification reads"
  on public.app_notification_reads;

create policy "Users can update own notification reads"
  on public.app_notification_reads
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select on public.app_notifications to authenticated;
grant select, insert, update on public.app_notification_reads to authenticated;

-- Example: send one announcement to all users.
-- insert into public.app_notifications (audience, title, body, kind)
-- values (
--   'all',
--   '{
--     "ar": "اشتراك مجاني مدى الحياة من KISHIB",
--     "en": "Lifetime free KISHIB access"
--   }'::jsonb,
--   '{
--     "ar": "تم تفعيل اشتراك مجاني مدى الحياة لحسابك في KISHIB. يمكنك استخدام التحليل بدون حد.",
--     "en": "Lifetime free access has been activated for your KISHIB account. You can use evaluations without limits."
--   }'::jsonb,
--   'success'
-- );

-- Example: send only to specific emails.
-- insert into public.app_notifications (audience, target_emails, title, body, kind)
-- values (
--   'emails',
--   array[
--     'azadtarriq706@gmail.com',
--     'azad.prod.azad@gmail.com'
--   ],
--   '{"ar": "تم تفعيل اشتراكك", "en": "Your access is active"}'::jsonb,
--   '{"ar": "حسابك أصبح مجانيًا مدى الحياة في KISHIB.", "en": "Your KISHIB account is now lifetime free."}'::jsonb,
--   'success'
-- );
