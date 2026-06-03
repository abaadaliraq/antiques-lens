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
  city text,
  delivery_method text,
  has_kishib_evaluation boolean not null default false,
  kishib_evaluation_summary text,
  status text not null default 'pending_review',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_items_status_check check (
    status in ('pending_review', 'published', 'rejected', 'reserved', 'sold')
  ),
  constraint marketplace_items_currency_check check (currency in ('IQD', 'USD'))
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
    commission_amount = round(item_price * 0.07)
    and seller_net_amount = item_price - commission_amount
    and total_paid_by_buyer = item_price
  )
);

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
using (seller_id = auth.uid() and status <> 'sold')
with check (
  seller_id = auth.uid()
  and status <> 'sold'
  and status <> 'published'
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

drop policy if exists "Buyers can create valid marketplace orders" on public.marketplace_orders;
create policy "Buyers can create valid marketplace orders"
on public.marketplace_orders for insert
to authenticated
with check (
  buyer_id = auth.uid()
  and buyer_id <> seller_id
  and commission_percent = 7
  and commission_amount = round(item_price * 0.07)
  and seller_net_amount = item_price - commission_amount
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

insert into storage.buckets (id, name, public)
values ('marketplace-items', 'marketplace-items', true)
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

drop policy if exists "Users can update own marketplace storage objects" on storage.objects;
create policy "Users can update own marketplace storage objects"
on storage.objects for update
to authenticated
using (
  bucket_id = 'marketplace-items'
  and (storage.foldername(name))[1] = auth.uid()::text
)
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
