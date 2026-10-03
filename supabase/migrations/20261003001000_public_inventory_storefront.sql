-- Keep the public catalog limited to active inventory products.
create policy "active inventory products are public" on public.products
for select to anon
using (active = true and deleted_at is null);

-- Enable Supabase Realtime delivery for inventory changes.
do $$ begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null;
end $$;
