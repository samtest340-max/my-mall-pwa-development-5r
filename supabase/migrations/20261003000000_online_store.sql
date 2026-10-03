create table if not exists public.store_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (business_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  name text not null,
  slug text not null,
  description text,
  sku text not null,
  category text not null default 'General',
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) not null default 0 check (compare_at_price >= 0),
  stock_count integer not null default 0 check (stock_count >= 0),
  product_type text not null default 'Product' check (product_type in ('Product', 'Service')),
  published boolean not null default false,
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, sku),
  unique (business_id, slug)
);

create table if not exists public.store_settings (
  business_id uuid primary key,
  store_slug text not null unique,
  description text,
  open boolean not null default true,
  pickup_enabled boolean not null default true,
  payment_methods text[] not null default '{pay_on_delivery,bank_transfer}',
  free_delivery_threshold numeric(12,2),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  customer_id uuid,
  customer_name text not null,
  customer_phone text not null,
  status text not null default 'new' check (status in ('new','confirmed','packed','out_for_delivery','delivered','cancelled','returned')),
  payment_status text not null default 'pending' check (payment_status in ('pending','partial','paid','failed')),
  total numeric(12,2) not null check (total >= 0),
  delivery_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.store_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0)
);

alter table public.store_categories enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.store_orders enable row level security;
alter table public.store_order_items enable row level security;

create policy "published products are public" on public.products for select using (published = true);
create policy "public store settings are readable" on public.store_settings for select using (true);
create policy "authenticated products are manageable" on public.products for all to authenticated using (true) with check (true);
create policy "authenticated store data is manageable" on public.store_settings for all to authenticated using (true) with check (true);
create policy "authenticated orders are manageable" on public.store_orders for all to authenticated using (true) with check (true);
create policy "authenticated order items are manageable" on public.store_order_items for all to authenticated using (true) with check (true);
