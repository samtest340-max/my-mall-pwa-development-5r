create index if not exists sale_items_product_id_idx on public.sale_items(product_id);
create index if not exists sales_occurred_at_idx on public.sales(occurred_at desc);
create index if not exists sales_business_id_occurred_at_idx on public.sales(business_id, occurred_at desc);
create index if not exists products_business_name_lower_idx on public.products(business_id, lower(name));
create index if not exists products_business_sku_idx on public.products(business_id, sku);
create index if not exists products_business_barcode_idx on public.products(business_id, barcode);

alter table public.sale_items replica identity full;
alter table public.sales replica identity full;

-- Product history reads remain scoped by the existing business RLS policies.
-- Staff-level "own sales only" filtering should be applied when the staff role is enabled in the session profile.

