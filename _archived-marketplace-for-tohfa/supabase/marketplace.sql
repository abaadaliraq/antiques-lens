create extension if not exists pgcrypto;

create table if not exists public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  material text,
  origin text,
  estimated_age text,
  condition text not null,
  price numeric not null check (price > 0),
  currency text not null default 'IQD',
  country text,
  city text,
  delivery_method text,
  has_kishib_evaluation boolean not null default false,
  kishib_evaluation_summary text,
  status text not null default 'pending_review',
  rejection_reason text,
  review_note text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_items_status_check check (
    status in ('pending_review', 'published', 'needs_changes', 'rejected', 'reserved', 'sold')
  ),
  constraint marketplace_items_currency_check check (currency in ('IQD', 'USD'))
);

alter table public.marketplace_items
  add column if not exists country text,
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id);

alter table public.marketplace_items
  drop constraint if exists marketplace_items_status_check;

alter table public.marketplace_items
  add constraint marketplace_items_status_check check (
    status in ('pending_review', 'published', 'needs_changes', 'rejected', 'reserved', 'sold')
  );

create table if not exists public.marketplace_item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.marketplace_items(id) on delete cascade,
  image_url text not null,
  storage_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.marketplace_items(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  item_price numeric not null check (item_price > 0),
  commission_percent numeric not null default 7,
  commission_amount numeric not null,
  seller_net_amount numeric not null,
  payment_gateway_fee numeric not null default 0,
  total_paid_by_buyer numeric not null,
  status text not null default 'purchase_requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_orders_status_check check (
    status in (
      'purchase_requested',
      'seller_confirmed',
      'awaiting_payment',
      'paid',
      'delivered',
      'completed',
      'cancelled',
      'dispute'
    )
  ),
  constraint marketplace_orders_no_self_purchase check (buyer_id <> seller_id),
  constraint marketplace_orders_commission_check check (commission_percent = 7),
  constraint marketplace_orders_amounts_check check (
    commission_amount = round(item_price * 0.07, 2)
    and seller_net_amount = round(item_price - commission_amount, 2)
    and payment_gateway_fee = 0
    and total_paid_by_buyer = item_price
  )
);

create table if not exists public.marketplace_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  related_item_id uuid references public.marketplace_items(id) on delete cascade,
  related_order_id uuid references public.marketplace_orders(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint marketplace_notifications_type_check check (
    type in (
      'item_published',
      'item_rejected',
      'item_needs_changes',
      'purchase_requested',
      'order_updated'
    )
  )
);

alter table public.marketplace_notifications
  drop constraint if exists marketplace_notifications_type_check;

alter table public.marketplace_notifications
  add constraint marketplace_notifications_type_check check (
    type in (
      'item_published',
      'item_rejected',
      'item_needs_changes',
      'purchase_requested',
      'order_updated',
      'collection_verified',
      'collection_needs_changes',
      'collection_rejected',
      'collection_ready_for_sale'
    )
  );

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  material text,
  origin text,
  estimated_age text,
  condition text,
  estimated_value numeric,
  currency text not null default 'USD',
  country text,
  city text,
  dimensions text,
  weight text,
  has_mark boolean not null default false,
  notes text,
  visibility text not null default 'private',
  review_status text not null default 'pending_review',
  review_note text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  marketplace_item_id uuid references public.marketplace_items(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collection_items_review_status_check check (
    review_status in ('pending_review', 'verified', 'needs_changes', 'rejected')
  ),
  constraint collection_items_visibility_check check (
    visibility in ('private', 'ready_for_sale', 'listed', 'archived')
  ),
  constraint collection_items_currency_check check (currency in ('IQD', 'USD'))
);

create table if not exists public.collection_item_images (
  id uuid primary key default gen_random_uuid(),
  collection_item_id uuid not null references public.collection_items(id) on delete cascade,
  image_url text not null,
  storage_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists collection_items_owner_created_idx
  on public.collection_items(owner_id, created_at desc);
create index if not exists collection_items_review_status_idx
  on public.collection_items(review_status, created_at asc);
create index if not exists collection_images_item_idx
  on public.collection_item_images(collection_item_id, sort_order);

create index if not exists marketplace_items_status_created_idx
  on public.marketplace_items(status, created_at desc);
create index if not exists marketplace_items_seller_idx
  on public.marketplace_items(seller_id, created_at desc);
create index if not exists marketplace_images_item_idx
  on public.marketplace_item_images(item_id, sort_order);
create index if not exists marketplace_orders_buyer_idx
  on public.marketplace_orders(buyer_id, created_at desc);
create index if not exists marketplace_orders_seller_idx
  on public.marketplace_orders(seller_id, created_at desc);
create index if not exists marketplace_notifications_user_idx
  on public.marketplace_notifications(user_id, created_at desc);

create or replace function public.set_marketplace_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_marketplace_items_updated_at on public.marketplace_items;
create trigger set_marketplace_items_updated_at
before update on public.marketplace_items
for each row execute function public.set_marketplace_updated_at();

drop trigger if exists set_marketplace_orders_updated_at on public.marketplace_orders;
create trigger set_marketplace_orders_updated_at
before update on public.marketplace_orders
for each row execute function public.set_marketplace_updated_at();

drop trigger if exists set_collection_items_updated_at on public.collection_items;
create trigger set_collection_items_updated_at
before update on public.collection_items
for each row execute function public.set_marketplace_updated_at();

create or replace function public.is_marketplace_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'marketplace_admin')::boolean, false);
$$;

alter table public.marketplace_items enable row level security;
alter table public.marketplace_item_images enable row level security;
alter table public.marketplace_orders enable row level security;
alter table public.marketplace_notifications enable row level security;
alter table public.collection_items enable row level security;
alter table public.collection_item_images enable row level security;

drop policy if exists "Public can read published marketplace items" on public.marketplace_items;
create policy "Public can read published marketplace items"
on public.marketplace_items for select
using (status = 'published');

drop policy if exists "Sellers can read own marketplace items" on public.marketplace_items;
create policy "Sellers can read own marketplace items"
on public.marketplace_items for select
to authenticated
using (seller_id = auth.uid());

drop policy if exists "Admins can read marketplace items" on public.marketplace_items;
create policy "Admins can read marketplace items"
on public.marketplace_items for select
to authenticated
using (public.is_marketplace_admin());

drop policy if exists "Sellers can insert pending marketplace items" on public.marketplace_items;
create policy "Sellers can insert pending marketplace items"
on public.marketplace_items for insert
to authenticated
with check (seller_id = auth.uid() and status = 'pending_review');

drop policy if exists "Sellers can update own unsold nonpublished items" on public.marketplace_items;
create policy "Sellers can update own unsold nonpublished items"
on public.marketplace_items for update
to authenticated
using (
  seller_id = auth.uid()
  and status not in ('sold', 'published', 'reserved')
)
with check (
  seller_id = auth.uid()
  and status <> 'sold'
  and status <> 'published'
  and status <> 'reserved'
);

drop policy if exists "Admins can update marketplace item review status" on public.marketplace_items;
create policy "Admins can update marketplace item review status"
on public.marketplace_items for update
to authenticated
using (public.is_marketplace_admin())
with check (public.is_marketplace_admin());

drop policy if exists "Public can read published marketplace item images" on public.marketplace_item_images;
create policy "Public can read published marketplace item images"
on public.marketplace_item_images for select
using (
  exists (
    select 1 from public.marketplace_items item
    where item.id = marketplace_item_images.item_id
      and item.status = 'published'
  )
);

drop policy if exists "Sellers can read own marketplace item images" on public.marketplace_item_images;
create policy "Sellers can read own marketplace item images"
on public.marketplace_item_images for select
to authenticated
using (
  exists (
    select 1 from public.marketplace_items item
    where item.id = marketplace_item_images.item_id
      and item.seller_id = auth.uid()
  )
);

drop policy if exists "Admins can read marketplace item images" on public.marketplace_item_images;
create policy "Admins can read marketplace item images"
on public.marketplace_item_images for select
to authenticated
using (public.is_marketplace_admin());

drop policy if exists "Sellers can insert images for own items" on public.marketplace_item_images;
create policy "Sellers can insert images for own items"
on public.marketplace_item_images for insert
to authenticated
with check (
  exists (
    select 1 from public.marketplace_items item
    where item.id = marketplace_item_images.item_id
      and item.seller_id = auth.uid()
  )
);

drop policy if exists "Sellers can delete images for own unsold items" on public.marketplace_item_images;
create policy "Sellers can delete images for own unsold items"
on public.marketplace_item_images for delete
to authenticated
using (
  exists (
    select 1 from public.marketplace_items item
    where item.id = marketplace_item_images.item_id
      and item.seller_id = auth.uid()
      and item.status <> 'sold'
  )
);

drop policy if exists "Buyers can read own marketplace orders" on public.marketplace_orders;
create policy "Buyers can read own marketplace orders"
on public.marketplace_orders for select
to authenticated
using (buyer_id = auth.uid());

drop policy if exists "Sellers can read marketplace orders for own items" on public.marketplace_orders;
create policy "Sellers can read marketplace orders for own items"
on public.marketplace_orders for select
to authenticated
using (seller_id = auth.uid());

drop policy if exists "Admins can read marketplace orders" on public.marketplace_orders;
create policy "Admins can read marketplace orders"
on public.marketplace_orders for select
to authenticated
using (public.is_marketplace_admin());

drop policy if exists "Admins can update marketplace orders" on public.marketplace_orders;
create policy "Admins can update marketplace orders"
on public.marketplace_orders for update
to authenticated
using (public.is_marketplace_admin())
with check (public.is_marketplace_admin());

drop policy if exists "Buyers can create valid marketplace orders" on public.marketplace_orders;
create policy "Buyers can create valid marketplace orders"
on public.marketplace_orders for insert
to authenticated
with check (
  buyer_id = auth.uid()
  and buyer_id <> seller_id
  and commission_percent = 7
  and commission_amount = round(item_price * 0.07, 2)
  and seller_net_amount = round(item_price - commission_amount, 2)
  and payment_gateway_fee = 0
  and total_paid_by_buyer = item_price
  and status = 'purchase_requested'
  and exists (
    select 1 from public.marketplace_items item
    where item.id = marketplace_orders.item_id
      and item.seller_id = marketplace_orders.seller_id
      and item.status = 'published'
      and item.price = marketplace_orders.item_price
  )
);

drop policy if exists "Users can read own marketplace notifications" on public.marketplace_notifications;
create policy "Users can read own marketplace notifications"
on public.marketplace_notifications for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can mark own marketplace notifications read" on public.marketplace_notifications;
create policy "Users can mark own marketplace notifications read"
on public.marketplace_notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Admins can read marketplace notifications" on public.marketplace_notifications;
create policy "Admins can read marketplace notifications"
on public.marketplace_notifications for select
to authenticated
using (public.is_marketplace_admin());

drop policy if exists "Admins can create marketplace notifications" on public.marketplace_notifications;
create policy "Admins can create marketplace notifications"
on public.marketplace_notifications for insert
to authenticated
with check (public.is_marketplace_admin());

drop policy if exists "Users can read own collection items" on public.collection_items;
create policy "Users can read own collection items"
on public.collection_items for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Admins can read collection items" on public.collection_items;
create policy "Admins can read collection items"
on public.collection_items for select
to authenticated
using (public.is_marketplace_admin());

drop policy if exists "Users can insert own collection items" on public.collection_items;
create policy "Users can insert own collection items"
on public.collection_items for insert
to authenticated
with check (
  owner_id = auth.uid()
  and visibility = 'private'
  and review_status = 'pending_review'
  and reviewed_at is null
  and reviewed_by is null
);

drop policy if exists "Users can update own unlisted collection items" on public.collection_items;
create policy "Users can update own unlisted collection items"
on public.collection_items for update
to authenticated
using (
  owner_id = auth.uid()
  and visibility <> 'listed'
)
with check (
  owner_id = auth.uid()
  and visibility <> 'listed'
  and review_status in ('pending_review', 'needs_changes', 'rejected')
  and reviewed_at is null
  and reviewed_by is null
);

drop policy if exists "Users can delete own unlisted collection items" on public.collection_items;
create policy "Users can delete own unlisted collection items"
on public.collection_items for delete
to authenticated
using (
  owner_id = auth.uid()
  and visibility <> 'listed'
);

drop policy if exists "Admins can update collection review status" on public.collection_items;
create policy "Admins can update collection review status"
on public.collection_items for update
to authenticated
using (public.is_marketplace_admin())
with check (public.is_marketplace_admin());

drop policy if exists "Users can read own collection item images" on public.collection_item_images;
create policy "Users can read own collection item images"
on public.collection_item_images for select
to authenticated
using (
  exists (
    select 1 from public.collection_items item
    where item.id = collection_item_images.collection_item_id
      and item.owner_id = auth.uid()
  )
);

drop policy if exists "Admins can read collection item images" on public.collection_item_images;
create policy "Admins can read collection item images"
on public.collection_item_images for select
to authenticated
using (public.is_marketplace_admin());

drop policy if exists "Users can insert images for own collection items" on public.collection_item_images;
create policy "Users can insert images for own collection items"
on public.collection_item_images for insert
to authenticated
with check (
  exists (
    select 1 from public.collection_items item
    where item.id = collection_item_images.collection_item_id
      and item.owner_id = auth.uid()
  )
);

drop policy if exists "Users can delete images for own unlisted collection items" on public.collection_item_images;
create policy "Users can delete images for own unlisted collection items"
on public.collection_item_images for delete
to authenticated
using (
  exists (
    select 1 from public.collection_items item
    where item.id = collection_item_images.collection_item_id
      and item.owner_id = auth.uid()
      and item.visibility <> 'listed'
  )
);

insert into storage.buckets (id, name, public)
values ('marketplace-items', 'marketplace-items', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('collection-items', 'collection-items', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read marketplace storage objects" on storage.objects;
create policy "Public can read marketplace storage objects"
on storage.objects for select
using (bucket_id = 'marketplace-items');

drop policy if exists "Users can upload own marketplace storage objects" on storage.objects;
create policy "Users can upload own marketplace storage objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'marketplace-items'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own marketplace storage objects" on storage.objects;
create policy "Users can delete own marketplace storage objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'marketplace-items'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read own collection storage objects" on storage.objects;
create policy "Users can read own collection storage objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'collection-items'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_marketplace_admin()
  )
);

drop policy if exists "Users can upload own collection storage objects" on storage.objects;
create policy "Users can upload own collection storage objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'collection-items'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own collection storage objects" on storage.objects;
create policy "Users can delete own collection storage objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'collection-items'
  and (storage.foldername(name))[1] = auth.uid()::text
);
