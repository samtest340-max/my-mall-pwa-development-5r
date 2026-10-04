alter table public.products add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

create policy "Product images are publicly readable"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Authenticated users can upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

create policy "Authenticated users can update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

do $$ begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null;
end $$;
