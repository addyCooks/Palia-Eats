-- PaliaEats: Step 6 - image storage
-- Run once in Supabase Dashboard -> SQL Editor, after 0003_grants.sql.

-- Public bucket: anyone can VIEW images through their public URL.
-- Max 2 MB per file, only JPG / PNG / WebP.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-media',
  'restaurant-media',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Only admins may add, change or remove files in this bucket.
create policy "restaurant-media: admin read"
  on storage.objects for select to authenticated
  using (bucket_id = 'restaurant-media' and public.is_admin());

create policy "restaurant-media: admin upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'restaurant-media' and public.is_admin());

create policy "restaurant-media: admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'restaurant-media' and public.is_admin())
  with check (bucket_id = 'restaurant-media' and public.is_admin());

create policy "restaurant-media: admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'restaurant-media' and public.is_admin());
