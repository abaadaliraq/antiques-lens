alter table public.marketplace_orders
  alter column commission_percent set default 3;

alter table public.marketplace_orders
  drop constraint if exists marketplace_orders_commission_check;

alter table public.marketplace_orders
  drop constraint if exists marketplace_orders_amounts_check;

alter table public.marketplace_orders
  add constraint marketplace_orders_commission_check check (commission_percent = 3);

alter table public.marketplace_orders
  add constraint marketplace_orders_amounts_check check (
    commission_amount = round(item_price * 0.03, 2)
    and seller_net_amount = round(item_price - commission_amount, 2)
    and total_paid_by_buyer = item_price + payment_gateway_fee
  );

drop policy if exists "Buyers can create valid marketplace orders" on public.marketplace_orders;
create policy "Buyers can create valid marketplace orders"
on public.marketplace_orders for insert
with check (
  auth.uid() = buyer_id
  and buyer_id <> seller_id
  and commission_percent = 3
  and commission_amount = round(item_price * 0.03, 2)
  and seller_net_amount = round(item_price - commission_amount, 2)
);
