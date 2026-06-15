create table if not exists public.collection_item_likes (
  id uuid primary key default gen_random_uuid(),
  collection_item_id uuid not null references public.collection_items(id) on delete cascade,
  visitor_key text not null,
  created_at timestamptz not null default now(),
  unique (collection_item_id, visitor_key)
);

create table if not exists public.collection_item_offers (
  id uuid primary key default gen_random_uuid(),
  collection_item_id uuid not null references public.collection_items(id) on delete cascade,
  visitor_key text not null,
  amount numeric not null check (amount > 0),
  currency text not null default 'USD' check (currency in ('IQD', 'USD')),
  created_at timestamptz not null default now()
);

create index if not exists collection_item_likes_item_idx
  on public.collection_item_likes(collection_item_id);

create index if not exists collection_item_offers_item_amount_idx
  on public.collection_item_offers(collection_item_id, amount desc);

drop policy if exists "Public can read verified collection items" on public.collection_items;
create policy "Public can read verified collection items"
on public.collection_items for select
using (review_status = 'verified');

drop policy if exists "Public can read verified collection item images" on public.collection_item_images;
create policy "Public can read verified collection item images"
on public.collection_item_images for select
using (
  exists (
    select 1 from public.collection_items item
    where item.id = collection_item_images.collection_item_id
      and item.review_status = 'verified'
  )
);

alter table public.collection_item_likes enable row level security;
alter table public.collection_item_offers enable row level security;

drop policy if exists "Public can read collection likes" on public.collection_item_likes;
create policy "Public can read collection likes"
on public.collection_item_likes for select
using (true);

drop policy if exists "Public can like collection items" on public.collection_item_likes;
create policy "Public can like collection items"
on public.collection_item_likes for insert
with check (true);

drop policy if exists "Public can read collection offers" on public.collection_item_offers;
create policy "Public can read collection offers"
on public.collection_item_offers for select
using (true);

drop policy if exists "Public can offer on collection items" on public.collection_item_offers;
create policy "Public can offer on collection items"
on public.collection_item_offers for insert
with check (true);
