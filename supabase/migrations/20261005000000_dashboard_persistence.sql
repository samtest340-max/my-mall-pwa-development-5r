create table if not exists public.order_supplies (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  supplier_name text not null,
  supplier_phone text,
  order_number text,
  product_name text not null,
  quantity numeric not null default 0,
  batch_number text,
  expiry_date date,
  received_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.dashboard_audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists order_supplies_business_received_idx on public.order_supplies(business_id, received_at desc);
create index if not exists dashboard_audit_business_created_idx on public.dashboard_audit_logs(business_id, created_at desc);
alter table public.order_supplies enable row level security;
alter table public.dashboard_audit_logs enable row level security;
create policy "business users manage order supplies" on public.order_supplies for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "business users read audit logs" on public.dashboard_audit_logs for select using (auth.uid() is not null);
create policy "business users create audit logs" on public.dashboard_audit_logs for insert with check (auth.uid() = actor_id);
revoke update, delete on public.dashboard_audit_logs from authenticated, anon;
 grant select, insert, update, delete on public.order_supplies to authenticated;
grant select, insert on public.dashboard_audit_logs to authenticated;
