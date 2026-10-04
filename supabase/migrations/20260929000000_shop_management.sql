create schema if not exists app_private;

create sequence if not exists public.sync_seq;

do $$ begin
  create type public.user_role as enum ('owner','manager','cashier');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.stock_movement_type as enum ('sale','purchase','adjustment','transfer_in','transfer_out','return','opening');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.sale_status as enum ('completed','held','returned');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.payment_method as enum ('cash','transfer','pos','credit');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.payment_kind as enum ('sale','debt_payment','refund');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.customer_ledger_type as enum ('credit_sale','payment','adjustment','refund');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.purchase_status as enum ('ordered','received');
exception when duplicate_object then null; end $$;

create table if not exists public.businesses (id uuid primary key, name text not null, logo_url text, currency text not null default 'NGN', vat_rate numeric(8,2) not null default 0, plan text not null default 'trial', trial_ends_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.branches (id uuid primary key, business_id uuid not null references public.businesses(id), name text not null, address text, phone text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.profiles (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade, business_id uuid not null references public.businesses(id), role public.user_role not null default 'cashier', branch_id uuid references public.branches(id), full_name text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.devices (id uuid primary key, business_id uuid not null references public.businesses(id), user_id uuid references auth.users(id), label text not null, last_sync_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.categories (id uuid primary key, business_id uuid not null references public.businesses(id), name text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.products (id uuid primary key, business_id uuid not null references public.businesses(id), name text not null, sku text, barcode text, category_id uuid references public.categories(id), cost_price numeric(14,2) not null default 0, sell_price numeric(14,2) not null default 0, pack_size numeric(14,3) not null default 1, pack_name text, track_expiry boolean not null default false, reorder_level numeric(14,3) not null default 0, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.stock_movements (id uuid primary key, business_id uuid not null references public.businesses(id), branch_id uuid not null references public.branches(id), product_id uuid not null references public.products(id), qty_delta numeric(14,3) not null, type public.stock_movement_type not null, reason text, batch_no text, expiry_date date, ref_id uuid, device_id uuid references public.devices(id), occurred_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.customers (id uuid primary key, business_id uuid not null references public.businesses(id), name text not null, phone text, address text, credit_limit numeric(14,2) not null default 0, loyalty_points integer not null default 0, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.sales (id uuid primary key, business_id uuid not null references public.businesses(id), branch_id uuid not null references public.branches(id), receipt_no text not null, customer_id uuid references public.customers(id), cashier_id uuid references auth.users(id), subtotal numeric(14,2) not null default 0, discount numeric(14,2) not null default 0, tax numeric(14,2) not null default 0, total numeric(14,2) not null default 0, status public.sale_status not null default 'completed', device_id uuid references public.devices(id), occurred_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.sale_items (id uuid primary key, business_id uuid not null references public.businesses(id), sale_id uuid not null references public.sales(id), product_id uuid not null references public.products(id), qty numeric(14,3) not null, unit_price numeric(14,2) not null, unit_cost numeric(14,2) not null, line_total numeric(14,2) not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.payments (id uuid primary key, business_id uuid not null references public.businesses(id), sale_id uuid references public.sales(id), customer_id uuid references public.customers(id), branch_id uuid not null references public.branches(id), method public.payment_method not null, kind public.payment_kind not null, amount numeric(14,2) not null, occurred_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.customer_ledger (id uuid primary key, business_id uuid not null references public.businesses(id), customer_id uuid not null references public.customers(id), entry_type public.customer_ledger_type not null, amount numeric(14,2) not null, due_date date, ref_id uuid, occurred_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.suppliers (id uuid primary key, business_id uuid not null references public.businesses(id), name text not null, phone text, address text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.purchases (id uuid primary key, business_id uuid not null references public.businesses(id), branch_id uuid not null references public.branches(id), supplier_id uuid references public.suppliers(id), total numeric(14,2) not null default 0, amount_paid numeric(14,2) not null default 0, status public.purchase_status not null default 'ordered', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.purchase_items (id uuid primary key, business_id uuid not null references public.businesses(id), purchase_id uuid not null references public.purchases(id), product_id uuid not null references public.products(id), qty numeric(14,3) not null, unit_cost numeric(14,2) not null, batch_no text, expiry_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.supplier_ledger (id uuid primary key, business_id uuid not null references public.businesses(id), supplier_id uuid not null references public.suppliers(id), entry_type text not null check (entry_type in ('purchase','payment')), amount numeric(14,2) not null, occurred_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.expenses (id uuid primary key, business_id uuid not null references public.businesses(id), branch_id uuid not null references public.branches(id), category text not null, amount numeric(14,2) not null, note text, occurred_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.till_sessions (id uuid primary key, business_id uuid not null references public.businesses(id), branch_id uuid not null references public.branches(id), cashier_id uuid references auth.users(id), opened_at timestamptz not null default now(), closed_at timestamptz, opening_cash numeric(14,2) not null default 0, expected_cash numeric(14,2), counted_cash numeric(14,2), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.audit_log (id uuid primary key, business_id uuid not null references public.businesses(id), user_id uuid references auth.users(id), action text not null, table_name text, record_id uuid, detail jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));
create table if not exists public.sync_conflicts (id uuid primary key, business_id uuid not null references public.businesses(id), table_name text not null, record_id uuid not null, client_payload jsonb not null, server_payload jsonb not null, reason text not null, resolved boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, server_version bigint not null default nextval('public.sync_seq'));

create or replace function app_private.touch_sync_version() returns trigger language plpgsql as $$ begin new.updated_at := now(); new.server_version := nextval('public.sync_seq'); return new; end $$;
do $$ declare t text; begin foreach t in array array['businesses','branches','profiles','devices','categories','products','stock_movements','customers','sales','sale_items','payments','customer_ledger','suppliers','purchases','purchase_items','supplier_ledger','expenses','till_sessions','audit_log','sync_conflicts'] loop execute format('drop trigger if exists %I_sync_version on public.%I',t,t); execute format('create trigger %I_sync_version before insert or update on public.%I for each row execute function app_private.touch_sync_version()',t,t); end loop; end $$;

create or replace function app_private.current_business_id() returns uuid language sql stable security definer set search_path = public, app_private as $$ select business_id from public.profiles where user_id = auth.uid() and deleted_at is null limit 1 $$;
create or replace function app_private.current_role() returns public.user_role language sql stable security definer set search_path = public, app_private as $$ select role from public.profiles where user_id = auth.uid() and deleted_at is null limit 1 $$;
revoke all on function app_private.current_business_id() from public;
revoke all on function app_private.current_role() from public;
grant execute on function app_private.current_business_id() to authenticated;
grant execute on function app_private.current_role() to authenticated;

create or replace function app_private.prevent_cashier_price_change() returns trigger language plpgsql security definer set search_path = public, app_private as $$ begin if app_private.current_role() = 'cashier' and (new.cost_price is distinct from old.cost_price or new.sell_price is distinct from old.sell_price) then raise exception 'Cashiers cannot change product prices'; end if; return new; end $$;
drop trigger if exists products_cashier_price_guard on public.products;
create trigger products_cashier_price_guard before update on public.products for each row execute function app_private.prevent_cashier_price_change();

create or replace view public.stock_levels with (security_invoker = true) as select business_id, branch_id, product_id, coalesce(sum(qty_delta) filter (where deleted_at is null),0) as quantity from public.stock_movements group by business_id, branch_id, product_id;
create or replace view public.customer_balances with (security_invoker = true) as select business_id, customer_id, coalesce(sum(case when entry_type in ('credit_sale','adjustment') then amount when entry_type in ('payment','refund') then -amount end) filter (where deleted_at is null),0) as balance from public.customer_ledger group by business_id, customer_id;

alter table public.businesses enable row level security;
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.customer_ledger enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.supplier_ledger enable row level security;
alter table public.expenses enable row level security;
alter table public.till_sessions enable row level security;
alter table public.audit_log enable row level security;
alter table public.sync_conflicts enable row level security;

do $$ declare t text; begin foreach t in array array['businesses','branches','profiles','devices','categories','products','stock_movements','customers','sales','sale_items','payments','customer_ledger','suppliers','purchases','purchase_items','supplier_ledger','expenses','till_sessions','audit_log','sync_conflicts'] loop execute format('drop policy if exists %I_business_access on public.%I',t,t); execute format('create policy %I_business_access on public.%I for all to authenticated using (business_id = app_private.current_business_id()) with check (business_id = app_private.current_business_id())',t,t); end loop; end $$;

create or replace function public.signup_business(p_business_name text, p_full_name text, p_branch_name text default 'Main Branch') returns jsonb language plpgsql security definer set search_path = public, app_private as $$ declare b uuid := gen_random_uuid(); br uuid := gen_random_uuid(); begin if auth.uid() is null then raise exception 'Authentication required'; end if; insert into businesses(id,name) values (b,trim(p_business_name)); insert into branches(id,business_id,name) values (br,b,coalesce(nullif(trim(p_branch_name),''),'Main Branch')); insert into profiles(id,user_id,business_id,role,branch_id,full_name) values (gen_random_uuid(),auth.uid(),b,'owner',br,trim(p_full_name)); return jsonb_build_object('business_id',b,'branch_id',br); end $$;
revoke all on function public.signup_business(text,text,text) from public;
grant execute on function public.signup_business(text,text,text) to authenticated;



revoke all on public.stock_levels, public.customer_balances from anon;
grant select on public.stock_levels, public.customer_balances to authenticated;
